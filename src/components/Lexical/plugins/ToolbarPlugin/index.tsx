/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';


import {
  $isCodeNode,
} from '@lexical/code';
import {$isLinkNode, TOGGLE_LINK_COMMAND} from '@lexical/link';
import {$isListNode, ListNode} from '@lexical/list';
import {$isHeadingNode, $isQuoteNode} from '@lexical/rich-text';
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
} from '@lexical/selection';
import {$isTableNode, $isTableSelection} from '@lexical/table';
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
  mergeRegister,
} from '@lexical/utils';
import {
  $addUpdateTag,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  CommandPayloadType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  SKIP_DOM_SELECTION_TAG,
  SKIP_SELECTION_FOCUS_TAG,
  TextFormatType,
  UNDO_COMMAND,
} from 'lexical';
import {INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND} from 'lexical';
import {Dispatch, useCallback, useEffect, useState, useRef} from 'react';
import {motion} from 'framer-motion';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Eraser,
  MoreHorizontal,
  Palette,
  Paintbrush,
  ChevronLeft,
  ChevronRight,
  Indent,
  Outdent,
  CaseSensitive,
  CaseLower,
  CaseUpper,
  List,
  ListOrdered,
  ListTree,
  PenTool
} from 'lucide-react';

import useModal from '../../hooks/useModal';
import ExpandablePanel from '../../ui/ExpandablePanel';
import {isKeyboardInput} from '../../utils/focusUtils';
import {getSelectedNode} from '../../utils/getSelectedNode';
import {sanitizeUrl} from '../../utils/url';
import FontSize, {parseFontSizeForToolbar} from './fontSize';
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
  formatStrikethrough,
  formatUppercase,
  formatLowercase,
  formatCapitalize,
  formatHighlight,
} from './utils';
import {useToolbarState, blockTypeToBlockName as contextBlockTypeToBlockName} from '../../../../contexts/ToolbarContext';

const blockTypeToBlockName: Record<string, string> = {
  paragraph: 'Normal',
  h1: 'Heading 1',
  h2: 'Heading 2', 
  h3: 'Heading 3',
  number: 'Numbered List',
  bullet: 'Bullet List',
  check: 'Check List',
  quote: 'Quote',
  code: 'Code Block',
};


const useSettings = () => ({
  settings: {
    isCodeHighlighted: false,
    isCodeShiki: false,
  },
});

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['17px', '17px'],
  ['18px', '18px'],
  ['19px', '19px'],
  ['20px', '20px'],
];


function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  style: string;
  disabled?: boolean;
}): JSX.Element {
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style],
  );

  const buttonAriaLabel =
    style === 'font-family'
      ? 'Formatting options for font family'
      : 'Formatting options for font size';

  return (
    <ExpandablePanel
      disabled={disabled}
      buttonClassName={`px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-sm border border-gray-200 dark:border-gray-700 hover:shadow-md whitespace-nowrap overflow-hidden text-ellipsis w-[180px] h-10 focus:outline-none focus:ring-0 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      buttonLabel={value}
      buttonIconClassName={
        style === 'font-family' ? 'w-3.5 h-3.5 mr-1.5' : ''
      }
      buttonAriaLabel={buttonAriaLabel}
      direction="right"
      maxWidth="280px">
      <div className="flex items-center">
        {style === 'font-family' && <div className="w-3.5 h-3.5 mr-1.5" />}
        <span className="text-sm">{value}</span>
      </div>
      <div className="flex items-center space-x-1 whitespace-nowrap h-8">
        {(style === 'font-family' ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).slice(0, 5).map(
          ([option, text]) => (
            <motion.button
              key={option}
              onClick={() => handleClick(option)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis ${
                value === option
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title={text}>
              {text}
            </motion.button>
          ),
        )}
      </div>
    </ExpandablePanel>
  );
}

// Adobe-quality Color picker component
function ColorPicker({
  color,
  onChange,
  title,
  icon: Icon,
}: {
  color: string;
  onChange: (color: string) => void;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}): JSX.Element {
  // Pride flag colors from CSS variables
  const prideColors = [
    // Gay Pride Flag
    { color: '#d04b36', name: 'Gay Red' },
    { color: '#e36511', name: 'Gay Orange' },
    { color: '#ffba00', name: 'Gay Yellow' },
    { color: '#00b180', name: 'Gay Green' },
    { color: '#147aab', name: 'Gay Blue' },
    { color: '#675997', name: 'Gay Indigo' },
    
    // Transgender Pride Flag
    { color: '#4fa5c2', name: 'Trans Blue' },
    { color: '#f587ac', name: 'Trans Pink' },
    { color: '#f9fbfc', name: 'Trans White' },
    
    // Bisexual Pride Flag
    { color: '#c1357e', name: 'Bi Pink' },
    { color: '#675997', name: 'Bi Purple' },
    { color: '#0655a9', name: 'Bi Blue' },
    
    // Pansexual Pride Flag
    { color: '#fa5e5b', name: 'Pan Magenta' },
    { color: '#ffba00', name: 'Pan Yellow' },
    { color: '#4fa5c2', name: 'Pan Blue' },
    
    // Additional Colors
    { color: '#000000', name: 'Black' },
    { color: '#ffffff', name: 'White' },
    { color: '#808080', name: 'Gray' }
  ];

  return (
    <ExpandablePanel
      buttonClassName="p-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-lg flex items-center h-10"
      buttonLabel=""
      buttonAriaLabel={title}
      direction="right"
      maxWidth="400px">
      <div className="flex items-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex items-center space-x-1">
        {/* Current Color Display */}
        <div
          className="w-7 h-7 rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm"
          style={{ backgroundColor: color }}
          title={`${title}: ${color.toUpperCase()}`}
        />
        
        {/* Pride Colors */}
        {prideColors.slice(0, 12).map((colorObj) => (
          <motion.button
            key={colorObj.color}
            onClick={() => onChange(colorObj.color)}
            className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
              color === colorObj.color 
                ? 'border-gray-800 dark:border-gray-200 ring-2 ring-blue-500 shadow-lg' 
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400'
            }`}
            style={{ backgroundColor: colorObj.color }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title={`${colorObj.name} - ${colorObj.color}`}
          />
        ))}
        
        {/* Custom Color Input */}
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:border-gray-400 dark:hover:border-gray-400 transition-all duration-200"
          title="Custom Color"
        />
      </div>
    </ExpandablePanel>
  );
}

