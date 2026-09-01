// eslint-disable-next-line typescript/no-restricted-imports -- The smoke test intentionally uses only platform APIs before installing the package.
import {mkdir, mkdtemp, readdir, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'

import * as path from 'forward-slash-path'

const rootFolder = path.resolve(import.meta.dirname, '..')
const distFolder = path.join(rootFolder, 'dist')
const bunExecutable = process.execPath
const temporaryFolder = await mkdtemp(path.join(tmpdir(), 'token-vocabs-distribution-'))
const consumerFolder = path.join(temporaryFolder, 'consumer')
const run = async (command: Array<string>, cwd: string, env?: Record<string, string>) => {
  const childProcess = Bun.spawn(command, {
    cwd,
    env,
    stderr: 'inherit',
    stdout: 'inherit',
    stdin: 'inherit',
  })
  const exitCode = await childProcess.exited
  if (exitCode !== 0) {
    throw new Error(`${command.join(' ')} failed with exit code ${exitCode}.`)
  }
}
try {
  await run([bunExecutable, 'pm', 'pack', '--destination', temporaryFolder], distFolder)
  const temporaryFiles = await readdir(temporaryFolder)
  const tarballFileName = temporaryFiles.find(fileName => fileName.endsWith('.tgz'))
  if (!tarballFileName) {
    throw new Error('Distribution pack did not produce a .tgz file.')
  }
  await mkdir(consumerFolder)
  await Bun.write(path.join(consumerFolder, 'package.json'), '{"private":true,"type":"module"}\n')
  await run([bunExecutable, 'add', path.join(temporaryFolder, tarballFileName)], consumerFolder)
  const smokeTest = [
    "const main = await import('token-vocabs')",
    "if (await main.count('mind goblin', 'gpt') !== 3) throw new Error('Default export smoke test failed.')",
    "if (await main.count('<|endoftext|>', 'gpt') !== 1) throw new Error('Tiktoken special-token smoke test failed.')",
    "const browser = await import('token-vocabs/browser')",
    "if (await browser.count('<|im_end|>', 'qwen') !== 1) throw new Error('Browser export smoke test failed.')",
    "const all = await import('token-vocabs/browser/all')",
    "if (all.countLoaded('mind goblin', 'deepseek') !== 4) throw new Error('Eager browser export smoke test failed.')",
  ].join('\n')
  const environment = Object.fromEntries(Object.entries(Bun.env).filter((entry): entry is [string, string] => entry[1] !== undefined))
  environment.NODE_PATH = ''
  await run([bunExecutable, '--eval', smokeTest], consumerFolder, environment)
  console.log('Distribution package smoke test passed.')
} finally {
  await rm(temporaryFolder, {
    force: true,
    recursive: true,
  })
}
