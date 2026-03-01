"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import therapistLogo from "../assets/ai-therapist-logo.png";
import AudioBubble from "../components/AudioBubble.jsx";
import ConnectionStatus from "../components/ConnectionStatus.jsx";
import GraphPanel from "../components/GraphPanel.jsx";
import TranscriptPanel from "../components/TranscriptPanel.jsx";
import VoicePanel, { buildEviConnectionConfig } from "../components/VoicePanel.jsx";
import ProsodyPanel from "../components/ProsodyPanel.jsx";
import { createSession, getHumeAccessToken, getSessionGraphSnapshot, normalizeBackendEnvelope } from "../lib/api";
import { prosodyScoresToSignals } from "../lib/graphTransform";
import { deriveBackendWsBaseUrl } from "../lib/runtime";
import {
  clearSessionRecord,
  getActiveSessionId,
  listSessionRecords,
  persistSessionRecord,
  readSessionRecord,
  setActiveSessionId,
  updateSessionRecord,
} from "../lib/sessionStore";
import useBackendSocket from "../hooks/useBackendSocket";
import useEviEventForwarder from "../hooks/useEviEventForwarder";
import useGraphState from "../hooks/useGraphState";

function averageFftLevel(fft) {
  if (!Array.isArray(fft) || fft.length === 0) {
    return 0;
  }

  const normalized = fft
    .map((value) => {
      const numericValue = Number(value) || 0;
      return numericValue > 1 ? numericValue / 255 : numericValue;
    })
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (normalized.length === 0) {
    return 0;
  }

  const peak = normalized.reduce((maxValue, value) => Math.max(maxValue, value), 0);
  const rms = Math.sqrt(
    normalized.reduce((sum, value) => sum + value * value, 0) / normalized.length,
  );
  const noiseFloor = 0.035;
  const ceiling = 0.22;
  const energy = Math.max(rms, peak * 0.6);

  if (energy <= noiseFloor) {
    return 0;
  }

  return Math.min((energy - noiseFloor) / (ceiling - noiseFloor), 1);
}

function mapBackendStatus(status) {
  if (status === "open") {
    return "connected";
  }

  if (status === "connecting" || status === "reconnecting") {
    return "connecting";
  }

  if (status === "error") {
    return "error";
  }

  return "disconnected";
}

function mapVoiceStatus(status) {
  if (status === "disconnected") {
    return "idle";
  }

  return status;
}

function SessionRow({ session, isActive, onClick, onContextMenu }) {
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`flex items-center justify-between px-4 py-2.5 rounded-2xl cursor-pointer transition-colors ${
        isActive
          ? "bg-[#526D5B] text-white font-medium"
          : "text-gray-300 hover:bg-[#4A6351]"
      }`}
    >
      <span className="text-sm">Session {session.displayNumber}</span>
      <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

