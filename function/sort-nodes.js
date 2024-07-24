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
            util.log.success("selectedNodes:", this.selectedNodes)
        })

        pubsub.subscribe('selection:unselected', (type, selectedList) => {
            if (type != "node") return
            selectedList.forEach(uuid => { if (this.selectedNodes.includes(uuid)) { this.selectedNodes.splice(this.selectedNodes.indexOf(uuid), 1) } })
            util.log.success("selectedNodes:", this.selectedNodes)
        })

    }


    static sort() {

        if (this.selectedNodes.length == 0) return util.log.error("请先选中要排序的节点")

        if (this.selectedNodes.length > 1) return util.log.error("请确保当前只选中一个节点")

        const funcString = global.setting.sortCallback
        const funcBodyString = funcString.substring(funcString.indexOf("{") + 1, funcString.lastIndexOf("}"))

        let func = null
        try {
            func = new Function("node1", "node2", funcBodyString)
        } catch (e) {
            return util.log.error("解析排序回调函数失败，请在设置中检查格式")
        }


        const prefebData = JSON.parse(fs.readFileSync(this.curPrefebPath, 'utf-8'))

        Editor.Ipc.sendToPanel("scene", "scene:query-node", this.selectedNodes[0], (err, result) => {

            if (err) reject(err)

            const selectedNodeInfo = JSON.parse(result)
            for (const nodeInfo of prefebData) {

                if (this.editMode == "prefeb") {
                    //prefeb
                    if (nodeInfo._name != selectedNodeInfo.value.name.value) continue
                    nodeInfo._children.sort((a, b) => {
                        const node1 = { name: prefebData[a.__id__]._name, children: prefebData[a.__id__]._children }
                        const node2 = { name: prefebData[b.__id__]._name, children: prefebData[b.__id__]._children }
                        return func(node1, node2)
                    })
                    util.log.success(333333333333333)
                    Editor.Ipc.sendToMain("scene:apply-prefab", this.curPrefebUuid, JSON.stringify(prefebData), (err) => {
                        util.log.success(11111111111111111111111)
                        if (err) return Editor.error(`[Hyrm's-Plugin]${err}`)
                        Editor.success(`[Hyrm's-Plugin]:排序节点并保存prefeb成功=>${this.curPrefebPath}`)
                        // Editor.Ipc.sendToMain("scene:enter-prefab-edit-mode", this.curPrefebUuid)
                    })
                    break


                } else {
                    //scene
                    if (nodeInfo._id != this.selectedNodes[0]) continue
                    util.log.success(prefebData)
                    util.log.success(nodeInfo._children)
                    nodeInfo._children.sort((a, b) => {
                        const node1 = { name: prefebData[a.__id__]._name, children: prefebData[a.__id__]._children }
                        const node2 = { name: prefebData[b.__id__]._name, children: prefebData[b.__id__]._children }
                        return func(node1, node2)
                    })

                    Editor.Ipc.sendToMain("scene:save-scene", JSON.stringify(prefebData), this.curPrefebUuid, (err) => {
                        if (err) return Editor.error(`[Hyrm's-Plugin]${err}`)
                        Editor.success(`[Hyrm's-Plugin]:排序节点并保存scene成功=>${this.curPrefebPath}`)
                        Editor.Ipc.sendToMain("scene:open-by-uuid", this.curPrefebUuid)
                    })
                    break

                }
            }
        })
    }
}

// () {

//     if (this.nodesSelectedList.length > 1) return Editor.error(`[Hyrm's-Plugin]:请确保当前只选中一个节点`)

//     const prefebData = JSON.parse(fs.readFileSync(this.curPrefebPath, 'utf-8'))
//     for (const nodeInfo of prefebData) {

//       switch (this.editMode) {

//         case "prefeb": {
//           const nodeInfoExt = await new Promise((resolve, reject) => {
//             Editor.Ipc.sendToPanel("scene", "scene:query-node", this.nodesSelectedList[0], (err, result) => {
//               if (err) reject(err)
//               resolve(JSON.parse(result))
//             })
//           })

//           if (nodeInfo._name != nodeInfoExt.value.name.value) continue
//           nodeInfo._children.sort((a, b) => {
//             const aName = prefebData[a.__id__]._name
//             const bName = prefebData[b.__id__]._name
//             Editor.log(aName, bName)
//             return Number(aName) - Number(bName)
//           })
//           break
//         }

//         case "scene": {
//           if (nodeInfo._id != this.nodesSelectedList[0]) continue

//           nodeInfo._children.sort((a, b) => {
//             const aName = prefebData[a.__id__]._name
//             const bName = prefebData[b.__id__]._name
//             return Number(aName) - Number(bName)
//           })
//           break
//         }
//       }

//     }


//     switch (this.editMode) {
//       case "prefeb": {
//         Editor.Ipc.sendToMain("scene:apply-prefab", this.curPrefebUuid, JSON.stringify(prefebData), (err) => {
//           if (err) return Editor.error(`[Hyrm's-Plugin]${err}`)
//           Editor.success(`[Hyrm's-Plugin]:排序节点并保存prefeb成功=>${this.curPrefebPath}`)
//         })
//         break
//       }
//       case "scene": {
//         Editor.Ipc.sendToMain("scene:save-scene", JSON.stringify(prefebData), this.curPrefebUuid, (err) => {
//           if (err) return Editor.error(`[Hyrm's-Plugin]${err}`)
//           Editor.success(`[Hyrm's-Plugin]:排序节点并保存scene成功=>${this.curPrefebPath}`)
//         })
//       }
//     }
//   },