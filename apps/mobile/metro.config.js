// Metro config tuned for a pnpm monorepo.
// Without this, Metro can't see `@lingoo/shared` (which lives outside the app
// folder) or the hoisted node_modules at the repo root.
const {getDefaultConfig} = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 1. Watch the whole monorepo so changes in packages/shared hot-reload.
config.watchFolders = [workspaceRoot]

// 2. Resolve modules from both the app and the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
