// Palette of vibrant neon/pastel colors that look great on a dark bg.
// Each player always gets the same color (deterministic by name hash).
const PLAYER_COLORS = [
  '#C6FF00', // neon green
  '#00F5FF', // neon blue
  '#FF6B6B', // coral red
  '#FFD93D', // golden yellow
  '#A29BFE', // soft purple
  '#FF9F43', // vivid orange
  '#00CEC9', // teal
  '#FD79A8', // pink
  '#55EFC4', // mint
  '#74B9FF', // sky blue
  '#E17055', // terracotta
  '#FDCB6E', // warm yellow
];

/** Returns a consistent color string for a given player name. */
export const getColorForName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PLAYER_COLORS[hash % PLAYER_COLORS.length];
};

export const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Trigger haptic feedback if available.
 * @param {number|number[]} ms - vibration duration in ms, or an array pattern [vibrate, pause, vibrate, ...]
 */
export const vibrate = (ms = 50) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
};
