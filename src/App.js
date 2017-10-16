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

  convertToHtml(doc) {
    return convertToHtml(doc);
  }

  onCopyHandler(e) {
    const { state } = this.editor.state;
    const { document } = state;
    console.log('here: ', this.convertToHtml(document.toJS()));
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

function convertToHtml(state) {
    let t = '';
    if (state.nodes) {
        state.nodes.forEach((node) => {
            switch(node.type) {
                case 'paragraph': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `${text}\n`
                    }
                    break;
                }
                case 'bold': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `**${text}**`
                    }
                    break;
                }
                case 'italic_asterisk': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `*${text}*`
                    }
                    break;
                }
                case 'italic_underscore': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `_${text}_`
                    }
                    break;
                }
                case 'code': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `\`${text}\``
                    }
                    break;
                }
                case 'strike': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `~~${text}~~`
                    }
                    break;
                }
                case 'block-quote': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `\n> ${text}\n`;
                    }
                    break;
                }
                case 'bulleted-list': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `\n- ${text}\n`;
                    }
                    break;
                }
                case 'heading-one': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `\n# ${text}\n`;
                    }
                    break;
                }
                case 'heading-two': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `\n## ${text}\n`;
                    }
                    break;
                }
                case 'heading-three': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `\n### ${text}\n`;
                    }
                    break;
                }
                case 'heading-four': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `\n#### ${text}\n`;
                    }
                    break;
                }
                case 'heading-five': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `\n##### ${text}\n`;
                    }
                    break;
                }
                case 'heading-six': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `\n###### ${text}\n`;
                    }
                    break;
                }
                case 'list-item': {
                    const text = convertToHtml(node);
                    if (text.length) {
                        t += `\n+ ${text}\n`;
                    }
                    break;
                }
                case 'code-block': {
                    const text = convertToHtml(node);
                    if (text.length){
                        t += `\n\`\`\`${text}\`\`\``;
                    }
                    break;
                }
                default: {
                    console.log('in default:type: ', node.type);
                    console.log('in default:kind: ', node.kind);
                    t += convertToHtml(node);
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