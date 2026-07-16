/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';

import type {LexicalEditor} from 'lexical';
import {useState} from 'react';

import Button from '../../ui/Button';

export function InsertTableDialog({
  activeEditor: _activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);

  const handleInsert = () => {
    // Placeholder for table insertion logic
    // This would typically use INSERT_TABLE_COMMAND
    console.log(`Inserting table with ${rows} rows and ${columns} columns`);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Rows
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={rows}
          onChange={(e) => setRows(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Columns
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={columns}
          onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button onClick={onClose} className="px-4 py-2">
          Cancel
        </Button>
        <Button onClick={handleInsert} className="px-4 py-2 bg-gray-900 text-white">
          Insert Table
        </Button>
      </div>
    </div>
  );
}
