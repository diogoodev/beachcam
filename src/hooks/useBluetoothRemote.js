import { useEffect, useRef } from 'react';

export function useBluetoothRemote(onAction, isActive = true) {
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      // Common keys emitted by cheap bluetooth selfie remotes:
      // VolumeUp, VolumeDown, Enter, Space, ArrowUp, ArrowDown
      const validKeys = ['Enter', 'VolumeUp', 'VolumeDown', ' ', 'ArrowUp', 'ArrowDown'];
      
      if (validKeys.includes(e.key)) {
        // Prevent default actions like scrolling the page
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

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (clickTimer.current) clearTimeout(clickTimer.current);
    };
  }, [onAction, isActive]);
}
