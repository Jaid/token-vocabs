import type {ModelId} from '../models.ts'

import {models} from '../models.ts'
import {ClipTokenizer} from './ClipTokenizer.ts'
import {HuggingFaceTokenizer} from './HuggingFaceTokenizer.ts'
import {BuiltinTiktokenTokenizer, CustomTiktokenTokenizer} from './TiktokenTokenizer.ts'

type TokenizerLike = {
  encode: (text: string) => Array<number>
  getTokenCount: (text: string) => number
}

const tokenizerCache = new Map<ModelId, TokenizerLike>

export const getTokenizer = (modelId: ModelId) => {
  const cached = tokenizerCache.get(modelId)
  if (cached) {
    return cached
  }
  const model = models[modelId]
  let tokenizer: TokenizerLike
  switch (model.kind) {
    case 'tiktoken-builtin': {
      tokenizer = new BuiltinTiktokenTokenizer(modelId)
      break
    }
    case 'tiktoken-custom': {
      tokenizer = new CustomTiktokenTokenizer(modelId)
      break
    }
    case 'huggingface': {
      tokenizer = new HuggingFaceTokenizer(modelId)
      break
    }
    case 'clip-bpe': {
      tokenizer = new ClipTokenizer(modelId)
      break
    }
  }
  tokenizerCache.set(modelId, tokenizer)
  return tokenizer
}
