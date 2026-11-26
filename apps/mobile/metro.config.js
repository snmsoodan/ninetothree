// The monorepo's packages are TypeScript sources, not build output, so Metro
// has to watch the whole workspace and resolve through both node_modules.
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const root = path.resolve(__dirname, "../..");
const config = getDefaultConfig(__dirname);

config.watchFolders = [root];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(root, "node_modules"),
];
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
