import { useEffect, useRef } from 'react';

export function useBluetoothRemote(onAction, isActive = true) {
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      const validKeys = [
        'Enter', ' ', 'ArrowUp', 'ArrowDown',
        'VolumeUp', 'VolumeDown',
        'AudioVolumeUp', 'AudioVolumeDown',
        'MediaTrackNext', 'MediaTrackPrevious', 'MediaPlayPause'
      ];
      if (validKeys.includes(e.key)) {
        // Prevent default actions like scrolling the page or OS volume change
        e.preventDefault();
        
        clickCount.current += 1;

        if (clickTimer.current) {
          clearTimeout(clickTimer.current);
        }

        // Wait 400ms to see if more clicks are coming
        clickTimer.current = setTimeout(() => {
          const finalCount = clickCount.current;
          clickCount.current = 0;
          clickTimer.current = null;
          
          if (onAction) {
            onAction(finalCount);
          }
        }, 400);
      }
    };

    const preventVol = (e) => {
      const validKeys = [
        'Enter', ' ', 'ArrowUp', 'ArrowDown',
        'VolumeUp', 'VolumeDown',
        'AudioVolumeUp', 'AudioVolumeDown',
        'MediaTrackNext', 'MediaTrackPrevious', 'MediaPlayPause'
      ];
      if (validKeys.includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', preventVol, { passive: false });
    window.addEventListener('keypress', preventVol, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', preventVol);
      window.removeEventListener('keypress', preventVol);
      if (clickTimer.current) clearTimeout(clickTimer.current);
    };
  }, [onAction, isActive]);
}
