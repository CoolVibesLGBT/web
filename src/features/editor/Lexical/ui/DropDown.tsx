/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';

import {motion, AnimatePresence} from 'framer-motion';
import {useRef, useState, useCallback, useEffect} from 'react';
import {ChevronDown} from 'lucide-react';

interface DropDownProps {
  disabled?: boolean;
  buttonClassName?: string;
  buttonAriaLabel?: string;
  buttonIconClassName?: string;
  buttonLabel?: string;
  children: React.ReactNode;
}

interface DropDownItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e?: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
  title?: string;
  'aria-label'?: string;
}

export default function DropDown({
  disabled = false,
  buttonClassName,
  buttonAriaLabel,
  buttonIconClassName,
  buttonLabel,
  children,
}: DropDownProps): JSX.Element {
  const [showDropDown, setShowDropDown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropDownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const calculatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Dropdown genişliği (min-w-48 = 12rem = 192px)
      const dropdownWidth = 256; // min-w-64
      const dropdownHeight = 300; // Tahmini yükseklik
      
      let left = rect.left;
      let top = rect.bottom + 4;
      
      // Sağa taşma kontrolü
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 8;
      }
      
      // Aşağıya taşma kontrolü
      if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 4;
      }
      
      // Sol kenardan taşma kontrolü
      if (left < 8) {
        left = 8;
      }
      
      setDropdownPosition({
        top: top + window.scrollY,
        left: left + window.scrollX,
      });
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      if (!showDropDown) {
        calculatePosition();
      }
      setShowDropDown(!showDropDown);
    }
  }, [showDropDown, disabled, calculatePosition]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropDownRef.current !== null &&
        !dropDownRef.current.contains(event.target as Node) &&
        buttonRef.current !== null &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropDown(false);
      }
    },
    [dropDownRef, buttonRef],
  );

  useEffect(() => {
    if (showDropDown) {
      document.addEventListener('mousedown', handleClickOutside);
      
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setShowDropDown(false);
        }
      };
      
      const handleScroll = () => {
        calculatePosition();
      };
      
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [showDropDown, handleClickOutside, calculatePosition]);

  return (
    <div className="relative" ref={dropDownRef}>
      <button
        type="button"
        disabled={disabled}
        aria-label={buttonAriaLabel || 'Dropdown'}
        className={`
          ${buttonClassName || ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          inline-flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
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
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDropDown ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {showDropDown && (
          <motion.div
            initial={{opacity: 0, y: -10, scale: 0.95}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -10, scale: 0.95}}
            transition={{duration: 0.15, ease: 'easeOut'}}
            className="fixed min-w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl backdrop-blur-sm z-[9999]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}>
            <div className="py-1">
              {Array.isArray(children) ? children.slice(1) : children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropDownItem({
  children,
  className,
  onClick,
  title,
  'aria-label': ariaLabel,
}: DropDownItemProps): JSX.Element {
  return (
    <motion.div
      whileHover={{scale: 1.02}}
      whileTap={{scale: 0.98}}
      className={`
        ${className || ''}
        flex items-center justify-between px-3 py-2 text-sm text-gray-900 dark:text-white
        cursor-pointer transition-all duration-150
        hover:bg-gray-100 dark:hover:bg-gray-700
        first:rounded-t-lg last:rounded-b-lg
      `}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}>
      {children}
    </motion.div>
  );
}