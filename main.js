const fs = require('fs');
const path = require('path');
const Parser = require('tree-sitter');
const TS = require("tree-sitter-typescript").typescript;
const TSX = require("tree-sitter-typescript").tsx;
const parser = new Parser();

const Query = require('tree-sitter').Query;

// Define the Tree-sitter query
const query = `
  (function_declaration
    name: (identifier) @function_name)
`;


/**
 * Recursively reads all files in a directory and its subdirectories.
 * @param {string} dirPath - The directory path to traverse.
 * @returns {string[]} - A list of file paths.
 */
function getAllFiles(dirPath) {
    let files = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        // skip node_modules
        if (entry.isDirectory() && entry.name === 'node_modules') {
            continue;
        }
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(getAllFiles(fullPath));
        } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            files.push(fullPath);
        }
    }
    return files;
}

/**
 * Parses the source code of a file and queries it using Tree-sitter.
 * @param {string} filePath - The path to the JavaScript file.
 */
function processFile(filePath) {
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    let language = null;
    if (filePath.endsWith('.ts')) {
        language = TS;
    } else if (filePath.endsWith('.tsx')) {
        language = TSX;
    } else {
        console.error(`Unsupported file extension: ${filePath}`);
        return;
    }

    parser.setLanguage(language);

    let tree = null;

    try {
        tree = parser.parse(sourceCode);
    } catch (e) {
        console.error('Failed to parse file:', filePath);
        return;
    }

    let queryObject = new Query(language, query)

    if (!tree) {
        console.error('Failed to parse file:', filePath);
        return;
    }

    const cursor = queryObject.matches(tree.rootNode);
    for (const match of cursor) {
        match.captures.forEach(capture => {
            const { node, name } = capture;
            console.log(`File: ${filePath} | ${name}: ${node.text}`);
        });
    }
}

// Main function to process a repository path
function main(repoPath) {
    if (!fs.existsSync(repoPath)) {
        console.error(`Path does not exist: ${repoPath}`);
        process.exit(1);
    }

    const allFiles = getAllFiles(repoPath);
    allFiles.forEach(processFile);
}

// Take repository path as a command-line argument
const repoPath = process.argv[2];
if (!repoPath) {
    console.error('Usage: node script.js <repo-path>');
    process.exit(1);
}

main(repoPath);
