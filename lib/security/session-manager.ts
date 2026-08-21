// ---------------------------------------------------------------------
// lib/security/session-manager.ts — Session Security & Management
//
// Manages session metadata, session timeouts, concurrent session limits
// (max 3 per user), and session revocation.
// ---------------------------------------------------------------------

export interface SessionMetadata {
  id: string;
  userId: string;
  role: string;
  ip: string;
  userAgent: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent?: boolean;
}

// In-memory store for demo session tracking when DB session table is absent
const sessionStore = new Map<string, SessionMetadata[]>();

export const CONCURRENT_SESSION_LIMIT = 3;
export const GOV_SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours
export const PUBLIC_SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Register or update an active session. Automatically revokes oldest sessions
 * if the user exceeds the concurrent session limit (max 3).
 */
export function registerSession(
  userId: string,
  role: string,
  ip: string,
  userAgent: string,
  location: string = "Patna, Bihar",
): SessionMetadata {
  const userSessions = sessionStore.get(userId) ?? [];
  const now = new Date().toISOString();

  const newSession: SessionMetadata = {
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    role,
    ip,
    userAgent,
    location,
    createdAt: now,
    lastActiveAt: now,
  };

  const updated = [newSession, ...userSessions];

  // Enforce concurrent session limit (max 3 sessions)
  if (updated.length > CONCURRENT_SESSION_LIMIT) {
    updated.length = CONCURRENT_SESSION_LIMIT;
  }

  sessionStore.set(userId, updated);
  return newSession;
}

/**
 * Get active sessions for a user, filtering out timed-out sessions.
 */
export function getActiveSessions(
  userId: string,
  currentSessionId?: string,
): SessionMetadata[] {
  const userSessions = sessionStore.get(userId) ?? [];
  const now = Date.now();

  const active = userSessions.filter((sess) => {
    const lastActive = new Date(sess.lastActiveAt).getTime();
    const timeout =
      sess.role === "public" ? PUBLIC_SESSION_TIMEOUT_MS : GOV_SESSION_TIMEOUT_MS;
    return now - lastActive < timeout;
  });

  sessionStore.set(userId, active);

  return active.map((sess) => ({
    ...sess,
    isCurrent: currentSessionId ? sess.id === currentSessionId : false,
  }));
}

/**
 * Revoke a specific session by ID.
 */
export function revokeSession(userId: string, sessionId: string): boolean {
  const userSessions = sessionStore.get(userId) ?? [];
  const filtered = userSessions.filter((sess) => sess.id !== sessionId);
  sessionStore.set(userId, filtered);
  return filtered.length < userSessions.length;
}

/**
 * Revoke all active sessions for a user, optionally keeping the current one.
 */
export function revokeAllSessions(
  userId: string,
  keepSessionId?: string,
): void {
  if (keepSessionId) {
    const userSessions = sessionStore.get(userId) ?? [];
    const kept = userSessions.filter((sess) => sess.id === keepSessionId);
    sessionStore.set(userId, kept);
  } else {
    sessionStore.delete(userId);
  }
}

/**
 * Check if a session is timed out due to inactivity.
 */
export function isSessionExpired(sess: SessionMetadata): boolean {
  const lastActive = new Date(sess.lastActiveAt).getTime();
  const timeout =
    sess.role === "public" ? PUBLIC_SESSION_TIMEOUT_MS : GOV_SESSION_TIMEOUT_MS;
  return Date.now() - lastActive >= timeout;
}