function MainPageInner({ apiBaseUrl, humeConfigId }) {
  const voice = useVoice();
  const voiceStatus = voice.status.value;
  const clearVoiceMessages = voice.clearMessages;
  const disconnectVoice = voice.disconnect;
  const graphState = useGraphState();
  const {
    graph,
    lastServerError,
    applyEnvelope,
    applyGraphSnapshot,
    resetGraphState,
  } = graphState;

  const [activeTab, setActiveTab] = useState("chat");
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionIdState] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isTogglingSession, setIsTogglingSession] = useState(false);
  const [liveRequested, setLiveRequested] = useState(false);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [accessTokenState, setAccessTokenState] = useState({
    token: null,
    expiresAtMs: null,
    loading: false,
  });
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    sessionId: null,
    x: 0,
    y: 0,
  });

  const processedMessageCountRef = useRef(0);
  const smoothedAudioLevelRef = useRef(0);

  const syncSessionsFromStorage = useCallback(() => {
    const storedSessions = listSessionRecords();
    const storedActiveSessionId = getActiveSessionId();
    const nextActiveSessionId =
      storedSessions.find((session) => session.sessionId === storedActiveSessionId)?.sessionId ??
      storedSessions[0]?.sessionId ??
      null;

    setSessions(storedSessions);
    setActiveSessionIdState(nextActiveSessionId);
    return {
      sessions: storedSessions,
      activeSessionId: nextActiveSessionId,
    };
  }, []);

  useEffect(() => {
    syncSessionsFromStorage();
  }, [syncSessionsFromStorage]);

  useEffect(() => {
    if (!contextMenu.isOpen) {
      return undefined;
    }

    const closeMenu = () => {
      setContextMenu((currentState) => ({ ...currentState, isOpen: false }));
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("contextmenu", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("contextmenu", closeMenu);
    };
  }, [contextMenu.isOpen]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.sessionId === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  const backendSocket = useBackendSocket({
    sessionId: activeSession?.sessionId ?? null,
    sessionToken: activeSession?.sessionToken ?? null,
    enabled: Boolean(liveRequested && activeSession?.sessionId && activeSession?.sessionToken),
    wsBaseUrl: deriveBackendWsBaseUrl(apiBaseUrl),
    onEnvelope: (envelope) => {
      applyEnvelope(normalizeBackendEnvelope(envelope));
    },
    onError: (error) => {
      setPageError(error?.message ?? "The backend websocket failed.");
    },
  });

  const eventForwarder = useEviEventForwarder({
    sessionId: activeSession?.sessionId ?? null,
    sendEnvelope: backendSocket.sendEnvelope,
  });
  const forwardEviEvent = eventForwarder.forwardEvent;
  const resetEviForwarder = eventForwarder.resetForwarder;
  const backendSocketStatus = backendSocket.status;
  const sendBackendEnvelope = backendSocket.sendEnvelope;
  const disconnectBackendSocket = backendSocket.disconnect;

  useEffect(() => {
    if (voice.messages.length < processedMessageCountRef.current) {
      processedMessageCountRef.current = 0;
    }

    const nextMessages = voice.messages.slice(processedMessageCountRef.current);
    nextMessages.forEach((message) => {
      if (message?.type) {
        forwardEviEvent(message);
      }
    });
    processedMessageCountRef.current = voice.messages.length;
  }, [forwardEviEvent, voice.messages]);

  useEffect(() => {
    const chatGroupId = voice.chatMetadata?.chatGroupId ?? null;

    if (!activeSession?.sessionId || !chatGroupId) {
      return;
    }

    const currentRecord = readSessionRecord(activeSession.sessionId);

    if (currentRecord?.chatGroupId === chatGroupId) {
      return;
    }

    updateSessionRecord(activeSession.sessionId, { chatGroupId });
    syncSessionsFromStorage();
  }, [activeSession?.sessionId, syncSessionsFromStorage, voice.chatMetadata?.chatGroupId]);

  const fetchGraphSnapshot = useCallback(
    async (sessionId) => {
      if (!sessionId) {
        resetGraphState();
        return;
      }

      setIsGraphLoading(true);

      try {
        const snapshot = await getSessionGraphSnapshot({
          baseUrl: apiBaseUrl,
          sessionId,
        });
        applyGraphSnapshot(snapshot);
        setPageError(null);
      } catch (error) {
        resetGraphState();
        setPageError(error?.message ?? "Unable to load the graph snapshot.");
      } finally {
        setIsGraphLoading(false);
      }
    },
    [apiBaseUrl, applyGraphSnapshot, resetGraphState],
  );

  useEffect(() => {
    resetEviForwarder();
    clearVoiceMessages();
    processedMessageCountRef.current = 0;
    void fetchGraphSnapshot(activeSession?.sessionId ?? null);
  }, [activeSession?.sessionId, clearVoiceMessages, fetchGraphSnapshot, resetEviForwarder]);

  useEffect(() => {
    if (backendSocketStatus === "open" && activeSession?.sessionId) {
      sendBackendEnvelope("client.ping", {});
      void fetchGraphSnapshot(activeSession.sessionId);
    }
  }, [activeSession?.sessionId, backendSocketStatus, fetchGraphSnapshot, sendBackendEnvelope]);

  const ensureAccessToken = useCallback(
    async (sessionId) => {
      const expiresSoon =
        typeof accessTokenState.expiresAtMs === "number" &&
        accessTokenState.expiresAtMs - Date.now() < 60_000;

      if (accessTokenState.token && !expiresSoon) {
        return accessTokenState.token;
      }

      setAccessTokenState((currentState) => ({ ...currentState, loading: true }));

      try {
        const response = await getHumeAccessToken({ baseUrl: apiBaseUrl, sessionId });
        setAccessTokenState({
          token: response.accessToken,
          expiresAtMs: response.expiresAtMs ?? null,
          loading: false,
        });
        return response.accessToken;
      } catch (error) {
        setAccessTokenState((currentState) => ({ ...currentState, loading: false }));
        throw error;
      }
    },
    [accessTokenState.expiresAtMs, accessTokenState.token, apiBaseUrl],
  );

  const createAndSelectSession = useCallback(async () => {
    setIsCreatingSession(true);

    try {
      const sessionRecord = persistSessionRecord(await createSession({ baseUrl: apiBaseUrl }));
      const nextState = syncSessionsFromStorage();
      setActiveSessionId(sessionRecord.sessionId);
      setActiveSessionIdState(sessionRecord.sessionId);
      setPageError(null);

      return (
        nextState.sessions.find((session) => session.sessionId === sessionRecord.sessionId) ??
        sessionRecord
      );
    } finally {
      setIsCreatingSession(false);
    }
  }, [apiBaseUrl, syncSessionsFromStorage]);

  const stopLiveSession = useCallback(async () => {
    setLiveRequested(false);
    disconnectBackendSocket(1000, "Stopped by user");

    if (voiceStatus === "connected" || voiceStatus === "connecting") {
      await disconnectVoice();
    }
  }, [disconnectBackendSocket, disconnectVoice, voiceStatus]);

  const handleStartSession = useCallback(async () => {
    if (isTogglingSession) {
      return;
    }

    setIsTogglingSession(true);
    setPageError(null);

    try {
      const sessionRecord = activeSession ?? (await createAndSelectSession());

      if (!sessionRecord?.sessionToken) {
        throw new Error("This session is missing the backend websocket token.");
      }

      const accessToken = await ensureAccessToken(sessionRecord.sessionId);
      setLiveRequested(true);

      await voice.connect(
        buildEviConnectionConfig({
          accessToken,
          humeConfigId,
          verboseTranscription: true,
          sessionId: sessionRecord.sessionId,
          resumedChatGroupId: sessionRecord.chatGroupId ?? null,
        }),
      );
    } catch (error) {
      setLiveRequested(false);
      setPageError(error?.message ?? "Unable to start the live session.");
    } finally {
      setIsTogglingSession(false);
    }
  }, [activeSession, createAndSelectSession, ensureAccessToken, humeConfigId, isTogglingSession, voice]);

  const handleStopSession = useCallback(async () => {
    if (isTogglingSession) {
      return;
    }

    setIsTogglingSession(true);
    setPageError(null);

    try {
      await stopLiveSession();
    } catch (error) {
      setPageError(error?.message ?? "Unable to stop the live session.");
    } finally {
      setIsTogglingSession(false);
    }
  }, [isTogglingSession, stopLiveSession]);

  const handleCreateSession = useCallback(async () => {
    try {
      if (voiceStatus === "connected" || voiceStatus === "connecting" || liveRequested) {
        await stopLiveSession();
      }

      await createAndSelectSession();
      setAccessTokenState({
        token: null,
        expiresAtMs: null,
        loading: false,
      });
    } catch (error) {
      setPageError(error?.message ?? "Unable to create a new session.");
    }
  }, [createAndSelectSession, liveRequested, stopLiveSession, voiceStatus]);

  const handleSelectSession = useCallback(
    async (sessionId) => {
      if (!sessionId || sessionId === activeSessionId) {
        return;
      }

      try {
        if (voiceStatus === "connected" || voiceStatus === "connecting" || liveRequested) {
          await stopLiveSession();
        }

        setActiveSessionId(sessionId);
        setActiveSessionIdState(sessionId);
        setAccessTokenState({
          token: null,
          expiresAtMs: null,
          loading: false,
        });
        setPageError(null);
      } catch (error) {
        setPageError(error?.message ?? "Unable to switch sessions.");
      }
    },
    [activeSessionId, liveRequested, stopLiveSession, voiceStatus],
  );

  const handleDeleteSession = useCallback(async () => {
    const targetSessionId = contextMenu.sessionId;

    if (!targetSessionId) {
      return;
    }

    try {
      if (targetSessionId === activeSessionId && (voiceStatus === "connected" || voiceStatus === "connecting" || liveRequested)) {
        await stopLiveSession();
      }

      clearSessionRecord(targetSessionId);
      const nextState = syncSessionsFromStorage();
      setContextMenu({ isOpen: false, sessionId: null, x: 0, y: 0 });

      if (!nextState.activeSessionId) {
        resetGraphState();
        resetEviForwarder();
        clearVoiceMessages();
        processedMessageCountRef.current = 0;
        setAccessTokenState({
          token: null,
          expiresAtMs: null,
          loading: false,
        });
      }
    } catch (error) {
      setPageError(error?.message ?? "Unable to delete the local session.");
    }
  }, [
    activeSessionId,
    contextMenu.sessionId,
    liveRequested,
    resetGraphState,
    resetEviForwarder,
    stopLiveSession,
    syncSessionsFromStorage,
    clearVoiceMessages,
    voiceStatus,
  ]);

  const transcriptEntries = useMemo(
    () =>
      eventForwarder.transcript.map((entry) => ({
        ...entry,
        text: entry.text ?? entry.content ?? "",
      })),
    [eventForwarder.transcript],
  );

  const latestSignals = useMemo(
    () => prosodyScoresToSignals(eventForwarder.latestProsodyFrame?.prosodyScores, 5),
    [eventForwarder.latestProsodyFrame?.prosodyScores],
  );

const audioLevel = useMemo(() => {
    const micLevel = averageFftLevel(voice.micFft);
    
    const rawAssistantFft = voice.playerFft || voice.fft || [];
    
    let assistantLevel = 0;
    if (voice.isPlaying) {
      const baseLevel = averageFftLevel(rawAssistantFft);
      assistantLevel = Math.min((baseLevel * 2.5) + 0.1, 1);
    }

    const targetLevel = Math.max(micLevel, assistantLevel);
    const previousLevel = smoothedAudioLevelRef.current;
    const response = targetLevel > previousLevel ? 0.6 : 0.16;
    
    const nextLevel = previousLevel + (targetLevel - previousLevel) * response;
    smoothedAudioLevelRef.current = nextLevel < 0.01 ? 0 : nextLevel;
    
    return smoothedAudioLevelRef.current;
  }, [voice.fft, voice.playerFft, voice.isPlaying, voice.micFft]);

  const connection = useMemo(
    () => ({
      backend: mapBackendStatus(backendSocket.status),
      evi: voiceStatus,
      lastError: pageError ?? voice.error?.message ?? lastServerError?.message ?? null,
    }),
    [backendSocket.status, lastServerError?.message, pageError, voice.error?.message, voiceStatus],
  );

  const activeSessionDisplay = activeSession?.displayNumber ?? null;

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <div className="w-64 bg-[#3F5546] flex flex-col h-full border-r border-[#526D5B] p-5 shrink-0 text-white relative">
        <div className="flex items-center gap-3 mb-8 px-1">
          <img
            src={therapistLogo.src || therapistLogo}
            alt="AI Therapist Logo"
            className="w-12 h-12 object-contain"
          />
          <span className="font-bold text-2xl">AI Therapist</span>
        </div>

        <button
          type="button"
          onClick={() => void handleCreateSession()}
          disabled={isCreatingSession}
          className="w-full bg-[#89B399] text-[#3F5546] rounded-full py-2.5 mb-6 font-medium shadow-sm hover:bg-[#76A086] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isCreatingSession ? "Creating..." : "+ New Session"}
        </button>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <SessionRow
                key={session.sessionId}
                session={session}
                isActive={session.sessionId === activeSessionId}
                onClick={() => void handleSelectSession(session.sessionId)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setContextMenu({
                    isOpen: true,
                    sessionId: session.sessionId,
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
              />
            ))
          ) : (
            <div className="px-4 py-3 rounded-2xl text-sm text-gray-300 bg-[#4A6351]">
              No local sessions yet.
            </div>
          )}
        </div>

        <div className="mt-4 shrink-0">
          <ConnectionStatus connection={connection} />
        </div>

        <div className="mt-4 pt-4 border-t border-[#526D5B] flex items-center justify-between px-2 text-gray-300 shrink-0">
          <button className="flex items-center gap-2 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-sm font-medium underline underline-offset-2">log out</span>
          </button>
          <button className="hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between relative bg-[#DDE8D5] overflow-hidden pb-12">
        <div className="w-full flex-1 flex items-center justify-center pt-10 min-h-[400px]">
          <div className="w-full max-w-2xl h-[600px]">
              <AudioBubble
                audioLevel={audioLevel}
                micActive={voiceStatus === "connected" || voiceStatus === "connecting"}
              />
          </div>
        </div>
        <div className="w-full max-w-xl px-8 z-10 shrink-0">
          <VoicePanel
            sessionId={activeSession?.sessionId ?? null}
            voiceState={mapVoiceStatus(voiceStatus)}
            isBusy={isTogglingSession || accessTokenState.loading}
            onStart={() => void handleStartSession()}
            onStop={() => void handleStopSession()}
          />
          {activeSessionDisplay ? (
            <p className="mt-3 text-center text-sm text-[#3F5546]">Current local session: Session {activeSessionDisplay}</p>
          ) : null}
        </div>
      </div>

      <div className="w-[420px] bg-[#F4F3ED] flex flex-col h-full border-l border-[#E5E4DC] p-6 shrink-0">
        <div className="flex bg-[#E5E4DC] p-1.5 rounded-full mb-6 shrink-0 relative">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === "chat" ? "bg-white text-[#3F5546] shadow-sm" : "text-[#7A8C80] hover:text-[#3F5546]"}`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === "graph" ? "bg-white text-[#3F5546] shadow-sm" : "text-[#7A8C80] hover:text-[#3F5546]"}`}
          >
            Knowledge Graph
          </button>
        </div>

        {pageError ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {pageError}
          </div>
        ) : null}

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4">
          {activeTab === "chat" ? (
            <div className="flex-1 min-h-0 flex flex-col gap-4">
              <div className="flex-1 min-h-0">
                <TranscriptPanel entries={transcriptEntries} showInterim={true} />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col gap-4">
              <div className="flex-1 min-h-0">
                <GraphPanel graph={graph} selectedReceiptId={null} />
              </div>
            </div>
          )}
          {isGraphLoading ? (
            <div className="text-xs text-zinc-500 italic">Refreshing graph snapshot...</div>
          ) : null}
        </div>
      </div>

      {contextMenu.isOpen ? (
        <div
          className="fixed z-50 min-w-[11rem] rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_20px_35px_rgba(15,23,42,0.22)]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={() => void handleDeleteSession()}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
          >
            Delete local session
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MainPage(props) {
  return (
    <VoiceProvider clearMessagesOnDisconnect={false}>
      <MainPageInner {...props} />
    </VoiceProvider>
  );
}

export default MainPage;
