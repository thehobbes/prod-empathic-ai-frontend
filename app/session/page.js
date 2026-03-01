import ConnectionStatus from "../../components/ConnectionStatus";
import GraphPanel from "../../components/GraphPanel";
import ProsodyPanel from "../../components/ProsodyPanel";
import ReceiptsPanel from "../../components/ReceiptsPanel";
import TranscriptPanel from "../../components/TranscriptPanel";
import VoicePanel from "../../components/VoicePanel";

/**
 * Extract and validate the `sessionId` query parameter from App Router `searchParams`.
 *
 * Expected input:
 * - `searchParams` (`Record<string, string | string[] | undefined>`): query params supplied by Next.js route.
 *
 * Expected output:
 * - `{ sessionId: string | null, error: string | null }`
 *   - `sessionId`: valid normalized session ID or `null`
 *   - `error`: user-displayable validation error if missing/invalid
 *
 * Data contract notes:
 * - Must support `?sessionId=...` and reject array values unless explicitly supported.
 * - Should enforce a safe session ID pattern used by backend route `/ws/session/{sessionId}`.
 *
 * Purpose:
 * - Provide a safe bootstrap point for the realtime session route.
 */
export function parseSessionRouteParams(searchParams) {
  void searchParams;
  throw new Error("TODO: implement parseSessionRouteParams()");
}

/**
 * Build the initial UI view model used to render empty panels before streams connect.
 *
 * Expected input:
 * - `sessionId` (`string`): validated session identifier for the active page.
 *
 * Expected output:
 * - `import('../../lib/dtos').SessionPageViewModel`
 *   with placeholder transcript/prosody/graph/receipts/connection states.
 *
 * Purpose:
 * - Ensure all panels can render deterministically before realtime data arrives.
 */
export function buildInitialSessionViewModel(sessionId) {
  void sessionId;
  throw new Error("TODO: implement buildInitialSessionViewModel()");
}

/**
 * Render the main session experience page that hosts voice, transcript, graph, and receipts.
 *
 * Inputs:
 * - `searchParams`: Next.js App Router query parameter object.
 *
 * Output:
 * - The session dashboard shell and all major panel placeholders.
 *
 * Purpose:
 * - Main frontend route for the hackathon demo experience.
 */
export default function SessionPage({ searchParams }) {
  const rawSessionId =
    typeof searchParams?.sessionId === "string" ? searchParams.sessionId : null;

  const placeholderConnection = {
    backend: "idle",
    evi: "idle",
    lastError: null,
  };

  return (
    <main className="min-h-screen bg-zinc-100 p-4 text-zinc-900 md:p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <VoicePanel sessionId={rawSessionId} />
          <ConnectionStatus connection={placeholderConnection} />
          <TranscriptPanel entries={[]} showInterim={false} />
          <ProsodyPanel signals={[]} />
        </section>

        <section className="space-y-4">
          <GraphPanel
            graph={{ nodes: [], edges: [], metadata: { updatedAtMs: null } }}
            selectedReceiptId={null}
          />
          <ReceiptsPanel receipts={[]} selectedReceiptId={null} />
        </section>
      </div>
    </main>
  );
}