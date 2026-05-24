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
const expectedCounts = Object.fromEntries(Object.entries(expectedTokenIds).map(([modelId, tokenIds]) => [modelId, tokenIds.length]))
test('exports the documented models and metadata', () => {
  expect(modelIds).toEqual(['gpt', 'gemma', 'qwen', 'kimi', 'deepseek', 'mimo', 'sdxl', 'glm', 'minimax'])
  expect(Object.keys(models)).toEqual(modelIds)
  expect(countTokensNamed).toBe(countTokens)
})
test('tokenize returns exact token IDs for all models', () => {
  expect(tokenize(sampleText)).toEqual(expectedTokenIds)
}, 30_000)
test('countTokens returns exact counts for all models', () => {
  expect(countTokens(sampleText)).toEqual(expectedCounts)
}, 30_000)
test('countTokens supports selecting one or more models', () => {
  expect(countTokens(sampleText, 'sdxl')).toBe(2)
  expect(countTokens(sampleText, {model: 'gpt'})).toBe(3)
  expect(countTokens(sampleText, {model: ['gpt', 'deepseek']})).toEqual({
    gpt: 3,
    deepseek: 4,
  })
})
test('tokenize supports selecting one or more models', () => {
  expect(tokenize(sampleText, 'sdxl')).toEqual([2575, 26_223])
  expect(tokenize(sampleText, {model: 'gpt'})).toEqual([77_021, 18_778, 4724])
  expect(tokenize(sampleText, {model: ['gpt', 'deepseek']})).toEqual({
    gpt: [77_021, 18_778, 4724],
    deepseek: [60_514, 807, 3778, 261],
  })
})
test('counts match tokenize lengths for a broader sample', () => {
  const text = 'Hello, world! 你好 123'
  const tokenIds = tokenize(text)
  const counts = countTokens(text)
  for (const modelId of modelIds) {
    expect(counts[modelId]).toBe(tokenIds[modelId].length)
  }
})
test('empty text stays empty across all tokenizers', () => {
  expect(tokenize('')).toEqual({
    gpt: [],
    gemma: [],
    qwen: [],
    kimi: [],
    deepseek: [],
    mimo: [],
    sdxl: [],
    glm: [],
    minimax: [],
  })
  expect(countTokens('')).toEqual({
    gpt: 0,
    gemma: 0,
    qwen: 0,
    kimi: 0,
    deepseek: 0,
    mimo: 0,
    sdxl: 0,
    glm: 0,
    minimax: 0,
  })
})
test('throws on unknown models', () => {
  expect(() => countTokens(sampleText, {model: 'bogus' as never})).toThrow('Unknown model')
  expect(() => tokenize(sampleText, 'bogus' as never)).toThrow('Unknown model')
})
