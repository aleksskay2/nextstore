export function formatLastSeen(ts) {
  const diff = Math.floor((Date.now() - ts * 1000) / 1000);
  console.log('diff', diff)

  if (diff < 60) return "был только что";
  if (diff < 3600) return `был ${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `был ${Math.floor(diff / 3600)} ч назад`;

  const d = new Date(ts * 1000);
  return `был ${d.toLocaleDateString()} в ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}
