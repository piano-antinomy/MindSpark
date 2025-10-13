import React, { useState, useEffect } from 'react';

const OrientationLock = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Check if device is tablet-sized (between phone and desktop)
      const isTabletSize = width >= 768 && width < 1280;
      
      // Check if in portrait mode
      const isPortraitMode = height > width;
      
      setIsTablet(isTabletSize);
      setIsPortrait(isPortraitMode);
    };

    // Check on mount
    checkOrientation();

    // Listen for orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Only show overlay if it's a tablet in portrait mode
  if (!isTablet || !isPortrait) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex flex-col items-center justify-center text-white p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📱➡️📺</div>
        <h2 className="text-2xl font-bold mb-4">Please Rotate Your Device</h2>
        <p className="text-lg mb-6">
          This app is optimized for landscape mode on tablets for the best experience.
        </p>
        <div className="animate-bounce">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm text-gray-300 mt-4">
          Rotate your device to landscape mode to continue
        </p>
      </div>
    </div>
  );
};

export default OrientationLock;
