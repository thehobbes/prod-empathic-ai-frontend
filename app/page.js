"use client";

import MainPage from "../pages/MainPage.jsx";
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
    <MainPage/>
  );
}