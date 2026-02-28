/**
 * Error shape returned by frontend API helpers for REST failures.
 *
 * @typedef {Object} ApiClientError
 * @property {string} name - Stable error name, e.g. `ApiClientError`.
 * @property {string} message - User-safe or developer-safe message depending on caller context.
 * @property {number | null} status - HTTP status code when available.
 * @property {string | null} code - Optional backend error code for UI branching.
 * @property {unknown} details - Parsed error body or raw response payload.
 */
export class ApiClientError extends Error {
    constructor(message, status = null, code = null, details = null) {
        super(message);
        this.name = "ApiClientError";
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

/**
 * Issue an HTTP request to the FastAPI backend and parse JSON.
 *
 * Expected input:
 * - `args`:
 *   - `baseUrl` (`string`)
 *   - `path` (`string`) relative API path (e.g., `/v1/sessions`)
 *   - `method` (`'GET'|'POST'|'PUT'|'PATCH'|'DELETE'`)
 *   - `body` (`unknown`, optional) JSON-serializable request payload
 *   - `headers` (`Record<string, string>`, optional)
 *
 * Expected output:
 * - `Promise<unknown>` parsed JSON response body.
 *
 * Data contract notes:
 * - Must throw `ApiClientError` on non-2xx responses or invalid JSON.
 * - Should include response status and parsed backend error payload when available.
 *
 * Purpose:
 * - Provide a shared transport primitive for all frontend REST calls.
 */
export async function requestJson({
    baseUrl,
    path,
    method = "GET",
    body,
    headers = {},
}) {
    // clean url
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    const cleanPath = path.replace(/^\//, "");
    const url = `${cleanBaseUrl}/${cleanPath}`;

    // configure fetch options and stringify payload if body
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    };
    if (body !== undefined && body !== null) {
        options.body = JSON.stringify(body);
    }

    // execute network req, handle non-2XX responses, return response if successful
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            let errorDetails = null;
            let errorCode = null;
            try {
                errorDetails = await response.json();
                errorCode = errorDetails?.code || null;
            } catch {
                errorDetails = await response.text();
            }
            throw new ApiClientError(
                `API Request Failed: ${response.statusText}`,
                response.status,
                errorCode,
                errorDetails
            );
        }

        return await response.json();

    // network level failures (offline, cors)
    } catch (error) {
        if (error instanceof ApiClientError) {
            throw error; 
        }
        throw new ApiClientError(error.message || "Network connection failed");
    }
}

/**
 * Create a new session via `POST /v1/sessions`.
 *
 * Expected input:
 * - `params`:
 *   - `baseUrl` (`string`) FastAPI base URL
 *
 * Expected output:
 * - `Promise<import('./dtos').CreateSessionResponse>`
 *   `{ sessionId: string }`
 *
 * Purpose:
 * - Bootstrap a new session before the user enters the realtime page.
 */
export async function createSession({ baseUrl }) {
  return requestJson({
    baseUrl,
    path: "/v1/sessions",
    method: "POST", // POST because we are creating a new resource on the server
  });

// mock data if needed
/*
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomId = Math.random().toString(36).substring(2, 9);
      resolve({ 
        sessionId: `mock_sess_${randomId}` 
      });
    }, 500);
  });
*/
}

/**
 * Fetch a temporary Hume EVI access token from the backend token endpoint.
 *
 * Expected input:
 * - `params`:
 *   - `baseUrl` (`string`)
 *   - `sessionId` (`string`, optional) for audit/logging correlation if backend supports it
 *
 * Expected output:
 * - `Promise<import('./dtos').HumeAccessTokenResponse>`
 *   `{ accessToken: string, expiresIn: number, expiresAtMs?: number }`
 *
 * Data contract notes:
 * - Backend route maps to `POST /v1/hume/access-token`.
 * - Frontend should track expiry for token refresh/reconnect handling.
 *
 * Purpose:
 * - Obtain browser-safe credentials for Hume EVI without exposing API keys.
 */
export async function getHumeAccessToken({ baseUrl, sessionId }) {
  return requestJson({
    baseUrl,
    path: "/v1/hume/access-token",
    method: "POST",
    body: sessionId ? { session_id: sessionId } : undefined,
  });

  // try mock if hume not connected
  /*
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        accessToken: "mock_hume_token_abc123",
        expiresIn: 3600,
        expiresAtMs: Date.now() + (3600 * 1000),
      });
    }, 400);
  });
  */
}

/**
 * Fetch the current knowledge-graph snapshot for a session.
 *
 * Expected input:
 * - `params`:
 *   - `baseUrl` (`string`)
 *   - `sessionId` (`string`)
 *
 * Expected output:
 * - `Promise<import('./dtos').GraphSnapshotResponse>`
 *   `{ nodes: KgNode[], edges: KgEdge[] }`
 *
 * Purpose:
 * - Seed graph UI state before incremental WS diffs arrive.
 */
export async function getSessionGraphSnapshot({ baseUrl, sessionId }) {
  return requestJson({
    baseUrl,
    path: `/v1/sessions/${sessionId}/graph`, // check path correct
    method: "GET",
  });

  // mock test
/*
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        // Mocking some initial therapy-context nodes
        nodes: [
          { id: "node-1", label: "Person", canonical: "User", sessionId },
          { id: "node-2", label: "Emotion", canonical: "Overwhelmed", sessionId },
          { id: "node-3", label: "Trigger", canonical: "Upcoming Project", sessionId }
        ],
        // Mocking the relationships between them
        edges: [
          { id: "edge-1", type: "FEELS", sourceId: "node-1", targetId: "node-2", sessionId },
          { id: "edge-2", type: "CAUSES", sourceId: "node-3", targetId: "node-2", sessionId }
        ]
      });
    }, 600); // Simulates a 600ms network delay
  });
*/
}

/**
 * End the active session and fetch summary/top concepts from backend.
 *
 * Expected input:
 * - `params`:
 *   - `baseUrl` (`string`)
 *   - `sessionId` (`string`)
 *
 * Expected output:
 * - `Promise<import('./dtos').EndSessionResponse>`
 *   `{ summary: string, topConcepts: Array<{ label: string, canonical: string, count?: number }> }`
 *
 * Purpose:
 * - Close the session lifecycle and retrieve end-of-session summary data.
 */
export async function endSession({ baseUrl, sessionId }) {
  return requestJson({
    baseUrl,
    path: `/v1/sessions/${sessionId}/end`, // check path correct
    method: "POST",
  });

  // mock if needed
/*
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary: "The user discussed feeling overwhelmed by their upcoming computer science project deadline. We explored breaking the architecture down into smaller, manageable milestones to reduce anxiety and regain a sense of control.",
        topConcepts: [
          { label: "Emotion", canonical: "Overwhelmed", count: 4 },
          { label: "Trigger", canonical: "Project Deadline", count: 3 },
          { label: "Action", canonical: "Milestone Planning", count: 2 }
        ]
      });
    }, 800); // Simulates an 800ms backend processing delay
  });
*/
}