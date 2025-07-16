import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseIdleTimeoutProps {
  timeout?: number; // timeout in milliseconds
  onIdle?: () => void;
  enabled?: boolean;
}

export const useIdleTimeout = ({ 
  timeout = 60 * 60 * 1000, // 1 hour default
  onIdle,
  enabled = true 
}: UseIdleTimeoutProps = {}) => {
  const { signOut } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      console.log('Session timeout - logging out user');
      
      // Call custom onIdle callback if provided
      if (onIdle) {
        onIdle();
      } else {
        // Default behavior: sign out and redirect
        signOut();
      }
    }, timeout);
  }, [timeout, onIdle, signOut, enabled]);

  const handleActivity = useCallback(() => {
    if (!enabled) return;
    resetTimer();
  }, [resetTimer, enabled]);

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // List of events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the initial timer
    resetTimer();

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleActivity, resetTimer, enabled]);

  // Provide manual reset function
  const manualReset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Get remaining time
  const getRemainingTime = useCallback(() => {
    if (!enabled || !lastActivityRef.current) return 0;
    
    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = Math.max(0, timeout - elapsed);
    return remaining;
  }, [timeout, enabled]);

  return {
    resetTimer: manualReset,
    getRemainingTime,
    isEnabled: enabled
  };
};