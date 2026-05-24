import path from 'node:path'

import fs from 'fs-extra'

const rootFolder = path.resolve(import.meta.dirname, '..')
const generatedAssetsIndexFile = path.join(rootFolder, 'temp/generated/model-assets/index.ts')
const configFile = path.join(rootFolder, 'rolldown.config.ts')
const distFolder = path.join(rootFolder, 'dist')
const toForwardSlashes = (filePath: string) => {
  return filePath.replaceAll('\\', '/')
}
const exists = async (filePath: string) => {
  try {
    await fs.stat(filePath)
    return true
  } catch {
    return false
  }
}
if (!await exists(generatedAssetsIndexFile)) {
  throw new Error(`Missing generated tokenizer assets at ${JSON.stringify(toForwardSlashes(generatedAssetsIndexFile))}. Run “bun run fetch” first.`)
}
await fs.rm(distFolder, {
  force: true,
  recursive: true,
})
const buildProcess = Bun.spawn(['bun', 'x', 'rolldown', '--config', configFile], {
  cwd: rootFolder,
  stderr: 'inherit',
  stdout: 'inherit',
  stdin: 'inherit',
})
const exitCode = await buildProcess.exited
if (exitCode !== 0) {
  throw new Error(`Rolldown build failed with exit code ${exitCode}.`)
}
console.log(`Built distribution files into ${toForwardSlashes(distFolder)}.`)
