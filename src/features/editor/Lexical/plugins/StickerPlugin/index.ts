import type { JSX } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import type { LexicalCommand } from 'lexical';
import { useEffect } from 'react';
import type { ChatEmoticon } from '@/features/emoticons/types';

import { $createStickerNode, StickerNode } from '../../nodes/StickerNode';

export const INSERT_STICKER_COMMAND: LexicalCommand<ChatEmoticon> = createCommand(
  'INSERT_STICKER_COMMAND',
);

export default function StickerPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([StickerNode])) {
      throw new Error('StickerPlugin: StickerNode not registered on editor');
    }

    return editor.registerCommand<ChatEmoticon>(
      INSERT_STICKER_COMMAND,
      (payload) => {
        const stickerNode = $createStickerNode(payload);
        $insertNodeToNearestRoot(stickerNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
