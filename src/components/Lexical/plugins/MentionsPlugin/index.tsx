/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  MenuTextMatch,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {TextNode} from 'lexical';
import {useCallback, useEffect, useMemo, useState} from 'react';
import * as ReactDOM from 'react-dom';

import {$createMentionNode} from '../../nodes/MentionNode';
import { User } from 'lucide-react';
import { api } from '../../../../services/api';
import { motion } from 'framer-motion';
import { useTheme } from '../../../../contexts/ThemeContext';

const PUNCTUATION =
  '\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%\'"~=<>_:;';
const NAME = '\\b[A-Z][^\\s' + PUNCTUATION + ']';

const DocumentMentionsRegex = {
  NAME,
  PUNCTUATION,
};

const PUNC = DocumentMentionsRegex.PUNCTUATION;

const TRIGGERS = ['@'].join('');

// Chars we expect to see in a mention (non-space, non-punctuation).
const VALID_CHARS = '[^' + TRIGGERS + PUNC + '\\s]';

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS =
  '(?:' +
  '\\.[ |$]|' + // E.g. "r. " in "Mr. Smith"
  ' |' + // E.g. " " in "Josh Duck"
  '[' +
  PUNC +
  ']|' + // E.g. "-' in "Salier-Hellendag"
  ')';

const LENGTH_LIMIT = 75;

const AtSignMentionsRegex = new RegExp(
  '(^|\\s|\\()(' +
    '[' +
    TRIGGERS +
    ']' +
    '((?:' +
    VALID_CHARS +
    VALID_JOINS +
    '){0,' +
    LENGTH_LIMIT +
    '})' +
    ')$',
);

// 50 is the longest alias length limit.
const ALIAS_LENGTH_LIMIT = 50;

// Regex used to match alias.
const AtSignMentionsRegexAliasRegex = new RegExp(
  '(^|\\s|\\()(' +
    '[' +
    TRIGGERS +
    ']' +
    '((?:' +
    VALID_CHARS +
    '){0,' +
    ALIAS_LENGTH_LIMIT +
    '})' +
    ')$',
);

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 5;

const mentionsCache = new Map();

interface UserData {
  id: string;
  username: string;
  displayname: string;
  avatar?: {
    file?: {
      url?: string;
    };
  };
}

async function lookupUsers(query: string): Promise<Array<UserData>> {
  try {
    const response = await api.searchUserLookup(query);
    
    let users: Array<UserData> = [];
    if (Array.isArray(response)) {
      users = response;
    } else if (response && typeof response === 'object' && 'users' in response) {
      users = response.users;
    }
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

function useMentionLookupService(mentionString: string | null) {
  const [results, setResults] = useState<Array<UserData>>([]);

  useEffect(() => {
    const cachedResults = mentionsCache.get(mentionString);

    if (mentionString == null) {
      setResults([]);
      return;
    }

    if (cachedResults === null) {
      return;
    } else if (cachedResults !== undefined) {
      setResults(cachedResults);
      return;
    }

    mentionsCache.set(mentionString, null);
    lookupUsers(mentionString).then((newResults) => {
      mentionsCache.set(mentionString, newResults);
      setResults(newResults);
    });
  }, [mentionString]);

  return results;
}

function checkForAtSignMentions(
  text: string,
  minMatchLength: number,
): MenuTextMatch | null {
  let match = AtSignMentionsRegex.exec(text);

  if (match === null) {
    match = AtSignMentionsRegexAliasRegex.exec(text);
  }
  if (match !== null) {
    // The strategy ignores leading whitespace but we need to know it's
    // length to add it to the leadOffset
    const maybeLeadingWhitespace = match[1];

    const matchingString = match[3];
    if (matchingString.length >= minMatchLength) {
      return {
        leadOffset: match.index + maybeLeadingWhitespace.length,
        matchingString,
        replaceableString: match[2],
      };
    }
  }
  return null;
}

function getPossibleQueryMatch(text: string): MenuTextMatch | null {
  return checkForAtSignMentions(text, 1);
}

class MentionTypeaheadOption extends MenuOption {
  name: string;
  username: string;
  avatarUrl: string | null;
  picture: JSX.Element;

  constructor(name: string, username: string, avatarUrl: string | null, picture: JSX.Element) {
    super(name);
    this.name = name;
    this.username = username;
    this.avatarUrl = avatarUrl;
    this.picture = picture;
  }
}

function MentionsTypeaheadMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: MentionTypeaheadOption;
}) {
  const { theme } = useTheme();
  const avatarUrl = option.avatarUrl;
  const displayName = option.name;

  return (
    <motion.li
      key={option.key}
      tabIndex={-1}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all
        ${isSelected 
          ? theme === 'dark'
            ? 'bg-white/10 backdrop-blur-sm'
            : 'bg-gray-100'
          : theme === 'dark'
            ? 'hover:bg-white/5'
            : 'hover:bg-gray-50'
        }
      `}
    >
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <motion.img
            src={avatarUrl}
            alt={displayName}
            className={`w-10 h-10 rounded-full object-cover border-2 ${
              theme === 'dark' ? 'border-white/20' : 'border-gray-200'
            }`}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          />
        ) : (
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 ${
            theme === 'dark' ? 'border-white/20' : 'border-gray-200'
          }`}>
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <motion.div 
          className={`font-semibold truncate ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.1 }}
        >
          {displayName}
        </motion.div>
        <motion.div 
          className={`text-xs truncate ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.15 }}
        >
          @{option.username}
        </motion.div>
      </div>
    </motion.li>
  );
}

export default function NewMentionsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const { theme } = useTheme();

  const [queryString, setQueryString] = useState<string | null>(null);

  const results = useMentionLookupService(queryString);

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  const options = useMemo(
    () =>
      results
        .map(
          (user) => {
            const displayName = user.displayname || user.username;
            const avatarUrl = user.avatar?.file?.url || null;
            return new MentionTypeaheadOption(
              displayName,
              user.username,
              avatarUrl,
              <User className='w-5 h-5 font-semibold text-white'/>
            );
          }
        )
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results],
  );

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const mentionNode = $createMentionNode(selectedOption.name,undefined,editor._config.theme.mention);
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        mentionNode.select();
        closeMenu();
      });
    },
    [editor],
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }
      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForMentionMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        {selectedIndex, selectOptionAndCleanUp, setHighlightedIndex},
      ) =>
        anchorElementRef.current && results.length
          ? ReactDOM.createPortal(
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`typeahead-popover p-2 w-full backdrop-blur-xl rounded-xl relative mentions-menu absolute right-0 z-10 mt-2 min-w-[320px] max-w-[400px] origin-top-right shadow-2xl border ${
                  theme === 'dark'
                    ? 'bg-black/95 border-white/10'
                    : 'bg-white/95 border-gray-200'
                }`}
              >
                <ul className="space-y-1">
                  {options.map((option, i: number) => (
                    <MentionsTypeaheadMenuItem
                      index={i}
                      isSelected={selectedIndex === i}
                      onClick={() => {
                        setHighlightedIndex(i);
                        selectOptionAndCleanUp(option);
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(i);
                      }}
                      key={option.key}
                      option={option}
                    />
                  ))}
                </ul>
              </motion.div>,
              anchorElementRef.current,
            )
          : null
      }
    />
  );
}
