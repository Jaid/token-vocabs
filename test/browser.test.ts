import {expect, test} from 'bun:test'
import path from 'node:path'

const rootFolder = path.resolve(import.meta.dirname, '..')
test('browser entry fetches binary vocab bundles lazily and supports free()', async () => {
  const script = [
    'globalThis.DecompressionStream = undefined',
    'const {count, countLoaded, default: defaultTokenize, free, load, tokenize, tokenizeLoaded} = await import(\'token-vocabs/browser\')',
    'const sampleText = \'mind goblin\'',
    'let missingAssetError = \'\'',
    'try {',
    '  tokenizeLoaded(sampleText, \'gpt\')',
    '} catch (error) {',
    '  missingAssetError = error instanceof Error ? error.message : String(error)',
    '}',
    'const autoTokenization = await defaultTokenize(sampleText, \'gpt\')',
    'const loadResult = await load([\'deepseek\', \'sdxl\'])',
    'const deepseekCount = countLoaded(sampleText, {model: \'deepseek\'})',
    'free(\'gpt\')',
    'let freedAssetError = \'\'',
    'try {',
    '  countLoaded(sampleText, \'gpt\')',
    '} catch (error) {',
    '  freedAssetError = error instanceof Error ? error.message : String(error)',
    '}',
    'console.log(JSON.stringify({',
    '  autoCount: await count(sampleText, \'gpt\'),',
    '  autoTokenization,',
    '  deepseekCount,',
    '  freedAssetError,',
    '  loadResult,',
    '  missingAssetError,',
    '  reloadedTokenization: await tokenize(sampleText, \'gpt\'),',
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
    autoCount: 3,
    autoTokenization: {
      offsets: [4, 8],
      tokens: [77_021, 18_778, 4724],
    },
    deepseekCount: 4,
    freedAssetError: 'Missing tokenizer assets for model "gpt". Call load() first or use tokenize()/count() to auto-load it.',
    loadResult: ['deepseek', 'sdxl'],
    missingAssetError: 'Missing tokenizer assets for model "gpt". Call load() first or use tokenize()/count() to auto-load it.',
    reloadedTokenization: {
      offsets: [4, 8],
      tokens: [77_021, 18_778, 4724],
    },
  })
}, 30_000)
test('browser/all eagerly loads every vocabulary bundle', async () => {
  const script = [
    'globalThis.DecompressionStream = undefined',
    'const {countLoaded, default: tokenize, free, tokenizeLoaded} = await import(\'token-vocabs/browser/all\')',
    'console.log(JSON.stringify({',
    '  firstCount: countLoaded(\'mind goblin\', \'deepseek\'),',
    '  firstTokenization: tokenizeLoaded(\'mind goblin\', \'gpt\'),',
    '  reloadedTokenization: (free(\'gpt\'), await tokenize(\'mind goblin\', \'gpt\')),',
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
    firstCount: 4,
    firstTokenization: {
      offsets: [4, 8],
      tokens: [77_021, 18_778, 4724],
    },
    reloadedTokenization: {
      offsets: [4, 8],
      tokens: [77_021, 18_778, 4724],
    },
  })
}, 30_000)
