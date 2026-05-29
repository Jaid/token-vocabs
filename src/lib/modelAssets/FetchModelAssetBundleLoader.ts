import type {ModelId} from '../models.ts'

import {ModelAssetBundleLoader} from './base/ModelAssetBundleLoader.ts'

export class FetchModelAssetBundleLoader extends ModelAssetBundleLoader {
  constructor(readonly bundleUrls: Readonly<Record<ModelId, URL>>) {
    super()
  }

  protected override async readCompressedBundle(modelId: ModelId) {
    const bundleUrl = this.bundleUrls[modelId]
    const response = await fetch(bundleUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch tokenizer assets for model ${JSON.stringify(modelId)} from ${JSON.stringify(bundleUrl.href)}: ${response.status} ${response.statusText}`)
    }
    return new Uint8Array(await response.arrayBuffer())
  }
}
