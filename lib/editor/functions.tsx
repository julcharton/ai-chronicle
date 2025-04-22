'use client';

import {
  defaultMarkdownSerializer,
  defaultMarkdownParser,
} from 'prosemirror-markdown';
import { DOMParser, Node as ProsemirrorNode } from 'prosemirror-model';
import type { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import {
  Decoration as DecorationImpl,
  DecorationSet as DecorationSetImpl,
} from 'prosemirror-view';
import { renderToString } from 'react-dom/server';

import { Markdown } from '@/components/markdown';

import { documentSchema } from './config';
import { createSuggestionWidget, type UISuggestion } from './suggestions';

// Enhanced version that uses both DOM-based parsing and direct markdown parsing
export const buildDocumentFromContent = (content: string) => {
  try {
    // First try to parse it directly as markdown for better fidelity
    const parsedMarkdown = defaultMarkdownParser.parse(content);
    if (parsedMarkdown) {
      return parsedMarkdown;
    }
  } catch (e) {
    // Fallback to DOM-based parsing if markdown parsing fails
    console.warn(
      'Direct markdown parsing failed, falling back to DOM parser',
      e,
    );
  }

  // Original DOM-based approach as fallback
  const parser = DOMParser.fromSchema(documentSchema);
  const stringFromMarkdown = renderToString(<Markdown>{content}</Markdown>);
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = stringFromMarkdown;
  return parser.parse(tempContainer);
};

// Enhanced to ensure proper markdown serialization
export const buildContentFromDocument = (document: ProsemirrorNode) => {
  try {
    // Use the default markdown serializer
    return defaultMarkdownSerializer.serialize(document);
  } catch (error) {
    console.error('Error serializing document to markdown:', error);
    // Fallback to a simple text extraction if serialization fails
    let text = '';
    document.descendants((node) => {
      if (node.isText) {
        text += `${node.text} `;
      }
      return true;
    });
    return text.trim();
  }
};

export const createDecorations = (
  suggestions: Array<UISuggestion>,
  view: EditorView,
) => {
  const decorations: Array<DecorationImpl> = [];

  for (const suggestion of suggestions) {
    decorations.push(
      DecorationImpl.inline(
        suggestion.selectionStart,
        suggestion.selectionEnd,
        {
          class: 'suggestion-highlight',
        },
        {
          suggestionId: suggestion.id,
          type: 'highlight',
        },
      ),
    );

    decorations.push(
      DecorationImpl.widget(
        suggestion.selectionStart,
        (view) => {
          const { dom } = createSuggestionWidget(suggestion, view);
          return dom;
        },
        {
          suggestionId: suggestion.id,
          type: 'widget',
        },
      ),
    );
  }

  return DecorationSetImpl.create(view.state.doc, decorations);
};

// Helper function to convert HTML to Markdown
export const htmlToMarkdown = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // DOM node types
  const TEXT_NODE = 3;
  const ELEMENT_NODE = 1;

  // Extract text content with basic formatting
  const extractMarkdown = (element: Element): string => {
    let result = '';

    // Process child nodes
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === TEXT_NODE) {
        result += node.textContent;
      } else if (node.nodeType === ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        switch (tagName) {
          case 'h1':
            result += `# ${extractMarkdown(el)}\n\n`;
            break;
          case 'h2':
            result += `## ${extractMarkdown(el)}\n\n`;
            break;
          case 'h3':
            result += `### ${extractMarkdown(el)}\n\n`;
            break;
          case 'h4':
            result += `#### ${extractMarkdown(el)}\n\n`;
            break;
          case 'h5':
            result += `##### ${extractMarkdown(el)}\n\n`;
            break;
          case 'h6':
            result += `###### ${extractMarkdown(el)}\n\n`;
            break;
          case 'p':
            result += `${extractMarkdown(el)}\n\n`;
            break;
          case 'strong':
          case 'b':
            result += `**${extractMarkdown(el)}**`;
            break;
          case 'em':
          case 'i':
            result += `*${extractMarkdown(el)}*`;
            break;
          case 'code':
            result += `\`${extractMarkdown(el)}\``;
            break;
          case 'pre':
            result += `\`\`\`\n${extractMarkdown(el)}\n\`\`\`\n\n`;
            break;
          case 'a': {
            const href = el.getAttribute('href');
            result += `[${extractMarkdown(el)}](${href})`;
            break;
          }
          case 'img': {
            const src = el.getAttribute('src');
            const alt = el.getAttribute('alt') || '';
            result += `![${alt}](${src})`;
            break;
          }
          case 'ul': {
            for (const li of Array.from(el.querySelectorAll('li'))) {
              result += `- ${extractMarkdown(li)}\n`;
            }
            result += '\n';
            break;
          }
          case 'ol': {
            let index = 1;
            for (const li of Array.from(el.querySelectorAll('li'))) {
              result += `${index}. ${extractMarkdown(li)}\n`;
              index++;
            }
            result += '\n';
            break;
          }
          default:
            result += extractMarkdown(el);
        }
      }
    }

    return result;
  };

  return extractMarkdown(tempDiv);
};
