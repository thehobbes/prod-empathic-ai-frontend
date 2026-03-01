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
    if (voiceState === "connecting") {
        return { label: "Connecting...", disabled: true, intent: "start" };
    }
    if (voiceState === "disconnecting") {
        return { label: "Disconnecting...", disabled: true, intent: "stop" };
    }
    if (isBusy) {
        return { label: "Processing...", disabled: true, intent: "start" };
    }

    if (voiceState === "connected") {
        return { label: "End Session", disabled: false, intent: "stop" };
    }

    return { label: "Start Session", disabled: false, intent: "start" };
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
    const { label, disabled, intent } = deriveStartStopButtonState(voiceState, isBusy);

    // Dynamic styling based on whether we are starting (green) or stopping (red)
    const baseClasses = "inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
    const colorClasses = intent === "stop"
        ? "bg-[#5BA87F] hover:bg-[#5BA87F] focus:ring-[#5BA87F]"
        : "bg-[#5BA87F] hover:bg-[#4d916d] focus:ring-[#5BA87F]";

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => (intent === "start" ? onStart?.() : onStop?.())}
            className={`${baseClasses} ${colorClasses} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
            {/* Mic Icon for Start */}
            {intent === "start" && (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            )}

            {/* Stop Square Icon for End */}
            {intent === "stop" && (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
            )}

            {label}
        </button>
    );
}