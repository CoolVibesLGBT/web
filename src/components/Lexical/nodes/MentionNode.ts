/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
  TextNode,
} from 'lexical';

export type SerializedMentionNode = Spread<
  {
    mentionName: string;
    mentionClass:string;
  },
  SerializedTextNode
>;

function $convertMentionElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const textContent = domNode.textContent;
  const mentionName = domNode.getAttribute('data-lexical-mention-name');
  const mentionClass = domNode.className || undefined; // Burada sınıfı alıyoruz

  if (textContent !== null) {
    const node = $createMentionNode(
      typeof mentionName === 'string' ? mentionName : textContent,
      textContent,
      mentionClass,
    );
    return {
      node,
    };
  }

  return null;
}

const mentionStyle = 'background-color: rgba(24, 119, 232, 0.2)';
export class MentionNode extends TextNode {
  __mention: string;
  __mentionClass:string;

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mention, node.__text, node.__key,node.__mentionClass);
  }
  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(
      serializedNode.mentionName,
      serializedNode.text,
      serializedNode.mentionClass,
    ).updateFromJSON(serializedNode);
  }

  constructor(mentionName: string, text?: string, key?: NodeKey, mentionClass?: string) {
    super(text ?? mentionName, key);
    this.__mention = mentionName;
    this.__mentionClass = mentionClass ?? 'mention';

    console.log("constructor",mentionClass)

  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      mentionName: this.__mention,
      mentionClass: this.__mentionClass,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.style.cssText = mentionStyle;
    const mentionClass = (config.theme as any)?.mention || 'mention';
    dom.className = mentionClass;
    dom.spellcheck = false;

    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-mention', 'true');
    if (this.__text !== this.__mention) {
      element.setAttribute('data-lexical-mention-name', this.__mention);
    }


    console.log("exportDOM:",this.__mentionClass)
    
    element.className = `mention  ${this.__mentionClass}`;
    element.textContent = this.__text;
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-mention')) {
          return null;
        }
        return {
          conversion: $convertMentionElement,
          priority: 1,
        };
      },
    };
  }

  isTextEntity(): true {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createMentionNode(
  mentionName: string,
  textContent?: string,
  mentionClass?: string,
): MentionNode {
  const mentionNode = new MentionNode(mentionName, textContent ?? mentionName, undefined, mentionClass);
  mentionNode.setMode('segmented').toggleDirectionless();
  return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return node instanceof MentionNode;
}
