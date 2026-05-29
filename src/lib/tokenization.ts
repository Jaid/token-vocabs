export type TokenizeInput = Uint8Array | string

export type RawTokenizeResultBase = {
  /**
   * array of byte starting offsets for every token after the first one
   *
   * Offsets are measured against the tokenizer’s effective UTF-8 text representation after its built-in normalization and preprocessing. That usually matches the provided input, but tokenizers that normalize or discard characters can shift the reported positions.
   *
   * The array length is equal to the number of tokens minus one, since the first token always starts at byte offset `0` within that effective tokenizer input.
   */
  offsets: Array<number>
  /**
   * array of token IDs in token order
   */
  tokens: Array<number>
}

export type RawTextTokenizeResultExtension = {
  /**
   * the actual input passed to the tokenizer after applying all preprocessing/normalization steps
   *
   * If no such steps are defined by the corresponding tokenizer or they didn’t modify the input, this property is absent.
   */
  processedInput?: string
}

export type RawBinaryTokenizeResultExtension = {
  /**
   * the actual input passed to the tokenizer after applying all preprocessing/normalization steps
   *
   * If no such steps are defined by the corresponding tokenizer or they didn’t modify the input, this property is absent.
   */
  processedInput?: Uint8Array
}

export type RawTokenizeResult<InputGeneric extends TokenizeInput = TokenizeInput> = RawTokenizeResultBase & (InputGeneric extends Uint8Array ? RawBinaryTokenizeResultExtension : RawTextTokenizeResultExtension)
export type RawBinaryTokenizeResult = RawTokenizeResult<Uint8Array>
export type RawTextTokenizeResult = RawTokenizeResult<string>

const utf8TextDecoder = new TextDecoder('utf-8', {fatal: true})
const utf8TextEncoder = new TextEncoder
const toTokenStartOffsets = (tokenByteLengths: ReadonlyArray<number>) => {
  const tokenStartOffsets: Array<number> = []
  let currentOffset = 0
  for (const tokenByteLength of tokenByteLengths) {
    tokenStartOffsets.push(currentOffset)
    currentOffset += tokenByteLength
  }
  return tokenStartOffsets
}

export const toTokenizeText = (input: TokenizeInput) => {
  if (typeof input === 'string') {
    return input
  }
  try {
    return utf8TextDecoder.decode(input)
  } catch {
    throw new TypeError('Tokenizer input bytes must be valid UTF-8.')
  }
}

export const getUtf8ByteLength = (text: string) => {
  return utf8TextEncoder.encode(text).byteLength
}

export const toRawTokenizeResult = <InputGeneric extends TokenizeInput = string>(tokens: ReadonlyArray<number>, tokenStartOffsets: ReadonlyArray<number>, processedInput?: InputGeneric): RawTokenizeResult<InputGeneric> => {
  if (tokens.length !== tokenStartOffsets.length) {
    throw new TypeError(`Expected ${tokens.length} token start offsets, got ${tokenStartOffsets.length}.`)
  }
  const baseResult: RawTokenizeResultBase = {
    offsets: tokenStartOffsets.slice(1),
    tokens: [...tokens],
  }
  if (processedInput === undefined) {
    return baseResult
  }
  return {
    ...baseResult,
    processedInput,
  } as RawTokenizeResult<InputGeneric>
}

export const toRawTokenizeResultFromTokenByteLengths = <InputGeneric extends TokenizeInput = string>(tokens: ReadonlyArray<number>, tokenByteLengths: ReadonlyArray<number>, processedInput?: InputGeneric): RawTokenizeResult<InputGeneric> => {
  if (tokens.length !== tokenByteLengths.length) {
    throw new TypeError(`Expected ${tokens.length} token byte lengths, got ${tokenByteLengths.length}.`)
  }
  return toRawTokenizeResult(tokens, toTokenStartOffsets(tokenByteLengths), processedInput)
}
