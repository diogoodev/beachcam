import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';

/**
 * useRemoteControl — Manages a Supabase Broadcast channel for remote scoring.
 * 
 * Generates a 4-digit session code. Any device (smartwatch, phone, etc.)
 * can join the channel with this code and send commands:
 *   ADD_POINT_A, ADD_POINT_B, UNDO
 */
export function useRemoteControl({ onPointA, onPointB, onUndo, isActive = false }) {
  const [sessionCode, setSessionCode] = useState(null);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [lastRemoteAction, setLastRemoteAction] = useState(null);
  const channelRef = useRef(null);

  // Generate a random 4-digit code
  const generateCode = useCallback(() => {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setSessionCode(code);
    return code;
  }, []);

  // Start listening on the channel
  const startSession = useCallback(() => {
    const code = generateCode();
    
    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`remote-control:${code}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'command' }, (payload) => {
        const { action, device } = payload.payload;
        
        setLastRemoteAction({ action, device, time: Date.now() });
        setRemoteConnected(true);

        switch (action) {
          case 'ADD_POINT_A':
            onPointA?.();
            break;
          case 'ADD_POINT_B':
            onPointB?.();
            break;
          case 'UNDO':
            onUndo?.();
            break;
        }
      })
      .on('broadcast', { event: 'ping' }, () => {
        // Remote device connected — acknowledge
        setRemoteConnected(true);
        channel.send({
          type: 'broadcast',
          event: 'pong',
          payload: { status: 'connected' }
        });
      })
      .subscribe();

    channelRef.current = channel;
    return code;
  }, [generateCode, onPointA, onPointB, onUndo]);

  // Stop and cleanup
  const stopSession = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setSessionCode(null);
    setRemoteConnected(false);
  }, []);

  // Auto-start/stop based on isActive
  useEffect(() => {
    if (isActive && !sessionCode) {
      startSession();
    } else if (!isActive && sessionCode) {
      stopSession();
    }
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    sessionCode,
    remoteConnected,
    lastRemoteAction,
    startSession,
    stopSession,
  };
}
