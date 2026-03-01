"use client";

/**
 * Build graph-visualization props (nodes, edges, styles, highlights) from the normalized graph state.
 */
export function buildGraphRenderModel(graph, selectedReceiptId) {
  const safeNodes = graph?.nodes || [];
  const safeEdges = graph?.edges || [];

  return {
    nodes: safeNodes.map((node) => ({
      id: node.id,
      label: node.label,
      canonical: node.canonical,
      isHighlighted: false, 
    })),
    edges: safeEdges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.type,
      isHighlighted: false,
    })),
    highlights: { highlightNodeIds: [], highlightEdgeIds: [] },
    fallbackRows: safeNodes.map((n) => ({
      id: n.id,
      label: n.label,
      canonical: n.canonical,
    })),
  };
}

/**
 * Render the live knowledge graph panel.
 */
export default function GraphPanel({ graph, selectedReceiptId }) {
  // 👇 THIS IS THE LINE THAT WAS MISSING! 👇
  const renderModel = buildGraphRenderModel(graph, selectedReceiptId);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm flex flex-col h-full min-h-[300px]">
      
      {/* Header section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Knowledge Graph</h2>
        <span className="text-xs font-medium px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-md">
          Receipt Highlight: {selectedReceiptId ?? "None"}
        </span>
      </div>
      
      {/* Graph Statistics */}
      <div className="flex gap-3 mb-4 text-xs">
        <div className="bg-[#EFEFEF] text-gray-700 px-3 py-1.5 rounded-full font-medium">
          Nodes: {renderModel.nodes.length}
        </div>
        <div className="bg-[#EFEFEF] text-gray-700 px-3 py-1.5 rounded-full font-medium">
          Edges: {renderModel.edges.length}
        </div>
      </div>

      {/* The Fallback UI (Entity List) */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 border border-zinc-100 rounded-lg p-2 custom-scrollbar">
        {renderModel.fallbackRows.length > 0 ? (
          <ul className="space-y-2">
            {renderModel.fallbackRows.map((row) => (
              <li 
                key={row.id} 
                className="bg-white p-3 rounded-md shadow-sm border border-zinc-100 flex items-center gap-3 transition-all hover:border-zinc-300"
              >
                <span className="text-[10px] font-bold text-[#5BA87F] uppercase tracking-wider bg-[#E5EFE9] px-2 py-1 rounded">
                  {row.label}
                </span>
                <span className="text-sm text-gray-700 font-medium">
                  {row.canonical}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-zinc-400 italic">
            Waiting for conversation context...
          </div>
        )}
      </div>

    </section>
  );
}