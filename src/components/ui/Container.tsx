import React, { ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface ContainerProps extends React.ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
  className?: string;
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(({ children, className = '', ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 0 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
    className={`skyline-page-scroll w-full ${className}`}
    {...props}
  >
    {children}
  </motion.div>
));

Container.displayName = 'Container';

export default Container;
