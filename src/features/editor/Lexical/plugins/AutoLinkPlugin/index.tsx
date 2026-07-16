import type { JSX } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from '@lexical/react/LexicalAutoLinkPlugin';
import { $createYouTubeNode } from '../../nodes/YouTubeNode';
import { useEffect } from 'react';
import { TextNode } from 'lexical';
import { $createTweetNode } from '../../nodes/TweetNode';
import { $createMetadataNode } from '../../nodes/MetadataNode';
import { api } from '../../../../../services/api';

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/;

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

// YouTube regex
const YOUTUBE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const TWITTER_REGEX =
  /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;

const MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text.startsWith('http') ? text : `https://${text}`;
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`;
  }),
];

const pendingMetadataNodeKeys = new Set<string>();

export default function LexicalAutoLinkPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // YouTube otomatik embed
    return editor.registerNodeTransform(TextNode, (textNode) => {
      const text = textNode.getTextContent();


      const ytMatch = text.match(YOUTUBE_REGEX);
      if (ytMatch && ytMatch.length > 1) {
        const videoId = ytMatch[1];
        editor.update(() => {
          const youTubeNode = $createYouTubeNode(videoId);
          textNode.replace(youTubeNode);
        });
        return;
      }

      // Twitter embed
      const twMatch = text.match(TWITTER_REGEX);
      if (twMatch && twMatch.length > 1) {
        const tweetID = twMatch[1]; // sadece ID alıyoruz
        editor.update(() => {
          const tweetNode = $createTweetNode(tweetID);
          textNode.replace(tweetNode);
        });
        return;
      }


      const trimmedText = text.trim();
      const urlMatch = trimmedText.match(URL_REGEX);
      if (urlMatch && urlMatch.index === 0 && urlMatch[0].length === trimmedText.length) {
        const url = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
        const nodeKey = textNode.getKey();
        if (pendingMetadataNodeKeys.has(nodeKey)) return;
        pendingMetadataNodeKeys.add(nodeKey);

        (async () => {
          try {
            const res = await api.fetchMetadata(url);
            if (!res) return;

            const metadata = res.og ?? res.twitter;
            const oembed = res.oembed;
            if (!metadata && !oembed) return;

            editor.update(() => {
              // The async response may arrive after this text node was edited.
              if (!textNode.isAttached() || textNode.getTextContent().trim() !== trimmedText) return;

              const ogNode = $createMetadataNode({
                title: oembed?.title || metadata?.title,
                description: metadata?.description,
                image: (oembed?.type === 'photo' ? oembed.url : oembed?.thumbnail_url) || metadata?.image,
                url: metadata?.url || url,
                siteName: oembed?.provider_name || metadata?.site_name,
                oembed: oembed ? {
                  version: oembed.version,
                  type: oembed.type,
                  title: oembed.title,
                  authorName: oembed.author_name,
                  authorURL: oembed.author_url,
                  providerName: oembed.provider_name,
                  providerURL: oembed.provider_url,
                  thumbnailURL: oembed.thumbnail_url,
                  thumbnailWidth: oembed.thumbnail_width,
                  thumbnailHeight: oembed.thumbnail_height,
                  url: oembed.url,
                  html: oembed.html,
                  width: oembed.width,
                  height: oembed.height,
                } : undefined,
              });

              textNode.replace(ogNode);
            });
          } catch (err) {
            console.error("Link metadata/oEmbed fetch failed", err);
          } finally {
            pendingMetadataNodeKeys.delete(nodeKey);
          }
        })();
      }

    });
  }, [editor]);

  return <AutoLinkPlugin matchers={MATCHERS} />;
}
