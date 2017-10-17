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

const LOCAL_STORAGE_KEY = 'slate-markdown:document';
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
    state: this.getFromLocalStorage(),
    schema: {
        nodes
    },
    copyFormat: 'markdown'
  }

  getFromLocalStorage() {
      const localData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return localData
        ? State.fromJSON(JSON.parse(localData))
        : initialState;
  }

  // On change, update the app's React state with the new editor state.
  onChange = ({ state }) => {
    this.setState({ state })
    // hack to save data
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.toJS()));
  }

  convertToMarkdown(doc) {
    return convertToMarkdown(doc);
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

  getSelectionStyle(type) {
      return {
          textAlign: 'center',
          width: '50%',
          fontWeight: (this.state.copyFormat === type ? 'bold' : 'normal'),
          textDecoration: (this.state.copyFormat === type ? 'underline' : 'none')
      };
  }

  // Render the editor.
  render() {
    return (
        <div style={{ width: '40em', overflowY: 'scroll', fontSize: '1rem', paddingTop: '0.5em' }}>
          <div style={{ width: '100%', display: 'flex' }}>
              <span
                  style={this.getSelectionStyle('markdown')}
                  onClick={(e) => this.setState({ copyFormat: 'markdown'})}>Markdown</span>
              <span
                  style={this.getSelectionStyle('html')}
                  onClick={(e) => this.setState({ copyFormat: 'html'})}>HTML</span>
          </div>
          <Editor
            className="editor"
            style={{ border: '1px solid rgba(128,128,128,0.25)', borderRadius: '5px', fontSize: '1rem', margin: '0.5em 1em 1em' }}
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