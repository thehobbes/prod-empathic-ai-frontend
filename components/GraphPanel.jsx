"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const LABEL_COLORS = {
  Session: "#163a28",
  Utterance: "#285943",
  ProsodyFrame: "#5b7f67",
  Trigger: "#2d6a4f",
  Emotion: "#40916c",
  Belief: "#52b788",
  Need: "#74c69d",
  Goal: "#95d5b2",
  Action: "#b7e4c7",
  Event: "#d8f3dc",
  Person: "#1f5139",
  default: "#7dbf97",
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function trimLabel(value, maxLength = 26) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function getNodeDisplayText(node) {
  if (node?.label === "Session") {
    return {
      label: "Session",
      subLabel: "",
    };
  }

  if (node?.label === "Utterance") {
    return {
      label: "Utterance",
      subLabel: "",
    };
  }

  if (node?.label === "ProsodyFrame") {
    return {
      label: "Prosody",
      subLabel: "",
    };
  }

  const primaryLabel = trimLabel(node?.canonical || node?.name || node?.id, 28);
  const secondaryLabel = trimLabel(node?.label || "Node", 16);

  return {
    label: primaryLabel || secondaryLabel,
    subLabel: secondaryLabel,
  };
}

function buildPopupPosition(event, container) {
  const rect = container.getBoundingClientRect();
  const candidate =
    event?.sourceEvent ??
    event?.nativeEvent ??
    event?.event ??
    event ??
    null;
  const clientX = candidate?.clientX ?? rect.left + rect.width * 0.5;
  const clientY = candidate?.clientY ?? rect.top + rect.height * 0.5;

  return {
    left: clamp(clientX - rect.left + 18, 12, Math.max(rect.width - 308, 12)),
    top: clamp(clientY - rect.top + 18, 12, Math.max(rect.height - 248, 12)),
  };
}

function buildGraphModel(graph) {
  const safeNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const safeEdges = Array.isArray(graph?.edges) ? graph.edges : [];
  const normalizedNodes = safeNodes.map((node) => ({
    ...node,
    label:
      node?.label ??
      node?.type ??
      node?.nodeType ??
      node?.kind ??
      (Array.isArray(node?.labels) ? node.labels[0] : null) ??
      "Node",
    canonical:
      node?.canonical ??
      node?.name ??
      node?.title ??
      node?.properties?.canonical ??
      node?.properties?.text ??
      node?.properties?.summary ??
      node?.properties?.name ??
      null,
  }));
  const normalizedEdges = safeEdges.map((edge) => ({
    ...edge,
    type:
      edge?.type ??
      edge?.label ??
      edge?.relationshipType ??
      edge?.relationship_type ??
      edge?.relType ??
      edge?.rel_type ??
      "RELATED_TO",
    sourceId:
      edge?.sourceId ??
      edge?.source ??
      edge?.source_id ??
      edge?.from ??
      edge?.from_id ??
      edge?.start ??
      edge?.startNode ??
      edge?.start_node_id ??
      null,
    targetId:
      edge?.targetId ??
      edge?.target ??
      edge?.target_id ??
      edge?.to ??
      edge?.to_id ??
      edge?.end ??
      edge?.endNode ??
      edge?.end_node_id ??
      null,
  }));
  const sessionId =
    graph?.sessionId ??
    graph?.session_id ??
    normalizedNodes.find((node) => node?.sessionId || node?.session_id || node?.properties?.session_id)?.sessionId ??
    normalizedNodes.find((node) => node?.sessionId || node?.session_id || node?.properties?.session_id)?.session_id ??
    normalizedNodes.find((node) => node?.sessionId || node?.session_id || node?.properties?.session_id)?.properties
      ?.session_id ??
    normalizedEdges.find((edge) => edge?.sessionId || edge?.session_id || edge?.properties?.session_id)?.sessionId ??
    normalizedEdges.find((edge) => edge?.sessionId || edge?.session_id || edge?.properties?.session_id)?.session_id ??
    normalizedEdges.find((edge) => edge?.sessionId || edge?.session_id || edge?.properties?.session_id)?.properties
      ?.session_id ??
    null;
  const existingSessionNode = normalizedNodes.find((node) => node.label === "Session") ?? null;
  const sessionNodeId = existingSessionNode?.id ?? (sessionId ? `session:${sessionId}` : null);
  const hasRealSessionEdges = normalizedEdges.some((edge) => edge.sourceId === sessionNodeId || edge.targetId === sessionNodeId);
  const shouldSynthesizeSession = Boolean(sessionNodeId && !existingSessionNode);
  const syntheticSessionEdges = sessionNodeId && !hasRealSessionEdges
    ? normalizedNodes
        .filter((node) => node.id !== sessionNodeId)
        .map((node) => ({
        id: `session-edge:${sessionId}:${node.id}`,
        type: "CONTAINS",
        sourceId: sessionNodeId,
        targetId: node.id,
        sessionId,
        synthetic: true,
        properties: {
          session_id: sessionId,
          generated_by: "frontend",
          relation: "session_contains_node",
        },
      }))
    : [];
  const degreeMap = new Map();

  [...normalizedEdges, ...syntheticSessionEdges].forEach((edge) => {
    const sourceId = edge.sourceId ?? edge.source ?? edge.source_id;
    const targetId = edge.targetId ?? edge.target ?? edge.target_id;

    if (sourceId) {
      degreeMap.set(sourceId, (degreeMap.get(sourceId) ?? 0) + 1);
    }

    if (targetId) {
      degreeMap.set(targetId, (degreeMap.get(targetId) ?? 0) + 1);
    }
  });

  const sourceNodes = shouldSynthesizeSession
    ? [
        {
          id: sessionNodeId,
          label: "Session",
          canonical: sessionId,
          sessionId,
          synthetic: true,
          properties: {
            session_id: sessionId,
            generated_by: "frontend",
          },
        },
        ...normalizedNodes,
      ]
    : normalizedNodes;
  const nodeIds = new Set(sourceNodes.map((node) => node.id));
  const nodes = sourceNodes.map((node) => {
    const degree = degreeMap.get(node.id) ?? 0;
    const fill = LABEL_COLORS[node.label] ?? LABEL_COLORS.default;
    const displayText = getNodeDisplayText(node);
    const baseSize =
      node.label === "Session" ? 34 : node.label === "Utterance" ? 18 : node.label === "ProsodyFrame" ? 16 : 22;

    return {
      id: node.id,
      label: displayText.label,
      subLabel: displayText.subLabel,
      fill,
      size: Math.min(baseSize + degree * 1.9, 38),
      data: node,
    };
  });

  const edges = [...syntheticSessionEdges, ...normalizedEdges]
    .map((edge, index) => {
      const source = edge.sourceId ?? edge.source ?? edge.source_id;
      const target = edge.targetId ?? edge.target ?? edge.target_id;

      if (!source || !target || !nodeIds.has(source) || !nodeIds.has(target)) {
        return null;
      }

      return {
        id: edge.id || `${source}:${target}:${edge.type || index}`,
        source,
        target,
        label: trimLabel(edge.type || "RELATED_TO", 22),
        fill: edge.synthetic ? "#7fbf8f" : "#4b8f68",
        interpolation: "curved",
        arrowPlacement: "end",
        dashed: Boolean(edge.synthetic),
        dashArray: edge.synthetic ? [6, 6] : undefined,
        data: edge,
      };
    })
    .filter(Boolean);

  return { nodes, edges };
}

