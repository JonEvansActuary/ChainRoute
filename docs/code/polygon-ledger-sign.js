/**
 * Sign and send a Polygon (EIP-1559) transaction using a Ledger device (e.g. Ledger Stax).
 * Uses @ledgerhq/hw-app-eth and @ethereumjs/tx. Pass resolution = null for blind signing
 * (required for data-only txs; enable "Blind signing" or "Contract data" in Ethereum app settings).
 *
 * @module polygon-ledger-sign
 */

const { buildPayload } = require('./build-polygon-payload.js');

/** Ledger Live: account 0 = 44'/60'/0'/0/0, account 1 = 44'/60'/1'/0/0, etc. */
const DEFAULT_PATH = "44'/60'/0'/0/0";
const POLYGON_CHAIN_ID = 137;
const GAS_LIMIT = 100000;

/**
 * Resolve path to Ledger Live derivation. Ledger Live uses account index in the 4th component
 * (44'/60'/n'/0/0), not the address index in the 5th (44'/60'/0'/0/n). So "account 1" is
 * 44'/60'/1'/0/0, not 44'/60'/0'/0/1. Converts runbook-style 44'/60'/0'/0/n → 44'/60'/n'/0/0
 * so signer 0..6 match keys/EVMaddresses.txt.
 * @param {string} path - e.g. "44'/60'/0'/0/0", "44'/60'/0'/0/1", or "44'/60'/1'/0/0"
 * @returns {string} Ledger Live path 44'/60'/n'/0/0
 */
function resolveLedgerLivePath(path) {
  const p = String(path).trim();
  const match = p.match(/^44'\/60'\/0'\/(\d+)\/(\d+)$/);
  if (match) {
    const accountIndex = match[2];
    return `44'/60'/${accountIndex}'/0/0`;
  }
  return p;
}

/**
 * Get the signer address from the Ledger for the given BIP32 path.
 * Path is resolved to Ledger Live format (44'/60'/n'/0/0) so account 0, 1, ... match EVMaddresses.txt.
 * @param {object} eth - Ledger Eth instance (from @ledgerhq/hw-app-eth)
 * @param {string} path - BIP32 path (e.g. "44'/60'/0'/0/0" or "44'/60'/0'/0/1")
 * @param {string} [chainId] - Optional chain ID for Stax display
 * @returns {Promise<string>} Ethereum address (0x-prefixed)
 */
async function getLedgerAddress(eth, path = DEFAULT_PATH, chainId) {
  const resolved = resolveLedgerLivePath(path);
  const opts = chainId ? { chainId: String(chainId) } : undefined;
  const result = await eth.getAddress(resolved, false, false, opts?.chainId);
  return result.address;
}

/**
 * Sign the ChainRoute anchor tx on the Ledger and broadcast it.
 * @param {object} params - { genesisHash, previousPolygonHash, arweaveBlobTxId (43 char), delegate }
 * @param {string} path - BIP32 path (e.g. "44'/60'/0'/0/0")
 * @param {object} [opts] - { rpcUrl, chainId }
 * @returns {Promise<string>} Polygon transaction hash
 */
async function signAndSendWithLedger(params, path = DEFAULT_PATH, opts = {}) {
  const ethers = require('ethers');
  const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default;
  const Eth = require('@ledgerhq/hw-app-eth').default;
  const { createCustomCommon, Mainnet } = require('@ethereumjs/common');
  const { createFeeMarket1559Tx } = require('@ethereumjs/tx');
  const { bytesToHex } = require('@ethereumjs/util');

  const resolvedPath = resolveLedgerLivePath(path);
  const rpcUrl = opts.rpcUrl || 'https://polygon-rpc.com';
  const chainId = opts.chainId ?? POLYGON_CHAIN_ID;
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const transport = await TransportNodeHid.open();
  const eth = new Eth(transport);

  try {
    const signerAddress = await getLedgerAddress(eth, path, chainId);
    const [nonce, feeData] = await Promise.all([
      provider.getTransactionCount(signerAddress, 'pending'),
      provider.getFeeData(),
    ]);

    const payload = {
      genesisHash: params.genesisHash.toLowerCase(),
      previousPolygonHash: params.previousPolygonHash.toLowerCase(),
      arweaveId: params.arweaveBlobTxId,
      delegate: params.delegate,
    };
    const dataHex = '0x' + buildPayload(payload).toString('hex');

    const maxFeePerGas = feeData.maxFeePerGas ?? 30n * 10n ** 9n;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 30n * 10n ** 9n;

    const common = createCustomCommon({ chainId }, Mainnet);
    const txData = {
      type: '0x02',
      chainId: '0x' + chainId.toString(16),
      nonce: '0x' + nonce.toString(16),
      maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16),
      maxFeePerGas: '0x' + maxFeePerGas.toString(16),
      gasLimit: '0x' + GAS_LIMIT.toString(16),
      to: signerAddress,
      value: '0x0',
      data: dataHex,
      accessList: [],
    };

    const tx = createFeeMarket1559Tx(txData, { common });
    const unsignedSerialized = tx.getMessageToSign();
    const rawTxHex = bytesToHex(unsignedSerialized).slice(2);

    const { v, r, s } = await eth.signTransaction(resolvedPath, rawTxHex, null);

    const signedTx = tx.addSignature(
      BigInt('0x' + v),
      BigInt('0x' + r),
      BigInt('0x' + s)
    );
    const signedSerialized = signedTx.serialize();
    const signedHex = '0x' + Buffer.from(signedSerialized).toString('hex');

    const txHash = await provider.send('eth_sendRawTransaction', [signedHex]);
    const receipt = await provider.waitForTransaction(txHash);
    return receipt.hash;
  } finally {
    await transport.close();
  }
}

module.exports = {
  getLedgerAddress,
  signAndSendWithLedger,
  resolveLedgerLivePath,
  DEFAULT_PATH,
};
