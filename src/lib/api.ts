import type {ModelId} from './models.ts'
import type {ModelSelection} from './modelSelection.ts'
import type {RawTokenizeResult, TokenizeInput} from './tokenization.ts'

import {freeModelAssets, loadModelAssets} from './data.ts'
import {modelIds, models} from './models.ts'
import {normalizeModelList} from './modelSelection.ts'
import {freeTokenizers, getTokenizer} from './tokenizers/index.ts'

export type {ModelSelection} from './modelSelection.ts'

export type CountResult = number
export type CountTokensResult = CountResult
export type TokenizeResult<InputGeneric extends TokenizeInput = TokenizeInput> = RawTokenizeResult<InputGeneric>

export type TokenizeOptions<TModel extends ModelId = ModelId> = SingleModelOptions<TModel>

export type CountOptions<TModel extends ModelId = ModelId> = SingleModelOptions<TModel>
export type CountTokensOptions<TModel extends ModelId = ModelId> = CountOptions<TModel>
type SingleModelOptions<TModel extends ModelId = ModelId> = {
  model: TModel
}

const resolveSelectedModel = (functionName: 'count' | 'countLoaded' | 'tokenize' | 'tokenizeLoaded', optionsOrModel?: ModelId | SingleModelOptions) => {
  if (typeof optionsOrModel === 'string') {
    const [selectedModel] = normalizeModelList(optionsOrModel)
    return selectedModel
  }
  const model = optionsOrModel?.model
  if (typeof model !== 'string') {
    throw new TypeError(`${functionName}() requires a single model ID as the second argument.`)
  }
  const [selectedModel] = normalizeModelList(model)
  return selectedModel
}

export function tokenizeLoaded<InputGeneric extends TokenizeInput, TModel extends ModelId>(input: InputGeneric, model: TModel): RawTokenizeResult<InputGeneric>
export function tokenizeLoaded<InputGeneric extends TokenizeInput, TModel extends ModelId>(input: InputGeneric, options: TokenizeOptions<TModel>): RawTokenizeResult<InputGeneric>
export function tokenizeLoaded(input: TokenizeInput, optionsOrModel?: ModelId | TokenizeOptions): RawTokenizeResult {
  return getTokenizer(resolveSelectedModel('tokenizeLoaded', optionsOrModel)).tokenize(input)
}

export function countLoaded<TModel extends ModelId>(input: TokenizeInput, model: TModel): CountResult
export function countLoaded<TModel extends ModelId>(input: TokenizeInput, options: CountOptions<TModel>): CountResult
export function countLoaded(input: TokenizeInput, optionsOrModel?: CountOptions | ModelId): CountResult {
  return getTokenizer(resolveSelectedModel('countLoaded', optionsOrModel)).getTokenCount(input)
}

export function load<TModel extends ModelId>(model: TModel): Promise<TModel>
export function load(model?: ModelSelection): Promise<Array<ModelId>>
export async function load(model?: ModelSelection) {
  const selectedModels = normalizeModelList(model)
  await loadModelAssets(selectedModels)
  if (typeof model === 'string') {
    return selectedModels[0]
  }
  return selectedModels
}

export function tokenize<InputGeneric extends TokenizeInput, TModel extends ModelId>(input: InputGeneric, model: TModel): Promise<RawTokenizeResult<InputGeneric>>
export function tokenize<InputGeneric extends TokenizeInput, TModel extends ModelId>(input: InputGeneric, options: TokenizeOptions<TModel>): Promise<RawTokenizeResult<InputGeneric>>
export async function tokenize(input: TokenizeInput, optionsOrModel?: ModelId | TokenizeOptions): Promise<RawTokenizeResult> {
  const selectedModel = resolveSelectedModel('tokenize', optionsOrModel)
  await load(selectedModel)
  return tokenizeLoaded(input, selectedModel)
}

export function count<TModel extends ModelId>(input: TokenizeInput, model: TModel): Promise<CountResult>
export function count<TModel extends ModelId>(input: TokenizeInput, options: CountOptions<TModel>): Promise<CountResult>
export async function count(input: TokenizeInput, optionsOrModel?: CountOptions | ModelId): Promise<CountResult> {
  const selectedModel = resolveSelectedModel('count', optionsOrModel)
  await load(selectedModel)
  return countLoaded(input, selectedModel)
}

export const free = (modelId?: ModelId) => {
  freeModelAssets(modelId)
  freeTokenizers(modelId)
}

export {modelIds, models}
export default tokenize
export type {ModelId}
export type {RawTokenizeResult, TokenizeInput} from './tokenization.ts'
