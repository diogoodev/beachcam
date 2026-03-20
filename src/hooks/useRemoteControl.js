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

  // Use refs for callbacks to avoid stale closures in the channel listener
  const onPointARef = useRef(onPointA);
  const onPointBRef = useRef(onPointB);
  const onUndoRef = useRef(onUndo);
  onPointARef.current = onPointA;
  onPointBRef.current = onPointB;
  onUndoRef.current = onUndo;

  // Start listening on the channel
  const startSession = useCallback(() => {
    // Generate a random 4-digit code
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setSessionCode(code);
    
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

        // Use refs to always call the latest callback
        switch (action) {
          case 'ADD_POINT_A':
            onPointARef.current?.();
            break;
          case 'ADD_POINT_B':
            onPointBRef.current?.();
            break;
          case 'UNDO':
            onUndoRef.current?.();
            break;
        }
      })
      .on('broadcast', { event: 'ping' }, () => {
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
  }, []); // No dependencies needed — uses refs for callbacks

  // Stop and cleanup
  const stopSession = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setSessionCode(null);
    setRemoteConnected(false);
    setLastRemoteAction(null);
  }, []);

  // Auto-start/stop based on isActive
  useEffect(() => {
    if (isActive && !channelRef.current) {
      startSession();
    } else if (!isActive && channelRef.current) {
      stopSession();
    }
    
    // Cleanup only if stopSession hasn't already removed the channel
    return () => {
      if (channelRef.current) {
        stopSession();
      }
    };
  }, [isActive, startSession, stopSession]);

  return {
    sessionCode,
    remoteConnected,
    lastRemoteAction,
    startSession,
    stopSession,
  };
}
