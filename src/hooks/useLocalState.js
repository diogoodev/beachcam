import { useState, useEffect } from "react";

export function useLocalState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading localStorage", error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error setting localStorage", error);
    }
  }, [key, state]);

  return [state, setState];
}
