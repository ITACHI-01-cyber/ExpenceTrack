import React, { useEffect, useState } from 'react';

const AnimatedNumber = ({ value, duration = 600, formatter }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCurrentValue(value * easeProgress);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCurrentValue(value);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{formatter ? formatter(currentValue) : currentValue.toFixed(0)}</span>;
};

export default AnimatedNumber;
