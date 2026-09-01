import type {ModelId} from '../models.ts'

import {ModelAssetBundleLoader} from './base/ModelAssetBundleLoader.ts'

export class FilesystemModelAssetBundleLoader extends ModelAssetBundleLoader {
  constructor(readonly bundleUrls: Readonly<Record<ModelId, URL>>) {
    super()
  }

  protected override async readCompressedBundle(modelId: ModelId) {
    return new Uint8Array(await Bun.file(this.bundleUrls[modelId]).arrayBuffer())
  }
}
