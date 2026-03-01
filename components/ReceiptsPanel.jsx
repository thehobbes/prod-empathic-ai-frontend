"use client";

/**
 * Format a receipt item into UI-ready text snippets and referenced graph ids.
 *
 * Expected input:
 * - `receipt` (`import('../lib/dtos').Receipt`)
 *
 * Expected output:
 * - `import('../lib/dtos').ReceiptListItemViewModel` with summary, evidence quote, and highlight targets.
 *
 * Purpose:
 * - Normalize backend receipt/tool-call evidence into a consistent presentation format.
 */
export function formatReceiptListItem(receipt) {
    if (!receipt) return null;

    const formattedSummary = receipt.toolName
        ? receipt.toolName.replace(/_/g, ' ')
        : "Unknown Action";

    return {
        receiptId: receipt.receiptId,
        summary: formattedSummary,
        evidenceQuote: receipt.evidence?.quote || "No explicit quote provided.",
        isVerified: receipt.evidence?.verified ?? false,
        highlightNodeIds: Array.isArray(receipt.nodeIds) ? receipt.nodeIds : [],
        highlightEdgeIds: Array.isArray(receipt.edgeIds) ? receipt.edgeIds : [],
    };
}

/**
 * Render the "why this changed" receipts panel for KG tool calls and evidence quotes.
 *
 * Expected input:
 * - `props.receipts` (`import('../lib/dtos').Receipt[]`)
 * - `props.selectedReceiptId` (`string | null`)
 * - `props.onSelectReceipt?` (`(receiptId: string | null) => void`)
 *
 * Expected output:
 * - React element listing receipts and showing verification state for evidence.
 *
 * Purpose:
 * - Provide transparent traceability from transcript evidence to KG mutations.
 */
export default function ReceiptsPanel({
    receipts,
    selectedReceiptId,
    onSelectReceipt,
}) {
    return (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm flex flex-col h-full min-h-[300px]">

            {/* Header */}
            <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Evidence Receipts</h2>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">
                    Graph Mutation Log
                </p>
            </div>

            {/* Receipts List */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {receipts?.length > 0 ? (
                    <ul className="space-y-3">
                        {receipts.map((rawReceipt) => {
                            const formatted = formatReceiptListItem(rawReceipt);
                            if (!formatted) return null;

                            const isSelected = formatted.receiptId === selectedReceiptId;

                            return (
                                <li key={formatted.receiptId}>
                                    <button
                                        type="button"
                                        onClick={() => onSelectReceipt?.(formatted.receiptId)}
                                        className={`w-full text-left rounded-lg border p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5BA87F]/50 ${isSelected
                                                ? "bg-[#E5EFE9] border-[#5BA87F] shadow-sm"
                                                : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                                            }`}
                                    >
                                        {/* Action Title / Summary */}
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={`text-xs font-bold uppercase tracking-wide ${isSelected ? "text-[#2C5F43]" : "text-zinc-600"}`}>
                                                {formatted.summary}
                                            </span>
                                            {formatted.isVerified && (
                                                <svg className="w-4 h-4 text-[#5BA87F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            )}
                                        </div>

                                        {/* Evidence Quote Bubble */}
                                        <div className={`text-sm italic pl-3 border-l-2 ${isSelected ? "border-[#5BA87F] text-[#3A6048]" : "border-zinc-300 text-zinc-600"}`}>
                                            "{formatted.evidenceQuote}"
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="h-full flex items-center justify-center text-sm text-zinc-400 italic">
                        Awaiting graph updates...
                    </div>
                )}
            </div>

        </section>
    );
}