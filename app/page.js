"use client";

/**
 * Request a new therapy session from the FastAPI backend and return the new session ID.
 *
 * Expected input:
 * - No direct arguments. Implementation should read API base URL from runtime config/env.
 *
 * Expected output:
 * - `Promise<{ sessionId: string }>` where `sessionId` is a backend-generated stable identifier.
 *
 * Data contract notes:
 * - Must call `POST /v1/sessions`.
 * - Must normalize backend response shape (`{session_id}`) to frontend camelCase (`{sessionId}`).
 * - Must throw a typed error object containing HTTP status and user-safe message when request fails.
 *
 * Purpose:
 * - Create a new session before navigating into the voice + graph experience.
 */
export async function createSessionAndNavigate() {
  throw new Error("TODO: implement createSessionAndNavigate()");
}

/**
 * Handle the landing-page Start Session button click.
 *
 * Expected input:
 * - `event` (`React.MouseEvent<HTMLButtonElement>`): user gesture required to begin the flow.
 *
 * Expected output:
 * - `Promise<void>` after creating a session and navigating to `/session?sessionId=...`.
 *
 * Data contract notes:
 * - Should set local loading/error UI state.
 * - Should call `createSessionAndNavigate()`.
 * - Should route to `/session` with query params consumable by `app/session/page.js`.
 *
 * Purpose:
 * - Start the frontend experience from a single click.
 */
export async function handleStartSessionClick(event) {
  void event;
  throw new Error("TODO: implement handleStartSessionClick()");
}

/**
 * Render the landing page that starts a new session.
 *
 * Inputs:
 * - None (client component; local state and handlers will be added later).
 *
 * Output:
 * - A UI shell with a Start Session CTA and room for backend connectivity errors.
 *
 * Purpose:
 * - Entry point for session creation and navigation.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-zinc-900">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Empathic AI Therapy
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Voice session control room
          </h1>
          <p className="text-sm text-zinc-600">
            Frontend skeleton for Hume EVI voice, backend KG updates, transcript,
            prosody signals, graph, and receipts.
          </p>
        </header>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This is a scaffold. The button handler and API integration are
          intentionally unimplemented.
        </div>

        <button
          type="button"
          onClick={handleStartSessionClick}
          className="inline-flex w-fit items-center rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white"
        >
          Start Session
        </button>
      </section>
    </main>
  );
}