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


      const urlMatch = text.match(URL_REGEX);
      if (urlMatch) {
        const url = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;

 
    (async () => {
      try {
        const res = await api.fetchMetadata(encodeURIComponent(url));
        if (!res) return;

        const og = res.og ?? res.twitter;
        if (!og) return;

        editor.update(() => {
          // node hâlâ document içinde mi kontrol et
          if (!textNode.isAttached()) return;

          const ogNode = $createMetadataNode({
            title: og.title,
            description: og.description,
            image: og.image,
            url: og.url,
            siteName: og.site_name,
          });

          textNode.replace(ogNode);
        });
      } catch (err) {
        console.error("OG fetch failed", err);
      }
    })();

      }

    });
  }, [editor]);

  return <AutoLinkPlugin matchers={MATCHERS} />;
}
