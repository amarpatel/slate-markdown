// Import React!
import React from 'react'
import { State } from 'slate'
import { Editor } from 'slate-react'
import _ from 'lodash';

import { MarkdownPrefixPlugin, markdownPrefixNodes } from "./markdown/plugins/MarkdownPrefixes";
import { MarkdownInlinesPlugin, markdownInlineNodes } from "./markdown/plugins/MarkdownInlines";

const plugins = [
    MarkdownInlinesPlugin(),
    MarkdownPrefixPlugin(),
];

const nodes = _.assign({}, markdownPrefixNodes, markdownInlineNodes);

// import initialState from './state.json'
const initialState = State.fromJSON({
  document: {
    nodes: [
      {
        kind: 'block',
        type: 'paragraph',
        nodes: [
          {
            kind: 'text',
            ranges: [
              {
                text: 'A line of text in a paragraph.'
              }
            ]
          }
        ]
      }
    ]
  }
});

// Define our app...
class App extends React.Component {

  // Set the initial state when the app is first constructed.
  state = {
    state: initialState,
    schema: {
        nodes
    }
  }

  // On change, update the app's React state with the new editor state.
  onChange = ({ state }) => {
    this.setState({ state })
  }

  convertToMarkdown(doc) {
    return convertToMarkdown(doc);
  }

  onCopyHandler(e, html) {
    const { state } = this.editor.state;
    const { document } = state;
    const markdownText = this.convertToMarkdown(document.toJS());
    e.clipboardData.setData('text/plain', markdownText);
  }

  // Render the editor.
  render() {
    return (
      <Editor
        ref={ (editor) => {this.editor = editor;} }
        onCopy={(...args) => this.onCopyHandler(...args)}
        plugins={plugins}
        schema={this.state.schema}
        state={this.state.state}
        onChange={this.onChange}
      />
    )
  }
}

export default App;

function convertToMarkdown(state) {
    let t = '';
    if (state.nodes) {
        state.nodes.forEach((node) => {
            switch(node.type) {
                case 'paragraph': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `${text}\n`
                    }
                    break;
                }
                case 'italic_asterisk': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `*${text}*`
                    }
                    break;
                }
                case 'italic_underscore': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `*${text}*`
                    }
                    break;
                }
                case 'bold_asterisk': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `**${text}**`
                    }
                    break;
                }
                case 'bold_underscore': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `**${text}**`
                    }
                    break;
                }
                case 'code': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `\`${text}\``
                    }
                    break;
                }
                case 'strike': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `~~${text}~~`
                    }
                    break;
                }
                case 'block-quote': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `\n> ${text}\n`;
                    }
                    break;
                }
                case 'bulleted-list': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `\n- ${text}\n`;
                    }
                    break;
                }
                case 'heading-one': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `\n# ${text}\n`;
                    }
                    break;
                }
                case 'heading-two': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `\n## ${text}\n`;
                    }
                    break;
                }
                case 'heading-three': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `\n### ${text}\n`;
                    }
                    break;
                }
                case 'heading-four': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `\n#### ${text}\n`;
                    }
                    break;
                }
                case 'heading-five': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `\n##### ${text}\n`;
                    }
                    break;
                }
                case 'heading-six': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `\n###### ${text}\n`;
                    }
                    break;
                }
                case 'list-item': {
                    const text = convertToMarkdown(node);
                    if (text.length) {
                        t += `\n+ ${text}\n`;
                    }
                    break;
                }
                case 'code-block': {
                    const text = convertToMarkdown(node);
                    if (text.length){
                        t += `\n\`\`\`\n${text}\n\`\`\``;
                    }
                    break;
                }
                default: {
                    console.log('in default:type: ', node.type);
                    console.log('in default:kind: ', node.kind);
                    t += convertToMarkdown(node);
                }
            }
        });
    }

    if (state.ranges) {
        state.ranges.forEach((range) => {
            if (range.text.length) {
                t += range.text
            }
        });
    }

    return t;
}