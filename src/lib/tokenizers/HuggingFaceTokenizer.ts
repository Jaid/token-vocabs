import type {ModelId} from '../models.ts'

import {Tokenizer} from '@huggingface/tokenizers'

import {readModelMsgpackFile} from '../data.ts'
import {toPlainObject} from '../structuredData.ts'
import {getUtf8ByteLength, toRawTokenizeResultFromTokenByteLengths} from '../tokenization.ts'
import {BaseTokenizer} from './base/BaseTokenizer.ts'

type HfEncodeResult = {
  ids: Array<number>
  tokens: Array<string>
}
type HfEncodeOptions = {add_special_tokens?: boolean}
type HfDecodeOptions = {
  clean_up_tokenization_spaces?: boolean
  skip_special_tokens?: boolean
}
type HfTokenizer = {
  decode: (tokenIds: Array<number>, options?: HfDecodeOptions) => string
  encode: (text: string, options?: HfEncodeOptions) => HfEncodeResult
}
type TokenizerState = {tokenizer: HfTokenizer}

const TokenizerConstructor = Tokenizer as unknown as new (tokenizerJson: unknown, tokenizerConfig: unknown) => HfTokenizer
const byteFallbackTokenPattern = /^<0x[0-9A-F]{2}>$/u
const encodeOptions = {add_special_tokens: false} as const
const decodeOptions = {
  clean_up_tokenization_spaces: false,
  skip_special_tokens: false,
} as const
const getTokenByteLength = (tokenizer: HfTokenizer, tokenId: number, token: string) => {
  if (byteFallbackTokenPattern.test(token)) {
    return 1
  }
  const decoded = tokenizer.decode([tokenId], decodeOptions)
  if (decoded.includes('�')) {
    return [...token].length
  }
  return getUtf8ByteLength(decoded)
}

export class HuggingFaceTokenizer extends BaseTokenizer<TokenizerState> {
  constructor(readonly modelId: ModelId) {
    super()
  }

  protected override createState() {
    const tokenizerJson = toPlainObject(readModelMsgpackFile<unknown>(this.modelId, 'tokenizer.msgpack'))
    const tokenizerConfig = toPlainObject(readModelMsgpackFile<unknown>(this.modelId, 'tokenizer_config.msgpack'))
    return {tokenizer: new TokenizerConstructor(tokenizerJson, tokenizerConfig)}
  }

  protected override encodeWithState(text: string, state: TokenizerState) {
    return [...state.tokenizer.encode(text, encodeOptions).ids]
  }

  protected override tokenizeWithState(text: string, state: TokenizerState) {
    const {ids, tokens} = state.tokenizer.encode(text, encodeOptions)
    const tokenIds = [...ids]
    const tokenByteLengths = tokenIds.map((tokenId, index) => getTokenByteLength(state.tokenizer, tokenId, tokens[index]))
    const decodedInput = tokenIds.length ? state.tokenizer.decode(tokenIds, decodeOptions) : ''
    return toRawTokenizeResultFromTokenByteLengths(tokenIds, tokenByteLengths, decodedInput === text ? undefined : decodedInput)
  }
}
