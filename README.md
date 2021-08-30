# PhaserAssetsWebpackPlugin

[![Phaser 3.x](https://img.shields.io/badge/Phaser-3.x-brightgreen.svg)](https://github.com/photonstorm/phaser)
[![npm](https://img.shields.io/npm/v/phaser-assets-webpack-plugin.svg)](https://www.npmjs.com/package/phaser-assets-webpack-plugin)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/laineus/phaser-assets-webpack-plugin/blob/master/LICENSE)

A Webpack plugin to load assets automatically for Phaser3.
It watches the directories along your setting and exports a json file that listed the assets information.

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
    new PhaserAssetsWebpackPlugin({
      patterns: [
        { type: 'image', dir: '/img', rule: /^\w+\.png$/ },
        { type: 'audio', dir: '/audio', rule: /^\w+\.(m4a|ogg)$/ }
      ],
      documentRoot: './public',
      output: './src/assets.json'
    })
  ]
}
```

Settings:

|Key|Default|What is|
|---|---|---|
|patterns|Required|An Array of assets settings|
|documentRoot|`'public'`|The path to the document root directory.|
|output|`'assets.json'`|The path to the json file to output.|
|spriteSheetSettingsFileName|`'settings.json'`|The name of settings file for spritesheet.|

Patterns:

|Key|Required|What is|
|---|---|---|
|type|Yes|Method name for Phaser::Loader. `image` will be `spritesheet` automatically when it is.|
|prefix|No|Prefix for the assets key name.|
|dir|Yes|Assets directory from document root. It can be started with `/` or `./`.|
|rule|Yes|Name pattern of files to be assets.|
|callback|No|Callback function after loaded. Given arg that Array of the loaded data.|

## CLI

```js
// config file
module.exports = {
  patterns: [
    { type: 'image', dir: '/img', rule: /^\w+\.png$/ },
    { type: 'audio', dir: '/audio', rule: /^\w+\.(m4a|ogg)$/ }
  ],
  documentRoot: './public',
  output: './src/assets.json'
}
```

```
$ phaser-assets --config <path to config file> --watch
```

## Use the exported json in Phaser3

An example of the exported json.

```json
{
  "image": [
    ["title", "/img/title.png"]
  ],
  "spritesheet": [
    ["player", "/img/player.png", { "frameWidth": 16, "frameHeight": 16, "startFrame": 0, "endFrame": 3 }]
  ],
  "audio": [
    ["bgm", ["/audio/bgm.m4a", "/audio/bgm.ogg"]]
  ]
}
```

The key names based on each file name. ( `player.png` => `[prefix]player` )

The Data can be imported and used for Phaser::Loader as is.

```js
import assets from './assets.json'
```

```js
Object.keys(assets).forEach(methodName => {
  assets[methodName].forEach(args => scene.load[methodName](...args)
})
```

The json file will be regenerated automatically when added or removed files while webpack is watching.

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

- Webpack5

I'm not sure if this will be working on other versions.
Please make an issue or PR if need it.

# [Examples] Projects that using this plugin

- [phavuer-example](https://github.com/laineus/phavuer-example)
- [phavuer-rpg-example](https://github.com/laineus/phavuer-rpg-example)
- [unsung-kingdom](https://github.com/laineus/unsung-kingdom)
