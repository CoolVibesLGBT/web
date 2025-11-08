import React, { useState, useEffect, useRef } from 'react';
import Map from './Map';

const MAX_HEADER_HEIGHT = 200;
const MIN_HEADER_HEIGHT = 80;

const TestPage: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(MAX_HEADER_HEIGHT);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollTop = scrollContainerRef.current.scrollTop;
    const newHeight = Math.max(MIN_HEADER_HEIGHT, MAX_HEADER_HEIGHT - scrollTop);
    setHeaderHeight(newHeight);
  };

  useEffect(() => {
    const current = scrollContainerRef.current;
    if (current) {
      current.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (current) {
        current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      style={{
        height: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >

<Map/>
 
    </div>
  );
};

export default TestPage;