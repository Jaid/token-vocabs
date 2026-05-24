type BrotliDecompressFunction = (buffer: Uint8Array, outputSize?: number) => Uint8Array

let polyfillPromise: Promise<BrotliDecompressFunction> | undefined
const getBrotliPolyfill = () => {
  polyfillPromise ??= (async () => {
    // @ts-expect-error TS7016 The brotli package exposes this browser-friendly entry as untyped CommonJS.
    const module = await import('brotli/decompress.js') as {default: BrotliDecompressFunction}
    return module.default
  })()
  return polyfillPromise
}

export const decompressBrotli = async (bytes: Uint8Array) => {
  if (typeof DecompressionStream === 'function') {
    try {
      const decompressedStream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('brotli'))
      return new Uint8Array(await new Response(decompressedStream).arrayBuffer())
    } catch {

    }
  }
  const brotliDecompress = await getBrotliPolyfill()
  return brotliDecompress(bytes)
}

export default decompressBrotli
