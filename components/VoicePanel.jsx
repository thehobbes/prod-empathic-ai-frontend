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
 * - returns `null` for unsupported or interim-only events the UI does not persist.
 *
 * Data contract notes:
 * - Must preserve `messageId`, `role`, `content`, `interim`, and `prosodyScores` when present.
 * - Should handle `user_message`, `assistant_message`, `audio_output`, and metadata events gracefully.
 *
 * Purpose:
 * - Decouple UI/state code from raw Hume SDK event shapes.
 */
export function normalizeEviSdkEvent(eviEvent) {
    if (!eviEvent || !eviEvent.type) return null;

    switch (eviEvent.type) {
        case "user_message":
            return {
                kind: "user_message",
                messageId: eviEvent.message?.id || Date.now().toString(),
                role: "user",
                content: eviEvent.message?.content || "",
                interim: eviEvent.message?.interim || false,
                // Extract the specific prosody scores array from Hume's nested JSON
                prosodyScores: eviEvent.models?.prosody?.scores || null,
                timestampMs: Date.now(),
            };

        case "assistant_message":
            return {
                kind: "assistant_message",
                messageId: eviEvent.message?.id || Date.now().toString(),
                role: "assistant",
                content: eviEvent.message?.content || "",
                interim: false, // Assistant messages are generally sent as final chunks
                prosodyScores: null, // Assistant doesn't have prosody analysis in this pipeline
                timestampMs: Date.now(),
            };

        default:
            // Gracefully ignore audio_output chunks, ping/pong, and chat_metadata
            // as they don't need to be persisted in our transcript UI state.
            return null;
    }
}

/**
 * Create the Hume EVI connection configuration object (token, config id, verbose transcription).
 *
 * Expected input:
 * - `params` (`import('../lib/dtos').BuildEviConnectionConfigParams`)
 * `{ accessToken, humeConfigId?, verboseTranscription, sessionId }`
 *
 * Expected output:
 * - A plain object consumable by the future Hume React SDK wrapper/hook.
 *
 * Purpose:
 * - Centralize voice connection settings and prevent config drift.
 */
export function buildEviConnectionConfig({
    accessToken,
    humeConfigId,
    verboseTranscription,
    sessionId,
}) {
    return {
        auth: {
            strategy: "accessToken",
            value: accessToken,
        },
        // Optional: Only pass the config ID if you created a specific persona in the Hume portal
        configId: humeConfigId || undefined,
        // Required to true if we want the "typing..." interim effect
        verboseTranscription: !!verboseTranscription,
        // We attach our backend's sessionId as custom metadata so the Hume EVI logs
        // can be correlated with our Knowledge Graph database later.
        sessionSettings: {
            customSessionId: sessionId,
        },
    };
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
        <section className="rounded-xl border border-zinc-200 bg-[#FAFAFA] p-5 shadow-sm flex flex-col h-full min-h-[150px]">
            <div className="flex flex-wrap items-center justify-between gap-4">

                {/* Header Info */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-800">Voice Link Engine</h2>
                    <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded-full">
                            Hume EVI
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                            ID: {sessionId ?? "pending..."}
                        </span>
                    </div>
                </div>

                {/* Connection Controls */}
                <div className="flex items-center gap-3">
                    <StartStopCallButton
                        voiceState="idle" // This will be driven by useSession state later
                        isBusy={false}
                        onStart={() => {
                            console.log("TODO: Trigger Hume EVI connect() using buildEviConnectionConfig");
                        }}
                        onStop={() => {
                            console.log("TODO: Trigger Hume EVI disconnect()");
                        }}
                    />
                </div>
            </div>

            {/* Integration Placeholder */}
            <div className="mt-4 pt-4 border-t border-zinc-200">
                <p className="text-xs text-zinc-500 italic flex items-center gap-2">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Hume React SDK VoiceProvider will be mounted here to manage the WebSocket lifecycle.
                </p>
            </div>
        </section>
    );
}