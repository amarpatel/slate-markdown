import React from 'react'
import { State } from 'slate'

const REGEX = {
    CODEBLOCK: /^`{2,}/,
};

export function MarkdownPrefixPlugin(options) {
    return {
        types: [
            'list-item',
            'block-quote',
            'heading-one',
            'heading-two',
            'heading-three',
            'heading-four',
            'heading-five',
            'heading-six',
            'code-block',
        ],

        /**
         * Get the block type for a series of auto-markdown shortcut `chars`.
         *
         * @param {String} chars
         * @return {String} block
         */

        getType(chars) {
            if (chars.match(REGEX.CODEBLOCK)) {
                return 'code-block';
            }

            switch (chars) {
                case '+': return 'list-item'
                case '>': return 'block-quote'
                case '#': return 'heading-one'
                case '##': return 'heading-two'
                case '###': return 'heading-three'
                case '####': return 'heading-four'
                case '#####': return 'heading-five'
                case '######': return 'heading-six'
                default: return null
            }
        },

        /**
         * On key down, check for our specific key shortcuts.
         *
         * @param {Event} e
         * @param {Data} data
         * @param {Change} change
         */

        onKeyDown(e, data, change) {
            switch (data.key) {
                case 'space': return this.onSpace(e, change)
                case 'backspace': return this.onBackspace(e, change)
                case 'enter': return this.onEnter(e, change)
            }
        },

        /**
         * On space, if it was after an auto-markdown shortcut, convert the current
         * node into the shortcut's corresponding type.
         *
         * @param {Event} e
         * @param {State} change
         * @return {State or Null} state
         */

        onSpace(e, change) {
            const { state } = change
            if (state.isExpanded) return

            const { startBlock, startOffset } = state
            const chars = startBlock.text.slice(0, startOffset).replace(/\s*/g, '')
            const type = this.getType(chars)

            console.log('startBlock.type: ', startBlock.type);
            console.log('type: ', type);

            if (!type) return
            if (startBlock.type === 'code-block') return;
            if (type == 'list-item' && startBlock.type == 'list-item') return

            if (this.types.includes(type) === false) return;

            e.preventDefault()

            change.setBlock(type)

            if (type == 'list-item') {
                change.wrapBlock('bulleted-list')
            }

            change
                .extendToStartOf(startBlock)
                .delete()

            return true
        },

        /**
         * On backspace, if at the start of a non-paragraph, convert it back into a
         * paragraph node.
         *
         * @param {Event} e
         * @param {State} change
         * @return {State or Null} state
         */

        onBackspace(e, change) {
            const { state } = change
            if (state.isExpanded) return
            if (state.startOffset != 0) return

            const { startBlock } = state

            if (this.types.includes(startBlock.type) === false) return;

            e.preventDefault()
            change.setBlock('paragraph')

            if (startBlock.type == 'list-item') {
                change.unwrapBlock('bulleted-list')
            }

            return true
        },

        /**
         * On return, if at the end of a node type that should not be extended,
         * create a new paragraph below it.
         *
         * @param {Event} e
         * @param {State} change
         * @return {State or Null} state
         */

        onEnter(e, change) {
            const { state } = change
            if (state.isExpanded) return

            const { startBlock, startOffset, endOffset } = state
            if (startOffset == 0 && startBlock.text.length == 0) return this.onBackspace(e, change)
            if (endOffset != startBlock.text.length) return


            const chars = startBlock.text.slice(0, startOffset).replace(/\s*/g, '')
            const type = this.getType(chars)
            if (type === 'code-block') {
                e.preventDefault()
                change
                    .setBlock(type)
                    .extendToStartOf(startBlock)
                    .delete();
                return true;
            }

            if (this.types.includes(startBlock.type) && startBlock.type === 'list-item') {
                e.preventDefault()
                change
                    .splitBlock()
                    .setBlock('paragraph')
                return true
            }
        }
    };
}

export const markdownPrefixNodes = {
    'block-quote': props => <blockquote>{props.children}</blockquote>,
    'bulleted-list': props => <ul>{props.children}</ul>,
    'heading-one': props => <h1>{props.children}</h1>,
    'heading-two': props => <h2>{props.children}</h2>,
    'heading-three': props => <h3>{props.children}</h3>,
    'heading-four': props => <h4>{props.children}</h4>,
    'heading-five': props => <h5>{props.children}</h5>,
    'heading-six': props => <h6>{props.children}</h6>,
    'list-item': props => <li>{props.children}</li>,
    'code-block': props => <pre>{props.children}</pre>
};