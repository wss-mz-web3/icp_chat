const CLIENT_ID_KEY = 'icp-chat-client-id';

export function getClientId(): string {
  if (typeof window === 'undefined') {
    return 'unknown-client';
  }

  try {
    const stored = window.localStorage.getItem(CLIENT_ID_KEY);
    if (stored && stored.length > 0) {
      return stored;
    }

    const randomPart =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? (crypto as any).randomUUID()
        : `client-${Math.random().toString(36).slice(2)}-${Date.now()}`;

    window.localStorage.setItem(CLIENT_ID_KEY, randomPart);
    return randomPart;
  } catch {
    return 'unknown-client';
  }
}


