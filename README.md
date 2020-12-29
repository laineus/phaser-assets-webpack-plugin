# PhaserAssetsWebpackPlugin

[![Phaser 3.x](https://img.shields.io/badge/Phaser-3.x-brightgreen.svg)](https://github.com/photonstorm/phaser)
[![npm](https://img.shields.io/npm/v/phaser-assets-webpack-plugin.svg)](https://www.npmjs.com/package/phaser-assets-webpack-plugin)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/laineus/phaser-assets-webpack-plugin/blob/master/LICENSE)

A Webpack plugin to load assets automatically for Phaser3

# Usage

Install:

```
$ npm install phaser-assets-webpack-plugin
```

Define into `webpack.config.js`:

```js
const PhaserAssetsWebpackPlugin = require('phaser-assets-webpack-plugin')
// ...
{
  entry: {
    ...
  },
  output: {
    ...
  },
  plugins: [
    new PhaserAssetsWebpackPlugin([
      { type: 'image', dir: '/img', rule: /^\w+\.png$/ },
      { type: 'audio', dir: '/audio', rule: /^\w+\.(m4a|ogg)$/ }
    ], { documentRoot: '/public' })
  ]
}
```

Patterns:

|Key|Require|What is|
|---|---|---|
|type|Yes|Method name for Phaser::Loader. `image` will be `spritesheet` automatically when it is.|
|prefix|No|Prefix for asset key name.|
|dir|Yes|Assets directory from document root. Must be started with `/`.|
|rule|Yes|Name pattern of files to be assets.|
|callback|No|Callback function after loaded. Given arg that Array of the loaded data.|

Options:

|Key|Default|What is|
|---|---|---|
|documentRoot|`'/public'`|Document root. Must be started with `/`|
|importName|`'assets'`|`import assets from '[importName]'`|
|spriteSheetSettingsFileName|`'settings.json'`|Name of settings file for spritesheet.|
|useAbsoluteUrl|true|URL setting for your app. Such as '/image.png' or './image.png'`|

## Use it in Phaser3

An Object like following will be generated when exists files under the rules you defined.

```js
{
  image: [
    ['title', '/img/title.png']
  ],
  spritesheet: [
    ['player', '/img/player.png'. { frameWidth: 16, frameHeight: 16, startFrame: 0, endFrame: 3 }]
  ],
  audio: [
    ['bgm', ['/audio/bgm.m4a', '/audio/bgm.ogg']]
  ]
}
```

The key names based on each file name. ( `player.png` => `[prefix]player` )

The Data can be imported and used for Phaser::Loader as is.

```js
import assets from 'assets'
```

```js
Object.keys(assets).forEach(methodName => {
  assets[methodName].forEach(args => scene.load[methodName](...args)
})
```

Then it will be reloaded automatically when added or removed files while webpack is watching.

## Spritesheet setting

Just define num of horizontal and vertical for each spritesheet into JSON file located same dir as assets.

```
- img/
  - player.png
  - setting.json
```

```json
[
  ["player.png", 3, 1]
]
```

The `image` will be `spritesheet` if the setting is exsists.

# Requirements

- Webpack4 or higher

I'm not sure if this will be working on Webpack3 or less.
Please make an issue or PR if need it.

# [Examples] Projects that using this plugin

- [phavuer-example](https://github.com/laineus/phavuer-example)
- [phavuer-rpg-example](https://github.com/laineus/phavuer-rpg-example)
- [unsung-kingdom](https://github.com/laineus/unsung-kingdom)
