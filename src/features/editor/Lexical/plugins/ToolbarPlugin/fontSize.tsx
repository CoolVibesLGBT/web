/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


import type {LexicalEditor} from 'lexical';
import * as React from 'react';
import {Minus, Plus} from 'lucide-react';
import {motion} from 'framer-motion';

import {isKeyboardInput} from '../../utils/focusUtils';
import {SHORTCUTS} from '../ShortcutsPlugin/shortcuts';
import {
  updateFontSize,
  updateFontSizeInSelection,
  UpdateFontSizeType,
} from './utils';
import { MAX_ALLOWED_FONT_SIZE, MIN_ALLOWED_FONT_SIZE } from '../../../../../contexts/ToolbarContext';

function parseFontSize(input: string): [number, string] | null {
  const match = input.match(/^(\d+(?:\.\d+)?)(px|pt)$/);
  return match ? [Number(match[1]), match[2]] : null;
}

function normalizeToPx(fontSize: number, unit: string): number {
  return unit === 'pt' ? Math.round((fontSize * 4) / 3) : fontSize;
}

function isValidFontSize(fontSizePx: number): boolean {
  return (
    fontSizePx >= MIN_ALLOWED_FONT_SIZE && fontSizePx <= MAX_ALLOWED_FONT_SIZE
  );
}

export function parseFontSizeForToolbar(input: string): string {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return '';
  }

  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return `${fontSizePx}px`;
}

export function parseAllowedFontSize(input: string): string {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return '';
  }

  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return isValidFontSize(fontSizePx) ? input : '';
}

export default function FontSize({
  selectionFontSize,
  disabled,
  editor,
}: {
  selectionFontSize: string;
  disabled: boolean;
  editor: LexicalEditor;
}) {
  const [inputValue, setInputValue] = React.useState<string>(selectionFontSize);
  const [inputChangeFlag, setInputChangeFlag] = React.useState<boolean>(false);
  const [isMouseMode, setIsMouseMode] = React.useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputValueNumber = Number(inputValue);

    if (e.key === 'Tab') {
      return;
    }
    if (['e', 'E', '+', '-'].includes(e.key) || isNaN(inputValueNumber)) {
      e.preventDefault();
      setInputValue('');
      return;
    }
    setInputChangeFlag(true);
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();

      updateFontSizeByInputValue(inputValueNumber, !isMouseMode);
    }
  };

  const handleInputBlur = () => {
    setIsMouseMode(false);

    if (inputValue !== '' && inputChangeFlag) {
      const inputValueNumber = Number(inputValue);
      updateFontSizeByInputValue(inputValueNumber);
    }
  };

  const handleClick = () => {
    setIsMouseMode(true);
  };

  const updateFontSizeByInputValue = (
    inputValueNumber: number,
    skipRefocus: boolean = false,
  ) => {
    let updatedFontSize = inputValueNumber;
    if (inputValueNumber > MAX_ALLOWED_FONT_SIZE) {
      updatedFontSize = MAX_ALLOWED_FONT_SIZE;
    } else if (inputValueNumber < MIN_ALLOWED_FONT_SIZE) {
      updatedFontSize = MIN_ALLOWED_FONT_SIZE;
    }

    setInputValue(String(updatedFontSize));
    updateFontSizeInSelection(
      editor,
      String(updatedFontSize) + 'px',
      null,
      skipRefocus,
    );
    setInputChangeFlag(false);
  };

  React.useEffect(() => {
    setInputValue(selectionFontSize);
  }, [selectionFontSize]);

  return (
    <div className="flex items-center space-x-1">
      <motion.button
        type="button"
        disabled={
          disabled ||
          (selectionFontSize !== '' &&
            Number(inputValue) <= MIN_ALLOWED_FONT_SIZE)
        }
        onClick={(e) => {
          updateFontSize(
            editor,
            UpdateFontSizeType.decrement,
            inputValue,
            isKeyboardInput(e),
          );
        }}
        className={`p-2 rounded-lg transition-all duration-200 ${
          disabled || (selectionFontSize !== '' && Number(inputValue) <= MIN_ALLOWED_FONT_SIZE)
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Decrease font size"
        title={`Decrease font size (${SHORTCUTS.DECREASE_FONT_SIZE})`}>
        <Minus className="w-3.5 h-3.5" />
      </motion.button>

      <input
        type="number"
        title="Font size"
        value={inputValue}
        disabled={disabled}
        className={`px-3 py-2 w-16 text-center text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700'
            : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-blue-500'
        }`}
        min={MIN_ALLOWED_FONT_SIZE}
        max={MAX_ALLOWED_FONT_SIZE}
        onChange={(e) => setInputValue(e.target.value)}
        onClick={handleClick}
        onKeyDown={handleKeyPress}
        onBlur={handleInputBlur}
      />

      <motion.button
        type="button"
        disabled={
          disabled ||
          (selectionFontSize !== '' &&
            Number(inputValue) >= MAX_ALLOWED_FONT_SIZE)
        }
        onClick={(e) => {
          updateFontSize(
            editor,
            UpdateFontSizeType.increment,
            inputValue,
            isKeyboardInput(e),
          );
        }}
        className={`p-2 rounded-lg transition-all duration-200 ${
          disabled || (selectionFontSize !== '' && Number(inputValue) >= MAX_ALLOWED_FONT_SIZE)
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Increase font size"
        title={`Increase font size (${SHORTCUTS.INCREASE_FONT_SIZE})`}>
        <Plus className="w-3.5 h-3.5" />
      </motion.button>
    </div>
  );
}
