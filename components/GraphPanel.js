"use client";

/**
 * Build graph-visualization props (nodes, edges, styles, highlights) from the normalized graph state.
 *
 * Expected input:
 * - `graph` (`import('../lib/dtos').GraphViewModel`): normalized graph nodes/edges + metadata.
 * - `selectedReceiptId` (`string | null`): receipt currently selected in the receipts panel.
 *
 * Expected output:
 * - `import('../lib/dtos').GraphRenderModel` containing library-agnostic render arrays and highlight ids.
 *
 * Data contract notes:
 * - Must tolerate missing graph library by producing a list/fallback model.
 * - Should attach receipt highlights to nodes/edges referenced by receipt evidence.
 *
 * Purpose:
 * - Isolate visualization-specific transformation logic from the UI component.
 */
export function buildGraphRenderModel(graph, selectedReceiptId) {
  void graph;
  void selectedReceiptId;
  throw new Error("TODO: implement buildGraphRenderModel()");
}

/**
 * Render the live knowledge graph panel.
 *
 * Expected input:
 * - `props.graph` (`import('../lib/dtos').GraphViewModel`)
 * - `props.selectedReceiptId` (`string | null`)
 *
 * Expected output:
 * - React element rendering graph canvas (future) or a fallback list representation.
 *
 * Purpose:
 * - Display live KG diffs coming from the backend WebSocket.
 */
export default function GraphPanel({ graph, selectedReceiptId }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Knowledge Graph</h2>
        <span className="text-xs text-zinc-500">
          Receipt highlight: {selectedReceiptId ?? "none"}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        Nodes: {graph?.nodes?.length ?? 0} | Edges: {graph?.edges?.length ?? 0}
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        TODO: render graph library output with fallback list if library init fails.
      </p>
    </section>
  );
}