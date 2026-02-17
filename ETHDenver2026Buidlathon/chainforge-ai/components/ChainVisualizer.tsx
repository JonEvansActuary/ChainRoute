"use client";

import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import type { DecodedPayload } from "@/lib/chainroute/verifier";
import type { ProvenanceBlob } from "@/lib/chainroute/types";
import { useNetwork } from "./NetworkContext";

export interface ChainNodeData {
  label: string;
  txHash?: string;
  arweaveId?: string;
  decoded?: DecodedPayload;
  blob?: ProvenanceBlob;
  isGenesis?: boolean;
}

interface ChainVisualizerProps {
  genesisHash: string;
  nodes: Array<{
    txHash: string;
    decoded?: DecodedPayload;
    blob?: ProvenanceBlob;
  }>;
  className?: string;
  /** When set (e.g. for Polygon mainnet demo chain), tx links use this base instead of the active network explorer */
  explorerBaseUrl?: string;
}

function buildNodesAndEdges(
  genesisHash: string,
  nodes: ChainVisualizerProps["nodes"]
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const chainNodes: Node<ChainNodeData>[] = [];
  const edges: Edge[] = [];
  let y = 0;

  nodes.forEach((n, i) => {
    const isGenesis = i === 0;
    const id = n.txHash.slice(0, 16);
    chainNodes.push({
      id,
      type: "default",
      position: { x: 40, y: y * 120 },
      data: {
        label: isGenesis ? "Genesis" : `Event ${i}`,
        txHash: n.txHash,
        arweaveId: n.decoded?.arweaveId,
        decoded: n.decoded,
        blob: n.blob,
        isGenesis,
      },
      className: "rounded-lg border-2 border-chain-neon/40 bg-card px-3 py-2 shadow chain-glow",
    });
    if (i > 0) {
      edges.push({
        id: `e-${i}`,
        source: chainNodes[i - 1].id,
        target: id,
        animated: true,
        style: { stroke: "#00ff9d", strokeWidth: 2 },
      });
    }
    y++;
  });

  return { nodes: chainNodes, edges };
}

type NodeData = ChainNodeData;

export function ChainVisualizer({ genesisHash, nodes, className = "", explorerBaseUrl }: ChainVisualizerProps) {
  const { explorerUrl } = useNetwork();
  const { nodes: initialNodes, edges: initialEdges } = buildNodesAndEdges(genesisHash, nodes);
  const [nodesState, setNodesState] = useNodesState(initialNodes);
  const [edgesState, setEdgesState] = useEdgesState(initialEdges);
  const explorerBase = explorerBaseUrl ?? explorerUrl;

  const nodeTypes: NodeTypes = {
    default: ({ data }) => (
      <div className="min-w-[200px]">
        <div className="font-semibold text-chain-neon">{data.label}</div>
        {data.txHash && (
          <a
            href={`${explorerBase}/tx/${data.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-xs text-muted-foreground hover:text-chain-neon"
          >
            {data.txHash.slice(0, 10)}…{data.txHash.slice(-8)}
          </a>
        )}
        {data.arweaveId && (
          <a
            href={`https://arweave.net/${data.arweaveId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-xs text-muted-foreground hover:text-chain-neon"
          >
            Arweave: {data.arweaveId.slice(0, 12)}…
          </a>
        )}
        {data.blob?.eventType && (
          <p className="mt-1 text-xs text-muted-foreground">{data.blob.eventType}</p>
        )}
        {data.decoded?.delegate && (
          <p className="mt-1 text-xs text-amber-400">
            Next signer: {data.decoded.delegate.slice(0, 6)}...{data.decoded.delegate.slice(-4)}
          </p>
        )}
      </div>
    ),
  };

  return (
    <div className={`h-[280px] w-full rounded-xl border border-border sm:h-[400px] ${className}`}>
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={(changes) => setNodesState((nodes) => applyNodeChanges(changes, nodes))}
        onEdgesChange={(changes) => setEdgesState((edges) => applyEdgeChanges(changes, edges))}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Background />
        <Controls />
        <MiniMap nodeColor="#00ff9d" maskColor="hsl(160 20% 6% / 0.8)" />
      </ReactFlow>
    </div>
  );
}
