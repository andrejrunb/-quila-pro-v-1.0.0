const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Encontra o root do monorepo
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Monitora o root do monorepo para resolver pacotes compartilhados
config.watchFolders = [monorepoRoot];

// 2. Garante que pacotes hoisted sejam resolvidos
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
