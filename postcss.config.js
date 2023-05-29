import presetEnv from 'postcss-preset-env'
import nesting from 'postcss-nesting'
import importEnv from 'postcss-import'

export default {
  plugins: [
    presetEnv({
      preserve: true
    }),
    importEnv({
      path: ['src/assets/css/src'],
      addModulesDirectories: ['node_modules', 'src/assets/css/src']
    }),
    nesting()
  ]
}
