import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';

import ToolbarPlugin from '../features/editor/Lexical/plugins/ToolbarPlugin';
import AutoLinkPlugin from '../features/editor/Lexical/plugins/AutoLinkPlugin';
import NewMentionsPlugin from '../features/editor/Lexical/plugins/MentionsPlugin';
import YouTubePlugin from '@/features/editor/Lexical/plugins/YouTubePlugin';
import ImagesPlugin from '@/features/editor/Lexical/plugins/ImagesPlugin';
import BioNodes from '../features/editor/Lexical/nodes/BioNodes';
import { ToolbarContext } from '../contexts/ToolbarContext';

type ThemeMode = 'dark' | 'light';

type BioEditorConfig = {
  namespace: string;
  editable: boolean;
  nodes: typeof BioNodes;
  theme: Record<string, unknown>;
  onError: (error: Error) => void;
};

function createBioTheme(theme: ThemeMode) {
  return {
    paragraph: `mb-2 text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
    heading: {
      h1: `text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
      h2: `text-2xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
      h3: `text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
    },
    list: {
      nested: {
        listitem: 'list-none',
      },
      ol: `list-decimal list-inside mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
      ul: `list-disc list-inside mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
      listitem: `mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`,
    },
    quote: `border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-2 italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`,
    link: `${theme === 'dark' ? 'text-white underline' : 'text-gray-900 underline'}`,
    text: {
      bold: 'font-semibold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
    },
    hashtag: 'hashtag inline-block bg-[linear-gradient(to_right,_#d04b36,_#e36511,_#ffba00,_#00b180,_#147aab,_#675997)] bg-clip-text text-transparent font-semibold hover:underline cursor-pointer',
    mention: 'mention font-semibold font-md inline-block bg-[linear-gradient(to_right,_#d04b36,_#e36511,_#ffba00,_#00b180,_#147aab,_#675997)] bg-clip-text text-transparent font-semibold hover:underline cursor-pointer',
  };
}

function createBioEditorConfig(theme: ThemeMode, editable: boolean): BioEditorConfig {
  return {
    namespace: 'CoolVibesEditor',
    editable,
    nodes: BioNodes,
    theme: createBioTheme(theme),
    onError(error: Error) {
      console.error('Lexical Error:', error);
    },
  };
}

const ToolbarPluginWrapper = () => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [, setIsLinkEditMode] = useState(false);

  useEffect(() => {
    setActiveEditor(editor);
  }, [editor]);

  return (
    <ToolbarContext>
      <ToolbarPlugin
        editor={editor}
        activeEditor={activeEditor}
        setActiveEditor={setActiveEditor}
        setIsLinkEditMode={setIsLinkEditMode}
      />
    </ToolbarContext>
  );
};

const BioEditorPlugins = React.memo(({
  onChange,
}: {
  onChange: (editorState: { read: (fn: () => void) => void }) => void;
}) => (
  <>
    <OnChangePlugin onChange={onChange} />
    <AutoFocusPlugin />
    <HistoryPlugin />
    <HashtagPlugin />
    <ListPlugin />
    <LinkPlugin />
    <AutoLinkPlugin />
    <NewMentionsPlugin />
    <YouTubePlugin />
    <ImagesPlugin captionsEnabled={false} />
  </>
));

BioEditorPlugins.displayName = 'BioEditorPlugins';

const BioPreviewPlugins = React.memo(() => (
  <>
    <HashtagPlugin />
    <ListPlugin />
    <LinkPlugin />
    <NewMentionsPlugin />
  </>
));

BioPreviewPlugins.displayName = 'BioPreviewPlugins';

