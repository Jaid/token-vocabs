import type {ModelId} from './models.ts'

export const modelAssetBundleUrls = {
  gpt: new URL('../../temp/generated/model-assets/gpt.bin', import.meta.url),
  gemma: new URL('../../temp/generated/model-assets/gemma.bin', import.meta.url),
  qwen: new URL('../../temp/generated/model-assets/qwen.bin', import.meta.url),
  kimi: new URL('../../temp/generated/model-assets/kimi.bin', import.meta.url),
  deepseek: new URL('../../temp/generated/model-assets/deepseek.bin', import.meta.url),
  mimo: new URL('../../temp/generated/model-assets/mimo.bin', import.meta.url),
  sdxl: new URL('../../temp/generated/model-assets/sdxl.bin', import.meta.url),
  glm: new URL('../../temp/generated/model-assets/glm.bin', import.meta.url),
  minimax: new URL('../../temp/generated/model-assets/minimax.bin', import.meta.url),
  hy: new URL('../../temp/generated/model-assets/hy.bin', import.meta.url),
  step: new URL('../../temp/generated/model-assets/step.bin', import.meta.url),
} as const satisfies Record<ModelId, URL>
