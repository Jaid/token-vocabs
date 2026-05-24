import type {ModelId} from './models.ts'

import fs from 'node:fs'
import path from 'node:path'

import {modelIds} from './models.ts'

const dataFolderCandidates = [
  path.resolve(import.meta.dirname, './data'),
  path.resolve(import.meta.dirname, '../data'),
  path.resolve(import.meta.dirname, '../../data'),
]
const fileExists = (filePath: string) => {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}
const folderExists = (folderPath: string) => {
  try {
    return fs.statSync(folderPath).isDirectory()
  } catch {
    return false
  }
}
let resolvedDataFolder: string | undefined

export const getDataFolder = () => {
  if (resolvedDataFolder) {
    return resolvedDataFolder
  }
  const dataFolder = dataFolderCandidates.find(folderExists)
  if (!dataFolder) {
    throw new Error(`Could not find tomni data folder. Checked: ${dataFolderCandidates.join(', ')}. Run “bun run fetch” first.`)
  }
  resolvedDataFolder = dataFolder
  return dataFolder
}

export const getModelDataFolder = (modelId: ModelId) => {
  return path.join(getDataFolder(), modelId)
}

export const resolveModelDataFile = (modelId: ModelId, fileName: string) => {
  const filePath = path.join(getModelDataFolder(modelId), fileName)
  if (!fileExists(filePath)) {
    throw new Error(`Missing tokenizer asset ${JSON.stringify(fileName)} for model ${JSON.stringify(modelId)} at ${JSON.stringify(filePath)}. Run “bun run fetch” first.`)
  }
  return filePath
}

export const readModelTextFile = (modelId: ModelId, fileName: string) => {
  return fs.readFileSync(resolveModelDataFile(modelId, fileName), 'utf8')
}

export const readModelJsonFile = <T>(modelId: ModelId, fileName: string): T => {
  return JSON.parse(readModelTextFile(modelId, fileName)) as T
}

export const getAvailableModelIds = () => {
  return modelIds.filter(modelId => folderExists(getModelDataFolder(modelId)))
}
