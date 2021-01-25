const path = require('path')
const fs = require('fs')
const sizeOf = require('image-size')

const defaultSettings = {
  documentRoot: 'public',
  output: 'assets.json',
  spriteSheetSettingsFileName: 'settings.json'
}

module.exports = class {
  constructor (patterns, settings) {
    this.patterns = patterns
    this.settings = { ...defaultSettings, ...settings }
    this.timer = null
  }
  apply (compiler) {
    this.projectRoot = compiler.context
    compiler.hooks.afterEnvironment.tap('AssetsPlugin', () => {
      console.log('PhaserAssetsWebpackPlugin: Initializing...')
      this.exportJson()
      if (compiler.options.mode === 'development') this.watch()
    })
  }
  watch () {
    // Watch dependent directories
    this.patterns.map(v => path.join(this.projectRoot, this.settings.documentRoot, v.dir)).forEach(dir => {
      fs.watch(dir, _event => {
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          console.log('PhaserAssetsWebpackPlugin: Reloading...')
          this.exportJson()
        }, 2000)
      })
    })
  }
  exportJson () {
    const assetsData = this.getAssetsData()
    const json = JSON.stringify(assetsData, null, 2)
    const outputPath = path.join(this.projectRoot, this.settings.output)
    fs.writeFileSync(outputPath, json)
  }
  getAssetsData () {
    const data = this.patterns.reduce((result, pattern) => {
      const dir = path.join(this.projectRoot, this.settings.documentRoot, pattern.dir)
      const fileNames = fs.readdirSync(dir)
      const spriteSheetSettings = this.getSpriteSheetSettings(dir)
      const list = fileNames.filter(fileName => pattern.rule.test(fileName)).reduce((list, fileName) => {
        const assetKeyName = `${pattern.prefix}${fileName.split('.')[0]}`
        const url = `${pattern.dir}${pattern.dir.endsWith('/') ? '' : '/'}${fileName}`
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
    const endFrame = (numOfX * numOfY) - 1
    return { frameWidth, frameHeight, startFrame: 0, endFrame }
  }
}