export default function GraphPanel({ graph }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [GraphCanvasComponent, setGraphCanvasComponent] = useState(null);
  const [popup, setPopup] = useState(null);

  const graphModel = useMemo(() => buildGraphModel(graph), [graph]);
  const selectedIds = popup ? [popup.item.id] : [];

  useEffect(() => {
    let cancelled = false;

    import("reagraph").then((module) => {
      if (!cancelled) {
        setGraphCanvasComponent(() => module.GraphCanvas);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!GraphCanvasComponent || !graphRef.current || graphModel.nodes.length === 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      graphRef.current?.fitNodesInView?.();
    }, 160);

    return () => window.clearTimeout(timeoutId);
  }, [GraphCanvasComponent, graphModel.edges.length, graphModel.nodes.length]);

  const openPopup = (kind, item, event) => {
    if (!containerRef.current) {
      return;
    }

    setPopup({
      kind,
      item,
      ...buildPopupPosition(event, containerRef.current),
    });
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm flex flex-col h-full min-h-[300px]">
      {graphModel.nodes.length > 0 ? (
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[360px] overflow-hidden rounded-2xl border border-[#dfe9e2] bg-[radial-gradient(circle_at_top,_rgba(181,228,199,0.36),_transparent_34%),linear-gradient(180deg,#f9fcfa,#edf6ef)]"
        >
          {GraphCanvasComponent ? (
            <GraphCanvasComponent
              ref={graphRef}
              nodes={graphModel.nodes}
              edges={graphModel.edges}
              layoutType="forceDirected2d"
              labelType="auto"
              cameraMode="pan"
              draggable={false}
              maxDistance={3200}
              minDistance={120}
              selections={selectedIds}
              actives={selectedIds}
              edgeArrowPosition="end"
              onCanvasClick={() => setPopup(null)}
              onNodeClick={(node, _, event) => {
                openPopup("node", node.data || node, event);
              }}
              onEdgeClick={(edge, event) => {
                openPopup("edge", edge.data || edge, event);
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#4a6a56]">
              Loading graph...
            </div>
          )}

          {popup ? (
            <div
              className="absolute z-10 w-[296px] max-w-[calc(100%-24px)] rounded-2xl border border-[#cfe4d3] bg-white/96 p-4 shadow-[0_28px_56px_rgba(15,23,42,0.18)] backdrop-blur"
              style={{ left: popup.left, top: popup.top }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#204330]">
                    {popup.kind === "node"
                      ? `${popup.item.label || "Node"}: ${popup.item.canonical || popup.item.id}`
                      : `${popup.item.type || popup.item.label || "Edge"} edge`}
                  </h3>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    {popup.kind === "node" ? "Node Payload" : "Edge Payload"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  className="rounded-full px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100"
                >
                  Close
                </button>
              </div>
              <pre className="mt-3 max-h-[220px] overflow-auto rounded-xl bg-[#edf6ef] p-3 text-[11px] leading-5 text-[#1f3528]">
                {JSON.stringify(popup.item, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-zinc-50 border border-zinc-100 rounded-lg p-2 custom-scrollbar">
          <div className="h-full flex items-center justify-center text-sm text-zinc-400 italic">
            Waiting for conversation context...
          </div>
        </div>
      )}
    </section>
  );
}
