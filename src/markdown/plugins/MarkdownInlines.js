import React from 'react'
import { State } from 'slate'
import _ from 'lodash';

const REGEX = {
    LINK: /\[(.*?)(\]\()([A-Za-z0-9\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]+)\)/,
    CODE: /([`])(?:(?=(\\?))\2.)+?\1/,
    BOLD: /([*])(?:(?=(\\?))\2.)+?\1/,
    CONSECUTIVE: {
        TILDE: /`{2,}/,
    }
};

function wrapLink(change, { text, href }) {
    change.wrapInline({
        type: 'link',
        data: { text, href }
    });

    change.collapseToEnd()
}
function wrapCode(change, { text }) {
    change.wrapInline({
        type: 'code',
        data: { text }
    });

    change.collapseToEnd()
}
function wrapBold(change, { text }) {
    change.wrapInline({
        type: 'bold',
        data: { text }
    });

    change.collapseToEnd()
}

export function MarkdownInlinesPlugin(options) {
    return {
        types: [
            'link',
            'code',
        ],

        /**
         * Get the block type for a series of auto-markdown shortcut `chars`.
         *
         * @param {String} chars
         * @return {String} block
         */

        getType(chars) {
            if (chars.match(REGEX.LINK)) {
                return 'link';
            }

            if (chars.match(REGEX.CODE) && !chars.match(REGEX.CONSECUTIVE.TILDE)) {
                return 'code';
            }

            if (chars.match(REGEX.CODEBLOCK)) {
                return 'codeblock';
            }
            return null;
        },

        getLinkData(chars) {
            const [match, text, , href] = chars.match(REGEX.LINK);
            return { text, href, match };
        },

        getCodeData(chars) {
            const [match] = chars.match(REGEX.CODE);
            const [, text] = match.split('`');
            return { match, text };
        },

        onKeyUp(e, data, change) {
            switch (data.key) {
                case 'space': return
                case 'backspace': return
                case 'enter': return
                default: return this.onDefault(e, change)
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

                case '`': return this.doCodeConversion(e, change)
                case '*': return this.doCodeConversion(e, change)

                default: return this.onDefault(e, change)
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
            this.doLinkConversion(e, change, (changeAfter) => {
                changeAfter.insertText(' ');
                return true;
            });
            this.doBoldConversion(e, change, (changeAfter) => {
                changeAfter.insertText(' ');
                return true;
            });
        },

        onDefault(e, change) {
            // this.doLinkConversion(e, change, () => {
            //     return true;
            // });
        },

        doBoldConversion(e, change, next = _.identity) {
            const { state } = change
            if (state.isExpanded) return
            const { startBlock, startOffset } = state
            const chars = startBlock.text
            const withClosingTag = chars + '*';
            const type = this.getType(withClosingTag)

            if (startBlock.type === 'code-block' || startBlock.type === 'code-container') return;
            if (type === 'bold') {
                e.preventDefault()

                const { match, text } = this.getCodeData(withClosingTag);

                change
                    .deleteBackward(match.length - 1) // delete the ** text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapBold, { text })         // wrap the selection in an `a` tag with href
                    .setBlock('bold-container');
                return next(change);
            }
        },

        doLinkConversion(e, change, next = _.identity) {
            const { state } = change
            if (state.isExpanded) return

            const { startBlock, startOffset } = state
            const chars = startBlock.text
            const type = this.getType(chars);

            if (startBlock.type === 'code-block' || startBlock.type === 'code-container') return;

            if (type !== 'link') return
            e.preventDefault()

            const { text, href, match } = this.getLinkData(chars);

            change
                .deleteBackward(match.length) // delete the []() text
                .insertText(text)             // add just the url text
                .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                .call(wrapLink, { text, href })         // wrap the selection in an `a` tag with href
                .setBlock('link-container');
            next(change);
        },

        doCodeConversion(e, change, next = _.identity) {
            const { state } = change
            if (state.isExpanded) return
            const { startBlock, startOffset } = state
            const chars = startBlock.text
            const withClosingTag = chars + '`';
            const type = this.getType(withClosingTag)

            if (startBlock.type === 'code-block') return;
            if (type === 'code') {
                e.preventDefault()

                const { match, text } = this.getCodeData(withClosingTag);

                change
                    .deleteBackward(match.length - 1) // delete the `` text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapCode, { text })         // wrap the selection in an `a` tag with href
                    .setBlock('code-container');
                return next(change);
            }
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

            const { startBlock, endBlock, startOffset, endOffset } = state

            console.log('bs startBlock: ', startBlock);
            console.log('bs startOffset: ', startOffset);
            console.log('bs endOffset: ', endOffset);

            if (endBlock.type === 'link-container') {
                const link = this.getLink(endBlock);
                if (!link) return;
                const text = link.get('text');
                const href = link.get('href');
                const visibleText = `[${text}](${href})`;

                e.preventDefault();
                change
                    .setBlock('text')
                    .deleteBackward(text.length)
                    .insertText(visibleText);
                return true;
            }

            if (endBlock.type === 'code-container') {
                const code = this.getCode(endBlock);
                if (!code) return;
                const text = code.get('text');
                const visibleText = `\`${text}`;

                e.preventDefault();
                change
                    .setBlock('text')
                    .deleteBackward(text.length)
                    .insertText(visibleText);
                return true;
            }
        },

        getLink(block) {
            const inlines = block.getInlines().find(({type}) => type === 'link');
            if (inlines) {
                return inlines.first();
            }
        },

        getCode(block) {
            const inlines = block.getInlines().find(({type}) => type === 'code');
            if (inlines) {
                return inlines.first();
            }
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
            this.doLinkConversion(e, change, (changeAfter) => {
                changeAfter
                    .splitBlock()
                    .setBlock('paragraph');
                return true;
            });
        }
    };
}

export const markdownInlineNodes = {
    link(props) {
        const { data } = props.node;
        const href = data.get('href');
        return (<a {...props.attributes} href={href}>{props.children}</a>);
    },
    'link-container': props => <span style={{ display: 'inline' }}>{props.children}</span>,
    code(props) {
        const { data } = props.node;
        const text = data.get('text');
        return (<pre {...props.attributes} style={{ display: 'inline' }} href={text}>{props.children}</pre>);
    },
    'code-container': props => <span style={{ display: 'inline' }}>{props.children}</span>,
    bold(props) {
        const { data } = props.node;
        const text = data.get('text');
        return (<strong {...props.attributes} style={{ display: 'inline' }} href={text}>{props.children}</strong>);
    },
    'bold-container': props => <span style={{ display: 'inline' }}>{props.children}</span>,
};