/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const applicationName = "coolvibes"

const hostName = window.location.hostname;
export const isDevPlayground: boolean =
  hostName !== 'coolvibes.lgbt' &&
  hostName !== 'coolvibes.io' &&
  hostName !== 'coolvibes.app';


  // REST API servisleri için URL’ler
  const domainToServiceURL: Record<string, [string, string]> = {
    'coolvibes.lgbt': ['https://api.coolvibes.lgbt', 'https://api.coolvibes.lgbt'],
    'coolvibes.io': ['https://api.coolvibes.io', 'https://api.coolvibes.io'],
    'coolvibes.app': ['https://api.coolvibes.app', 'https://api.coolvibes.app'],
  };
  
  // Socket servisleri için URL’ler
  const domainToSocketURL: Record<string, [string, string]> = {
    'coolvibes.lgbt': ['wss://socket.coolvibes.lgbt', 'wss://socket2.coolvibes.lgbt'],
    'coolvibes.io': ['wss://socket.coolvibes.io', 'wss://socket2.coolvibes.io'],
    'coolvibes.app': ['wss://socket.coolvibes.app', 'wss://socket2.coolvibes.app'],
  };
  
  // Varsayılan development ortamı (localhost)
  const defaultServiceURL: [string, string] = ['http://localhost:3001', 'http://localhost:3002'];
  const defaultSocketURL: [string, string] = ['ws://localhost:3002', 'ws://localhost:3002'];
  
  // Export edilen URL’ler
  export const serviceURL = domainToServiceURL[hostName] || defaultServiceURL;
  export const socketURL = domainToSocketURL[hostName] || defaultSocketURL;
  
  

export const DEFAULT_SETTINGS = {
  disableBeforeInput: false,
  emptyEditor: isDevPlayground,
  hasLinkAttributes: false,
  isAutocomplete: false,
  isCharLimit: false,
  isCharLimitUtf8: false,
  isCodeHighlighted: true,
  isCodeShiki: false,
  isCollab: false,
  isMaxLength: false,
  isRichText: true,
  listStrictIndent: false,
  measureTypingPerf: false,
  selectionAlwaysOnDisplay: false,
  shouldAllowHighlightingWithBrackets: false,
  shouldPreserveNewLinesInMarkdown: false,
  shouldUseLexicalContextMenu: false,
  showNestedEditorTreeView: false,
  showTableOfContents: false,
  showTreeView: true,
  tableCellBackgroundColor: true,
  tableCellMerge: true,
  tableHorizontalScroll: true,
  useCollabV2: false,
} as const;

// These are mutated in setupEnv
export const INITIAL_SETTINGS: Record<SettingName, boolean> = {
  ...DEFAULT_SETTINGS,
};

export type SettingName = keyof typeof DEFAULT_SETTINGS;

export type Settings = typeof INITIAL_SETTINGS; 