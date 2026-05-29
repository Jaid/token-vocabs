import {expect, test} from 'bun:test'

import countTokens, {countTokens as countTokensNamed, modelIds, models, tokenize} from '#src/main.ts'

const sampleText = 'mind goblin'
const expectedTokenIds = {
  gpt: [77_021, 18_778, 4724],
  gemma: [24_447, 218_798],
  qwen: [36_475, 338, 45_491],
  kimi: [66_468, 970, 3145, 259],
  deepseek: [60_514, 807, 3778, 261],
  mimo: [37_724, 342, 47_061],
  sdxl: [2575, 26_223],
  glm: [37_528, 342, 46_771],
  minimax: [68_201, 113_859, 259],
} as const
const textEncoder = new TextEncoder
const denormalizedSdxlInput = ' MIND\tGoblin '
const normalizedSdxlInput = 'mind goblin'
const invalidUtf8Bytes = Uint8Array.of(0xFF)
const sampleTextBytes = textEncoder.encode(sampleText)
const denormalizedSdxlInputBytes = textEncoder.encode(denormalizedSdxlInput)
const normalizedSdxlInputBytes = textEncoder.encode(normalizedSdxlInput)
const expectedTokenEntries = Object.entries(expectedTokenIds)
test('exports the documented models and metadata', () => {
  expect(modelIds).toEqual(['gpt', 'gemma', 'qwen', 'kimi', 'deepseek', 'mimo', 'sdxl', 'glm', 'minimax'])
  expect(Object.keys(models)).toEqual(modelIds)
  expect(countTokensNamed).toBe(countTokens)
})
test('tokenize returns exact token IDs for all models', () => {
  for (const [modelId, tokenIds] of expectedTokenEntries) {
    expect(tokenize(sampleText, modelId as keyof typeof expectedTokenIds).tokens).toEqual(tokenIds)
  }
}, 30_000)
test('countTokens returns exact counts for all models', () => {
  for (const [modelId, tokenIds] of expectedTokenEntries) {
    expect(countTokens(sampleText, modelId as keyof typeof expectedTokenIds)).toBe(tokenIds.length)
  }
}, 30_000)
test('countTokens supports model IDs and options objects', () => {
  expect(countTokens(sampleText, 'sdxl')).toBe(2)
  expect(countTokens(sampleText, {model: 'gpt'})).toBe(3)
})
test('tokenize returns raw token data for the selected model', () => {
  expect(tokenize(sampleText, 'gpt')).toEqual({
    offsets: [4, 8],
    tokens: [77_021, 18_778, 4724],
  })
  expect(tokenize(sampleText, {model: 'gpt'})).toEqual({
    offsets: [4, 8],
    tokens: [77_021, 18_778, 4724],
  })
})
test('counts match tokenize lengths for a broader sample', () => {
  const text = 'Hello, world! 你好 123'
  for (const modelId of modelIds) {
    const tokenization = tokenize(text, modelId)
    expect(countTokens(text, modelId)).toBe(tokenization.tokens.length)
  }
})
test('empty text stays empty across all tokenizers', () => {
  for (const modelId of modelIds) {
    expect(tokenize('', modelId)).toEqual({
      offsets: [],
      tokens: [],
    })
    expect(countTokens('', modelId)).toBe(0)
  }
})
test('supports UTF-8 byte input', () => {
  expect(countTokens(sampleTextBytes, 'gpt')).toBe(3)
  expect(tokenize(sampleTextBytes, 'gpt')).toEqual({
    offsets: [4, 8],
    tokens: [77_021, 18_778, 4724],
  })
})
test('rejects invalid UTF-8 byte input', () => {
  expect(() => countTokens(invalidUtf8Bytes, 'gpt')).toThrow('valid UTF-8')
  expect(() => tokenize(invalidUtf8Bytes, 'gpt')).toThrow('valid UTF-8')
})
test('reports normalized CLIP input when preprocessing changes it', () => {
  expect(tokenize(denormalizedSdxlInput, 'sdxl')).toEqual({
    offsets: [5],
    processedInput: normalizedSdxlInput,
    tokens: [2575, 26_223],
  })
  expect(tokenize(denormalizedSdxlInputBytes, 'sdxl')).toEqual({
    offsets: [5],
    processedInput: normalizedSdxlInputBytes,
    tokens: [2575, 26_223],
  })
})
test('throws on unsupported model selections', () => {
  expect(() => countTokens(sampleText, {model: ['gpt', 'deepseek'] as never})).toThrow('requires a single model ID')
  expect(() => tokenize(sampleText, {model: ['gpt', 'deepseek'] as never})).toThrow('requires a single model ID')
  expect(() => countTokens(sampleText, {model: 'bogus' as never})).toThrow('Unknown model')
  expect(() => tokenize(sampleText, 'bogus' as never)).toThrow('Unknown model')
})
