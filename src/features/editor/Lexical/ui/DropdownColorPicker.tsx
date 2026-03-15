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

interface DropdownColorPickerProps {
  disabled?: boolean;
  buttonClassName?: string;
  buttonAriaLabel?: string;
  buttonIconClassName?: string;
  color: string;
  onChange?: (color: string, skipHistoryStack?: boolean, skipRefocus?: boolean) => void;
  title?: string;
}

const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#808080', '#800000', '#FF0000', '#FFA500', '#FFFF00', '#008000',
  '#0000FF', '#800080', '#FFC0CB', '#A52A2A', '#C0C0C0', '#808080', '#000080', '#008080',
  '#00FF00', '#FF00FF', '#00FFFF', '#FFD700', '#DDA0DD', '#F0E68C', '#E6E6FA', '#98FB98',
  '#F5DEB3', '#FFE4E1', '#F0F8FF', '#F5F5DC', '#FFEFD5', '#FFF8DC', '#FDF5E6', '#FAF0E6'
];

export default function DropdownColorPicker({
  disabled = false,
  buttonClassName,
  buttonAriaLabel,
  buttonIconClassName,
  color,
  onChange,
  title,
}: DropdownColorPickerProps): JSX.Element {
  const [showDropDown, setShowDropDown] = useState(false);
  const [customColor, setCustomColor] = useState(color);
  const dropDownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    if (buttonRef.current !== null) {
      setShowDropDown(!showDropDown);
    }
  }, [showDropDown]);

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

  const handleColorSelect = useCallback(
    (selectedColor: string) => {
      setCustomColor(selectedColor);
      onChange?.(selectedColor, false, false);
      setShowDropDown(false);
    },
    [onChange],
  );

  const handleCustomColorChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = event.target.value;
      setCustomColor(newColor);
      onChange?.(newColor, false, false);
    },
    [onChange],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className="relative" ref={dropDownRef}>
      <button
        type="button"
        disabled={disabled}
        aria-label={buttonAriaLabel || 'Color picker'}
        className={`
          ${buttonClassName || ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
          inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-900 dark:text-white
          bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500
          transition-colors duration-200
        `}
        onClick={handleClick}
        ref={buttonRef}
        title={title}>
        {buttonIconClassName && (
          <i className={`${buttonIconClassName} mr-2`}>🎨</i>
        )}
        <div
          className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded"
          style={{backgroundColor: color}}
        />
      </button>
      <AnimatePresence>
        {showDropDown && (
          <motion.div
            initial={{opacity: 0, y: -10, scale: 0.95}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -10, scale: 0.95}}
            transition={{duration: 0.15, ease: 'easeOut'}}
            className=" mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preset Colors
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_PRESETS.map((presetColor) => (
                    <motion.button
                      key={presetColor}
                      whileHover={{scale: 1.1}}
                      whileTap={{scale: 0.95}}
                      className={`
                        w-6 h-6 rounded border-2 transition-all duration-200
                        ${color === presetColor 
                          ? 'border-gray-900 dark:border-white ring-2 ring-gray-500' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-500'
                        }
                      `}
                      style={{backgroundColor: presetColor}}
                      onClick={() => handleColorSelect(presetColor)}
                      title={presetColor}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
