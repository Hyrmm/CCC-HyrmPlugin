'use strict'

const fs = require('fs')
const path = require('path')
const pubsub = require("pubsub.js")
const utils = require("./utils/index")
const watchFile = require("./function/watch-file")
const { sortNodes } = require("./function/sort-nodes")

module.exports = {
  nodesSelectedList: [],
  selectedList: [],

  load() {

    //  读取配置
    const settingFile = fs.readFileSync(path.join(__dirname, "setting.json"), { encoding: 'utf-8' })
    global.setting = JSON.parse(settingFile.toString())
    utils.log.success(global.setting)

    // 功能模块初始化
    sortNodes.init()

    // // 注入代码
    // electron.app.on('web-contents-created', (sender, webContents) => {
    //   webContents.on('dom-ready', (e) => {
    //     this.injectHook()
    //   })
    // })

    // // 生成资源类型
    // this.generateAssetTyps()

    // // 开启文件监听
    // this.watchFile()

    // Editor.Panel.open('hyrm-plugin');




  },

  unload() {

    watchFile.unwatch()

  },

  injectHook() {
    // const hackCode = fs.readFileSync(path.join(__dirname, "hook.js")).toString()
    // const webContents = getMainWebContents()

    // if (webContents) {
    //   webContents.executeJavaScript(hackCode).then(() => {
    //     Editor.success("[Hyrm's-Plugin]:渲染进程Hooks=>注入成功")
    //   })
    // } else {
    //   Editor.error("[Hyrm's-Plugin]:渲染进程Hooks=>注入失败")
    // }
  },

  messages: {

    /** 原生消息:场景编辑模式 */
    "scene:open-by-uuid"(err, uuid) {
      pubsub.publish("scene:open-by-uuid", [uuid])
    },

    /** 原生消息:预制体编辑模式 */
    "scene:enter-prefab-edit-mode"(err, uuid) {
      pubsub.publish("scene:enter-prefab-edit-mode", [uuid])
    },

    /** 原生消息:选中节点(资源) */
    "selection:selected"(err, type, selectInfoList) {
      // this.selectedHandle(err, type, selectInfoList)
      pubsub.publish("selection:selected", [type, selectInfoList])
    },

    /** 原生消息:取消选中节点(资源) */
    "selection:unselected"(err, type, unSelectInfoList) {
      // this.unSelectedHandle(err, type, unSelectInfoList)
      pubsub.publish("selection:unselected", [type, unSelectInfoList])

    },

    /** 自定义消息 */
    // "hyrm-plugin:refresh"() {
    //   for (const uuid of this.selectedList) {
    //     this.refreshAssets(uuid)
    //   }
    // },

    "hyrm-plugin:watch-file/onwatch"() {
      watchFile.onwatch()
    },

    "hyrm-plugin:panel/get-setting"(sender) {
      sender.reply(null, global.setting)
    },

    "hyrm-plugin:panel/open-setting"(sender) {
      Editor.Panel.open('hyrm-plugin')
    },

    "hyrm-plugin:panel/save-setting"(sender, msgName, setting) {

      const oriWatchInterval = global.setting.watchInterval

      if (oriWatchInterval != setting.watchInterval) {
        watchFile.rewatch()
      }

      global.setting = setting
      fs.writeFileSync(path.join(__dirname, "setting.json"), JSON.stringify(global.setting), { encoding: 'utf-8' })
      sender.reply(null, global.setting)
    },

    "hyrm-plugin:sort-nodes/sort"() {
      sortNodes.sort()
    },

  },

  // selectedHandle(err, type, selectInfoList) {

  //   switch (type) {

  //     case "asset": {
  //       for (const selectedUUID of selectInfoList) {
  //         if (!this.selectedList.includes(selectedUUID)) {
  //           this.selectedList.push(selectedUUID)
  //         }
  //       }
  //       const selectedList2URL = []
  //       for (const uuid of this.selectedList) {
  //         selectedList2URL.push(Editor.assetdb.uuidToUrl(uuid))
  //       }
  //       Editor.log(`[Hyrm's-Plugin]:当前选中文件=》${JSON.stringify(selectedList2URL)}`)
  //       break
  //     }


  //     case "node": {
  //       for (const selectedNodesUUID of selectInfoList) {
  //         if (!this.nodesSelectedList.includes(selectedNodesUUID)) {
  //           this.nodesSelectedList.push(selectedNodesUUID)
  //         }
  //       }

  //       Editor.log(`[Hyrm's-Plugin]:当前选中节点=》${JSON.stringify(this.nodesSelectedList)}`)
  //       break
  //     }
  //   }


  // },

  // unSelectedHandle(err, type, unSelectInfoList) {

  //   switch (type) {
  //     case "asset": {
  //       for (const selectedUUID of unSelectInfoList) {
  //         if (this.selectedList.includes(selectedUUID)) {
  //           const index = this.selectedList.indexOf(selectedUUID)
  //           this.selectedList.splice(index, 1)
  //         }
  //       }

  //       const selectedList2URL = []
  //       for (const uuid of this.selectedList) {
  //         selectedList2URL.push(Editor.assetdb.uuidToUrl(uuid))
  //       }
  //       break
  //     }
  //     case "node": {
  //       for (const selectedUUID of unSelectInfoList) {
  //         if (this.nodesSelectedList.includes(selectedUUID)) {
  //           const index = this.nodesSelectedList.indexOf(selectedUUID)
  //           this.nodesSelectedList.splice(index, 1)
  //         }
  //       }

  //       const selectedList2URL = []
  //       for (const uuid of this.nodesSelectedList) {
  //         selectedList2URL.push(Editor.assetdb.uuidToUrl(uuid))
  //       }
  //       break
  //     }
  //   }
  // },

  // refreshAssets(uuid) {
  //   const assetInfo = Editor.assetdb.assetInfoByUuid(uuid)
  //   if (assetInfo.type == "folder") {
  //     Editor.assetdb.queryAssets(`${assetInfo.url}/*/`, this['assetTypes'], (err, assetInfos) => {
  //       for (const asset of assetInfos) {
  //         this.refreshAssets(asset.uuid)
  //       }
  //     })
  //   } else {
  //     Editor.assetdb.refresh(assetInfo.url, (err, refreshResult) => {
  //       if (err) return Editor.error(err)
  //       Editor.success(`[Hyrm's-Plugin]:刷新资源成功=>${refreshResult[0].url}`)
  //     })
  //   }
  // },

  // generateAssetTyps() {
  //   Editor.assetdb.deepQuery((err, result) => {
  //     if (err) return Editor.error(`[Hyrm's-Plugin]${err}`)

  //     for (const asset of result) {
  //       if (!this.assetTypes.includes(asset.type)) this.assetTypes.push(asset.type)
  //     }
  //   })
  // },

  // watchFile() {
  //   if (this.monitor) return Editor.error("[Hyrm's-Plugin]:文件监听已开启，请勿重复开启")

  //   const assetsPath = Editor.assetdb.urlToFspath("db://assets")
  //   if (!assetsPath) return Editor.error("[Hyrm's-Plugin]:文件监听开启失败，请尝试在菜单中手动开启")

  //   watch.createMonitor(Editor.assetdb.urlToFspath("db://assets"), { interval: 0.01 }, (monitor) => {

  //     monitor.on("created", (FileFspath, stat) => {
  //       const parentURL = Editor.assetdb.fspathToUrl(path.dirname(FileFspath))
  //       const targetDirectory = path.join(path.dirname(assetsPath), "/hyrm-plugin-file")

  //       if (fs.existsSync(targetDirectory) && !Editor.assetdb.existsByPath(FileFspath) && path.extname(FileFspath) != ".meta") {

  //         if (stat.isDirectory()) {

  //           copyFolder(FileFspath, path.join(targetDirectory, path.basename(FileFspath)))
  //           deleteFolderRecursive(FileFspath)

  //         } else {
  //           fs.copyFileSync(FileFspath, path.join(targetDirectory, path.basename(FileFspath)))
  //           fs.unlinkSync(FileFspath)
  //         }
  //         Editor.assetdb.import([path.join(targetDirectory, path.basename(FileFspath))], parentURL, (err, result) => {
  //           if (err) return Editor.error(`[Hyrm's-Plugin]${err}`)
  //           Editor.success(`[Hyrm's-Plugin]:导入资源成功=>${parentURL}/${path.basename(FileFspath)}`)
  //         })
  //       }
  //     })

  //     monitor.on("changed", (FileFspath, curr, prev) => {
  //       if (path.extname(FileFspath) == ".meta") return
  //       const fileUUID = Editor.assetdb.fspathToUuid(FileFspath)
  //       this.refreshAssets(fileUUID)
  //     })

  //     monitor.on("removed", (FileFspath, stat) => {
  //       // if (Editor.assetdb.existsByPath(FileFspath) && path.extname(FileFspath) != ".meta") {
  //       //   Editor.log(Editor.assetdb.fspathToUrl(FileFspath), this.refreshAssets, Editor.assetdb.fspathToUuid(FileFspath))
  //       //   this.refreshAssets(Editor.assetdb.fspathToUuid(FileFspath))
  //       // }
  //     })

  //     this.monitor = monitor
  //     Editor.success("[Hyrm's-Plugin]:文件监听=》开启成功")

  //   })

  // },
}