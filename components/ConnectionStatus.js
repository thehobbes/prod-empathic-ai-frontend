"use client";

/**
 * Convert raw connection states into a concise UI label and severity style.
 *
 * Expected input:
 * - `connection` (`import('../lib/dtos').ConnectionStatusViewModel`):
 *   `{ backend, evi, lastError }` where backend/evi are finite status strings.
 *
 * Expected output:
 * - `import('../lib/dtos').ConnectionStatusBadgeModel`:
 *   `{ label: string, tone: 'neutral'|'success'|'warning'|'danger' }`
 *
 * Purpose:
 * - Centralize display formatting for backend/EVI connectivity state.
 */
export function formatConnectionStatusBadge(connection) {
  void connection;
  throw new Error("TODO: implement formatConnectionStatusBadge()");
}

/**
 * Render connection health for backend websocket and Hume EVI.
 *
 * Expected input:
 * - `props.connection` (`import('../lib/dtos').ConnectionStatusViewModel`)
 *
 * Expected output:
 * - React element showing connection states and any last error message.
 *
 * Purpose:
 * - Give operators immediate feedback about realtime system health.
 */
export default function ConnectionStatus({ connection }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Connection Status</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Backend: {connection?.backend ?? "idle"} | EVI: {connection?.evi ?? "idle"}
      </p>
      {connection?.lastError ? (
        <p className="mt-2 text-xs text-red-600">{connection.lastError}</p>
      ) : null}
    </section>
  );
}