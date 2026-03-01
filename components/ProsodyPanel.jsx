"use client";

/**
 * Select and sort the top prosody/expression signals for display.
 *
 * Expected input:
 * - `signals` (`import('../lib/dtos').ProsodySignal[]`): flattened prosody signals for the active or most recent user message.
 * - `limit` (`number`, optional): maximum rows to display (default should be 5-8).
 *
 * Expected output:
 * - `import('../lib/dtos').ProsodySignal[]` sorted descending by confidence score.
 *
 * Data contract notes:
 * - Labels should be framed as "vocal expression signals", not emotional truth.
 * - Missing/empty inputs should return `[]`.
 *
 * Purpose:
 * - Standardize prosody ranking before rendering UI rows.
 */
export function selectTopProsodySignals(signals, limit = 5) {
    if (!signals || !Array.isArray(signals)) {
        return [];
    }

    const sortedSignals = [...signals].sort((a, b) => b.score - a.score);

    return sortedSignals.slice(0, limit);
}

/**
 * Render the prosody signal panel for expression measurements derived from EVI messages.
 *
 * Expected input:
 * - `props.signals` (`import('../lib/dtos').ProsodySignal[]`)
 *
 * Expected output:
 * - React element showing top signals or "No prosody frame" fallback text.
 *
 * Purpose:
 * - Present Hume prosody interpretation confidence in a safe, non-clinical framing.
 */
export default function ProsodyPanel({ signals }) {
    const topSignals = selectTopProsodySignals(signals, 5);

    return (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm flex flex-col h-full min-h-[250px]">

            {/* Header with Safe Framing */}
            <div className="mb-5">
                <h2 className="text-sm font-semibold text-gray-800">Vocal Expression Signals</h2>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">
                    Prosody Interpretation Confidence
                </p>
            </div>

            {/* Signal Bars */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {topSignals.length > 0 ? (
                    <ul className="space-y-3.5 text-sm text-zinc-700">
                        {topSignals.map((signal) => {
                            // Convert the 0-1 decimal score into a clean percentage
                            const percentage = Math.round(signal.score * 100);

                            return (
                                <li key={signal.label} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center text-xs font-medium">
                                        <span className="text-gray-700">{signal.label}</span>
                                        <span className="text-zinc-500">{percentage}%</span>
                                    </div>

                                    {/* Progress Bar UI */}
                                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-[#5BA87F] h-1.5 rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="h-full flex items-center justify-center text-sm text-zinc-400 italic">
                        Waiting for vocal input...
                    </div>
                )}
            </div>

        </section>
    );
}