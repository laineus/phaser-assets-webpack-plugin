const useAssetsLoader = require('./lib/useAssetsLoader.js')

module.exports = class {
  constructor (patterns, settings) {
    this.patterns = patterns
    this.settings = settings
  }
  apply (compiler) {
    this.projectRoot = compiler.context
    const { exportJson, watch } = useAssetsLoader(this.patterns, this.settings, { projectRoot: compiler.context })
    compiler.hooks.afterEnvironment.tap('AssetsPlugin', () => {
      exportJson()
      console.log('PhaserAssetsWebpackPlugin: Initialized')
      if (compiler.options.mode === 'development') {
        console.log('PhaserAssetsWebpackPlugin: Watching...')
        watch(() => {
          console.log('PhaserAssetsWebpackPlugin: Reloaded')
        })
      }
    })
  }
}
