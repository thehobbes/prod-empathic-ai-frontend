"use client";

/**
 * Merge incoming transcript events into a stable list of transcript rows.
 *
 * Expected input:
 * - `entries` (`import('../lib/dtos').TranscriptEntry[]`)
 * - `incoming` (`import('../lib/dtos').TranscriptEntry`)
 *
 * Expected output:
 * - `import('../lib/dtos').TranscriptEntry[]` preserving order and preventing interim rows from becoming final duplicates.
 *
 * Data contract notes:
 * - Should de-dupe by `messageId`.
 * - If an interim row becomes final, replace/update the existing row.
 *
 * Purpose:
 * - Provide a safe merge policy for verbose transcription streams.
 */
export function mergeTranscriptEntry(entries, incoming) {
    if (!incoming || !incoming.messageId) return entries || [];

    const safeEntries = entries || [];
    const existingIndex = safeEntries.findIndex(e => e.messageId === incoming.messageId);

    if (existingIndex >= 0) {
        // Replace the existing entry (maintaining React immutability)
        const updatedEntries = [...safeEntries];
        updatedEntries[existingIndex] = incoming;
        return updatedEntries;
    }

    // Brand new message, append to the end
    return [...safeEntries, incoming];
}

/**
 * Render the user/assistant transcript list.
 *
 * Expected input:
 * - `props.entries` (`import('../lib/dtos').TranscriptEntry[]`)
 * - `props.showInterim` (`boolean`): whether interim rows should be visible.
 *
 * Expected output:
 * - React element listing transcript rows with role and final/interim state.
 *
 * Purpose:
 * - Display the live conversation transcript sourced from EVI messages.
 */
export default function TranscriptPanel({ entries, showInterim = true }) {
    const safeEntries = entries || [];
    const visibleEntries = showInterim
        ? safeEntries
        : safeEntries.filter((entry) => !entry.interim);

    return (
        <section className="rounded-xl border border-zinc-200 bg-[#FAFAFA] p-5 shadow-sm flex flex-col h-full min-h-[400px]">

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Live Transcript</h2>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5BA87F] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4d916d]"></span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-500">
                        {showInterim ? "Verbose Mode" : "Finalized Only"}
                    </span>
                </div>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-2 custom-scrollbar">
                {visibleEntries.length > 0 ? (
                    visibleEntries.map((entry) => {
                        const isUser = entry.role === "user";

                        return (
                            <div key={entry.messageId} className="flex gap-3">

                                {/* Avatar */}
                                <div className="flex-shrink-0 mt-1">
                                    {isUser ? (
                                        <div className="w-8 h-8 rounded-full bg-[#E5B89B] border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-xs font-bold text-white">
                                            U
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#D1E6DD] border-2 border-white shadow-sm flex items-center justify-center">
                                            <svg className="w-4 h-4 text-[#2D6A4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2 mb-1.5">
                                        <span className="text-xs font-medium text-gray-500 capitalize">
                                            {isUser ? "User" : "AI"}
                                        </span>
                                        {entry.interim && (
                                            <span className="text-[10px] text-[#5BA87F] italic animate-pulse">
                                                typing...
                                            </span>
                                        )}
                                    </div>

                                    <div className={`p-3.5 text-sm shadow-sm transition-all duration-200 ${isUser
                                            ? 'bg-[#3A6048] text-white rounded-2xl rounded-tl-sm'
                                            : 'bg-white text-gray-700 rounded-2xl rounded-tl-sm border border-gray-100'
                                        } ${entry.interim ? 'opacity-70' : 'opacity-100'}`}>
                                        {entry.text ?? entry.content ?? ""}
                                    </div>
                                </div>

                            </div>
                        );
                    })
                ) : (
                    <div className="h-full flex items-center justify-center text-sm text-zinc-400 italic">
                        Awaiting conversation...
                    </div>
                )}
            </div>

        </section>
    );
}
