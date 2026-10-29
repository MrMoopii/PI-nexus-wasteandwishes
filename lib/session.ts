export const SESSION_IDLE_TIMEOUT_MS = 1 * 60 * 1000;

export function hitungIdle(lastActivityAt: unknown): boolean {
  const isIdle =
    typeof lastActivityAt !== "number" ||
    Date.now() - lastActivityAt >= SESSION_IDLE_TIMEOUT_MS;

  return isIdle;
}
