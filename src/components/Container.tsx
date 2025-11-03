import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
        scrollbar-hide 
        max-h-[100dvh] 
        min-h-[100dvh] 
        h-[100dvh] 
        !pb-[70dvh] 
        overflow-y-auto
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default Container;