const BioDraftEditor = React.memo(({
  content,
  placeholder,
  onChange,
}: {
  content: string;
  placeholder: string;
  onChange: (nextHtml: string) => void;
}) => {
  const [editor] = useLexicalComposerContext();
  const contentRef = useRef<string>(content);
  const isInitializedRef = useRef(false);
  const isUserTypingRef = useRef(false);

  useEffect(() => {
    if (isUserTypingRef.current) {
      return;
    }

    if (contentRef.current === content && isInitializedRef.current) {
      return;
    }

    contentRef.current = content;

    queueMicrotask(() => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content || '', 'text/html');

        editor.update(() => {
          const root = $getRoot();
          root.clear();

          const nodes = $generateNodesFromDOM(editor as any, doc);
          if (nodes.length > 0) {
            root.append(...nodes);
            return;
          }

          const fallbackText = content.trim();
          if (fallbackText.length > 0) {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(fallbackText));
            root.append(paragraph);
            return;
          }

          root.append($createParagraphNode());
        }, { discrete: true });

        isInitializedRef.current = true;
      } catch (error) {
        console.warn('Failed to render profile bio with Lexical:', error);

        editor.update(() => {
          const root = $getRoot();
          root.clear();

          const fallbackText = content.trim();
          if (fallbackText.length > 0) {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(fallbackText));
            root.append(paragraph);
            return;
          }

          root.append($createParagraphNode());
        }, { discrete: true });

        isInitializedRef.current = true;
      }
    });
  }, [content, editor]);

  const handleChange = React.useCallback((editorState: { read: (fn: () => void) => void }) => {
    isUserTypingRef.current = true;

    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor as any, null);
      // Keep the local snapshot in sync so the draft does not rehydrate from
      // parent state after every onChange and clobber embedded nodes.
      contentRef.current = htmlString;
      onChange(htmlString);
    });

    window.setTimeout(() => {
      isUserTypingRef.current = false;
    }, 1000);
  }, [editor, onChange]);

  return (
    <div className="relative">
      <div className="-mx-2 mt-1">
        <ToolbarPluginWrapper />
      </div>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="editor-input lexical-editor px-4 py-3"
            style={{
              minHeight: '120px',
              maxHeight: '100%',
              wordWrap: 'break-word',
            overflowWrap: 'break-word',
            }}
          />
        }
        placeholder={
          <div className="absolute top-[60px] left-[14px] text-sm pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <BioEditorPlugins onChange={handleChange} />
    </div>
  );
});

BioDraftEditor.displayName = 'BioDraftEditor';

const BioPreviewEditor = React.memo(({ content }: { content: string }) => {
  const [editor] = useLexicalComposerContext();
  const contentRef = useRef<string>(content);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (contentRef.current === content && isInitializedRef.current) {
      return;
    }

    contentRef.current = content;

    queueMicrotask(() => {
      try {
        editor.setEditable(false);

        const parser = new DOMParser();
        const doc = parser.parseFromString(content || '', 'text/html');

        editor.update(() => {
          const root = $getRoot();
          root.clear();

          const nodes = $generateNodesFromDOM(editor as any, doc);
          if (nodes.length > 0) {
            root.append(...nodes);
            return;
          }

          const fallbackText = content.trim();
          if (fallbackText.length > 0) {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(fallbackText));
            root.append(paragraph);
            return;
          }

          root.append($createParagraphNode());
        }, { discrete: true });

        isInitializedRef.current = true;
      } catch (error) {
        console.warn('Failed to render profile bio with Lexical:', error);

        editor.update(() => {
          const root = $getRoot();
          root.clear();

          const fallbackText = content.trim();
          if (fallbackText.length > 0) {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(fallbackText));
            root.append(paragraph);
            return;
          }

          root.append($createParagraphNode());
        }, { discrete: true });

        isInitializedRef.current = true;
      }
    });
  }, [content, editor]);

  return (
    <>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="editor-input lexical-editor px-0 py-0"
            style={{
              minHeight: 0,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          />
        }
        placeholder={<div />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <BioPreviewPlugins />
    </>
  );
});

BioPreviewEditor.displayName = 'BioPreviewEditor';

export const ProfileBioEditor = React.memo(({
  theme,
  content,
  placeholder,
  onChange,
}: {
  theme: ThemeMode;
  content: string;
  placeholder: string;
  onChange: (nextHtml: string) => void;
}) => {
  const editorConfig = useMemo(() => createBioEditorConfig(theme, true), [theme]);

  return (
    <div className={`w-full px-2 rounded-xl border-2 focus-within:border-opacity-100 transition-all ${theme === 'dark'
      ? 'cv-card-surface-muted border-white/10 focus-within:border-white/20'
      : 'bg-gray-50 border-gray-200 focus-within:border-gray-900'
      }`}>
      <LexicalComposer initialConfig={editorConfig}>
        <BioDraftEditor content={content} placeholder={placeholder} onChange={onChange} />
      </LexicalComposer>
    </div>
  );
});

ProfileBioEditor.displayName = 'ProfileBioEditor';

export const ProfileBioPreview = React.memo(({
  theme,
  content,
}: {
  theme: ThemeMode;
  content: string;
}) => {
  const editorConfig = useMemo(() => createBioEditorConfig(theme, false), [theme]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <BioPreviewEditor content={content} />
    </LexicalComposer>
  );
});

ProfileBioPreview.displayName = 'ProfileBioPreview';
