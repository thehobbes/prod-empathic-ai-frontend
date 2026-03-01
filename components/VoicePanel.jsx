"use client";

import React from "react";
import StartStopCallButton from "./StartStopCallButton";

export function buildEviConnectionConfig({
    accessToken,
    humeConfigId,
    verboseTranscription,
    sessionId,
    resumedChatGroupId,
}) {
    return {
        auth: {
            type: "accessToken",
            value: accessToken,
        },
        configId: humeConfigId || undefined,
        verboseTranscription: !!verboseTranscription,
        resumedChatGroupId: resumedChatGroupId || undefined,
        sessionSettings: {
            customSessionId: sessionId,
        },
    };
}

export default function VoicePanel({
    sessionId,
    voiceState = "idle",
    isBusy = false,
    onStart,
    onStop,
}) {
    const isConnected = voiceState === "connected";

    return (
        <section className="rounded-xl border border-zinc-200 bg-[#FAFAFA] p-5 shadow-sm flex flex-col h-full min-h-[150px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-gray-800">Voice Link Engine</h2>
                    <div className="mt-1 flex items-center gap-2">
                        <span
                            className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full transition-colors ${
                                isConnected
                                    ? "bg-green-100 text-green-700"
                                    : "bg-zinc-200 text-zinc-500"
                            }`}
                        >
                            {isConnected ? "Live" : "Hume EVI"}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                            ID: {sessionId ?? "pending..."}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <StartStopCallButton
                        voiceState={voiceState}
                        isBusy={isBusy}
                        onStart={onStart}
                        onStop={onStop}
                    />
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-200">
                <p className="text-xs text-zinc-500 italic flex items-center gap-2">
                    {isConnected ? (
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    ) : (
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {isConnected
                        ? "Streaming audio to Hume EVI..."
                        : "Press Start Session to request microphone access and open the live Hume connection."
                    }
                </p>
            </div>
        </section>
    );
}
