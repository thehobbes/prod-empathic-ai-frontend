"use client";

import StartStopCallButton from "./StartStopCallButton";

/**
 * Normalize Hume EVI SDK events/messages into the frontend transcript + prosody DTO format.
 *
 * Expected input:
 * - `eviEvent` (`unknown`): raw event emitted by Hume React SDK hook/component callbacks.
 *
 * Expected output:
 * - `import('../lib/dtos').EviNormalizedEvent | null`
 *   - returns `null` for unsupported or interim-only events the UI does not persist.
 *
 * Data contract notes:
 * - Must preserve `messageId`, `role`, `content`, `interim`, and `prosodyScores` when present.
 * - Should handle `user_message`, `assistant_message`, `audio_output`, and metadata events gracefully.
 *
 * Purpose:
 * - Decouple UI/state code from raw Hume SDK event shapes.
 */
export function normalizeEviSdkEvent(eviEvent) {
  void eviEvent;
  throw new Error("TODO: implement normalizeEviSdkEvent()");
}

/**
 * Create the Hume EVI connection configuration object (token, config id, verbose transcription).
 *
 * Expected input:
 * - `params` (`import('../lib/dtos').BuildEviConnectionConfigParams`)
 *   `{ accessToken, humeConfigId?, verboseTranscription, sessionId }`
 *
 * Expected output:
 * - A plain object consumable by the future Hume React SDK wrapper/hook.
 *
 * Purpose:
 * - Centralize voice connection settings and prevent config drift.
 */
export function buildEviConnectionConfig(params) {
  void params;
  throw new Error("TODO: implement buildEviConnectionConfig()");
}

/**
 * Render the voice panel that will host the Hume EVI call UI and controls.
 *
 * Expected input:
 * - `props.sessionId` (`string | null`)
 *
 * Expected output:
 * - React element containing voice connection controls and future Hume SDK UI mount point.
 *
 * Purpose:
 * - Encapsulate the browser-side voice experience and EVI connection lifecycle.
 */
export default function VoicePanel({ sessionId }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Voice Panel (Hume EVI)</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Session ID: {sessionId ?? "missing"}
          </p>
        </div>
        <StartStopCallButton
          voiceState="idle"
          onStart={() => {
            throw new Error("TODO: implement Hume EVI connect()");
          }}
          onStop={() => {
            throw new Error("TODO: implement Hume EVI disconnect()");
          }}
        />
      </div>
      <p className="mt-3 text-sm text-zinc-600">
        TODO: mount Hume React SDK provider/client UI and expose connection/error state.
      </p>
    </section>
  );
}