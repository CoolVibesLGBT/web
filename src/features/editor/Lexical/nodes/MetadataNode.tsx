import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  NodeKey,
  Spread,
} from 'lexical';

import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';

import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

export type OGNodePayload = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
  oembed?: OEmbedPayload;
};

export type OEmbedPayload = {
  version?: string;
  type: 'photo' | 'video' | 'link' | 'rich';
  title?: string;
  authorName?: string;
  authorURL?: string;
  providerName?: string;
  providerURL?: string;
  thumbnailURL?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  url?: string;
  html?: string;
  width?: number;
  height?: number;
};

export type SerializedOGNode = Spread<
  {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    siteName?: string;
    oembed?: OEmbedPayload;
  },
  SerializedDecoratorBlockNode
>;

const MAX_OEMBED_HTML_LENGTH = 256 * 1024;

const getSafeHTTPURL = (value?: string): string => {
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.username || parsed.password) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

const getOEmbedAspectRatio = (oembed: OEmbedPayload): string => {
  const width = Number(oembed.width);
  const height = Number(oembed.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return '16 / 9';
  }
  const ratio = Math.min(Math.max(width / height, 0.5), 2.4);
  return `${ratio}`;
};

const buildSandboxedOEmbedDocument = (providerHTML: string): string => {
  const html = providerHTML.slice(0, MAX_OEMBED_HTML_LENGTH);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; img-src https: data: blob:; media-src https: blob:; frame-src https:; script-src https: 'unsafe-inline'; style-src https: 'unsafe-inline'; font-src https: data:; connect-src https:; form-action https:; upgrade-insecure-requests">
    <base target="_blank">
    <style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:transparent}body{display:flex;align-items:center;justify-content:center}iframe,video,img,object,embed{max-width:100%;max-height:100%}</style>
  </head>
  <body>${html}</body>
