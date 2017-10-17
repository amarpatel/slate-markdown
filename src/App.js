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
        nodes: [{ kind: 'text', ranges: [{ text: 'Start typing here' }] }]
      },
      { kind: 'block', type: 'paragraph' },
      { kind: 'block', type: 'paragraph' },
    ]
  },
});

// Define our app...
class App extends React.Component {

  // Set the initial state when the app is first constructed.
  state = {
    state: initialState,
    schema: {
        nodes
    },
    copyFormat: 'markdown'
  }

  // On change, update the app's React state with the new editor state.
  onChange = ({ state }) => {
    this.setState({ state })
  }

  convertToMarkdown(doc) {
    return convertToMarkdown(doc);
  }

  radioHandler(e) {
      const copyFormat = e.currentTarget.name;
      this.setState({ copyFormat });
  }

  onCopyHandler(e) {
    const { state } = this.editor.state;
    const { document } = state;
    const { copyFormat } = this.state;
    e.preventDefault();

    if (copyFormat === 'html') {
        const html = window.document.querySelector('.editor').innerHTML;
        e.clipboardData.setData('text/html', html);
    } else {
        const markdownText = this.convertToMarkdown(document.toJS());
        e.clipboardData.setData('text/plain', markdownText);
    }
  }

  // Render the editor.
  render() {
    return (
        <div style={{ width: '40em', height: '40em', overflowY: 'scroll' }}>
          <div style={{ marginBottom: '2em' }}>
            <form>
                Copy format: <span style={{ paddingRight: '2em'}} ></span>
                <input
                    type="radio"
                    id="markdown"
                    name="markdown"
                    value="markdown"
                    onChange={(e) => this.radioHandler(e)}
                    checked={this.state.copyFormat === 'markdown'}/>
                <label htmlFor="markdown">Markdown</label>
              <input
                  type="radio"
                  id="html"
                  name="html"
                  value="html"
                  onChange={(e) => this.radioHandler(e)}
                  checked={this.state.copyFormat === 'html'}/>
              <label htmlFor="html">HTML</label>
            </form>
          </div>
          <Editor
            className="editor"
            style={{ border: '1px solid rgba(128,128,128,0.25)', borderRadius: '5px' }}
            ref={ (editor) => {this.editor = editor;} }
            onCopy={(e) => this.onCopyHandler(e)}
            plugins={plugins}
            schema={this.state.schema}
            state={this.state.state}
            onChange={this.onChange}
          />
        </div>
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
                    } else {
                        t += '\n';
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
                case 'link': {
                    const text = convertToMarkdown(node);
                    const { href } = node.data;
                    if (text.length){
                        t += `[${text}](${href})`;
                    }
                    break;
                }
                default: {
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