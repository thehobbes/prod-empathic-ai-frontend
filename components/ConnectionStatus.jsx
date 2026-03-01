"use client";

/**
 * Convert raw connection states into a concise UI label and severity style.
 *
 * Expected input:
 * - `connection` (`import('../lib/dtos').ConnectionStatusViewModel`):
 * `{ backend, evi, lastError }` where backend/evi are finite status strings.
 *
 * Expected output:
 * - `import('../lib/dtos').ConnectionStatusBadgeModel`:
 * `{ label: string, tone: 'neutral'|'success'|'warning'|'danger' }`
 *
 * Purpose:
 * - Centralize display formatting for backend/EVI connectivity state.
 */
export function formatConnectionStatusBadge(connection) {
    if (!connection) {
        return { label: "Offline", tone: "neutral" };
    }

    const { backend, evi } = connection;

    if (backend === "error" || evi === "error") {
        return { label: "Error", tone: "danger" };
    }

    if (backend === "connecting" || backend === "reconnecting" || evi === "connecting") {
        return { label: "Connecting...", tone: "warning" };
    }

    if (backend === "connected" && evi === "connected") {
        return { label: "Connected", tone: "success" };
    }

    if (backend === "connected" || evi === "connected") {
        return { label: "Partially Connected", tone: "warning" };
    }

    return { label: "Disconnected", tone: "neutral" };
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
    const badge = formatConnectionStatusBadge(connection);

    // Map the abstract "tone" to Tailwind colors
    const toneColors = {
        neutral: "bg-zinc-100 text-zinc-600 border-zinc-200",
        success: "bg-green-50 text-green-700 border-green-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-red-50 text-red-700 border-red-200",
    };

    return (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Connection Status</h2>

                {/* Render the dynamically generated badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${toneColors[badge.tone]}`}>
                    {badge.label}
                </span>
            </div>

            <p className="mt-2 text-sm text-zinc-600">
                Backend: <span className="font-mono">{connection?.backend ?? "idle"}</span> |
                EVI: <span className="font-mono">{connection?.evi ?? "idle"}</span>
            </p>

            {connection?.lastError ? (
                <p className="mt-2 text-xs text-red-600 font-medium">{connection.lastError}</p>
            ) : null}
        </section>
    );
}