import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'prettier/prettier': 'warn',
      // 关闭显示使用any警告
      '@typescript-eslint/no-explicit-any': 'off',
      // 关闭变量未使用警告
      '@typescript-eslint/no-unused-vars': 'off',
      // 关闭显示使用Function警告
      '@typescript-eslint/no-unsafe-function-type': 'off'
    }
  },
  prettier,
  {
    ignores: ['**/node_modules/**', '**/dist/', '**/generated/']
  }
])
