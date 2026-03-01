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
  void receipt;
  throw new Error("TODO: implement formatReceiptListItem()");
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
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Receipts</h2>
      {receipts?.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {receipts.map((receipt) => (
            <li key={receipt.receiptId}>
              <button
                type="button"
                onClick={() => onSelectReceipt?.(receipt.receiptId)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-left"
              >
                <div className="font-medium">
                  {receipt.toolName}{" "}
                  {receipt.receiptId === selectedReceiptId ? "(selected)" : ""}
                </div>
                <div className="text-xs text-zinc-500">
                  {receipt.evidence?.quote ?? "Missing evidence quote"}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-600">No receipts yet</p>
      )}
    </section>
  );
}