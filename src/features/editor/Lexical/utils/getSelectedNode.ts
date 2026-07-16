/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {$isTextNode} from 'lexical';
import type { LexicalNode } from 'lexical';

export function getSelectedNode(selection: any): LexicalNode {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isTextNode(focusNode) ? focusNode : anchorNode;
  }
  return $isTextNode(anchorNode) ? anchorNode : focusNode;
}
