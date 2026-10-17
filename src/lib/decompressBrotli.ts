type BrotliDecompressFunction = (buffer: Uint8Array, outputSize?: number) => Uint8Array

let polyfillPromise: Promise<BrotliDecompressFunction> | undefined
const getBrotliPolyfill = () => {
  polyfillPromise ??= (async () => {
    const module = await import('brotli/decompress')
    return module.decompress
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
