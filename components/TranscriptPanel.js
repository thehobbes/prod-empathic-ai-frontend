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
  void entries;
  void incoming;
  throw new Error("TODO: implement mergeTranscriptEntry()");
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
export default function TranscriptPanel({ entries, showInterim }) {
  const visibleEntries = showInterim
    ? entries
    : entries.filter((entry) => !entry.interim);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Transcript</h2>
      {visibleEntries?.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {visibleEntries.map((entry) => (
            <li key={entry.messageId} className="rounded-lg border border-zinc-100 p-2">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {entry.role} {entry.interim ? "(interim)" : "(final)"}
              </div>
              <div className="mt-1 text-zinc-800">{entry.text}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-600">No transcript messages yet</p>
      )}
    </section>
  );
}