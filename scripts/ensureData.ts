import path from 'node:path'

import fs from 'fs-extra'

import {modelIds} from '#src/lib/models.ts'

const rootFolder = path.resolve(import.meta.dirname, '..')
const generatedAssetsFolder = path.join(rootFolder, 'temp/generated/model-assets')
const generatedAssetFiles = modelIds.map(modelId => path.join(generatedAssetsFolder, `${modelId}.msgpack.br`))
const getMissingGeneratedAssetsFile = async () => {
  for (const generatedAssetFile of generatedAssetFiles) {
    if (!await fs.pathExists(generatedAssetFile)) {
      return generatedAssetFile
    }
  }
}
const missingGeneratedAssetsFile = await getMissingGeneratedAssetsFile()
if (missingGeneratedAssetsFile) {
  console.log(`Missing generated tokenizer assets at ${missingGeneratedAssetsFile}. Running fetch...`)
  const fetchProcess = Bun.spawn(['bun', 'run', 'fetch'], {
    cwd: rootFolder,
    stderr: 'inherit',
    stdout: 'inherit',
    stdin: 'inherit',
  })
  const exitCode = await fetchProcess.exited
  if (exitCode !== 0) {
    throw new Error(`Tokenizer asset fetch failed with exit code ${exitCode}.`)
  }
}
