import type {Linter} from 'eslint'

import {makeEslintConfig} from 'eslint-config-jaid'

const eslintConfig: Array<Linter.Config> = [
  {
    ignores: ['data/**', 'dist/**', 'private/**'],
  },
  ...makeEslintConfig(),
]

export default eslintConfig
