"use client";

/**
 * Derive button text, disabled state, and action intent from the voice connection state.
 *
 * Expected input:
 * - `voiceState` (`import('../lib/dtos').VoiceConnectionState`)
 * - `isBusy` (`boolean`, optional): true while connect/disconnect promise is in flight.
 *
 * Expected output:
 * - `{ label: string, disabled: boolean, intent: 'start'|'stop' }`
 *
 * Purpose:
 * - Keep button behavior consistent across all voice connection states.
 */
export function deriveStartStopButtonState(voiceState, isBusy) {
  void voiceState;
  void isBusy;
  throw new Error("TODO: implement deriveStartStopButtonState()");
}

/**
 * Render the user-gesture button that starts/stops the Hume EVI call.
 *
 * Expected input:
 * - `props.voiceState` (`import('../lib/dtos').VoiceConnectionState`)
 * - `props.isBusy` (`boolean`)
 * - `props.onStart` (`() => Promise<void> | void`)
 * - `props.onStop` (`() => Promise<void> | void`)
 *
 * Expected output:
 * - React button element that calls `onStart` or `onStop` based on state.
 *
 * Purpose:
 * - Provide the single required gesture entrypoint for microphone/call lifecycle.
 */
export default function StartStopCallButton({
  voiceState = "idle",
  isBusy = false,
  onStart,
  onStop,
}) {
  const isActive = voiceState === "connected" || voiceState === "connecting";
  const label = isActive ? "Stop Call" : "Start Call";

  return (
    <button
      type="button"
      disabled={isBusy}
      onClick={() => (isActive ? onStop?.() : onStart?.())}
      className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {label}
    </button>
  );
}