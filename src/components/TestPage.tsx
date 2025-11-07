import React, { useState, useEffect, useRef } from 'react';

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
      <header
        style={{
          height: headerHeight,
          backgroundColor: '#1E40AF', // Tailwind 'blue-800'
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: headerHeight / 4, // Font büyüklüğü header ile orantılı
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'height 0.2s ease-out, font-size 0.2s ease-out',
        }}
      >
        Scaling Header
      </header>

      <main style={{ padding: 16 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            style={{
              marginBottom: 16,
              backgroundColor: '#f3f4f6', // Tailwind 'gray-100'
              padding: 16,
              borderRadius: 8,
              boxShadow: '0 1px 3px rgb(0 0 0 / 0.1)',
            }}
          >
            Content item {i + 1}
          </div>
        ))}
      </main>
    </div>
  );
};

export default TestPage;