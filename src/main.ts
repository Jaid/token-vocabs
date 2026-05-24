import type {ModelId} from '#src/lib/models.ts'

import {modelIds, models} from '#src/lib/models.ts'
import {getTokenizer} from '#src/lib/tokenizers/index.ts'

export type TokenizeResult = Record<ModelId, Array<number>>

export type CountTokensResult = Record<ModelId, number>
export type ModelSelection = Arrayable<ModelId>
export type CountTokensOptions<TModel extends ModelSelection | undefined = undefined> = {
  model?: TModel
}
type Arrayable<T> = ReadonlyArray<T> | T

const normalizeModelList = (model?: ModelSelection) => {
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
const resolveSelectedModels = (optionsOrModel?: CountTokensOptions<ModelSelection> | ModelId) => {
  if (typeof optionsOrModel === 'string') {
    const [selectedModel] = normalizeModelList(optionsOrModel)
    return {
      isSingleModel: true,
      models: [selectedModel],
    }
  }
  const model = optionsOrModel?.model
  return {
    isSingleModel: typeof model === 'string',
    models: normalizeModelList(model),
  }
}
const tokenizeInternal = (text: string, optionsOrModel?: CountTokensOptions<ModelSelection> | ModelId): Array<number> | Partial<TokenizeResult> | TokenizeResult => {
  const {isSingleModel, models: selectedModels} = resolveSelectedModels(optionsOrModel)
  if (isSingleModel) {
    const [selectedModel] = selectedModels
    return getTokenizer(selectedModel).encode(text)
  }
  return Object.fromEntries(selectedModels.map(modelId => [modelId, getTokenizer(modelId).encode(text)]))
}

export function tokenize<TModel extends ModelId>(text: string, model: TModel): Array<number>
export function tokenize<TModels extends ReadonlyArray<ModelId>>(text: string, options: CountTokensOptions<TModels>): Pick<TokenizeResult, TModels[number]>
export function tokenize<TModel extends ModelId>(text: string, options: CountTokensOptions<TModel>): Array<number>
export function tokenize(text: string, options?: CountTokensOptions<ReadonlyArray<ModelId>>): TokenizeResult
export function tokenize(text: string, optionsOrModel?: CountTokensOptions<ModelSelection> | ModelId): Array<number> | Partial<TokenizeResult> | TokenizeResult {
  return tokenizeInternal(text, optionsOrModel)
}

export function countTokens<TModel extends ModelId>(text: string, model: TModel): number
export function countTokens<TModels extends ReadonlyArray<ModelId>>(text: string, options: CountTokensOptions<TModels>): Pick<CountTokensResult, TModels[number]>
export function countTokens<TModel extends ModelId>(text: string, options: CountTokensOptions<TModel>): number
export function countTokens(text: string, options?: CountTokensOptions<ReadonlyArray<ModelId>>): CountTokensResult
export function countTokens(text: string, optionsOrModel?: CountTokensOptions<ModelSelection> | ModelId): CountTokensResult | Partial<CountTokensResult> | number {
  const tokenIds = tokenizeInternal(text, optionsOrModel)
  if (Array.isArray(tokenIds)) {
    return tokenIds.length
  }
  return Object.fromEntries(Object.entries(tokenIds).map(([modelId, ids]) => [modelId, ids.length]))
}

export {modelIds, models}
export default countTokens
export type {ModelId}
