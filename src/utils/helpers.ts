export function roundTimestamp(timestamp: number, sn: number = 86400) {
  return (Math.floor(timestamp / sn) * sn).toString();
}
