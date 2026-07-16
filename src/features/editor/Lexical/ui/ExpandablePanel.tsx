/**
 * Expandable Panel Component
 * Toolbar üzerinde expand/collapse olan panel
 */

import type {JSX} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {useRef, useState, useCallback, useEffect} from 'react';
import {ChevronRight, ChevronLeft} from 'lucide-react';

interface ExpandablePanelProps {
  disabled?: boolean;
  buttonClassName?: string;
  buttonAriaLabel?: string;
  buttonIconClassName?: string;
  buttonLabel?: string;
  children: React.ReactNode;
  direction?: 'left' | 'right';
  maxWidth?: string;
}

export default function ExpandablePanel({
  disabled = false,
  buttonClassName,
  buttonAriaLabel,
  buttonIconClassName,
  buttonLabel,
  children,
  direction = 'right',
  maxWidth = '400px',
}: ExpandablePanelProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsExpanded(!isExpanded);
    }
  }, [isExpanded, disabled]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        panelRef.current !== null &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current !== null &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    },
    [panelRef, buttonRef],
  );

  useEffect(() => {
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsExpanded(false);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isExpanded, handleClickOutside]);

  return (
    <div className="relative flex items-center" ref={panelRef}>
      {/* Button */}
      <button
        type="button"
        disabled={disabled}
        aria-label={buttonAriaLabel || 'Expand panel'}
        className={`
          ${buttonClassName || ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          inline-flex items-center justify-center whitespace-nowrap
          focus:outline-none focus:ring-0
          transition-all duration-200
        `}
        onClick={handleClick}
        ref={buttonRef}>
        {buttonIconClassName && (
          <div className={`${buttonIconClassName} mr-1.5`} />
        )}
        {buttonLabel && <span className="mr-1">{buttonLabel}</span>}
        {!buttonLabel && !buttonIconClassName && children && (
          <div className="mr-1">
            {Array.isArray(children) ? children[0] : children}
          </div>
        )}
        {direction === 'right' ? (
          <ChevronRight className={`w-3 h-3 transition-all duration-300 ease-[0.4,0.0,0.2,1] ${
            isExpanded ? 'rotate-90' : ''
          }`} />
        ) : (
          <ChevronLeft className={`w-3 h-3 transition-all duration-300 ease-[0.4,0.0,0.2,1] ${
            isExpanded ? '-rotate-90' : ''
          }`} />
        )}
      </button>

      {/* Expandable Panel - Inline to push other elements */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ 
              opacity: 0, 
              width: 0,
              x: direction === 'right' ? -10 : 10,
              scale: 0.98,
            }}
            animate={{ 
              opacity: 1, 
              width: 'auto',
              x: 0,
              scale: 1,
            }}
            exit={{ 
              opacity: 0, 
              width: 0,
              x: direction === 'right' ? -10 : 10,
              scale: 0.98,
            }}
            transition={{ 
              duration: 0.25, 
              ease: [0.25, 0.1, 0.25, 1],
              opacity: { duration: 0.2 },
              width: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
              x: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
              scale: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
            }}
            className={`
              ml-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 
              overflow-hidden flex items-center space-x-1 flex-shrink-0
              backdrop-blur-sm whitespace-nowrap
              h-10
            `}
            style={{
              maxWidth: maxWidth,
              minWidth: 'fit-content',
            }}>
            {Array.isArray(children) ? children.slice(1) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
