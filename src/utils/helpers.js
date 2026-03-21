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
