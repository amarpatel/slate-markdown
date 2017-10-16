import React from 'react'
import { State } from 'slate'
import _ from 'lodash';

const REGEX = {
    LINK: /\[(.*?)(\]\()([A-Za-z0-9\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]+)\)/,
    CODE: /([`])(?:(?=(\\?))\2.)+?\1/,
    BOLD: /([*])(?:(?=(\\?))\2.)+?\1/,
    STRIKE: /([~])(?:(?=(\\?))\2.)+?\1/,
    UNDERLINE: /([_])(?:(?=(\\?))\2.)+?\1/,
    CONSECUTIVE: {
        BACKTICK: /`{2,}/,
        ASTERISK: /\*{2,}/,
        TILDE: /\~{2,}/,
        _: /\_{2,}/,
    }
};

function wrapInlineWithData(change, type, data) {
    change.wrapInline({ type, data });
    change.collapseToEnd();
}

export function MarkdownInlinesPlugin(options) {
    return {
        types: [
            'link',
            'code',
            'bold',
            'strike',
            'underline',
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

            if (chars.match(REGEX.CODE) && !chars.match(REGEX.CONSECUTIVE.BACKTICK)) {
                return 'code';
            }

            if (chars.match(REGEX.BOLD) && !chars.match(REGEX.CONSECUTIVE.ASTERISK)) {
                return 'bold';
            }

            if (chars.match(REGEX.STRIKE) && !chars.match(REGEX.CONSECUTIVE.TILDE)) {
                return 'strike';
            }

            if (chars.match(REGEX.UNDERLINE) && !chars.match(REGEX.CONSECUTIVE._)) {
                return 'underline';
            }

            return null;
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
                case 'space': {
                    return this.onSpace(e, change)
                }
                case 'backspace': {
                    return this.onBackspace(e, change)
                }
                case 'enter': {
                    return this.onEnter(e, change)
                }
                case '`': {
                    if (data.isShift) {
                        return this.doStrikeConversion(e, change)
                    }
                    return this.doCodeConversion(e, change)
                }
                case '-': {
                    if (data.isShift) {
                        return this.doUnderlineConversion(e, change)
                    }
                }
                case '8': {
                    if (data.isShift) {
                        return this.doBoldConversion(e, change)
                    }
                }
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
        },

        onDefault(e, change) {
        },

        getDataFromText(chars, type) {
            switch(type) {
                case 'link': {
                    const [match, text, , href] = chars.match(REGEX.LINK);
                    return { text, href, match };
                }
                case 'code': {
                    const [match] = chars.match(REGEX.CODE);
                    const [, text] = match.split('`');
                    return { match, text };
                }
                case 'bold': {
                    const [match] = chars.match(REGEX.BOLD);
                    const [, text] = match.split('*');
                    return { match, text };
                }
                case 'strike': {
                    const [match] = chars.match(REGEX.STRIKE);
                    const [, text] = match.split('~');
                    return { match, text };
                }
                case 'underline': {
                    const [match] = chars.match(REGEX.UNDERLINE);
                    const [, text] = match.split('_');
                    return { match, text };
                }
                default: return {};
            }
        },

        doUnderlineConversion(e, change, next = _.identity) {
            const { state } = change
            if (state.isExpanded) return
            const { startBlock } = state
            const chars = startBlock.text
            const withClosingTag = chars + '_';
            const type = this.getType(withClosingTag)

            if (startBlock.type === 'code-block' || startBlock.type === 'code-container') return;
            if (type === 'underline') {
                e.preventDefault()

                const { match, text } = this.getDataFromText(withClosingTag, type);

                change
                    .deleteBackward(match.length - 1) // delete the ** text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapInlineWithData, 'underline', { text })         // wrap the selection in an `a` tag with href
                    .setBlock('underline-container');
                return next(change);
            }
        },

        doStrikeConversion(e, change, next = _.identity) {
            const { state } = change
            if (state.isExpanded) return
            const { startBlock } = state
            const chars = startBlock.text
            const withClosingTag = chars + '~';
            const type = this.getType(withClosingTag)

            if (startBlock.type === 'code-block' || startBlock.type === 'code-container') return;
            if (type === 'strike') {
                e.preventDefault()

                const { match, text } = this.getDataFromText(withClosingTag, type);

                change
                    .deleteBackward(match.length - 1) // delete the ** text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapInlineWithData, 'strike', { text })         // wrap the selection in an `a` tag with href
                    .setBlock('strike-container');
                return next(change);
            }
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

                const { match, text } = this.getDataFromText(withClosingTag, type);

                change
                    .deleteBackward(match.length - 1) // delete the ** text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapInlineWithData, 'bold', { text })         // wrap the selection in an `a` tag with href
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

            const { text, href, match } = this.getDataFromText(chars, type);

            change
                .deleteBackward(match.length) // delete the []() text
                .insertText(text)             // add just the url text
                .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                .call(wrapInlineWithData, 'link', { text, href }) // wrap the selection in an `a` tag with href
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

                const { match, text } = this.getDataFromText(withClosingTag, type);

                change
                    .deleteBackward(match.length - 1) // delete the `` text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapInlineWithData, 'code', { text })         // wrap the selection in an `a` tag with href

                    // IS THIS RIGHT!?
                    .setBlock('code-container')
                    .setBlock('paragraph');
                console.log('setting code block twice...');
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

            const { endBlock } = state

            if (endBlock.type === 'link-container') {
                const node = this.getInlineNode(endBlock, 'link');
                if (!node) return;
                const text = node.get('text');
                const href = node.get('href');
                const visibleText = `[${text}](${href})`;

                e.preventDefault();
                change
                    .setBlock('text')
                    .deleteBackward(text.length)
                    .insertText(visibleText);
                return true;
            }

            if (endBlock.type === 'code-container') {
                const node = this.getInlineNode(endBlock, 'code');
                if (!node) return;
                const text = node.get('text');
                const visibleText = `\`${text}`;

                e.preventDefault();
                change
                    .setBlock('text')
                    .deleteBackward(text.length)
                    .insertText(visibleText);
                return true;
            }

            if (endBlock.type === 'bold-container') {
                const node = this.getInlineNode(endBlock, 'bold');
                if (!node) return;
                const text = node.get('text');
                const visibleText = `\*${text}`;

                e.preventDefault();
                change
                    .setBlock('text')
                    .deleteBackward(text.length)
                    .insertText(visibleText);
                return true;
            }

            if (endBlock.type === 'strike-container') {
                const node = this.getInlineNode(endBlock, 'strike');
                if (!node) return;
                const text = node.get('text');
                const visibleText = `~${text}`;

                e.preventDefault();
                change
                    .setBlock('text')
                    .deleteBackward(text.length)
                    .insertText(visibleText);
                return true;
            }

            if (endBlock.type === 'underline-container') {
                const node = this.getInlineNode(endBlock, 'underline');
                if (!node) return;
                const text = node.get('text');
                const visibleText = `_${text}`;

                e.preventDefault();
                change
                    .setBlock('text')
                    .deleteBackward(text.length)
                    .insertText(visibleText);
                return true;
            }
        },

        getInlineNode(block, kind) {
            const inlines = block.getInlines().find(({type}) => type === kind);
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

            const TYPES = ['link', 'link-container', 'bold', 'bold-container', 'code', 'code-container'];
            const { endBlock } = change.state;
            if (TYPES.includes(endBlock.type)) {
                change
                    .splitBlock()
                    .setBlock('paragraph');
                return true;
            }
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
    strike(props) {
        const { data } = props.node;
        const text = data.get('text');
        return (<span {...props.attributes} style={{ display: 'inline', textDecoration: 'line-through' }} href={text}>{props.children}</span>);
    },
    'strike-container': props => <span style={{ display: 'inline' }}>{props.children}</span>,
    underline(props) {
        const { data } = props.node;
        const text = data.get('text');
        return (<span {...props.attributes} style={{ display: 'inline', textDecoration: 'underline' }} href={text}>{props.children}</span>);
    },
    'underline-container': props => <span style={{ display: 'inline' }}>{props.children}</span>,
};