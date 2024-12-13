const Parser = require('tree-sitter');
const Language = require('tree-sitter-javascript');

const parser = new Parser();
parser.setLanguage(Language);

const sourceCode = `
  function greet(name) {
    return "Hello, " + name;
  }
`;
const tree = parser.parse(sourceCode);

const query = `
  (function_declaration
    name: (identifier) @function_name)
`;


const Query = require('tree-sitter').Query;
const queryObject = new Query(Language, query);

const cursor = queryObject.matches(tree.rootNode);
for (const match of cursor) {
  match.captures.forEach(capture => {
    const { node, name } = capture;
    console.log(`${name}: ${node.text}`);
  });
}
