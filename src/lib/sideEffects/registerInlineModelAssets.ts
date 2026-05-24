import type {ModelAssetMap} from '../data.ts'

import {modelAssets} from '#root/temp/generated/model-assets/index.ts'

import {registerModelAssetMap} from '../data.ts'
import {prepareEncodedModelAssetsSync} from '../node/modelAssets.ts'

const preparedModelAssets = Object.fromEntries(Object.entries(modelAssets).map(([modelId, files]) => {
  return [modelId, prepareEncodedModelAssetsSync(files)]
})) as ModelAssetMap
registerModelAssetMap(preparedModelAssets)
