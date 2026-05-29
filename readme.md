# token-vocabs

Count tokens or inspect token IDs across several modern tokenizer families from one local, offline-friendly package.

## Supported models

- GPT → `o200k_base`
- Gemma 4 31B it
- Qwen 3.6 27B
- Kimi K2.6
- DeepSeek V4 Pro
- MiMo V2.5 Pro
- Stable Diffusion XL
- GLM 5.1
- MiniMax M2.7

## Highlights

- offline at runtime once the vendored assets are present
- browser-friendly once bundled
- exact golden outputs for the core sample fixture
- Brotli-compressed MessagePack tokenizer assets with Map-backed structured loading
- browser Brotli decompression with a bundled JS fallback where native stream support is missing
- Rolldown browser builds that can lazy-load one chunk per vocabulary, plus an eager `all.js` variant and the required WASM asset
- sync API for convenience
- one small single-model API for counts, token IDs and byte offsets
- generated tokenizer assets via `bun run fetch`
- publish-ready browser `dist/` builds that bundle tokenizer assets, emit the required WASM files and include package metadata plus declarations

## Usage

```ts
import countTokens from 'token-vocabs'

console.dir(countTokens('mind goblin', 'gpt'))
```

```ts
import countTokens from 'token-vocabs'

console.dir(countTokens(new TextEncoder().encode('mind goblin'), {model: 'gpt'}))
```

```ts
import {tokenize} from 'token-vocabs'

console.dir(tokenize('mind goblin', 'gpt'))
```

## Example output

```ts
countTokens('mind goblin', 'gpt')
// 3
```

```ts
tokenize('mind goblin', 'gpt')
// {
//   offsets: [4, 8],
//   tokens: [77021, 18778, 4724],
// }
```

## API

### `countTokens(textOrBytes, optionsOrModel)`

Returns the token count for exactly one model.

`Uint8Array` input is decoded as UTF-8.

```ts
countTokens('mind goblin', 'sdxl')
countTokens('mind goblin', {model: 'gpt'})
countTokens(new TextEncoder().encode('mind goblin'), 'gpt')
```

### `tokenize(textOrBytes, optionsOrModel)`

Returns a `RawTokenizeResult` for exactly one model.

```ts
tokenize('mind goblin', 'gpt')
tokenize('mind goblin', {model: 'gpt'})
```

The result shape is:

```ts
type RawTokenizeResult = {
  offsets: number[]
  tokens: number[]
  processedInput?: string | Uint8Array
}
```

`offsets` omits the first token’s implicit `0` byte start to save one array slot.

If a tokenizer normalizes or otherwise preprocesses the input, `processedInput` contains the effective tokenizer input. Its type matches the input kind – string in, string out; `Uint8Array` in, `Uint8Array` out.

If you need results for several models, call `countTokens()` or `tokenize()` once per model and combine the results yourself.

### `modelIds`

Exports the supported model IDs in stable default order.

### `models`

Exports model metadata, including the original upstream source URLs used by `bun run fetch`.

### `token-vocabs/browser`

Lazy browser entry with the same `countTokens()` and `tokenize()` API, plus:

- `loadModel(modelId)`
- `loadModels(modelSelection?)`
- `isModelLoaded(modelId)`
- `getLoadedModelIds()`

Load the required vocabularies first, then call the sync tokenization API.

### `token-vocabs/browser/all`

Eager browser entry that preloads every vocabulary and keeps the original “load once, tokenize immediately” behavior.

## Asset workflow

Raw fetched tokenizer assets are written to `./temp/data`.

`bun run fetch` also generates importable asset modules under `./temp/generated`, which is what the library loads at runtime.

Refresh them with:

```sh
bun run fetch
```

Create a publish-ready browser bundle with:

```sh
bun run build
```

That produces a `dist/` folder containing:

- `dist/main.js` as the lazy browser entry – call `loadModels()` before tokenizing
- `dist/all.js` as the eager browser entry that preloads every vocabulary
- emitted chunk files under `dist/vocabulary/` and `dist/chunks/`, plus the required WASM asset for browser bundlers
- `dist/package.json`, `dist/README.md`, `dist/LICENSE` and declaration files so `dist/` can be published on its own

Example lazy browser usage:

```ts
import {countTokens, loadModels} from './dist/main.js'

await loadModels(['gpt', 'deepseek'])
console.dir(countTokens('mind goblin', 'deepseek'))
```

## Notes

- `sdxl` intentionally implements the shared CLIP BPE core used by SDXL without auto-adding BOS/EOS tokens.
- GPT uses `tiktoken`’s built-in `o200k_base` implementation, but the upstream encoder payload is still fetched and converted to MessagePack for completeness.
- Structured tokenizer payloads are emitted into generated modules as ASCII85-encoded `.msgpack.br` blobs and decompressed before use.
- Tokenizer assets are large. That is inherent to exact offline tokenization.
