function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

function ensureUrlScheme(value) {
  const trimmed = trimTrailingSlash(value);

  if (!trimmed) {
    return trimmed;
  }

  if (/^[a-z]+:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `http://${trimmed}`;
}

export function resolveBackendApiBaseUrl(explicitBaseUrl) {
  const candidate =
    explicitBaseUrl ??
    process.env.BACKEND_API_BASE_URI ??
    process.env.NEXT_PUBLIC_BACKEND_API_BASE_URI ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:8000";

  return ensureUrlScheme(candidate);
}

export function deriveBackendWsBaseUrl(apiBaseUrl) {
  return trimTrailingSlash(apiBaseUrl).replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
}
