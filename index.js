const fs = require('fs')
const sizeOf = require('image-size')

const defaultSettings = {
  documentRoot: '/public',
  importName: 'assets',
  spriteSheetSettingsFileName: 'settings.json',
  useAbsoluteUrl: true
}

// This file need to be updated when dependent files changed to make Webpack do re-compile.
const tmpWatchedJson = `${__dirname}/tmp/assets.json`

module.exports = class {
  constructor (patterns, settings) {
    this.patterns = patterns
    this.settings = { ...defaultSettings, ...settings }
    this.updateFlg = false
    this.assetsModule = null
  }
  apply (compiler) {
    compiler.hooks.afterEnvironment.tap('AssetsPlugin', this.afterEnvironment.bind(this, compiler))
    compiler.hooks.afterCompile.tap('AssetsPlugin', this.afterCompile.bind(this))
  }
  afterEnvironment (compiler) {
    compiler.options.externals[this.settings.importName] = JSON.stringify(this.updateAssetsModule())
    // Watch dependent directories
    this.patterns.map(v => `.${this.settings.documentRoot}${v.dir}`).forEach(dir => {
      fs.watch(dir, event => {
        this.updateFlg = this.updateFlg || event === 'rename'
      })
    })
    // Do polling with a flag because [fs.watch] detects event twice for one update
    setInterval(() => {
      if (this.updateFlg && this.assetsModule) {
        this.assetsModule.request = JSON.stringify(this.updateAssetsModule())
        this.updateFlg = false
      }
    }, 1000)
  }
  afterCompile (compilation) {
    this.assetsModule = compilation.modules.find(v => v.userRequest === this.settings.importName)
    // Make Webpack Watch the tmporary JSON file
    compilation.fileDependencies.add(tmpWatchedJson)
  }
  updateAssetsModule () {
    console.log('AssetsPlugin: Loading...')
    const data = this.getAssetsData()
    fs.writeFileSync(tmpWatchedJson, JSON.stringify(data, null, '  '))
    console.log('AssetsPlugin: Complete!')
    return data
  }
  getAssetsData () {
    const data = this.patterns.reduce((result, pattern) => {
      const dir = `.${this.settings.documentRoot}/${pattern.dir}`
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
          const spriteSheetOption = spriteSheetSetting && this.getSpriteSheetOption(`${dir}/${fileName}`, spriteSheetSetting[1], spriteSheetSetting[2])
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
    return data
  }
  getSpriteSheetSettings (dir) {
    const pathToSettings = `${dir}/${this.settings.spriteSheetSettingsFileName}`
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
