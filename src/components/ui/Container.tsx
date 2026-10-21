import React, { ReactNode, forwardRef } from 'react';

interface ContainerProps extends React.ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
  className?: string;
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`skyline-page-scroll w-full ${className}`}
    {...props}
  >
    {children}
  </div>
));

Container.displayName = 'Container';

export default Container;
