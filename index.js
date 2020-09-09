const path = require('path')
const fs = require('fs')
const sizeOf = require('image-size')

const defaultSettings = {
  documentRoot: '/public',
  importName: 'assets',
  spriteSheetSettingsFileName: 'settings.json',
  useAbsoluteUrl: true
}

// This file need to be updated when dependent files changed to make Webpack do re-compile.
const tmpTimestampFile = path.resolve(__dirname, 'tmp/timestamp')

module.exports = class {
  constructor (patterns, settings) {
    this.patterns = patterns
    this.settings = { ...defaultSettings, ...settings }
    this.updateFlg = false
    this.latestData = null
    this.originalIdentifier = null
  }
  apply (compiler) {
    this.projectRoot = compiler.context
    compiler.hooks.afterEnvironment.tap('AssetsPlugin', this.afterEnvironment.bind(this, compiler))
    compiler.hooks.compilation.tap('AssetsPlugin', this.compilation.bind(this))
    compiler.hooks.afterCompile.tap('AssetsPlugin', this.afterCompile.bind(this))
  }
  afterEnvironment (compiler) {
    console.log('PhaserAssetsWebpackPlugin: Initializing...')
    this.latestData = this.getAssetsData()
    this.originalIdentifier = `external ${JSON.stringify(this.latestDataJson)}`
    // Make Webpack option
    compiler.options.externals[this.settings.importName] = this.latestDataJson
    if (compiler.options.mode === 'development') this.watch()
  }
  watch () {
    // Watch dependent directories
    this.patterns.map(v => path.join(this.projectRoot, this.settings.documentRoot, v.dir)).forEach(dir => {
      fs.watch(dir, event => {
        this.updateFlg = this.updateFlg || event === 'rename'
      })
    })
    // Do polling with a flag because [fs.watch] detects event twice for one update
    setInterval(() => {
      if (!this.updateFlg) return
      console.log('PhaserAssetsWebpackPlugin: Reloading...')
      this.latestData = this.getAssetsData()
      fs.writeFileSync(tmpTimestampFile, String(Math.floor(new Date() / 1000)))
      this.updateFlg = false
    }, 1000)
  }
  compilation (compilation) {
    if (!compilation.cache) return
    const cachedModule = compilation.cache[`m${this.originalIdentifier}`]
    if (!cachedModule) return
    // Replace value
    cachedModule.request = this.latestDataJson
    if (cachedModule.identifier() === this.originalIdentifier) return
    // Original key should be existing to avoid modules become duplicate
    compilation._modules.set(this.originalIdentifier, cachedModule)
  }
  afterCompile (compilation) {
    // Make Webpack watchs the tmporary timestamp file
    compilation.fileDependencies.add(tmpTimestampFile)
  }
  get latestDataJson () {
    return JSON.stringify(this.latestData)
  }
  getAssetsData () {
    const data = this.patterns.reduce((result, pattern) => {
      const dir = path.join(this.projectRoot, this.settings.documentRoot, pattern.dir)
      const fileNames = fs.readdirSync(dir)
      const spriteSheetSettings = this.getSpriteSheetSettings(dir)
      const list = fileNames.filter(fileName => pattern.rule.test(fileName)).reduce((list, fileName) => {
        const assetKeyName = `${pattern.prefix}${fileName.split('.')[0]}`
        const url = `${this.settings.useAbsoluteUrl ? '' : '.'}${pattern.dir}/${fileName}`
        const sameKeyRow = list.find(v => v[0] === assetKeyName)
        if (sameKeyRow) {
          // Append the file if existing same key
          sameKeyRow.splice(1, 1, [sameKeyRow[1], url].flat())
        } else {
          const spriteSheetSetting = spriteSheetSettings && spriteSheetSettings.find(v => v[0] === fileName)
          const spriteSheetOption = spriteSheetSetting && this.getSpriteSheetOption(path.join(dir, fileName), spriteSheetSetting[1], spriteSheetSetting[2])
          list.push(spriteSheetOption ? [assetKeyName, url, spriteSheetOption] : [assetKeyName, url])
        }
        return list
      }, [])
      if (pattern.callback) pattern.callback(list)
      result[pattern.type] = result[pattern.type] ? result[pattern.type].concat(list) : [...list]
      return result
    }, {})
    data.spritesheet = data.image.filter(v => v.length === 3)
    data.image = data.image.filter(v => v.length === 2)
    if (!data.spritesheet.length) delete data.spritesheet
    if (!data.image.length) delete data.image
    return data
  }
  getSpriteSheetSettings (dir) {
    const pathToSettings = path.join(dir, this.settings.spriteSheetSettingsFileName)
    if (!fs.existsSync(pathToSettings)) return null
    const settingsJson = fs.readFileSync(pathToSettings, 'utf8')
    try {
      return JSON.parse(settingsJson)
    } catch (error) {
      console.error(`[Error] Invalid JSON String: ${pathToSettings}`)
      return null
    }
  }
  getSpriteSheetOption (filePath, numOfX, numOfY) {
    const { width, height } = sizeOf(filePath)
    const frameWidth = Math.round(width / numOfX)
    const frameHeight = Math.round(height / numOfY)
    const endFrame = numOfX * numOfY
    return { frameWidth, frameHeight, endFrame }
  }
}
