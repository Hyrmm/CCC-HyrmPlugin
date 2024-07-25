const fs = require('fs')
const util = require('../utils/index')
const pubsub = require("pubsub.js")


exports.sortNodes = class {

    static editMode
    static curPrefebUuid
    static curPrefebPath

    static selectedNodes = []

    static init() {

        pubsub.subscribe('scene:open-by-uuid', (uuid) => {
            const prefebInfo = Editor.assetdb.assetInfoByUuid(uuid)

            this.editMode = "scene"
            this.curPrefebUuid = uuid
            this.curPrefebPath = prefebInfo.path
        })

        pubsub.subscribe('scene:enter-prefab-edit-mode', (uuid) => {
            const prefebInfo = Editor.assetdb.assetInfoByUuid(uuid)

            this.editMode = "prefeb"
            this.curPrefebUuid = uuid
            this.curPrefebPath = prefebInfo.path
        })

        pubsub.subscribe('selection:selected', (type, selectedList) => {
            if (type != "node") return
            selectedList.forEach(uuid => { if (!this.selectedNodes.includes(uuid)) { this.selectedNodes.push(uuid) } })
        })

        pubsub.subscribe('selection:unselected', (type, selectedList) => {
            if (type != "node") return
            selectedList.forEach(uuid => { if (this.selectedNodes.includes(uuid)) { this.selectedNodes.splice(this.selectedNodes.indexOf(uuid), 1) } })
        })

    }

    static sort() {

        if (this.selectedNodes.length == 0) return util.log.warn("请先选中要排序的节点")

        if (this.selectedNodes.length > 1) return util.log.warn("请确保当前只选中一个节点")

        const funcString = global.setting.sortCallback
        const funcBodyString = funcString.substring(funcString.indexOf("{") + 1, funcString.lastIndexOf("}"))

        try {
            new Function("node1", "node2", funcBodyString)
        } catch (e) {
            return util.log.error("解析排序回调函数失败，请在设置中检查格式")
        }

        Editor.Scene.callSceneScript('hyrm-plugin', 'sort-editor-node', this.selectedNodes[0], funcBodyString, (err, msg) => {
            if (err) return util.log.error(msg)
            Editor.Ipc.sendToPanel('scene', 'scene:stash-and-save')
            util.log.success(`排序节点并保存${this.editMode}成功=>${this.curPrefebPath}`)
        })
    }
}