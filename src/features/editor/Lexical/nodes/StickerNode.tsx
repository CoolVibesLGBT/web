import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';
import type { JSX } from 'react';

import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import * as React from 'react';
import StickerMedia from '@/features/emoticons/StickerMedia';
import GifMedia from '@/features/emoticons/GifMedia';
import type { ChatEmoticon } from '@/features/emoticons/types';

// Same renderers the chat composer uses (Lottie .tgs, .webm video, static .webp/.gif/.mp4) so a
// sticker or GIF picked from the shared emoticon picker looks and animates identically in a post.
function StickerComponent({
  className,
  format,
  nodeKey,
  document,
}: Readonly<{
  className: Readonly<{ base: string; focus: string }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  document: ChatEmoticon;
}>) {
  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <div className="flex w-full justify-start py-1">
        {document.kind === 'sticker' ? (
          <StickerMedia document={document} size={160} />
        ) : (
          <GifMedia document={document} className="max-h-72 max-w-full rounded-xl object-contain" />
        )}
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedStickerNode = Spread<
  { document: ChatEmoticon },
  SerializedDecoratorBlockNode
>;

export class StickerNode extends DecoratorBlockNode {
  __document: ChatEmoticon;

  static getType(): string {
    return 'sticker';
  }

  static clone(node: StickerNode): StickerNode {
    return new StickerNode(node.__document, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedStickerNode): StickerNode {
    return $createStickerNode(serializedNode.document).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedStickerNode {
    return {
      ...super.exportJSON(),
      document: this.__document,
    };
  }

  constructor(document: ChatEmoticon, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__document = document;
  }

  exportDOM(): DOMExportOutput {
    const element = window.document.createElement('img');
    element.setAttribute('data-lexical-sticker', JSON.stringify(this.__document));
    element.setAttribute('src', this.__document.url);
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-sticker')) return null;
        return { conversion: $convertStickerElement, priority: 1 };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getDocument(): ChatEmoticon {
    return this.__document;
  }

  getTextContent(): string {
    return this.__document.emoji || '';
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = { base: embedBlockTheme.base || '', focus: embedBlockTheme.focus || '' };
    return (
      <StickerComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        document={this.__document}
      />
    );
  }
}

function $convertStickerElement(domNode: HTMLElement): null | DOMConversionOutput {
  const raw = domNode.getAttribute('data-lexical-sticker');
  if (!raw) return null;
  try {
    const document = JSON.parse(raw) as ChatEmoticon;
    return { node: $createStickerNode(document) };
  } catch {
    return null;
  }
}

export function $createStickerNode(document: ChatEmoticon): StickerNode {
  return new StickerNode(document);
}

export function $isStickerNode(node: StickerNode | LexicalNode | null | undefined): node is StickerNode {
  return node instanceof StickerNode;
}
