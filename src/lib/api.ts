import type {ModelId} from './models.ts'
import type {RawTokenizeResult, TokenizeInput} from './tokenization.ts'

import {modelIds, models} from './models.ts'
import {normalizeModelList} from './modelSelection.ts'
import {getTokenizer} from './tokenizers/index.ts'

export type {ModelSelection} from './modelSelection.ts'

export type CountTokensResult = number
export type TokenizeResult<InputGeneric extends TokenizeInput = TokenizeInput> = RawTokenizeResult<InputGeneric>

export type TokenizeOptions<TModel extends ModelId = ModelId> = SingleModelOptions<TModel>

export type CountTokensOptions<TModel extends ModelId = ModelId> = SingleModelOptions<TModel>
type SingleModelOptions<TModel extends ModelId = ModelId> = {
  model: TModel
}

const resolveSelectedModel = (functionName: 'countTokens' | 'tokenize', optionsOrModel?: ModelId | SingleModelOptions) => {
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

export function tokenize<InputGeneric extends TokenizeInput, TModel extends ModelId>(input: InputGeneric, model: TModel): RawTokenizeResult<InputGeneric>
export function tokenize<InputGeneric extends TokenizeInput, TModel extends ModelId>(input: InputGeneric, options: TokenizeOptions<TModel>): RawTokenizeResult<InputGeneric>
export function tokenize(input: TokenizeInput, optionsOrModel?: ModelId | TokenizeOptions): RawTokenizeResult {
  return getTokenizer(resolveSelectedModel('tokenize', optionsOrModel)).tokenize(input)
}

export function countTokens<TModel extends ModelId>(input: TokenizeInput, model: TModel): CountTokensResult
export function countTokens<TModel extends ModelId>(input: TokenizeInput, options: CountTokensOptions<TModel>): CountTokensResult
export function countTokens(input: TokenizeInput, optionsOrModel?: CountTokensOptions | ModelId): CountTokensResult {
  return getTokenizer(resolveSelectedModel('countTokens', optionsOrModel)).getTokenCount(input)
}

export {modelIds, models}
export default countTokens
export type {ModelId}
export type {RawTokenizeResult, TokenizeInput} from './tokenization.ts'
