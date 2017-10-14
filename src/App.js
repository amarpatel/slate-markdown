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

  // Render the editor.
  render() {
    return (
      <Editor
        plugins={plugins}
        schema={this.state.schema}
        state={this.state.state}
        onChange={this.onChange}
      />
    )
  }
}

export default App;
