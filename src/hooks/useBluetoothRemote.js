import { useEffect, useRef, useCallback } from 'react';

export function useBluetoothRemote(onAction, isActive = true) {
  const clickCount = useRef(0);
  const clickTimer = useRef(null);
  const inputRef = useRef(null);

  // Focus keeper for iOS
  const keepFocus = useCallback(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    // Constantly fight to keep focus on our hidden input
    const interval = setInterval(keepFocus, 1000);
    // Focus immediately on mount or active change
    keepFocus();

    // Re-focus whenever user taps anywhere else on screen
    window.addEventListener('touchend', keepFocus);
    window.addEventListener('click', keepFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('touchend', keepFocus);
      window.removeEventListener('click', keepFocus);
    };
  }, [isActive, keepFocus]);

  const handleKeyDown = useCallback((e) => {
    const validKeys = [
      'Enter', ' ', 'ArrowUp', 'ArrowDown',
      'VolumeUp', 'VolumeDown',
      'AudioVolumeUp', 'AudioVolumeDown',
      'MediaTrackNext', 'MediaTrackPrevious', 'MediaPlayPause'
    ];
    
    if (validKeys.includes(e.key)) {
      // Very aggressive preventDefault for iOS
      e.preventDefault();
      e.stopPropagation();
      
      clickCount.current += 1;

      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
      }

      clickTimer.current = setTimeout(() => {
        const finalCount = clickCount.current;
        clickCount.current = 0;
        clickTimer.current = null;
        
        if (onAction) {
          onAction(finalCount);
        }
      }, 400);
    }
  }, [onAction]);

  const preventVol = useCallback((e) => {
    const validKeys = [
      'Enter', ' ', 'ArrowUp', 'ArrowDown',
      'VolumeUp', 'VolumeDown',
      'AudioVolumeUp', 'AudioVolumeDown',
      'MediaTrackNext', 'MediaTrackPrevious', 'MediaPlayPause'
    ];
    if (validKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    remoteInputProps: {
      ref: inputRef,
      onKeyDown: handleKeyDown,
      onKeyUp: preventVol,
      onKeyPress: preventVol,
      // The CSS is critical: invisible but technically "in" the DOM un-hidden
      style: {
        position: 'absolute',
        opacity: 0,
        height: '1px',
        width: '1px',
        top: 0,
        left: 0,
        border: 'none',
        padding: 0,
        margin: 0,
        pointerEvents: 'none'
      },
      readOnly: true, // Prevents default iOS keyboard popping up entirely
      autoComplete: "off",
      inputMode: "none" // Crucial: tell iOS not to open soft keyboard
    }
  };
}
