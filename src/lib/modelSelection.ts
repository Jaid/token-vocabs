import type {ModelId} from './models.ts'

import {modelIds} from './models.ts'

export type Arrayable<T> = ReadonlyArray<T> | T
export type ModelSelection = Arrayable<ModelId>

export const normalizeModelList = (model?: ModelSelection) => {
  const listedModels: Array<ModelId> = [...modelIds]
  if (model !== undefined) {
    listedModels.length = 0
    if (typeof model === 'string') {
      listedModels.push(model)
    } else {
      listedModels.push(...model)
    }
  }
  for (const modelId of listedModels) {
    if (!modelIds.includes(modelId)) {
      throw new Error(`Unknown model ${JSON.stringify(modelId)}. Supported models: ${modelIds.join(', ')}`)
    }
  }
  return listedModels
}
