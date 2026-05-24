import {registerModelAssetMap} from '../lib/data.ts'
import deepseek from './vocabulary/deepseek.ts'
import gemma from './vocabulary/gemma.ts'
import glm from './vocabulary/glm.ts'
import gpt from './vocabulary/gpt.ts'
import kimi from './vocabulary/kimi.ts'
import mimo from './vocabulary/mimo.ts'
import minimax from './vocabulary/minimax.ts'
import qwen from './vocabulary/qwen.ts'
import sdxl from './vocabulary/sdxl.ts'

registerModelAssetMap({
  deepseek,
  gemma,
  glm,
  gpt,
  kimi,
  mimo,
  minimax,
  qwen,
  sdxl,
})

export {countTokens, default, getLoadedModelIds, isModelLoaded, loadModel, loadModels, modelIds, models, tokenize} from './main.ts'
export type {CountTokensOptions, CountTokensResult, ModelId, ModelSelection, TokenizeResult} from './main.ts'
