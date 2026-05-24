import type {ModelId} from './models.ts'

import {Unpackr} from 'msgpackr/unpack'

import {modelIds} from './models.ts'

export type ModelAssetFiles = Record<string, string>
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
const binaryCache = new Map<string, Uint8Array>
const textCache = new Map<string, string>
const decodeBase64 = (value: string) => {
  if (typeof Uint8Array.fromBase64 === 'function') {
    return Uint8Array.fromBase64(value)
  }
  return Uint8Array.from(atob(value), character => character.codePointAt(0)!)
}
const getModelFileKey = (modelId: ModelId, fileName: string) => {
  return `${modelId}/${fileName}`
}
const clearModelCaches = (modelId: ModelId) => {
  const cacheKeyPrefix = `${modelId}/`
  for (const cacheKey of binaryCache.keys()) {
    if (cacheKey.startsWith(cacheKeyPrefix)) {
      binaryCache.delete(cacheKey)
    }
  }
  for (const cacheKey of textCache.keys()) {
    if (cacheKey.startsWith(cacheKeyPrefix)) {
      textCache.delete(cacheKey)
    }
  }
}
const getModelFiles = (modelId: ModelId) => {
  const files = modelAssetMap[modelId]
  if (!files) {
    throw new Error(`Missing tokenizer assets for model ${JSON.stringify(modelId)}. Run “bun run fetch” first or load the vocabulary chunk before tokenizing.`)
  }
  return files
}
const getEncodedModelFile = (modelId: ModelId, fileName: string) => {
  const base64 = getModelFiles(modelId)[fileName]
  if (!base64) {
    throw new Error(`Missing tokenizer asset ${JSON.stringify(fileName)} for model ${JSON.stringify(modelId)}. Run “bun run fetch” first.`)
  }
  return base64
}
const getModelFileBytes = (modelId: ModelId, fileName: string) => {
  const cacheKey = getModelFileKey(modelId, fileName)
  const cached = binaryCache.get(cacheKey)
  if (cached) {
    return cached
  }
  const decoded = decodeBase64(getEncodedModelFile(modelId, fileName))
  binaryCache.set(cacheKey, decoded)
  return decoded
}
const toPlainObject = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(entry => toPlainObject(entry))
  }
  if (value instanceof Map) {
    const object = {}
    for (const [key, entryValue] of value.entries()) {
      if (typeof key !== 'string') {
        throw new TypeError(`Expected string MessagePack object key, got ${typeof key}.`)
      }
      Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        value: toPlainObject(entryValue),
        writable: true,
      })
    }
    return object
  }
  return value
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

export const hasModelAssets = (modelId: ModelId) => {
  return Object.hasOwn(modelAssetMap, modelId)
}

export const registerModelAssets = (modelId: ModelId, files: ModelAssetFiles) => {
  modelAssetMap[modelId] = files
  clearModelCaches(modelId)
}

export const registerModelAssetMap = (assets: ModelAssetMap) => {
  for (const modelId of modelIds) {
    const files = assets[modelId]
    if (!files) {
      continue
    }
    registerModelAssets(modelId, files)
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
  return toPlainObject(unpackr.unpack(getModelFileBytes(modelId, toMsgpackFileName(fileName)))) as T
}

export const getAvailableModelIds = () => {
  return modelIds.filter(modelId => hasModelAssets(modelId))
}
