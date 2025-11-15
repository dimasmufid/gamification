export function secondsLeft(endsAt: string) {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((end - now) / 1000));
}

export function formatCountdown(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
