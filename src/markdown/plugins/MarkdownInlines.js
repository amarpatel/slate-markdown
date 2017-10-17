import React from 'react'
import { State } from 'slate'
import _ from 'lodash';

const REGEX = {
    LINK: /\[(.*?)(\]\()([A-Za-z0-9\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]+)\)/,
    CODE: /([`])(?:(?=(\\?))\2.)+?\1/,
    ITALIC_ASTERISK: /([*])(?:(?=(\\?))\2.)+?\1/,
    ITALIC_UNDERSCORE: /([_])(?:(?=(\\?))\2.)+?\1/,
    BOLD_ASTERISK: /(\*{2})(?:(?=(\\?))\2.)+?\1/,
    BOLD_UNDERSCORE: /(_{2})(?:(?=(\\?))\2.)+?\1/,
    STRIKE: /(~{2})(?:(?=(\\?))\2.)+?\1/,
    CONSECUTIVE: {
        TWO: {
            BACKTICK: /`{2,}/,
            ASTERISK: /\*{2,}/,
            TILDE: /\~{2,}/,
            _: /\_{2,}/,
        },
        THREE: {
            BACKTICK: /`{3,}/,
            ASTERISK: /\*{3,}/,
            TILDE: /\~{3,}/,
            _: /\_{3,}/,
        }
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
            'italic_asterisk',
            'italic_underscore',
            'bold_asterisk',
            'bold_underscore',
            'strike',
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

            if (chars.match(REGEX.CODE) && !chars.match(REGEX.CONSECUTIVE.TWO.BACKTICK)) {
                return 'code';
            }

            if (chars.match(REGEX.ITALIC_ASTERISK) && !chars.match(REGEX.CONSECUTIVE.TWO.ASTERISK)) {
                return 'italic_asterisk';
            }

            if (chars.match(REGEX.ITALIC_UNDERSCORE) && !chars.match(REGEX.CONSECUTIVE.TWO._)) {
                return 'italic_underscore';
            }

            if (chars.match(REGEX.BOLD_ASTERISK) && !chars.match(REGEX.CONSECUTIVE.THREE.ASTERISK)) {
                return 'bold_asterisk';
            }

            if (chars.match(REGEX.BOLD_UNDERSCORE) && !chars.match(REGEX.CONSECUTIVE.THREE._)) {
                return 'bold_underscore';
            }

            if (chars.match(REGEX.STRIKE) && !chars.match(REGEX.CONSECUTIVE.THREE.TILDE)) {
                return 'strike';
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
                        return this.doItalicUnderscoreConversion(e, change)
                    }
                }
                case '8': {
                    if (data.isShift) {
                        return this.doItalicAsteriskConversion(e, change)
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
                case 'italic_asterisk': {
                    const [match] = chars.match(REGEX.ITALIC_ASTERISK);
                    const [, text] = match.split('*');
                    return { match, text };
                }
                case 'italic_underscore': {
                    const [match] = chars.match(REGEX.ITALIC_UNDERSCORE);
                    const [, text] = match.split('_');
                    return { match, text };
                }
                case 'bold_asterisk': {
                    const [match] = chars.match(REGEX.BOLD_ASTERISK);
                    const [, text] = match.split('**');
                    return { match, text };
                }
                case 'bold_underscore': {
                    const [match] = chars.match(REGEX.BOLD_UNDERSCORE);
                    const [, text] = match.split('__');
                    return { match, text };
                }
                case 'strike': {
                    const [match] = chars.match(REGEX.STRIKE);
                    const [, text] = match.split('~~');
                    return { match, text };
                }
                default: return {};
            }
        },

        doBoldUnderscoreConversion(e, change, next = _.identity) {
            const { state } = change
            if (state.isExpanded) return
            const { startBlock } = state
            const chars = startBlock.text
            const withClosingTag = chars + '_';
            const type = this.getType(withClosingTag)

            if (startBlock.type === 'code-block' || startBlock.type === 'code-container') return;
            if (type === 'bold_underscore') {
                e.preventDefault()

                const { match, text } = this.getDataFromText(withClosingTag, type);

                change
                    .deleteBackward(match.length - 1) // delete the ** text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapInlineWithData, 'bold_underscore', { text })         // wrap the selection in an `a` tag with href
                    .setBlock('bold-container')
                    .splitBlock();
                return next(change);
            }

        },

        doItalicUnderscoreConversion(e, change, next = _.identity) {
            const { state } = change
            if (state.isExpanded) return
            const { startBlock } = state
            const chars = startBlock.text
            const withClosingTag = chars + '_';
            const type = this.getType(withClosingTag)

            if (startBlock.type === 'code-block' || startBlock.type === 'code-container') return;
            if (type === 'italic_underscore') {
                e.preventDefault()

                const { match, text } = this.getDataFromText(withClosingTag, type);

                change
                    .deleteBackward(match.length - 1) // delete the ** text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapInlineWithData, 'italic_underscore', { text })         // wrap the selection in an `a` tag with href
                    .setBlock('italic-container')
                    .splitBlock();
                return next(change);
            }

            if (type === 'bold_underscore') {
                return this.doBoldUnderscoreConversion(e, change, next);
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
                    .deleteBackward(match.length - 1) // delete the ~~ text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapInlineWithData, 'strike', { text })         // wrap the selection in an `a` tag with href
                    .setBlock('strike-container')
                    .splitBlock()
                return next(change);
            }
        },

        doItalicAsteriskConversion(e, change, next = _.identity) {
            const { state } = change
            if (state.isExpanded) return
            const { startBlock, startOffset } = state
            const chars = startBlock.text
            const withClosingTag = chars + '*';
            const type = this.getType(withClosingTag)

            if (startBlock.type === 'code-block' || startBlock.type === 'code-container') return;
            if (type === 'italic_asterisk') {
                e.preventDefault()

                const { match, text } = this.getDataFromText(withClosingTag, type);

                change
                    .deleteBackward(match.length - 1) // delete the ** text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapInlineWithData, 'italic_asterisk', { text })         // wrap the selection in an `a` tag with href
                    .setBlock('italic-container')
                    .splitBlock();
                return next(change);
            }

            if (type === 'bold_asterisk') {
                return this.doBoldAsteriskConversion(e, change, next);
            }
        },

        doBoldAsteriskConversion(e, change, next = _.identity) {
            const { state } = change
            if (state.isExpanded) return
            const { startBlock, startOffset } = state
            const chars = startBlock.text
            const withClosingTag = chars + '*';
            const type = this.getType(withClosingTag)

            if (startBlock.type === 'code-block' || startBlock.type === 'code-container') return;
            if (type === 'bold_asterisk') {
                e.preventDefault()

                const { match, text } = this.getDataFromText(withClosingTag, type);

                change
                    .deleteBackward(match.length - 1) // delete the ** text
                    .insertText(text)             // add just the url text
                    .extend(0 - text.length)      // extend the iSelector backwards the length of the inserted text
                    .call(wrapInlineWithData, 'bold_asterisk', { text })         // wrap the selection in an `a` tag with href
                    .setBlock('bold-container')
                    .splitBlock();
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
                .setBlock('link-container')
                .splitBlock();
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
                    .splitBlock();
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
                    .deleteBackward(text.length)
                    .insertText(visibleText);
                return true;
            }

            if (endBlock.type === 'italic-container') {
                const underscoreNode = this.getInlineNode(endBlock, 'italic_underscore');
                const asteriskNode = this.getInlineNode(endBlock, 'italic_asterisk');
                const node = underscoreNode || asteriskNode;
                if (!node) return;
                const text = node.get('text');
                const visibleText = `\*${text}`;

                e.preventDefault();
                change
                    .deleteBackward(text.length)
                    .insertText(visibleText);
                return true;
            }

            if (endBlock.type === 'strike-container') {
                const node = this.getInlineNode(endBlock, 'strike');
                if (!node) return;
                const text = node.get('text');
                const visibleText = `~~${text}`;

                e.preventDefault();
                change
                    .deleteBackward(text.length)
                    .insertText(visibleText);
                return true;
            }

            if (endBlock.type === 'bold-container') {
                const underscoreNode = this.getInlineNode(endBlock, 'bold_underscore');
                const asteriskNode = this.getInlineNode(endBlock, 'bold_asterisk');
                const node = underscoreNode || asteriskNode;
                if (!node) return;
                const text = node.get('text');
                const visibleText = `**${text}`;

                e.preventDefault();
                change
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

            const TYPES = [
                'link',
                'link-container',
                'italic_asterisk',
                'italic_underscore',
                'bold_asterisk',
                'bold_underscore',
                'italic-container',
                'code',
                'code-container'
            ];
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

    italic_underscore: (props) => (<span {...props.attributes} style={{ display: 'inline', fontStyle: 'italic' }}>{props.children}</span>),
    italic_asterisk: (props) => (<span {...props.attributes} style={{ display: 'inline', fontStyle: 'italic' }}>{props.children}</span>),
    'italic-container': props => <span style={{ display: 'inline' }}>{props.children}</span>,

    bold_underscore: (props) => (<strong {...props.attributes} style={{ display: 'inline' }}>{props.children}</strong>),
    bold_asterisk: (props) => (<strong {...props.attributes} style={{ display: 'inline' }}>{props.children}</strong>),
    'bold-container': props => <span style={{ display: 'inline' }}>{props.children}</span>,

    strike(props) {
        const { data } = props.node;
        const text = data.get('text');
        return (<strong {...props.attributes} style={{ display: 'inline', textDecoration: 'line-through' }} href={text}>{props.children}</strong>);
    },
    'strike-container': props => <span style={{ display: 'inline' }}>{props.children}</span>,
};