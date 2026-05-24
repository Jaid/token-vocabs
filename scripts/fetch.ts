import path from 'node:path'

import fs from 'fs-extra'

import {modelIds, models} from '#src/lib/models.ts'

const dataFolder = path.resolve(import.meta.dirname, '../data')

type JsonRecord = Record<string, unknown>

const isJsonRecord = (value: unknown): value is JsonRecord => {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
const ensureFolder = async (folder: string) => {
  await fs.mkdir(folder, {recursive: true})
}
const fetchText = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${JSON.stringify(url)}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}
const writeTextFile = async (filePath: string, content: string) => {
  await ensureFolder(path.dirname(filePath))
  await fs.writeFile(filePath, content)
}
const writeJsonFile = async (filePath: string, value: unknown) => {
  await writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}
const extractKimiPattern = (tokenizerImplementation: string) => {
  const match = /pat_str\s*=\s*"\|"\.join\(\[(?<body>[\s\S]*?)\]\)/u.exec(tokenizerImplementation)
  if (!match?.groups?.body) {
    throw new Error('Could not extract Kimi pat_str from tokenization_kimi.py.')
  }
  const parts = [...match.groups.body.matchAll(/r"""([\s\S]*?)"""/gu)].map(([, part]) => part)
  if (!parts.length) {
    throw new Error('Could not parse Kimi pat_str fragments from tokenization_kimi.py.')
  }
  return parts.join('|')
}
const getSpecialTokensFromTokenizerConfig = (tokenizerConfig: JsonRecord) => {
  const addedTokensDecoder = tokenizerConfig.added_tokens_decoder
  if (!isJsonRecord(addedTokensDecoder)) {
    throw new Error('Kimi tokenizer_config.json does not expose added_tokens_decoder.')
  }
  return Object.fromEntries(Object.entries(addedTokensDecoder).flatMap(([tokenId, data]) => {
    if (!isJsonRecord(data)) {
      return []
    }
    const content = typeof data.content === 'string' ? data.content : undefined
    if (!content) {
      return []
    }
    return [[content, Number(tokenId)] as const]
  }))
}
const fetchBuiltinTiktokenModel = async (modelId: 'gpt') => {
  const {encoding, source} = models[modelId]
  const modelFolder = path.join(dataFolder, modelId)
  await ensureFolder(modelFolder)
  await writeJsonFile(path.join(modelFolder, 'config.json'), {
    encoding,
  })
  await writeTextFile(path.join(modelFolder, 'o200k_base.json'), await fetchText(source.encodingJsonUrl))
}
const fetchCustomTiktokenModel = async (modelId: 'kimi') => {
  const {source} = models[modelId]
  const modelFolder = path.join(dataFolder, modelId)
  await ensureFolder(modelFolder)
  const [modelFile, tokenizerConfigText, tokenizerImplementation] = await Promise.all([
    fetchText(source.modelUrl),
    fetchText(source.tokenizerConfigUrl),
    fetchText(source.tokenizerImplementationUrl),
  ])
  const tokenizerConfig = JSON.parse(tokenizerConfigText) as unknown
  if (!isJsonRecord(tokenizerConfig)) {
    throw new TypeError('Kimi tokenizer_config.json did not parse into an object.')
  }
  const patStr = extractKimiPattern(tokenizerImplementation)
  const specialTokens = getSpecialTokensFromTokenizerConfig(tokenizerConfig)
  await Promise.all([
    writeJsonFile(path.join(modelFolder, 'config.json'), {
      pat_str: patStr,
      special_tokens: specialTokens,
    }),
    writeTextFile(path.join(modelFolder, 'tiktoken.model'), modelFile),
    writeTextFile(path.join(modelFolder, 'tokenizer_config.json'), tokenizerConfigText),
    writeTextFile(path.join(modelFolder, 'tokenization_kimi.py'), tokenizerImplementation),
  ])
}
const fetchHuggingFaceModel = async (modelId: Exclude<typeof modelIds[number], 'gpt' | 'kimi' | 'sdxl'>) => {
  const {source} = models[modelId]
  const modelFolder = path.join(dataFolder, modelId)
  await ensureFolder(modelFolder)
  await Promise.all([
    writeTextFile(path.join(modelFolder, 'tokenizer.json'), await fetchText(source.tokenizerJsonUrl)),
    writeTextFile(path.join(modelFolder, 'tokenizer_config.json'), await fetchText(source.tokenizerConfigUrl)),
  ])
}
const fetchClipBpeModel = async (modelId: 'sdxl') => {
  const {source} = models[modelId]
  const modelFolder = path.join(dataFolder, modelId)
  await ensureFolder(modelFolder)
  const tasks = [
    writeTextFile(path.join(modelFolder, 'vocab.json'), await fetchText(source.vocabUrl)),
    writeTextFile(path.join(modelFolder, 'merges.txt'), await fetchText(source.mergesUrl)),
    writeTextFile(path.join(modelFolder, 'tokenizer_config.json'), await fetchText(source.tokenizerConfigUrl)),
    writeTextFile(path.join(modelFolder, 'special_tokens_map.json'), await fetchText(source.specialTokensMapUrl)),
  ]
  await Promise.all(tasks)
}
const fetchModel = async (modelId: typeof modelIds[number]) => {
  const model = models[modelId]
  switch (model.kind) {
    case 'tiktoken-builtin': {
      await fetchBuiltinTiktokenModel(modelId)
      return
    }
    case 'tiktoken-custom': {
      await fetchCustomTiktokenModel(modelId)
      return
    }
    case 'huggingface': {
      await fetchHuggingFaceModel(modelId)
      return
    }
    case 'clip-bpe': {
      await fetchClipBpeModel(modelId)
    }
  }
}
console.log(`Writing tokenizer assets to ${dataFolder}`)
await ensureFolder(dataFolder)
for (const modelId of modelIds) {
  console.log(`• ${modelId}`)
  await fetchModel(modelId)
}
console.log('Done.')
