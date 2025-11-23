import { useEffect, useRef, useState } from 'react';
import { StorageService } from '../services/storageService';

export const useStepCounter = () => {
  const [steps, setSteps] = useState(0);
  const lastUpdate = useRef(0);
  // Use linear acceleration (without gravity) if available for better accuracy
  // Threshold needs to be higher if using linear acceleration, or carefully tuned
  const threshold = 1.0; 

  useEffect(() => {
    // Only works if device supports it and permission is granted (browsers vary)
    const handleMotion = (event: DeviceMotionEvent) => {
      const now = Date.now();
      if (now - lastUpdate.current < 250) return; // Debounce 250ms (average step time)

      // Use 'acceleration' (no gravity) if available, otherwise fallback to 'accelerationIncludingGravity'
      // Note: 'acceleration' is much better for counting actual movement and avoiding "ghost" steps when tilting the phone.
      const acc = event.acceleration || event.accelerationIncludingGravity;
      
      if (!acc) return;
      const { x, y, z } = acc;

      if (x === null || y === null || z === null) return;

      // Calculate vector magnitude
      const magnitude = Math.sqrt(x*x + y*y + z*z);

      // If using accelerationIncludingGravity, magnitude is ~9.8 when still. 
      // We need to look for deviation from 9.8.
      // If using acceleration, magnitude is ~0 when still.
      
      let isStep = false;

      if (event.acceleration && event.acceleration.x !== null) {
          // Using linear acceleration (cleaner)
          if (magnitude > threshold) {
              isStep = true;
          }
      } else {
          // Fallback to including gravity (messier)
          // Look for significant deviation from G (approx 9.8)
          const delta = Math.abs(magnitude - 9.8);
          if (delta > 2.0) { // Higher threshold for gravity inclusion
              isStep = true;
          }
      }

      if (isStep) {
        const newStepCount = 1;
        setSteps(prev => prev + newStepCount);
        StorageService.updateSteps(newStepCount);
        lastUpdate.current = now;
      }
    };

    // Request permission for iOS 13+ if needed (usually needs button click, so this might fail silently on load)
    // We rely on passive listener if available.
    if (typeof (window as any).DeviceMotionEvent !== 'undefined') {
        window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
       window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  return steps;
};