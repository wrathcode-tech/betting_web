const DEFAULT_TTL_MS = 60 * 1000;
const inflight = new Map();
const cache = new Map();
const preconnectedHosts = new Set();

function makeKey(gameCode, providerCode, platform) {
  return `${String(gameCode || "").trim().toLowerCase()}|${String(providerCode || "")
    .trim()
    .toLowerCase()}|${String(platform || "desktop").trim().toLowerCase()}`;
}

function nowMs() {
  return Date.now();
}

function isFresh(entry) {
  return !!entry && entry.expiresAt > nowMs() && typeof entry.launchURL === "string" && entry.launchURL;
}

export function getWarmLaunch(gameCode, providerCode, platform = "desktop") {
  const key = makeKey(gameCode, providerCode, platform);
  const entry = cache.get(key);
  if (!isFresh(entry)) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function setWarmLaunch(gameCode, providerCode, platform = "desktop", payload, ttlMs = DEFAULT_TTL_MS) {
  if (!payload?.launchURL) return null;
  const key = makeKey(gameCode, providerCode, platform);
  const entry = { ...payload, expiresAt: nowMs() + ttlMs };
  cache.set(key, entry);
  return entry;
}

export function warmLaunchIfNeeded({
  gameCode,
  providerCode,
  platform = "desktop",
  launchFn,
  extractPayload,
  ttlMs = DEFAULT_TTL_MS,
}) {
  if (!gameCode || !providerCode || typeof launchFn !== "function") return Promise.resolve(null);
  const key = makeKey(gameCode, providerCode, platform);
  const hot = getWarmLaunch(gameCode, providerCode, platform);
  if (hot) return Promise.resolve(hot);
  const running = inflight.get(key);
  if (running) return running;
  const p = Promise.resolve()
    .then(() => launchFn(gameCode, providerCode, platform))
    .then((res) => {
      const parsed = typeof extractPayload === "function" ? extractPayload(res) : res;
      if (parsed?.launchURL) return setWarmLaunch(gameCode, providerCode, platform, parsed, ttlMs);
      return null;
    })
    .catch(() => null)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function preconnectToUrl(rawUrl) {
  if (typeof document === "undefined" || !rawUrl) return;
  let origin = "";
  try {
    origin = new URL(rawUrl, window.location.origin).origin;
  } catch {
    return;
  }
  if (!origin || preconnectedHosts.has(origin)) return;
  preconnectedHosts.add(origin);
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = origin;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}
