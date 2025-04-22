import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import type { Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { MutableRefObject } from 'react';

import { buildContentFromDocument } from './functions';

// Enhanced schema with additional markdown-specific nodes and marks
export const documentSchema = new Schema({
  nodes: addListNodes(
    schema.spec.nodes
      .update('code_block', {
        content: 'text*',
        group: 'block',
        marks: '',
        defining: true,
        parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
        toDOM() {
          return ['pre', ['code', 0]];
        },
      })
      .update('image', {
        inline: true,
        attrs: {
          src: {},
          alt: { default: null },
          title: { default: null },
        },
        group: 'inline',
        draggable: true,
        parseDOM: [
          {
            tag: 'img[src]',
            getAttrs(dom: HTMLElement) {
              return {
                src: dom.getAttribute('src'),
                alt: dom.getAttribute('alt'),
                title: dom.getAttribute('title'),
              };
            },
          },
        ],
        toDOM(node) {
          const { src, alt, title } = node.attrs;
          return ['img', { src, alt, title }];
        },
      }),
    'paragraph block*',
    'block',
  ),
  marks: schema.spec.marks
    .update('link', {
      attrs: {
        href: {},
        title: { default: null },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs(dom: HTMLElement) {
            return {
              href: dom.getAttribute('href'),
              title: dom.getAttribute('title'),
            };
          },
        },
      ],
      toDOM(node) {
        const { href, title } = node.attrs;
        return [
          'a',
          { href, title, rel: 'noopener noreferrer', target: '_blank' },
          0,
        ];
      },
    })
    .update('code', {
      parseDOM: [{ tag: 'code' }],
      toDOM() {
        return ['code', 0];
      },
    }),
});

// Heading rule for markdown-style headings (e.g., # Heading)
export function headingRule(level: number) {
  return textblockTypeInputRule(
    new RegExp(`^(#{1,${level}})\\s$`),
    documentSchema.nodes.heading,
    () => ({ level }),
  );
}

// Bold rule for markdown-style bold text (e.g., **bold**)
export const boldRule = textblockTypeInputRule(
  /\*\*([^*]+)\*\*/,
  documentSchema.marks.strong,
  (match) => ({ content: match[1] }),
);

// Italic rule for markdown-style italic text (e.g., *italic*)
export const italicRule = textblockTypeInputRule(
  /\*([^*]+)\*/,
  documentSchema.marks.em,
  (match) => ({ content: match[1] }),
);

// Code rule for markdown-style inline code (e.g., `code`)
export const codeRule = textblockTypeInputRule(
  /`([^`]+)`/,
  documentSchema.marks.code,
  (match) => ({ content: match[1] }),
);

export const handleTransaction = ({
  transaction,
  editorRef,
  onSaveContent,
}: {
  transaction: Transaction;
  editorRef: MutableRefObject<EditorView | null>;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
}) => {
  if (!editorRef || !editorRef.current) return;

  const newState = editorRef.current.state.apply(transaction);
  editorRef.current.updateState(newState);

  if (transaction.docChanged && !transaction.getMeta('no-save')) {
    const updatedContent = buildContentFromDocument(newState.doc);

    if (transaction.getMeta('no-debounce')) {
      onSaveContent(updatedContent, false);
    } else {
      onSaveContent(updatedContent, true);
    }
  }
};
