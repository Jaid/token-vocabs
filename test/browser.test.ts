import {expect, test} from 'bun:test'
import path from 'node:path'

const rootFolder = path.resolve(import.meta.dirname, '..')
test('browser entry lazily loads selected vocabularies', async () => {
  const script = [
    'globalThis.DecompressionStream = undefined',
    'const {countTokens, getLoadedModelIds, isModelLoaded, loadModels, tokenize} = await import(\'token-vocabs/browser\')',
    'const sampleText = \'mind goblin\'',
    'let missingAssetError = \'\'',
    'try {',
    '  tokenize(sampleText, \'gpt\')',
    '} catch (error) {',
    '  missingAssetError = error instanceof Error ? error.message : String(error)',
    '}',
    'const initiallyLoadedModelIds = getLoadedModelIds()',
    'const loadedModels = await loadModels([\'gpt\', \'deepseek\'])',
    'console.log(JSON.stringify({',
    '  count: countTokens(sampleText, {model: \'deepseek\'}),',
    '  deepseekLoaded: isModelLoaded(\'deepseek\'),',
    '  gptLoaded: isModelLoaded(\'gpt\'),',
    '  initiallyLoadedModelIds,',
    '  loadedModelIds: getLoadedModelIds(),',
    '  loadedModels,',
    '  missingAssetError,',
    '  tokenization: tokenize(sampleText, \'gpt\'),',
    '}))',
  ].join('\n')
  const browserProcess = Bun.spawn(['bun', '--eval', script], {
    cwd: rootFolder,
    stderr: 'pipe',
    stdout: 'pipe',
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(browserProcess.stdout).text(),
    new Response(browserProcess.stderr).text(),
    browserProcess.exited,
  ])
  expect(exitCode).toBe(0)
  expect(stderr).toBe('')
  expect(JSON.parse(stdout)).toEqual({
    count: 4,
    deepseekLoaded: true,
    gptLoaded: true,
    initiallyLoadedModelIds: [],
    loadedModelIds: ['gpt', 'deepseek'],
    loadedModels: ['gpt', 'deepseek'],
    missingAssetError: 'Missing tokenizer assets for model "gpt". Run “bun run fetch” first or load the vocabulary chunk before tokenizing.',
    tokenization: {
      offsets: [4, 8],
      tokens: [77_021, 18_778, 4724],
    },
  })
}, 30_000)
test('browser/all eagerly loads every vocabulary', async () => {
  const script = [
    'globalThis.DecompressionStream = undefined',
    'const {default: countTokens, getLoadedModelIds, tokenize} = await import("token-vocabs/browser/all")',
    'console.log(JSON.stringify({',
    '  count: countTokens(\'mind goblin\', \'deepseek\'),',
    '  loadedModelIds: getLoadedModelIds(),',
    '  tokenization: tokenize(\'mind goblin\', \'gpt\'),',
    '}))',
  ].join('\n')
  const browserProcess = Bun.spawn(['bun', '--eval', script], {
    cwd: rootFolder,
    stderr: 'pipe',
    stdout: 'pipe',
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(browserProcess.stdout).text(),
    new Response(browserProcess.stderr).text(),
    browserProcess.exited,
  ])
  expect(exitCode).toBe(0)
  expect(stderr).toBe('')
  expect(JSON.parse(stdout)).toEqual({
    count: 4,
    loadedModelIds: ['gpt', 'gemma', 'qwen', 'kimi', 'deepseek', 'mimo', 'sdxl', 'glm', 'minimax'],
    tokenization: {
      offsets: [4, 8],
      tokens: [77_021, 18_778, 4724],
    },
  })
}, 30_000)
