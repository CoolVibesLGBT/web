/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';

import {motion} from 'framer-motion';

interface ButtonProps {
  children: JSX.Element | string | (JSX.Element | string)[];
  className?: string;
  disabled?: boolean;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  'aria-label'?: string;
  small?: boolean;
}

export default function Button({
  children,
  className,
  disabled = false,
  onClick,
  type = 'button',
  title,
  'aria-label': ariaLabel,
  small = false,
}: ButtonProps): JSX.Element {
  const sizeClasses = small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <motion.button
      whileHover={disabled ? {} : {scale: 1.02}}
      whileTap={disabled ? {} : {scale: 0.98}}
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`
        ${className || ''}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700'
        }
        inline-flex items-center justify-center ${sizeClasses} font-medium text-gray-900 dark:text-white
        bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500
        transition-all duration-200
      `}>
      {children}
    </motion.button>
  );
}
