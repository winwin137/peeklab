import { useEffect } from 'react';

export const useDynamicHeight = (): void => {
  useEffect(() => {
    const updateHeight = (): void => {
      // Set the height of the body to the inner window height
      document.body.style.height = `${window.innerHeight}px`;
    };

    // Adjust height on load and resize
    window.addEventListener('resize', updateHeight);
    updateHeight();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);
};
