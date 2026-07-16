/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function isKeyboardInput(e: React.MouseEvent | React.KeyboardEvent): boolean {
  return e.type === 'keydown' || e.type === 'keyup';
}
