'use strict'

const fs = require('fs')
const path = require('path')
const utils = require("./utils/index")
const pubsub = require("pubsub.js")

const { watchFile } = require("./function/watch-file")
const { sortNodes } = require("./function/sort-nodes")
const { spinePreview } = require("./function/spine-preview")

module.exports = {

  load() {

    //  读取配置
    const settingFile = fs.readFileSync(path.join(__dirname, "setting.json"), { encoding: 'utf-8' })
    global.setting = JSON.parse(settingFile.toString())
    utils.log.success(global.setting)
  },

  unload() {

    watchFile.unwatch()

  },

  messages: {

    "scene:ready"(err) {
      // 功能模块初始化
      watchFile.init()
      sortNodes.init()
      spinePreview.init()
    },
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
      pubsub.publish("selection:selected", [type, selectInfoList])
    },

    /** 原生消息:取消选中节点(资源) */
    "selection:unselected"(err, type, unSelectInfoList) {
      pubsub.publish("selection:unselected", [type, unSelectInfoList])

    },

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
      const oriRefreshInterval = global.setting.refreshInterval
      global.setting = setting

      if (oriWatchInterval != setting.watchInterval) {
        watchFile.resetMonitor()
      } 

      if (oriRefreshInterval != setting.refreshInterval) {
        watchFile.rewatch()
      }

      fs.writeFileSync(path.join(__dirname, "setting.json"), JSON.stringify(global.setting), { encoding: 'utf-8' })
      sender.reply(null, global.setting)
    },

    "hyrm-plugin:sort-nodes/sort"() {
      sortNodes.sort()
    },

    "hyrm-plugin:spine-preview/open"() {
      spinePreview.open()
    }

  }
}