import { useState, useEffect } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export const useMousePosition = (): MousePosition => {
  const [mousePosition, setMousePosition] = useState<MousePosition>(() => {
    // Initialize to screen center if window is available, otherwise fallback
    if (typeof window !== 'undefined') {
      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
    }
    return { x: 400, y: 300 }; // Fallback for SSR
  });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      // Clamp mouse position to window bounds to prevent cat chasing outside
      const clampedX = Math.max(0, Math.min(e.clientX, window.innerWidth));
      const clampedY = Math.max(0, Math.min(e.clientY, window.innerHeight));
      setMousePosition({ x: clampedX, y: clampedY });
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return mousePosition;
};