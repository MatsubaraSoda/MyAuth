import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  // shadcn-vue / Reka UI 惯例为单词文件名（Button.vue、Card.vue）；路由视图也常为单词（Profile.vue）。
  // 仅放宽命名规则，不改业务组件。
  {
    name: 'app/single-word-vue-filenames',
    files: [
      '**/components/ui/**/*.vue',
      '**/components/common/**/*.vue',
      '**/views/**/*.vue',
    ],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
