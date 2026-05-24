import type {EncodedModelAssetFiles} from '../lib/modelAssets.ts'
import type {ModelId} from '../lib/models.ts'
import type {ModelSelection} from '../lib/modelSelection.ts'

import {getAvailableModelIds, hasModelAssets, registerModelAssets} from '../lib/data.ts'
import {prepareEncodedModelAssets} from '../lib/modelAssets.ts'
import {normalizeModelList} from '../lib/modelSelection.ts'

export {countTokens, default, modelIds, models, tokenize} from '../lib/api.ts'
export type {CountTokensOptions, CountTokensResult, ModelSelection, TokenizeResult} from '../lib/api.ts'
export type {ModelId}

type ModelAssetModule = {
  default: EncodedModelAssetFiles
}

const modelAssetLoaders = {
  deepseek: () => import('./vocabulary/deepseek.ts'),
  gemma: () => import('./vocabulary/gemma.ts'),
  glm: () => import('./vocabulary/glm.ts'),
  gpt: () => import('./vocabulary/gpt.ts'),
  kimi: () => import('./vocabulary/kimi.ts'),
  mimo: () => import('./vocabulary/mimo.ts'),
  minimax: () => import('./vocabulary/minimax.ts'),
  qwen: () => import('./vocabulary/qwen.ts'),
  sdxl: () => import('./vocabulary/sdxl.ts'),
} as const satisfies Record<ModelId, () => Promise<ModelAssetModule>>

export const isModelLoaded = (modelId: ModelId) => {
  return hasModelAssets(modelId)
}

export const getLoadedModelIds = () => {
  return getAvailableModelIds()
}

export const loadModel = async (modelId: ModelId) => {
  if (isModelLoaded(modelId)) {
    return modelId
  }
  const loadedModule = await modelAssetLoaders[modelId]()
  registerModelAssets(modelId, await prepareEncodedModelAssets(loadedModule.default))
  return modelId
}

export const loadModels = async (model?: ModelSelection) => {
  const selectedModels = normalizeModelList(model)
  await Promise.all(selectedModels.map(modelId => loadModel(modelId)))
  return selectedModels
}
