import {load} from './main.ts'

await load()

export {count, countLoaded, default, free, load, modelIds, models, tokenize, tokenizeLoaded} from './main.ts'
export type {CountOptions, CountResult, CountTokensOptions, CountTokensResult, ModelId, ModelSelection, RawTokenizeResult, TokenizeInput, TokenizeOptions, TokenizeResult} from './main.ts'
