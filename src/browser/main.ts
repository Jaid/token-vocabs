import type {ModelAssetFiles} from '../lib/data.ts'
import type {ModelSelection} from '../lib/model-selection.ts'
import type {ModelId} from '../lib/models.ts'

import {getAvailableModelIds, hasModelAssets, registerModelAssets} from '../lib/data.ts'
import {normalizeModelList} from '../lib/model-selection.ts'

export {countTokens, default, modelIds, models, tokenize} from '../lib/api.ts'
export type {CountTokensOptions, CountTokensResult, ModelSelection, TokenizeResult} from '../lib/api.ts'
export type {ModelId}

type ModelAssetModule = {
  default: ModelAssetFiles
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
  registerModelAssets(modelId, loadedModule.default)
  return modelId
}

export const loadModels = async (model?: ModelSelection) => {
  const selectedModels = normalizeModelList(model)
  await Promise.all(selectedModels.map(modelId => loadModel(modelId)))
  return selectedModels
}
