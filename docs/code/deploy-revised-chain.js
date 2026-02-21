#!/usr/bin/env node
/**
 * Orchestrate the full ChainRoute provenance chain deployment:
 *   1 genesis Polygon tx + 6 events × (Arweave supports + Arweave blob + Polygon anchor)
 *   = 7 Polygon + 31 Arweave = 38 on-chain transactions.
 *
 * Reads a deploy-config.json, verifies Ledger addresses, deploys sequentially,
 * saves progress after each step, and writes final output files.
 *
 * Usage:
 *   node deploy-revised-chain.js <path-to-deploy-config.json>
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { postSupportToArweave } = require('./post-support-to-arweave.js');
const { buildProvenanceBlob, postProvenanceBlobToArweave } = require('./post-provenance-blob-to-arweave.js');
const { signAndSendWithLedger, getLedgerAddress, resolveLedgerLivePath } = require('./polygon-ledger-sign.js');

const ZEROS_64 = '0000000000000000000000000000000000000000000000000000000000000000';

function resolvePath(base, rel) {
  return path.resolve(base, rel);
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function stripHexPrefix(hash) {
  return hash.replace(/^0x/i, '').toLowerCase();
}

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, label, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const isTransient = /504|502|503|timeout|ETIMEDOUT|ECONNRESET|socket hang up/i.test(e.message);
      if (isTransient && attempt < maxRetries) {
        const delay = attempt * 15000;
        log(`  ⚠ ${label} failed (attempt ${attempt}/${maxRetries}): ${e.message.slice(0, 80)}`);
        log(`    Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else {
        throw e;
      }
    }
  }
}

async function openLedger() {
  const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default;
  const Eth = require('@ledgerhq/hw-app-eth').default;
  const transport = await TransportNodeHid.open();
  const eth = new Eth(transport);
  return { transport, eth };
}

async function verifyAddresses(signers, config) {
  log('Verifying Ledger addresses against PolygonEventSigners.json...');
  const { transport, eth } = await openLedger();

  const allPaths = [config.genesis.ledgerPath, ...config.events.map((e) => e.ledgerPath)];
  const allExpected = signers.map((s) => s.polygonAddress.toLowerCase());
  const mismatches = [];

  try {
    for (let i = 0; i < allPaths.length; i++) {
      const ledgerAddr = await getLedgerAddress(eth, allPaths[i], 137);
      const expected = allExpected[i];
      const match = ledgerAddr.toLowerCase() === expected;
      const label = i === 0 ? 'Genesis' : `Event ${i}`;
      const resolved = resolveLedgerLivePath(allPaths[i]);
      console.log(
        `  ${label}: path ${allPaths[i]} (→ ${resolved})  Ledger: ${ledgerAddr}  Expected: ${expected}  ${match ? '✓' : '✗ MISMATCH'}`
      );
      if (!match) mismatches.push(label);
    }
  } finally {
    await transport.close();
  }

  if (mismatches.length > 0) {
    console.error(`\nAddress mismatch for: ${mismatches.join(', ')}`);
    const ans = await ask('Continue anyway? (y/n) ');
    if (ans.toLowerCase() !== 'y') {
      process.exit(1);
    }
  } else {
    log('All 7 addresses verified.');
  }
}

async function postGenesis(config, signers, progress, exampleDir) {
  if (progress.genesisHash) {
    log(`Resuming — genesis already posted: ${progress.genesisHash}`);
    return progress.genesisHash;
  }

  const delegateAddr = config.genesis.delegateAddress;
  log(`Posting genesis Polygon tx (delegate: ${delegateAddr})...`);
  console.log('  >>> Please confirm the GENESIS transaction on your Ledger <<<');

  const txHash = await signAndSendWithLedger(
    {
      genesisHash: ZEROS_64,
      previousPolygonHash: ZEROS_64,
      arweaveBlobTxId: '',
      delegate: delegateAddr,
    },
    config.genesis.ledgerPath,
    { rpcUrl: config.rpcUrl }
  );

  const genesisHash = stripHexPrefix(txHash);
  log(`Genesis posted: ${genesisHash}`);

  progress.genesisHash = genesisHash;
  progress.genesisTxHash = txHash;
  progress.genesisDelegateAddress = delegateAddr;
  saveJSON(resolvePath(exampleDir, 'deploy-progress.json'), progress);
  return genesisHash;
}

async function deployEvent(eventIdx, eventConfig, config, signers, progress, exampleDir, genesisHash, prevPolygonHash) {
  const eventNum = eventIdx + 1;
  const eventKey = eventConfig.name;
  if (!progress.events) progress.events = {};
  if (!progress.events[eventKey]) progress.events[eventKey] = {};
  const ep = progress.events[eventKey];

  // Step A: Upload supports to Arweave
  if (!ep.supportIds || ep.supportIds.length !== eventConfig.supports.length) {
    ep.supportIds = ep.supportIds || [];
    log(`Event ${eventNum}: uploading support files to Arweave (${ep.supportIds.length}/${eventConfig.supports.length} done)...`);

    for (let i = ep.supportIds.length; i < eventConfig.supports.length; i++) {
      const sup = eventConfig.supports[i];
      const filePath = resolvePath(exampleDir, sup.path);
      log(`  Uploading support ${i + 1}/${eventConfig.supports.length}: ${sup.label}`);
      const arId = await withRetry(
        () => postSupportToArweave(filePath, resolvePath(exampleDir, config.arweaveKeyPath), { genesis: genesisHash }),
        `Support upload ${sup.label}`
      );
      log(`    → ${arId}`);
      ep.supportIds.push({ id: arId, label: sup.label });
      saveJSON(resolvePath(exampleDir, 'deploy-progress.json'), progress);
    }
  } else {
    log(`Event ${eventNum}: supports already uploaded (${ep.supportIds.length} files).`);
  }

  // Step B: Post provenance blob to Arweave
  if (!ep.blobId) {
    const eventFilePath = resolvePath(exampleDir, eventConfig.eventFile);
    const event = loadJSON(eventFilePath);
    const blob = buildProvenanceBlob(genesisHash, event, ep.supportIds);
    log(`Event ${eventNum}: posting provenance blob to Arweave...`);
    const blobId = await withRetry(
      () => postProvenanceBlobToArweave(blob, resolvePath(exampleDir, config.arweaveKeyPath)),
      `Event ${eventNum} blob`
    );
    log(`  → blob: ${blobId}`);
    ep.blobId = blobId;
    saveJSON(resolvePath(exampleDir, 'deploy-progress.json'), progress);
  } else {
    log(`Event ${eventNum}: blob already posted: ${ep.blobId}`);
  }

  // Step C: Post Polygon anchor
  if (!ep.polygonTxHash) {
    const delegateAddr = eventConfig.delegateAddress;

    log(`Event ${eventNum}: posting Polygon anchor (delegate: ${delegateAddr})...`);
    console.log(`  >>> Please confirm Event ${eventNum} anchor on your Ledger (path ${eventConfig.ledgerPath}) <<<`);

    const txHash = await signAndSendWithLedger(
      {
        genesisHash,
        previousPolygonHash: prevPolygonHash,
        arweaveBlobTxId: ep.blobId,
        delegate: delegateAddr,
      },
      eventConfig.ledgerPath,
      { rpcUrl: config.rpcUrl }
    );

    const hash64 = stripHexPrefix(txHash);
    log(`  → Polygon anchor: ${hash64}`);
    ep.polygonTxHash = txHash;
    ep.polygonHash64 = hash64;
    ep.delegateAddress = delegateAddr;
    saveJSON(resolvePath(exampleDir, 'deploy-progress.json'), progress);
  } else {
    log(`Event ${eventNum}: Polygon anchor already posted: ${ep.polygonHash64}`);
  }

  return ep.polygonHash64;
}

function writeFinalOutputs(config, signers, progress, exampleDir) {
  const genesisHash = progress.genesisHash;

  // chain-manifest.json
  const manifest = {
    genesisHash,
    polygonAnchors: [
      {
        step: 'genesis',
        txHash: '0x' + genesisHash,
        prevHash: ZEROS_64,
        arweaveBlobId: null,
        delegate: progress.genesisDelegateAddress,
      },
    ],
    arweaveBlobs: [],
  };

  for (const evt of config.events) {
    const ep = progress.events[evt.name];
    manifest.polygonAnchors.push({
      step: evt.name,
      txHash: ep.polygonTxHash,
      prevHash: manifest.polygonAnchors[manifest.polygonAnchors.length - 1].step === 'genesis'
        ? genesisHash
        : progress.events[config.events[config.events.indexOf(evt) - 1].name].polygonHash64,
      arweaveBlobId: ep.blobId,
      delegate: ep.delegateAddress,
    });
    manifest.arweaveBlobs.push({
      step: evt.name,
      blobId: ep.blobId,
      supportsFile: `${evt.name}-supports.json`,
    });
  }
  saveJSON(resolvePath(exampleDir, 'chain-manifest.json'), manifest);
  log('Wrote chain-manifest.json');

  // eventN-supports.json
  for (const evt of config.events) {
    const ep = progress.events[evt.name];
    saveJSON(resolvePath(exampleDir, `${evt.name}-supports.json`), ep.supportIds);
    log(`Wrote ${evt.name}-supports.json`);
  }

  // Payload JSONs
  saveJSON(resolvePath(exampleDir, 'genesis-payload.json'), {
    genesisHash: ZEROS_64,
    previousPolygonHash: ZEROS_64,
    arweaveId: 0,
    delegate: progress.genesisDelegateAddress,
  });
  log('Wrote genesis-payload.json');

  let prevHash = genesisHash;
  for (const evt of config.events) {
    const ep = progress.events[evt.name];
    const payloadName = evt.eventFile.replace('.json', '-payload.json');
    saveJSON(resolvePath(exampleDir, payloadName), {
      genesisHash,
      previousPolygonHash: prevHash,
      arweaveId: ep.blobId,
      delegate: ep.delegateAddress,
    });
    log(`Wrote ${payloadName}`);
    prevHash = ep.polygonHash64;
  }

  // transaction-ids.md
  let md = `# HypotheticalPaintingRevised – Transaction IDs (Polygon & Arweave)\n\n`;
  md += `Record of successful transactions for this example chain.\n\n`;
  md += `**Genesis hash (64 hex, no \`0x\`):**\n\`\`\`\n${genesisHash}\n\`\`\`\n\n---\n\n`;
  md += `## Polygon (anchors)\n\n`;
  md += `| Step     | Tx hash (0x) | 64 hex (for next step's prev hash) |\n`;
  md += `|----------|--------------|-------------------------------------|\n`;
  md += `| Genesis  | \`0x${genesisHash}\` | \`${genesisHash}\` |\n`;

  for (let i = 0; i < config.events.length; i++) {
    const evt = config.events[i];
    const ep = progress.events[evt.name];
    md += `| Event ${i + 1}  | \`${ep.polygonTxHash}\` | \`${ep.polygonHash64}\` |\n`;
  }

  md += `\n---\n\n## Arweave\n\n`;
  for (let i = 0; i < config.events.length; i++) {
    const evt = config.events[i];
    const ep = progress.events[evt.name];
    md += `### Event ${i + 1}\n\n`;
    md += `- **Provenance blob:** \`${ep.blobId}\`\n`;
    md += `- **Supporting files:** see [${evt.name}-supports.json](./${evt.name}-supports.json)\n\n`;
    md += `| Label | Arweave tx ID |\n|-------|---------------|\n`;
    for (const s of ep.supportIds) {
      md += `| ${s.label} | \`${s.id}\` |\n`;
    }
    md += `\n`;
  }
  md += `---\n\n*Full chain (Genesis + Events 1–6) posted.*\n`;
  fs.writeFileSync(resolvePath(exampleDir, 'transaction-ids.md'), md);
  log('Wrote transaction-ids.md');
}

function printSummary(config, progress) {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  DEPLOYMENT COMPLETE');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  Genesis:  0x${progress.genesisHash}`);
  for (let i = 0; i < config.events.length; i++) {
    const evt = config.events[i];
    const ep = progress.events[evt.name];
    console.log(`  Event ${i + 1}:  ${ep.polygonTxHash}  blob: ${ep.blobId}`);
  }
  console.log('──────────────────────────────────────────────────────');

  let totalArweave = 0;
  for (const evt of config.events) {
    const ep = progress.events[evt.name];
    totalArweave += ep.supportIds.length + 1;
  }
  console.log(`  Polygon txs: ${1 + config.events.length}  Arweave txs: ${totalArweave}  Total: ${1 + config.events.length + totalArweave}`);
  console.log('══════════════════════════════════════════════════════\n');
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error('Usage: node deploy-revised-chain.js <path-to-deploy-config.json>');
    process.exit(1);
  }

  const fullConfigPath = path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath);
  const exampleDir = path.dirname(fullConfigPath);
  const config = loadJSON(fullConfigPath);

  const arweaveKeyFull = resolvePath(exampleDir, config.arweaveKeyPath);
  if (!fs.existsSync(arweaveKeyFull)) {
    console.error(`Arweave key not found: ${arweaveKeyFull}`);
    process.exit(1);
  }

  const signersPath = resolvePath(exampleDir, config.signersFile);
  const signers = loadJSON(signersPath);
  if (signers.length < config.events.length + 1) {
    console.error(`Expected at least ${config.events.length + 1} signers, found ${signers.length}`);
    process.exit(1);
  }

  // Load or create progress
  const progressPath = resolvePath(exampleDir, 'deploy-progress.json');
  let progress = {};
  if (fs.existsSync(progressPath)) {
    progress = loadJSON(progressPath);
    log('Found existing deploy-progress.json.');
    const ans = await ask('Resume from previous progress? (y/n) ');
    if (ans.toLowerCase() !== 'y') {
      progress = {};
      log('Starting fresh.');
    } else {
      log('Resuming...');
    }
  }

  // Phase 0: Verify addresses
  await verifyAddresses(signers, config);

  // Phase 1: Genesis
  const genesisHash = await postGenesis(config, signers, progress, exampleDir);

  // Phase 2: Events 1-6
  let prevPolygonHash = genesisHash;
  for (let i = 0; i < config.events.length; i++) {
    prevPolygonHash = await deployEvent(i, config.events[i], config, signers, progress, exampleDir, genesisHash, prevPolygonHash);
  }

  // Phase 3: Write final outputs
  log('Writing final output files...');
  writeFinalOutputs(config, signers, progress, exampleDir);
  printSummary(config, progress);

  log('Done. Verify with:');
  log('  node docs/code/verify-chain.js <path-to-chain-manifest.json>');
  log('  node docs/code/verify-support-tags.js <path-to-chain-manifest.json>');
}

main().catch((e) => {
  console.error('Fatal error:', e.message || e);
  console.error(e.stack);
  process.exit(1);
});