</html>`;
};

const OEmbedPreview = ({
  title,
  description,
  image,
  url,
  siteName,
  oembed,
}: OGNodePayload): JSX.Element => {
  const { t } = useTranslation('common');
  const targetURL = getSafeHTTPURL(url);
  const providerName = oembed?.providerName || siteName;
  const displayTitle = oembed?.title || title || targetURL;
  const displayImage = getSafeHTTPURL(
    oembed?.type === 'photo' ? oembed.url : oembed?.thumbnailURL || image,
  );
  const hasRichEmbed = Boolean(
    oembed
      && (oembed.type === 'video' || oembed.type === 'rich')
      && oembed.html
      && oembed.html.length <= MAX_OEMBED_HTML_LENGTH,
  );

  if (oembed && hasRichEmbed) {
    return (
      <div
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950"
        data-oembed-type={oembed.type}
      >
        <iframe
          srcDoc={buildSandboxedOEmbedDocument(oembed.html || '')}
          title={displayTitle || `${providerName || 'oEmbed'} ${t('post_embed.content')}`}
          className="block min-h-[220px] w-full border-0 bg-black/5 dark:bg-black"
          style={{ aspectRatio: getOEmbedAspectRatio(oembed) }}
          sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
          allow="encrypted-media; fullscreen; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="flex min-w-0 items-center justify-between gap-3 border-t border-slate-200/80 px-3.5 py-2.5 dark:border-white/10">
          <div className="min-w-0">
            {providerName && (
              <div className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-zinc-500">
                {providerName}
              </div>
            )}
            {displayTitle && (
              <div className="truncate text-sm font-semibold text-slate-800 dark:text-zinc-100">
                {displayTitle}
              </div>
            )}
          </div>
          {targetURL && (
            <a
              href={targetURL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 no-underline transition hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              {t('post_embed.open')} ↗
            </a>
          )}
        </div>
      </div>
    );
  }

  const cardContent = (
    <>
      {displayImage && (
        <img
          src={displayImage}
          alt={oembed?.title || title || ''}
          className={`w-full bg-slate-100 dark:bg-zinc-900 ${oembed?.type === 'photo'
            ? 'max-h-[38rem] object-contain'
            : 'max-h-72 object-cover'
            }`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}

      <span className="flex min-w-0 flex-col gap-1 p-3.5">
        {(providerName || oembed?.authorName) && (
          <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-zinc-500">
            {[providerName, oembed?.authorName].filter(Boolean).join(' · ')}
          </span>
        )}
        {displayTitle && (
          <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            {displayTitle}
          </span>
        )}
        {description && (
          <span className="line-clamp-3 text-sm text-slate-600 dark:text-zinc-300">
            {description}
          </span>
        )}
      </span>
    </>
  );

  const cardClassName = "block overflow-hidden rounded-2xl border border-slate-200/80 bg-white no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-950";

  return targetURL ? (
    <a
      href={targetURL}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClassName}
      data-oembed-type={oembed?.type || 'link'}
    >
      {cardContent}
    </a>
  ) : (
    <span className={cardClassName} data-oembed-type={oembed?.type || 'link'}>
      {cardContent}
    </span>
  );
};

export class MetadataNode extends DecoratorBlockNode {
  __title: string;
  __description: string;
  __image: string;
  __url: string;
  __siteName: string;
  __oembed: OEmbedPayload | null;

  static getType(): string {
    return 'og';
  }

  static clone(node: MetadataNode): MetadataNode {
    return new MetadataNode(
      {
        title: node.__title,
        description: node.__description,
        image: node.__image,
        url: node.__url,
        siteName: node.__siteName,
        oembed: node.__oembed ? { ...node.__oembed } : undefined,
      },
      node.__format,
      node.__key,
    );
  }

  constructor(
    payload: OGNodePayload,
    format?: ElementFormatType,
    key?: NodeKey,
  ) {
    super(format, key);

    this.__title = payload.title || '';
    this.__description = payload.description || '';
    this.__image = payload.image || '';
    this.__url = payload.url || '';
    this.__siteName = payload.siteName || '';
    this.__oembed = payload.oembed ? { ...payload.oembed } : null;
  }

  exportJSON(): SerializedOGNode {
    return {
      ...super.exportJSON(),
      title: this.__title,
      description: this.__description,
      image: this.__image,
      url: this.__url,
      siteName: this.__siteName,
      oembed: this.__oembed ? { ...this.__oembed } : undefined,
    };
  }

  static importJSON(serializedNode: SerializedOGNode): MetadataNode {
    return $createMetadataNode({
      title: serializedNode.title,
      description: serializedNode.description,
      image: serializedNode.image,
      url: serializedNode.url,
      siteName: serializedNode.siteName,
      oembed: serializedNode.oembed,
    }).updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement): DOMConversionOutput | null => {
        if (!(domNode instanceof HTMLElement)) {
          return null;
        }
        const url = domNode.getAttribute('data-lexical-og-url');
        if (!url) return null;
        const payload: OGNodePayload = {
          url,
          title: domNode.getAttribute('data-lexical-og-title') || undefined,
          description:
            domNode.getAttribute('data-lexical-og-description') || undefined,
          image: domNode.getAttribute('data-lexical-og-image') || undefined,
          siteName: domNode.getAttribute('data-lexical-og-site') || undefined,
        };
        const serializedOEmbed = domNode.getAttribute('data-lexical-oembed');
        if (serializedOEmbed) {
          try {
            const oembed = JSON.parse(serializedOEmbed) as OEmbedPayload;
            if (oembed && typeof oembed === 'object' && typeof oembed.type === 'string') {
              payload.oembed = oembed;
            }
          } catch {
            // Invalid DOM payload falls back to the regular link preview.
          }
        }
        return { node: $createMetadataNode(payload) };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-og-url', this.__url);
    if (this.__title) {
      element.setAttribute('data-lexical-og-title', this.__title);
    }
    if (this.__description) {
      element.setAttribute('data-lexical-og-description', this.__description);
    }
    if (this.__image) {
      element.setAttribute('data-lexical-og-image', this.__image);
    }
    if (this.__siteName) {
      element.setAttribute('data-lexical-og-site', this.__siteName);
    }
    if (this.__oembed) {
      element.setAttribute('data-lexical-oembed', JSON.stringify(this.__oembed));
    }
    return { element };
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};

    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };

    return (
      <BlockWithAlignableContents
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
      >
        <OEmbedPreview
          title={this.__title}
          description={this.__description}
          image={this.__image}
          url={this.__url}
          siteName={this.__siteName}
          oembed={this.__oembed || undefined}
        />
      </BlockWithAlignableContents>
    );
  }
}

export function $createMetadataNode(
  payload: OGNodePayload,
): MetadataNode {
  return new MetadataNode(payload);
}

export function $isMetadataNode(
  node: unknown,
): node is MetadataNode {
  return node instanceof MetadataNode;
}
