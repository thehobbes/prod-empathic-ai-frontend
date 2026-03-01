const SESSION_STORAGE_PREFIX = "empathic-ai-session";
const SESSION_INDEX_KEY = `${SESSION_STORAGE_PREFIX}:index`;

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function getStorageKey(sessionId) {
  return `${SESSION_STORAGE_PREFIX}:${sessionId}`;
}

function createDefaultIndex() {
  return {
    activeSessionId: null,
    nextDisplayNumber: 1,
    sessions: [],
  };
}

function readRawIndex() {
  const storage = getStorage();

  if (!storage) {
    return createDefaultIndex();
  }

  const rawValue = storage.getItem(SESSION_INDEX_KEY);

  if (!rawValue) {
    return createDefaultIndex();
  }

  try {
    const parsed = JSON.parse(rawValue);
    return {
      activeSessionId: typeof parsed?.activeSessionId === "string" ? parsed.activeSessionId : null,
      nextDisplayNumber:
        typeof parsed?.nextDisplayNumber === "number" && parsed.nextDisplayNumber > 0
          ? parsed.nextDisplayNumber
          : 1,
      sessions: Array.isArray(parsed?.sessions) ? parsed.sessions.filter(Boolean) : [],
    };
  } catch {
    return createDefaultIndex();
  }
}

function writeRawIndex(index) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(SESSION_INDEX_KEY, JSON.stringify(index));
}

function writeSessionRecord(sessionRecord) {
  const storage = getStorage();

  if (!storage || !sessionRecord?.sessionId) {
    return;
  }

  storage.setItem(getStorageKey(sessionRecord.sessionId), JSON.stringify(sessionRecord));
}

function sortSessions(sessions) {
  return [...sessions].sort((left, right) => {
    const rightDisplay = typeof right?.displayNumber === "number" ? right.displayNumber : 0;
    const leftDisplay = typeof left?.displayNumber === "number" ? left.displayNumber : 0;
    return rightDisplay - leftDisplay;
  });
}

export function readSessionRecord(sessionId) {
  const storage = getStorage();

  if (!storage || !sessionId) {
    return null;
  }

  const rawValue = storage.getItem(getStorageKey(sessionId));

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

export function listSessionRecords() {
  const index = readRawIndex();

  return sortSessions(
    index.sessions
      .map((sessionMeta) => readSessionRecord(sessionMeta.sessionId) ?? sessionMeta)
      .filter(Boolean),
  );
}

export function getActiveSessionId() {
  return readRawIndex().activeSessionId;
}

export function setActiveSessionId(sessionId) {
  const index = readRawIndex();
  const nextIndex = {
    ...index,
    activeSessionId: sessionId ?? null,
  };

  writeRawIndex(nextIndex);
  return nextIndex.activeSessionId;
}

export function persistSessionRecord(sessionRecord) {
  if (!sessionRecord?.sessionId) {
    return null;
  }

  const index = readRawIndex();
  const existingRecord = readSessionRecord(sessionRecord.sessionId);
  const existingMeta = index.sessions.find((entry) => entry.sessionId === sessionRecord.sessionId) ?? null;

  const displayNumber =
    existingRecord?.displayNumber ??
    existingMeta?.displayNumber ??
    sessionRecord.displayNumber ??
    index.nextDisplayNumber;

  const nextRecord = {
    ...(existingRecord ?? {}),
    ...(existingMeta ?? {}),
    ...sessionRecord,
    displayNumber,
  };

  const nextSessions = sortSessions([
    ...index.sessions.filter((entry) => entry.sessionId !== sessionRecord.sessionId),
    {
      sessionId: nextRecord.sessionId,
      displayNumber: nextRecord.displayNumber,
      createdAtMs: nextRecord.createdAtMs ?? Date.now(),
    },
  ]);

  writeSessionRecord(nextRecord);
  writeRawIndex({
    activeSessionId: nextRecord.sessionId,
    nextDisplayNumber:
      displayNumber >= index.nextDisplayNumber ? displayNumber + 1 : index.nextDisplayNumber,
    sessions: nextSessions,
  });

  return nextRecord;
}

export function updateSessionRecord(sessionId, partialRecord) {
  if (!sessionId) {
    return null;
  }

  const currentRecord = readSessionRecord(sessionId) ?? { sessionId };
  return persistSessionRecord({
    ...currentRecord,
    ...partialRecord,
    sessionId,
  });
}

export function clearSessionRecord(sessionId) {
  const storage = getStorage();

  if (!storage || !sessionId) {
    return;
  }

  storage.removeItem(getStorageKey(sessionId));

  const index = readRawIndex();
  const nextSessions = index.sessions.filter((entry) => entry.sessionId !== sessionId);

  writeRawIndex({
    ...index,
    activeSessionId:
      index.activeSessionId === sessionId ? nextSessions[0]?.sessionId ?? null : index.activeSessionId,
    sessions: nextSessions,
  });
}
