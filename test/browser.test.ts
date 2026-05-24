import {expect, test} from 'bun:test'
import path from 'node:path'

const rootFolder = path.resolve(import.meta.dirname, '..')
test('browser entry lazily loads selected vocabularies', async () => {
  const script = [
    'globalThis.DecompressionStream = undefined',
    'const {countTokens, getLoadedModelIds, isModelLoaded, loadModels, tokenize} = await import(\'tomni/browser\')',
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
    '  counts: countTokens(sampleText, {model: [\'gpt\', \'deepseek\']}),',
    '  deepseekLoaded: isModelLoaded(\'deepseek\'),',
    '  gptLoaded: isModelLoaded(\'gpt\'),',
    '  initiallyLoadedModelIds,',
    '  loadedModelIds: getLoadedModelIds(),',
    '  loadedModels,',
    '  missingAssetError,',
    '  tokenIds: tokenize(sampleText, \'gpt\'),',
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
    counts: {
      deepseek: 4,
      gpt: 3,
    },
    deepseekLoaded: true,
    gptLoaded: true,
    initiallyLoadedModelIds: [],
    loadedModelIds: ['gpt', 'deepseek'],
    loadedModels: ['gpt', 'deepseek'],
    missingAssetError: 'Missing tokenizer assets for model "gpt". Run “bun run fetch” first or load the vocabulary chunk before tokenizing.',
    tokenIds: [77_021, 18_778, 4724],
  })
}, 30_000)
test('browser/all eagerly loads every vocabulary', async () => {
  const script = [
    'globalThis.DecompressionStream = undefined',
    'const {default: countTokens, getLoadedModelIds, tokenize} = await import("tomni/browser/all")',
    'console.log(JSON.stringify({',
    '  counts: countTokens(\'mind goblin\', {model: [\'gpt\', \'deepseek\']}),',
    '  loadedModelIds: getLoadedModelIds(),',
    '  tokenIds: tokenize(\'mind goblin\', \'sdxl\'),',
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
    counts: {
      deepseek: 4,
      gpt: 3,
    },
    loadedModelIds: ['gpt', 'gemma', 'qwen', 'kimi', 'deepseek', 'mimo', 'sdxl', 'glm', 'minimax'],
    tokenIds: [2575, 26_223],
  })
}, 30_000)
