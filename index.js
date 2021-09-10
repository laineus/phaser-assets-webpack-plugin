const phaserAssetsLoader = require('phaser-assets-loader')

module.exports = class {
  constructor (settings, ...args) {
    if (Array.isArray(settings)) { // <= 2.0.x
      settings = Object.assign({}, { patterns: settings }, args[0] )
    }
    this.settings = settings
  }
  apply (compiler) {
    this.projectRoot = compiler.context
    const { exportJson, watch } = phaserAssetsLoader(this.settings, { projectRoot: compiler.context })
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
