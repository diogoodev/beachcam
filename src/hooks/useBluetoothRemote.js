import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useBluetoothRemote — Dual-strategy key capture for Bluetooth remotes.
 * 
 * Strategy 1: window-level keydown listener (works on Android + desktop)
 * Strategy 2: hidden focused <input> (backup for iOS keyboards)
 * Strategy 3: volumechange on <audio> element (detects OS-level volume changes)
 * 
 * Also includes a diagnostic mode to help users identify what key their remote sends.
 */
export function useBluetoothRemote(onAction, isActive = true) {
  const clickCount = useRef(0);
  const clickTimer = useRef(null);
  const inputRef = useRef(null);
  const [lastEvent, setLastEvent] = useState(null); // For diagnostic display
  const [debugMode, setDebugMode] = useState(false);

  // Use ref to avoid stale closure in processClick
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const processClick = useCallback(() => {
    clickCount.current += 1;

    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }

    clickTimer.current = setTimeout(() => {
      const finalCount = clickCount.current;
      clickCount.current = 0;
      clickTimer.current = null;
      
      if (onActionRef.current) {
        onActionRef.current(finalCount);
      }
    }, 400);
  }, []);

  // ── Strategy 1: Global window keydown (Android, Desktop, some iOS keyboards) ──
  useEffect(() => {
    if (!isActive) return;

    const handler = (e) => {
      // Log ALL key events for diagnostics
      const info = { key: e.key, code: e.code, keyCode: e.keyCode, which: e.which, type: e.type };
      setLastEvent(info);

      // Very broad matching: accept almost any key that isn't a letter/number
      // to maximize compatibility with unknown Bluetooth remotes
      const validKeys = [
        'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'VolumeUp', 'VolumeDown',
        'AudioVolumeUp', 'AudioVolumeDown',
        'MediaTrackNext', 'MediaTrackPrevious', 'MediaPlayPause',
        'Camera', 'Focus',
      ];

      // Also match by keyCode for remotes that send non-standard key names
      const validKeyCodes = [
        13,  // Enter
        32,  // Space
        38,  // ArrowUp
        40,  // ArrowDown
        37,  // ArrowLeft
        39,  // ArrowRight
        175, // VolumeUp (Windows/Android)
        174, // VolumeDown (Windows/Android)
        179, // MediaPlayPause
        176, // MediaTrackNext
        177, // MediaTrackPrevious
      ];

      if (validKeys.includes(e.key) || validKeyCodes.includes(e.keyCode)) {
        e.preventDefault();
        e.stopPropagation();
        processClick();
      }
    };

    // Use capture phase to intercept before anything else
    const keyupHandler = (e) => e.preventDefault();
    window.addEventListener('keydown', handler, { capture: true, passive: false });
    window.addEventListener('keyup', keyupHandler, { capture: true, passive: false });

    return () => {
      window.removeEventListener('keydown', handler, { capture: true });
      window.removeEventListener('keyup', keyupHandler, { capture: true });
    };
  }, [isActive, processClick]);

  // ── Strategy 2: Hidden input focus keeper (iOS Safari backup) ──
  useEffect(() => {
    if (!isActive) return;

    const keepFocus = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    };

    // Focus immediately
    keepFocus();
    // Re-focus periodically  
    const interval = setInterval(keepFocus, 2000);
    // Re-focus on user interaction
    window.addEventListener('touchend', keepFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('touchend', keepFocus);
    };
  }, [isActive]);

  // ── Strategy 3: volumechange on audio (detects hardware volume on some browsers) ──
  useEffect(() => {
    if (!isActive) return;

    // Create a silent audio context that plays nothing
    // Some browsers fire volumechange when hardware volume changes
    const audio = document.createElement('audio');
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    audio.loop = true;
    audio.volume = 1;
    
    const onVolumeChange = () => {
      setLastEvent({ key: 'volumechange', code: 'HARDWARE', keyCode: 0, type: 'volumechange' });
      processClick();
    };

    audio.addEventListener('volumechange', onVolumeChange);
    
    // Try to play (needs user gesture on most browsers)
    audio.play().catch(() => {
      // Silent fail — will try on next user interaction
      const tryPlay = () => {
        audio.play().catch(() => {});
        window.removeEventListener('touchend', tryPlay);
        window.removeEventListener('click', tryPlay);
      };
      window.addEventListener('touchend', tryPlay, { once: true });
      window.addEventListener('click', tryPlay, { once: true });
    });

    return () => {
      audio.removeEventListener('volumechange', onVolumeChange);
      audio.pause();
      audio.remove();
    };
  }, [isActive, processClick]);

  const handleInputKeyDown = useCallback((e) => {
    const info = { key: e.key, code: e.code, keyCode: e.keyCode, which: e.which, type: 'input-keydown' };
    setLastEvent(info);
    e.preventDefault();
    e.stopPropagation();
    processClick();
  }, [processClick]);

  return {
    lastEvent,
    debugMode,
    setDebugMode,
    remoteInputProps: {
      ref: inputRef,
      onKeyDown: handleInputKeyDown,
      onKeyUp: (e) => { e.preventDefault(); e.stopPropagation(); },
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
        pointerEvents: 'none',
        zIndex: -1,
      },
      readOnly: true,
      autoComplete: "off",
      inputMode: "none",
      tabIndex: -1,
    }
  };
}
