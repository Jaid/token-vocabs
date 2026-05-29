import type {ModelId} from '../../models.ts'

import {Unpackr} from 'msgpackr/unpack'

import {decompressBrotli} from '../../decompressBrotli.ts'

export type ModelAssetFiles = Record<string, Uint8Array>

type MsgpackUnpackr = {
  unpack: (value: Uint8Array) => unknown
}

type MsgpackUnpackrConstructor = new (options: {mapsAsObjects: boolean}) => MsgpackUnpackr

const UnpackrConstructor = Unpackr as unknown as MsgpackUnpackrConstructor
const unpackr = new UnpackrConstructor({
  mapsAsObjects: false,
})
const toUint8Array = (value: unknown) => {
  if (value instanceof Uint8Array) {
    return value
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value)
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  }
  throw new TypeError(`Expected bundled tokenizer asset contents to be binary, got ${typeof value}.`)
}
const toModelAssetFiles = (value: unknown): ModelAssetFiles => {
  if (!(value instanceof Map)) {
    throw new TypeError('Expected a tokenizer asset bundle to unpack into a Map.')
  }
  const files = Object.create(null) as ModelAssetFiles
  for (const [fileName, content] of value.entries()) {
    if (typeof fileName !== 'string') {
      throw new TypeError(`Expected tokenizer asset file names to be strings, got ${typeof fileName}.`)
    }
    files[fileName] = toUint8Array(content)
  }
  return files
}

export abstract class ModelAssetBundleLoader {
  async load(modelId: ModelId) {
    const compressedBundle = await this.readCompressedBundle(modelId)
    const decompressedBundle = await decompressBrotli(compressedBundle)
    return toModelAssetFiles(unpackr.unpack(decompressedBundle))
  }

  protected abstract readCompressedBundle(modelId: ModelId): Promise<Uint8Array>
}
