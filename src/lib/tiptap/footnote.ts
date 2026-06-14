// src/lib/tiptap/footnote.ts

import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const Footnote = Node.create({
  name: 'footnote',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-fn-id'),
        renderHTML: (attributes: any) => ({
          'data-fn-id': attributes.id,
        }),
      },
      content: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-fn-content'),
        renderHTML: (attributes: any) => ({
          'data-fn-content': attributes.content,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'sup[data-fn-id]' }];
  },

  renderHTML({ node, HTMLAttributes }: any) {
    return [
      'sup',
      mergeAttributes(HTMLAttributes, {
        class: 'footnote-marker',
        title: node.attrs.content,
      }),
      `(${node.attrs.id})`,
    ];
  },

  addCommands() {
    return {
      insertFootnote: (id: string, content: string) => ({ commands }: any) =>
        commands.insertContent({
          type: this.name,
          attrs: { id, content },
        }),
    } as any;
  },
});

// Footnote list node — rendered at end of chapter
export const FootnoteList = Node.create({
  name: 'footnoteList',
  group: 'block',
  content: 'footnoteItem*',

  parseHTML() {
    return [{ tag: 'div[data-footnote-list]' }];
  },

  renderHTML({ HTMLAttributes }: any) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-footnote-list': '',
        class: 'footnote-list',
      }),
      0,
    ];
  },
});

export const FootnoteItem = Node.create({
  name: 'footnoteItem',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-fn-id'),
        renderHTML: (attributes: any) => ({
          'data-fn-id': attributes.id,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'p[data-fn-id]' }];
  },

  renderHTML({ node, HTMLAttributes }: any) {
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        class: 'footnote-item',
      }),
      ['sup', { class: 'footnote-ref' }, `(${node.attrs.id}) `],
      0,
    ];
  },
});
