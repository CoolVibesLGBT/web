/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {useCallback, useState} from 'react';
import {createPortal} from 'react-dom';

export default function useModal(): [
  React.ReactElement | null,
  (title: string, showModal: (onClose: () => void) => React.ReactElement) => void,
] {
  const [modal, setModal] = useState<React.ReactElement | null>(null);

  const showModal = useCallback(
    (title: string, getContent: (onClose: () => void) => React.ReactElement) => {
      const onClose = () => setModal(null);
      const content = getContent(onClose);
      setModal(
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <i className="icon close">×</i>
                </button>
              </div>
              <div className="p-4">
                {content}
              </div>
            </div>
          </div>,
          document.body,
        ),
      );
    },
    [],
  );

  return [modal, showModal];
}
