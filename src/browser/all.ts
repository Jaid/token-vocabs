import {registerModelAssetMap} from '../lib/data.ts'
import {prepareEncodedModelAssets} from '../lib/modelAssets.ts'
import deepseek from './vocabulary/deepseek.ts'
import gemma from './vocabulary/gemma.ts'
import glm from './vocabulary/glm.ts'
import gpt from './vocabulary/gpt.ts'
import kimi from './vocabulary/kimi.ts'
import mimo from './vocabulary/mimo.ts'
import minimax from './vocabulary/minimax.ts'
import qwen from './vocabulary/qwen.ts'
import sdxl from './vocabulary/sdxl.ts'

const [preparedDeepseek, preparedGemma, preparedGlm, preparedGpt, preparedKimi, preparedMimo, preparedMinimax, preparedQwen, preparedSdxl] = await Promise.all([
  prepareEncodedModelAssets(deepseek),
  prepareEncodedModelAssets(gemma),
  prepareEncodedModelAssets(glm),
  prepareEncodedModelAssets(gpt),
  prepareEncodedModelAssets(kimi),
  prepareEncodedModelAssets(mimo),
  prepareEncodedModelAssets(minimax),
  prepareEncodedModelAssets(qwen),
  prepareEncodedModelAssets(sdxl),
])
registerModelAssetMap({
  deepseek: preparedDeepseek,
  gemma: preparedGemma,
  glm: preparedGlm,
  gpt: preparedGpt,
  kimi: preparedKimi,
  mimo: preparedMimo,
  minimax: preparedMinimax,
  qwen: preparedQwen,
  sdxl: preparedSdxl,
})

export {countTokens, default, getLoadedModelIds, isModelLoaded, loadModel, loadModels, modelIds, models, tokenize} from './main.ts'
export type {CountTokensOptions, CountTokensResult, ModelId, ModelSelection, TokenizeResult} from './main.ts'
