import { Node, mergeAttributes } from '@tiptap/core';

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,
  selectable: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-callout-type'),
        renderHTML: (attributes: any) => ({
          'data-callout-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }];
  },

  renderHTML({ node, HTMLAttributes }: any) {
    return ['div', mergeAttributes(HTMLAttributes, {
      class: `callout callout-${node.attrs.type}`,
    }), 0];
  },

  addCommands() {
    return {
      setCallout: (type: string) => ({ commands }: any) =>
        commands.setNode(this.name, { type }),
      toggleCallout: (type: string) => ({ commands }: any) =>
        commands.toggleNode(this.name, 'paragraph', { type }),
    } as any;
  },
});
