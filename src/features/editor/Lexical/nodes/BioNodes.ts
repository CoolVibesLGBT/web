import type { Klass, LexicalNode } from 'lexical';

import { MetadataNode } from './MetadataNode';
import { TweetNode } from './TweetNode';
import { YouTubeNode } from './YouTubeNode';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { MentionNode } from './MentionNode';
import { ImageNode } from './ImageNode';
import { HashtagNode } from '@lexical/hashtag';

const BioNodes: Array<Klass<LexicalNode>> = [
  MetadataNode,
  HashtagNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  MentionNode,
  ImageNode,
  YouTubeNode,
  TweetNode,
];

export default BioNodes;
