"use client";

import React, { useState } from "react";
import StartStopCallButton from "./StartStopCallButton";

/**
 * Normalize Hume EVI SDK events/messages into the frontend transcript + prosody DTO format.
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
                prosodyScores: eviEvent.models?.prosody?.scores || null,
                timestampMs: Date.now(),
            };

        case "assistant_message":
            return {
                kind: "assistant_message",
                messageId: eviEvent.message?.id || Date.now().toString(),
                role: "assistant",
                content: eviEvent.message?.content || "",
                interim: false,
                prosodyScores: null,
                timestampMs: Date.now(),
            };

        default:
            return null;
    }
}

/**
 * Create the Hume EVI connection configuration object.
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
        configId: humeConfigId || undefined,
        verboseTranscription: !!verboseTranscription,
        sessionSettings: {
            customSessionId: sessionId,
        },
    };
}

/**
 * Render the voice panel that will host the Hume EVI call UI and controls.
 */
export default function VoicePanel({ sessionId }) {
    // --- State to track the connection status ---
    // In a real implementation, this would come from your useSession hook or Hume's useVoice hook
    const [currentVoiceState, setCurrentVoiceState] = useState("idle"); // 'idle' | 'connecting' | 'connected'
    const [isBusy, setIsBusy] = useState(false);

    const handleStart = async () => {
        setIsBusy(true);
        setCurrentVoiceState("connecting");
        
        console.log("Connecting to Hume EVI...");
        
        // Mocking the connection delay
        setTimeout(() => {
            setCurrentVoiceState("connected");
            setIsBusy(false);
        }, 1500);
    };

    const handleStop = async () => {
        setIsBusy(true);
        
        console.log("Disconnecting from Hume EVI...");
        
        // Mocking the disconnection delay
        setTimeout(() => {
            setCurrentVoiceState("idle");
            setIsBusy(false);
        }, 1000);
    };

    return (
        <section className="rounded-xl border border-zinc-200 bg-[#FAFAFA] p-5 shadow-sm flex flex-col h-full min-h-[150px]">
            <div className="flex flex-wrap items-center justify-between gap-4">

                {/* Header Info */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-800">Voice Link Engine</h2>
                    <div className="mt-1 flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full transition-colors ${
                            currentVoiceState === "connected" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-zinc-200 text-zinc-500"
                        }`}>
                            {currentVoiceState === "connected" ? "Live" : "Hume EVI"}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                            ID: {sessionId ?? "pending..."}
                        </span>
                    </div>
                </div>

                {/* Connection Controls - Dynamically switches between Start and Stop */}
                <div className="flex items-center gap-3">
                    <StartStopCallButton
                        voiceState={currentVoiceState}
                        isBusy={isBusy}
                        onStart={handleStart}
                        onStop={handleStop}
                    />
                </div>
            </div>

            {/* Integration Placeholder */}
            <div className="mt-4 pt-4 border-t border-zinc-200">
                <p className="text-xs text-zinc-500 italic flex items-center gap-2">
                    {currentVoiceState === "connected" ? (
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    ) : (
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {currentVoiceState === "connected" 
                        ? "Streaming audio to Hume EVI..." 
                        : "Hume React SDK VoiceProvider will be mounted here to manage the WebSocket lifecycle."
                    }
                </p>
            </div>
        </section>
    );
}