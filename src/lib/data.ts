import type {ModelAssetBundleLoader, ModelAssetFiles} from './modelAssets/base/ModelAssetBundleLoader.ts'
import type {ModelId} from './models.ts'

import {Unpackr} from 'msgpackr/unpack'

import {modelIds} from './models.ts'

export type ModelAssetMap = Partial<Record<ModelId, ModelAssetFiles>>

type MsgpackUnpackr = {
  unpack: (value: Uint8Array) => unknown
}
type MsgpackUnpackrConstructor = new (options: {mapsAsObjects: boolean}) => MsgpackUnpackr
const UnpackrConstructor = Unpackr as unknown as MsgpackUnpackrConstructor
const unpackr = new UnpackrConstructor({
  mapsAsObjects: false,
})
const textDecoder = new TextDecoder
const modelAssetMap = Object.create(null) as ModelAssetMap
const modelAssetLoadPromises = new Map<ModelId, Promise<void>>
const modelAssetRevisions = Object.create(null) as Partial<Record<ModelId, number>>
const msgpackCache = new Map<string, unknown>
const textCache = new Map<string, string>
let modelAssetBundleLoader: ModelAssetBundleLoader | undefined
const getModelFileKey = (modelId: ModelId, fileName: string) => {
  return `${modelId}/${fileName}`
}
const getModelRevision = (modelId: ModelId) => {
  return modelAssetRevisions[modelId] ?? 0
}
const bumpModelRevision = (modelId: ModelId) => {
  const nextRevision = getModelRevision(modelId) + 1
  modelAssetRevisions[modelId] = nextRevision
  return nextRevision
}
const clearModelCaches = (modelId: ModelId) => {
  const cacheKeyPrefix = `${modelId}/`
  for (const cacheKey of textCache.keys()) {
    if (cacheKey.startsWith(cacheKeyPrefix)) {
      textCache.delete(cacheKey)
    }
  }
  for (const cacheKey of msgpackCache.keys()) {
    if (cacheKey.startsWith(cacheKeyPrefix)) {
      msgpackCache.delete(cacheKey)
    }
  }
}
const getModelFiles = (modelId: ModelId) => {
  const files = modelAssetMap[modelId]
  if (!files) {
    throw new Error(`Missing tokenizer assets for model ${JSON.stringify(modelId)}. Call load() first or use tokenize()/count() to auto-load it.`)
  }
  return files
}
const getModelAssetBundleLoader = () => {
  if (!modelAssetBundleLoader) {
    throw new Error('No tokenizer asset loader is registered for the current entry.')
  }
  return modelAssetBundleLoader
}
const getEncodedModelFile = (modelId: ModelId, fileName: string) => {
  const files = getModelFiles(modelId)
  if (!Object.hasOwn(files, fileName)) {
    throw new Error(`Missing tokenizer asset ${JSON.stringify(fileName)} for model ${JSON.stringify(modelId)}. Run “bun run fetch” first.`)
  }
  return files[fileName]
}
const getModelFileBytes = (modelId: ModelId, fileName: string) => {
  return getEncodedModelFile(modelId, fileName)
}
const toMsgpackFileName = (fileName: string) => {
  if (fileName.endsWith('.msgpack')) {
    return fileName
  }
  if (fileName.endsWith('.json')) {
    return `${fileName.slice(0, -'.json'.length)}.msgpack`
  }
  throw new TypeError(`Expected a MessagePack or JSON file name, got ${JSON.stringify(fileName)}.`)
}
const hasModelAssets = (modelId: ModelId) => {
  return Object.hasOwn(modelAssetMap, modelId)
}

export const registerModelAssetBundleLoader = (loader: ModelAssetBundleLoader) => {
  modelAssetBundleLoader = loader
}

const registerModelAssets = (modelId: ModelId, files: ModelAssetFiles) => {
  modelAssetMap[modelId] = files
  clearModelCaches(modelId)
}

export const loadModelAssets = async (selectedModels: ReadonlyArray<ModelId>) => {
  await Promise.all(selectedModels.map(async modelId => {
    if (hasModelAssets(modelId)) {
      return
    }
    const existingLoadPromise = modelAssetLoadPromises.get(modelId)
    if (existingLoadPromise) {
      await existingLoadPromise
      return
    }
    const revision = getModelRevision(modelId)
    const loadPromise = (async () => {
      const files = await getModelAssetBundleLoader().load(modelId)
      if (getModelRevision(modelId) !== revision) {
        return
      }
      registerModelAssets(modelId, files)
    })().finally(() => {
      if (modelAssetLoadPromises.get(modelId) === loadPromise) {
        modelAssetLoadPromises.delete(modelId)
      }
    })
    modelAssetLoadPromises.set(modelId, loadPromise)
    await loadPromise
  }))
}

const freeSingleModelAssets = (modelId: ModelId) => {
  bumpModelRevision(modelId)
  delete modelAssetMap[modelId]
  modelAssetLoadPromises.delete(modelId)
  clearModelCaches(modelId)
}

export const freeModelAssets = (modelId?: ModelId) => {
  if (modelId) {
    freeSingleModelAssets(modelId)
    return
  }
  for (const listedModelId of modelIds) {
    freeSingleModelAssets(listedModelId)
  }
}

export const readModelTextFile = (modelId: ModelId, fileName: string) => {
  if (fileName.endsWith('.json') || fileName.endsWith('.msgpack')) {
    throw new TypeError(`Cannot read structured tokenizer asset ${JSON.stringify(fileName)} as text.`)
  }
  const cacheKey = getModelFileKey(modelId, fileName)
  const cached = textCache.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }
  const text = textDecoder.decode(getModelFileBytes(modelId, fileName))
  textCache.set(cacheKey, text)
  return text
}

export const readModelMsgpackFile = <T>(modelId: ModelId, fileName: string): T => {
  const normalizedFileName = toMsgpackFileName(fileName)
  const cacheKey = getModelFileKey(modelId, normalizedFileName)
  const cached = msgpackCache.get(cacheKey)
  if (cached !== undefined) {
    return cached as T
  }
  const unpacked = unpackr.unpack(getModelFileBytes(modelId, normalizedFileName)) as T
  msgpackCache.set(cacheKey, unpacked)
  return unpacked
}
