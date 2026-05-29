import type {ModelId} from '../models.ts'
import type {RawTextTokenizeResult} from '../tokenization.ts'

import {readModelMsgpackFile, readModelTextFile} from '../data.ts'
import {getUtf8ByteLength, toRawTokenizeResult} from '../tokenization.ts'
import {BaseTokenizer} from './base/BaseTokenizer.ts'

type ClipTokenizerState = {
  byteEncoder: Array<string>
  mergeRanks: Map<string, number>
  specialTokenIds: Map<string, number>
  unknownTokenId: number
  vocabulary: Map<string, number>
}

const clipPattern = /<\|startoftext\|>|<\|endoftext\|>|'d|'ll|'m|'re|'s|'t|'ve|\p{L}+|\p{N}|[^\s\p{L}\p{N}]+/gu
const clipWordSuffixPattern = /<\/w>$/u
const whitespacePattern = /\s+/gu
const textEncoder = new TextEncoder
const toTokenContent = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }
  if (value instanceof Map) {
    const content = value.get('content') as unknown
    if (typeof content === 'string') {
      return content
    }
  }
  if (value && typeof value === 'object' && 'content' in value && typeof value.content === 'string') {
    return value.content
  }
}
const createByteEncoder = (): Array<string> => {
  const byteEncoder = Array.from({length: 256}, () => '')
  const bytes = [
    ...Array.from({length: 94}, (_, index) => index + 33),
    ...Array.from({length: 12}, (_, index) => index + 161),
    ...Array.from({length: 82}, (_, index) => index + 174),
  ]
  const codePoints = [...bytes]
  let extraCodePoint = 256
  for (let byte = 0; byte < 256; byte++) {
    if (!bytes.includes(byte)) {
      bytes.push(byte)
      codePoints.push(extraCodePoint)
      extraCodePoint++
    }
  }
  for (const [index, byte] of bytes.entries()) {
    byteEncoder[byte] = String.fromCodePoint(codePoints[index])
  }
  return byteEncoder
}
const createMergeRanks = (mergesText: string) => {
  const mergeRanks = new Map<string, number>
  for (const [index, mergeLine] of mergesText.split(/\r?\n/u).filter(Boolean).filter(entry => !entry.startsWith('#')).entries()) {
    mergeRanks.set(mergeLine, index)
  }
  return mergeRanks
}
const normalizeText = (text: string) => {
  return text.normalize('NFC').replaceAll(whitespacePattern, ' ').trim().toLowerCase()
}
const toClipTokenByteLength = (token: string) => {
  return [...token.replace(clipWordSuffixPattern, '')].length
}
const withProcessedInput = (result: RawTextTokenizeResult, originalInput: string, processedInput: string) => {
  if (processedInput === originalInput) {
    return result
  }
  return {
    ...result,
    processedInput,
  }
}

export class ClipTokenizer extends BaseTokenizer<ClipTokenizerState> {
  readonly #bpeCache = new Map<string, Array<string>>

  constructor(readonly modelId: ModelId) {
    super()
  }

  protected override createState() {
    const vocabulary = readModelMsgpackFile<Map<string, number>>(this.modelId, 'vocab.msgpack')
    const tokenizerConfig = readModelMsgpackFile<Map<string, unknown>>(this.modelId, 'tokenizer_config.msgpack')
    const specialTokenIds = new Map<string, number>
    const unknownTokenContent = toTokenContent(tokenizerConfig.get('unk_token')) ?? '<|endoftext|>'
    const unknownTokenId = vocabulary.get(unknownTokenContent)
    if (unknownTokenId === undefined) {
      throw new Error(`Could not find CLIP unknown token ${JSON.stringify(unknownTokenContent)} in ${JSON.stringify(this.modelId)} vocabulary.`)
    }
    for (const value of [tokenizerConfig.get('bos_token'), tokenizerConfig.get('eos_token'), tokenizerConfig.get('unk_token')]) {
      const content = toTokenContent(value)
      if (!content) {
        continue
      }
      const tokenId = vocabulary.get(content)
      if (tokenId !== undefined) {
        specialTokenIds.set(content, tokenId)
      }
    }
    return {
      byteEncoder: createByteEncoder(),
      mergeRanks: createMergeRanks(readModelTextFile(this.modelId, 'merges.txt')),
      specialTokenIds,
      unknownTokenId,
      vocabulary,
    }
  }

  protected override encodeWithState(text: string, state: ClipTokenizerState) {
    return this.tokenizeWithState(text, state).tokens
  }

  protected override tokenizeWithState(text: string, state: ClipTokenizerState) {
    const normalizedText = normalizeText(text)
    if (!normalizedText) {
      return withProcessedInput({
        offsets: [],
        tokens: [],
      }, text, normalizedText)
    }
    const tokenIds: Array<number> = []
    const tokenStartOffsets: Array<number> = []
    let currentByteOffset = 0
    let previousMatchEnd = 0
    for (const match of normalizedText.matchAll(clipPattern)) {
      const piece = match[0]
      const pieceOffset = match.index
      currentByteOffset += getUtf8ByteLength(normalizedText.slice(previousMatchEnd, pieceOffset))
      const tokenStartOffset = currentByteOffset
      const specialTokenId = state.specialTokenIds.get(piece)
      if (specialTokenId !== undefined) {
        tokenIds.push(specialTokenId)
        tokenStartOffsets.push(tokenStartOffset)
        currentByteOffset += getUtf8ByteLength(piece)
        previousMatchEnd = pieceOffset + piece.length
        continue
      }
      const encodedPiece = Array.from(textEncoder.encode(piece), byte => state.byteEncoder[byte]).join('')
      let localByteOffset = 0
      for (const token of this.#applyBpe(encodedPiece, state.mergeRanks)) {
        tokenIds.push(state.vocabulary.get(token) ?? state.unknownTokenId)
        tokenStartOffsets.push(tokenStartOffset + localByteOffset)
        localByteOffset += toClipTokenByteLength(token)
      }
      currentByteOffset += getUtf8ByteLength(piece)
      previousMatchEnd = pieceOffset + piece.length
    }
    return withProcessedInput(toRawTokenizeResult(tokenIds, tokenStartOffsets), text, normalizedText)
  }

  #applyBpe(token: string, mergeRanks: Map<string, number>) {
    const cached = this.#bpeCache.get(token)
    if (cached) {
      return cached
    }
    const characters = [...token]
    if (!characters.length) {
      const result: Array<string> = []
      this.#bpeCache.set(token, result)
      return result
    }
    let word = [...characters.slice(0, -1), `${characters.at(-1)!}</w>`]
    while (word.length > 1) {
      let bestPairIndex = -1
      let bestPairRank = Number.POSITIVE_INFINITY
      for (let index = 0; index < word.length - 1; index++) {
        const rank = mergeRanks.get(`${word[index]} ${word[index + 1]}`)
        if (rank !== undefined && rank < bestPairRank) {
          bestPairRank = rank
          bestPairIndex = index
        }
      }
      if (bestPairIndex < 0) {
        break
      }
      const mergedWord: Array<string> = []
      for (let index = 0; index < word.length; index++) {
        if (index === bestPairIndex) {
          mergedWord.push(`${word[index]}${word[index + 1]}`)
          index++
          continue
        }
        mergedWord.push(word[index])
      }
      word = mergedWord
    }
    this.#bpeCache.set(token, word)
    return word
  }
}
