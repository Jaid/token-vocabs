import {createRequire} from 'node:module'
import path from 'node:path'

import fs from 'fs-extra'

const require = createRequire(import.meta.url)
const rootFolder = path.resolve(import.meta.dirname, '..')
const entrypoint = path.join(rootFolder, 'src/main.ts')
const dataFolder = path.join(rootFolder, 'data')
const distFolder = path.join(rootFolder, 'dist')
const exists = async (filePath: string) => {
  try {
    await fs.stat(filePath)
    return true
  } catch {
    return false
  }
}
if (!await exists(dataFolder)) {
  throw new Error(`Missing data folder at ${JSON.stringify(dataFolder)}. Run “bun run fetch” first.`)
}
await fs.rm(distFolder, {
  force: true,
  recursive: true,
})
await fs.mkdir(distFolder, {recursive: true})
const result = await Bun.build({
  entrypoints: [entrypoint],
  format: 'esm',
  outdir: distFolder,
  target: 'node',
})
if (!result.success) {
  for (const log of result.logs) {
    console.error(log)
  }
  throw new Error('Build failed.')
}
await fs.cp(dataFolder, path.join(distFolder, 'data'), {recursive: true})
const tiktokenWasmFile = require.resolve('tiktoken/tiktoken_bg.wasm')
await fs.copyFile(tiktokenWasmFile, path.join(distFolder, 'tiktoken_bg.wasm'))
console.log(`Built ${result.outputs.length} file${result.outputs.length === 1 ? '' : 's'} into ${distFolder}.`)