function $findTopLevelElement(node: LexicalNode) {
  let topLevelElement =
    node.getKey() === 'root'
      ? node
      : $findMatchingParent(node, (e) => {
          const parent = e.getParent();
          return parent !== null && $isRootOrShadowRoot(parent);
        });

  if (topLevelElement === null) {
    topLevelElement = node.getTopLevelElementOrThrow();
  }
  return topLevelElement;
}

export default function ToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: Dispatch<LexicalEditor>;
  setIsLinkEditMode: Dispatch<boolean>;
}): JSX.Element {
  const [modal] = useModal();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const {toolbarState, updateToolbarState} = useToolbarState();

  const dispatchToolbarCommand = <T extends LexicalCommand<unknown>>(
    command: T,
    payload: CommandPayloadType<T> | undefined = undefined,
    skipRefocus: boolean = false,
  ) => {
    activeEditor.update(() => {
      if (skipRefocus) {
        $addUpdateTag(SKIP_DOM_SELECTION_TAG);
      }
      activeEditor.dispatchCommand(command, payload as CommandPayloadType<T>);
    });
  };

  const dispatchFormatTextCommand = (
    payload: TextFormatType,
    skipRefocus: boolean = false,
  ) => dispatchToolbarCommand(FORMAT_TEXT_COMMAND, payload, skipRefocus);

  const $handleHeadingNode = useCallback(
    (selectedElement: LexicalNode) => {
      const type = $isHeadingNode(selectedElement)
        ? selectedElement.getTag()
        : selectedElement.getType();

      if (type in blockTypeToBlockName) {
        updateToolbarState(
          'blockType',
          type as keyof typeof contextBlockTypeToBlockName,
        );
      }
    },
    [updateToolbarState],
  );

  const {
    settings: {isCodeHighlighted, isCodeShiki},
  } = useSettings();

  const $handleCodeNode = useCallback(
    (element: LexicalNode) => {
      if ($isCodeNode(element)) {
        const language = element.getLanguage();
        updateToolbarState(
          'codeLanguage',
          language || '',
        );
        const theme = element.getTheme();
        updateToolbarState('codeTheme', theme || '');
        return;
      }
    },
    [updateToolbarState, isCodeHighlighted, isCodeShiki],
  );

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState(
          'isImageCaption',
          !!rootElement?.parentElement?.classList.contains(
            'image-caption-container',
          ),
        );
      } else {
        updateToolbarState('isImageCaption', false);
      }

      const anchorNode = selection.anchor.getNode();
      const element = $findTopLevelElement(anchorNode);
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      updateToolbarState('isRTL', $isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState('isLink', isLink);

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        updateToolbarState('rootType', 'table');
      } else {
        updateToolbarState('rootType', 'root');
      }

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();

          updateToolbarState('blockType', type as keyof typeof contextBlockTypeToBlockName);
        } else {
          $handleHeadingNode(element);
          $handleCodeNode(element);
          
          // Handle quote and code block types
          if ($isQuoteNode(element)) {
            updateToolbarState('blockType', 'quote' as keyof typeof contextBlockTypeToBlockName);
          } else if ($isCodeNode(element)) {
            updateToolbarState('blockType', 'code' as keyof typeof contextBlockTypeToBlockName);
          } else {
            const elementType = element.getType();
            if (elementType === 'paragraph') {
              updateToolbarState('blockType', 'paragraph' as keyof typeof contextBlockTypeToBlockName);
            }
          }
        }
      }

      // Handle buttons
      updateToolbarState(
        'fontColor',
        $getSelectionStyleValueForProperty(selection, 'color', '#000'),
      );
      updateToolbarState(
        'bgColor',
        $getSelectionStyleValueForProperty(
          selection,
          'background-color',
          '#fff',
        ),
      );
      updateToolbarState(
        'fontFamily',
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
      );
      let matchingParent;
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
        );
      }

      // If matchingParent is a valid node, pass it's format type
      updateToolbarState(
        'elementFormat',
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left',
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      // Update text format
      updateToolbarState('isBold', selection.hasFormat('bold'));
      updateToolbarState('isItalic', selection.hasFormat('italic'));
      updateToolbarState('isUnderline', selection.hasFormat('underline'));
      updateToolbarState(
        'isStrikethrough',
        selection.hasFormat('strikethrough'),
      );
      updateToolbarState('isSubscript', selection.hasFormat('subscript'));
      updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
      updateToolbarState('isHighlight', selection.hasFormat('highlight'));
      updateToolbarState('isCode', selection.hasFormat('code'));
      updateToolbarState(
        'fontSize',
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );
      updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
      updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
      updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
    }
    if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes();
      for (const selectedNode of nodes) {
        const parentList = $getNearestNodeOfType<ListNode>(
          selectedNode,
          ListNode,
        );
        if (parentList) {
          const type = parentList.getListType();
          updateToolbarState('blockType', type as keyof typeof contextBlockTypeToBlockName);
        } else {
          const selectedElement = $findTopLevelElement(selectedNode);
          $handleHeadingNode(selectedElement);
          $handleCodeNode(selectedElement);
          // Update elementFormat for node selection (e.g., images)
          if ($isElementNode(selectedElement)) {
            updateToolbarState(
              'elementFormat',
              selectedElement.getFormatType(),
            );
          }
        }
      }
    }
  }, [
    activeEditor,
    editor,
    updateToolbarState,
    $handleHeadingNode,
    $handleCodeNode,
  ]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(
      () => {
        $updateToolbar();
      },
      {editor: activeEditor},
    );
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({editorState}) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          {editor: activeEditor},
        );
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          updateToolbarState('canUndo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          updateToolbarState('canRedo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [$updateToolbar, activeEditor, editor, updateToolbarState]);

  const insertLink = useCallback(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(
        TOGGLE_LINK_COMMAND,
        sanitizeUrl('https://'),
      );
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);

  const applyStyleText = useCallback(
    (
      styles: Record<string, string>,
      skipHistoryStack?: boolean,
      skipRefocus: boolean = false,
    ) => {
      activeEditor.update(
        () => {
          if (skipRefocus) {
            $addUpdateTag(SKIP_DOM_SELECTION_TAG);
          }
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, styles);
          }
        },
        skipHistoryStack ? {} : {},
      );
    },
    [activeEditor],
  );

  const onFontColorSelect = useCallback(
    (value: string, skipHistoryStack?: boolean, skipRefocus?: boolean) => {
      applyStyleText({color: value}, skipHistoryStack, skipRefocus);
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string, skipHistoryStack?: boolean, skipRefocus?: boolean) => {
      applyStyleText(
        {'background-color': value},
        skipHistoryStack,
        skipRefocus,
      );
    },
    [applyStyleText],
  );

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  return (
    <motion.div 
      className="w-full  relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Single Row Scrollable for All Screens */}
      <div className="  flex flex-row gap-2 items-center justify-around ">
        {/* Left Scroll Arrow */}
        <div className=" left-0  z-20 ">
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1">
            <motion.button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                !canScrollLeft
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Scroll Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex w-full rounded-lg items-center space-x-2 scrollbar-hide  z-0"
          style={{ 
            overflowX: 'auto',
            overflowY: 'visible',
            paddingLeft: '0px',
            paddingRight: '0px'
          }}
        >
          {/* Undo/Redo */}
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 flex-shrink-0">
            <motion.button
        disabled={!toolbarState.canUndo || !isEditable}
        onClick={(e) =>
                dispatchToolbarCommand(UNDO_COMMAND, undefined, isKeyboardInput(e as any))
              }
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                !toolbarState.canUndo || !isEditable
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </motion.button>

            <motion.button
        disabled={!toolbarState.canRedo || !isEditable}
        onClick={(e) =>
                dispatchToolbarCommand(REDO_COMMAND, undefined, isKeyboardInput(e as any))
              }
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                !toolbarState.canRedo || !isEditable
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Redo"
            >
              <Redo2 className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 flex-shrink-0">
            <motion.button
            disabled={!isEditable}
            onClick={(e) =>
                dispatchFormatTextCommand('bold', isKeyboardInput(e as any))
              }
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.isBold
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Bold"
            >
              <Bold className="w-5 h-5" />
            </motion.button>

            <motion.button
            disabled={!isEditable}
            onClick={(e) =>
                dispatchFormatTextCommand('italic', isKeyboardInput(e as any))
              }
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.isItalic
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Italic"
            >
              <Italic className="w-5 h-5" />
            </motion.button>

            <motion.button
            disabled={!isEditable}
            onClick={(e) =>
                dispatchFormatTextCommand('underline', isKeyboardInput(e as any))
              }
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.isUnderline
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Underline"
            >
              <Underline className="w-5 h-5" />
            </motion.button>

            <motion.button
            disabled={!isEditable}
            onClick={() => formatStrikethrough(activeEditor)}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.isStrikethrough
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Strikethrough"
            >
              <Strikethrough className="w-5 h-5" />
            </motion.button>

            <motion.button
            disabled={!isEditable}
            onClick={insertLink}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.isLink
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Link"
            >
              <Link className="w-5 h-5" />
            </motion.button>

            <motion.button
            disabled={!isEditable}
            onClick={() => formatUppercase(activeEditor)}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.isUppercase
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Uppercase"
            >
              <CaseUpper className="w-5 h-5" />
            </motion.button>

            <motion.button
            disabled={!isEditable}
            onClick={() => formatLowercase(activeEditor)}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.isLowercase
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Lowercase"
            >
              <CaseLower className="w-5 h-5" />
            </motion.button>

            <motion.button
            disabled={!isEditable}
            onClick={() => formatCapitalize(activeEditor)}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.isCapitalize
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Capitalize"
            >
              <CaseSensitive className="w-5 h-5" />
            </motion.button>

            <motion.button
            disabled={!isEditable}
            onClick={() => formatHighlight(activeEditor)}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.isHighlight
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Highlight"
            >
              <PenTool className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Headings */}
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 flex-shrink-0">
            <ExpandablePanel
              disabled={!isEditable}
              buttonClassName={`px-3 py-2 rounded-lg transition-all duration-200 text-sm h-10 ${
                toolbarState.blockType === 'paragraph' || toolbarState.blockType === 'h1' || toolbarState.blockType === 'h2' || toolbarState.blockType === 'h3'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              buttonLabel={toolbarState.blockType === 'paragraph' ? 'P' : toolbarState.blockType === 'h1' ? 'H1' : toolbarState.blockType === 'h2' ? 'H2' : toolbarState.blockType === 'h3' ? 'H3' : 'P'}
              buttonAriaLabel="Text styles"
              direction="right"
              maxWidth="200px">
              <span className="text-xs font-medium">
                {toolbarState.blockType === 'paragraph' ? 'P' : toolbarState.blockType === 'h1' ? 'H1' : toolbarState.blockType === 'h2' ? 'H2' : toolbarState.blockType === 'h3' ? 'H3' : 'P'}
              </span>
              <div className="flex items-center space-x-1">
                <motion.button
                  onClick={() => formatParagraph(activeEditor)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    toolbarState.blockType === 'paragraph'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  title="Normal">
                  P
                </motion.button>
                <motion.button
                  onClick={() => formatHeading(activeEditor, 'h1', 'h1')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    toolbarState.blockType === 'h1'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  title="Heading 1">
                  H1
                </motion.button>
                <motion.button
                  onClick={() => formatHeading(activeEditor, 'h2', 'h2')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    toolbarState.blockType === 'h2'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  title="Heading 2">
                  H2
                </motion.button>
                <motion.button
                  onClick={() => formatHeading(activeEditor, 'h3', 'h3')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    toolbarState.blockType === 'h3'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  title="Heading 3">
                  H3
                </motion.button>
              </div>
            </ExpandablePanel>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 flex-shrink-0">
            <ExpandablePanel
              disabled={!isEditable}
              buttonClassName={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.elementFormat === 'left' || toolbarState.elementFormat === 'center' || toolbarState.elementFormat === 'right' || toolbarState.elementFormat === 'justify'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              buttonLabel=""
              buttonAriaLabel="Text alignment"
              direction="right"
              maxWidth="280px">
              <div className="flex items-center">
                {toolbarState.elementFormat === 'left' && <AlignLeft className="w-5 h-5" />}
                {toolbarState.elementFormat === 'center' && <AlignCenter className="w-5 h-5" />}
                {toolbarState.elementFormat === 'right' && <AlignRight className="w-5 h-5" />}
                {toolbarState.elementFormat === 'justify' && <AlignJustify className="w-5 h-5" />}
                {!['left', 'center', 'right', 'justify'].includes(toolbarState.elementFormat) && <AlignLeft className="w-5 h-5" />}
              </div>
              <div className="flex items-center space-x-1">
                <motion.button
                  onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    toolbarState.elementFormat === 'left'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  title="Left">
                  <AlignLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    toolbarState.elementFormat === 'center'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  title="Center">
                  <AlignCenter className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    toolbarState.elementFormat === 'right'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  title="Right">
                  <AlignRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    toolbarState.elementFormat === 'justify'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  title="Justify">
                  <AlignJustify className="w-5 h-5" />
                </motion.button>
                <motion.button
                  className="p-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200"
                  onClick={() => {
                    activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  title="Outdent">
                  <Outdent className="w-5 h-5" />
                </motion.button>
                <motion.button
                  className="p-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200"
                  onClick={() => {
                    activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  title="Indent">
                  <Indent className="w-5 h-5" />
                </motion.button>
              </div>
            </ExpandablePanel>
          </div>

          {/* Lists & More */}
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 flex-shrink-0">
            <motion.button
              disabled={!isEditable}
              onClick={() => formatBulletList(activeEditor, toolbarState.blockType)}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.blockType === 'bullet'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Bullet List"
            >
              <List className="w-5 h-5" />
            </motion.button>

            <motion.button
              disabled={!isEditable}
              onClick={() => formatNumberedList(activeEditor, toolbarState.blockType)}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.blockType === 'number'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Numbered List"
            >
              <ListOrdered className="w-5 h-5" />
            </motion.button>

            <motion.button
              disabled={!isEditable}
              onClick={() => formatQuote(activeEditor, toolbarState.blockType)}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                toolbarState.blockType === 'quote'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Quote"
            >
              <ListTree className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Colors */}
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 flex-shrink-0">
            <ColorPicker
              color={toolbarState.fontColor}
              onChange={(color) => onFontColorSelect(color)}
              title="Text Color"
              icon={Palette}
            />
            <ColorPicker
              color={toolbarState.bgColor}
              onChange={(color) => onBgColorSelect(color)}
              title="Background Color"
              icon={Paintbrush}
            />
          </div>

          {/* Font Controls */}
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 flex-shrink-0">
            <FontDropDown
              disabled={!isEditable}
              style={'font-family'}
              value={toolbarState.fontFamily}
              editor={activeEditor}
            />
            <FontSize
              selectionFontSize={parseFontSizeForToolbar(toolbarState.fontSize).slice(0, -2)}
              editor={activeEditor}
              disabled={!isEditable}
            />
          </div>

          {/* Clear & More */}
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1 flex-shrink-0">
            <motion.button
              disabled={!isEditable}
              onClick={(e) => clearFormatting(activeEditor, isKeyboardInput(e as any))}
              className="p-2 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg h-10"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Clear"
            >
              <Eraser className="w-5 h-5" />
            </motion.button>

        
          </div>
        </div>
           {/* Right Scroll Arrow */}
           <div className=" right-0 z-20">
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1">
            <motion.button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`p-2 rounded-lg transition-all duration-200 h-10 ${
                !canScrollRight
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              title="Scroll Right"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {modal}
    </motion.div>
  );
}