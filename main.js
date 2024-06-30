'use strict'
const electron = require('electron')
const path = require('path')
const watch = require('watch')
const fs = require('fs')


function getMainWebContents() {
  let allwins = electron.BrowserWindow.getAllWindows();
  for (let i = 0; i < allwins.length; i++) {
    const win = allwins[i];
    const url = win.getURL()
    if (url.includes('windows/main.html') || url.includes('app.asar/editor/index.html') || win.title && win.title.includes('Cocos Creator')) {
      return win.webContents;
    }
  }
  return;
}
function copyFolder(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  const files = fs.readdirSync(source);

  files.forEach((file) => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolder(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);

      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });

    fs.rmdirSync(folderPath);
  }
}





module.exports = {

  editMode: "",//scene||prefeb
  curPrefebUuid: '',
  curPrefebPath: '',
  nodesSelectedList: [],
  selectedList: [],
  assetTypes: [],
  monitor: null,
  load() {
    // 注入代码
    electron.app.on('web-contents-created', (sender, webContents) => {
      webContents.on('dom-ready', (e) => {
        this.injectHook()
      })
    })
    // 生成资源类型
    this.generateAssetTyps()

    // 开启文件监听
    this.watchFile()




  },

  unload() {

    if (this.monitor) this.monitor.stop()

  },

  injectHook() {
    const hackCode = fs.readFileSync(path.join(__dirname, "hook.js")).toString()
    const webContents = getMainWebContents()

    if (webContents) {
      webContents.executeJavaScript(hackCode).then(() => {
        Editor.success("[Hyrm's-Plugin]:渲染进程Hooks=>注入成功")
      })
    } else {
      Editor.error("[Hyrm's-Plugin]:渲染进程Hooks=>注入失败")
    }
  },

  messages: {

    "scene:open-by-uuid"(err, uuid) {
      this.editMode = "scene"
      const prefebInfo = Editor.assetdb.assetInfoByUuid(uuid)
      this.curPrefebUuid = uuid
      this.curPrefebPath = prefebInfo.path
    },

    "scene:enter-prefab-edit-mode"(err, uuid) {
      this.editMode = "prefeb"
      const prefebInfo = Editor.assetdb.assetInfoByUuid(uuid)
      this.curPrefebUuid = uuid
      this.curPrefebPath = prefebInfo.path
    },

    "selection:selected"(err, type, selectInfoList) {
      this.selectedHandle(err, type, selectInfoList)
    },

    "selection:unselected"(err, type, unSelectInfoList) {
      this.unSelectedHandle(err, type, unSelectInfoList)
    },

    "hyrm-plugin:refresh"() {
      for (const uuid of this.selectedList) {
        this.refreshAssets(uuid)
      }
    },

    "hyrm-plugin:watch-file"() {
      this.watchFile()
    },

    "hyrm-plugin:global-setting"() {
      Editor.Panel.open('hyrm-plugin');
    },


    async "hyrm-plugin:sort-nodes"() {

      if (this.nodesSelectedList.length > 1) return Editor.error(`[Hyrm's-Plugin]:请确保当前只选中一个节点`)

      const prefebData = JSON.parse(fs.readFileSync(this.curPrefebPath, 'utf-8'))

      for (const nodeInfo of prefebData) {

        switch (this.editMode) {

          case "prefeb": {
            const nodeInfoExt = await new Promise((resolve, reject) => {
              Editor.Ipc.sendToPanel("scene", "scene:query-node", this.nodesSelectedList[0], (err, result) => {
                if (err) reject(err)
                resolve(JSON.parse(result))
              })
            })

            if (nodeInfo._name != nodeInfoExt.value.name.value) continue
            nodeInfo._children.sort((a, b) => {
              const aName = prefebData[a.__id__]._name
              const bName = prefebData[b.__id__]._name
              Editor.log(aName, bName)
              return Number(aName) - Number(bName)
            })
            break
          }

          case "scene": {
            if (nodeInfo._id != this.nodesSelectedList[0]) continue

            nodeInfo._children.sort((a, b) => {
              const aName = prefebData[a.__id__]._name
              const bName = prefebData[b.__id__]._name
              return Number(aName) - Number(bName)
            })
            break
          }
        }

      }


      switch (this.editMode) {
        case "prefeb": {
          Editor.Ipc.sendToMain("scene:apply-prefab", this.curPrefebUuid, JSON.stringify(prefebData), (err) => {
            if (err) return Editor.error(`[Hyrm's-Plugin]${err}`)
            Editor.success(`[Hyrm's-Plugin]:排序节点并保存prefeb成功=>${this.curPrefebPath}`)
          })
          break
        }
        case "scene": {
          Editor.Ipc.sendToMain("scene:save-scene", JSON.stringify(prefebData), this.curPrefebUuid, (err) => {
            if (err) return Editor.error(`[Hyrm's-Plugin]${err}`)
            Editor.success(`[Hyrm's-Plugin]:排序节点并保存scene成功=>${this.curPrefebPath}`)
          })
        }
      }
    },

  },

  selectedHandle(err, type, selectInfoList) {

    switch (type) {

      case "asset": {
        for (const selectedUUID of selectInfoList) {
          if (!this.selectedList.includes(selectedUUID)) {
            this.selectedList.push(selectedUUID)
          }
        }
        const selectedList2URL = []
        for (const uuid of this.selectedList) {
          selectedList2URL.push(Editor.assetdb.uuidToUrl(uuid))
        }
        Editor.log(`[Hyrm's-Plugin]:当前选中文件=》${JSON.stringify(selectedList2URL)}`)
        break
      }


      case "node": {
        for (const selectedNodesUUID of selectInfoList) {
          if (!this.nodesSelectedList.includes(selectedNodesUUID)) {
            this.nodesSelectedList.push(selectedNodesUUID)
          }
        }

        Editor.log(`[Hyrm's-Plugin]:当前选中节点=》${JSON.stringify(this.nodesSelectedList)}`)
        break
      }
    }


  },

  unSelectedHandle(err, type, unSelectInfoList) {

    switch (type) {
      case "asset": {
        for (const selectedUUID of unSelectInfoList) {
          if (this.selectedList.includes(selectedUUID)) {
            const index = this.selectedList.indexOf(selectedUUID)
            this.selectedList.splice(index, 1)
          }
        }

        const selectedList2URL = []
        for (const uuid of this.selectedList) {
          selectedList2URL.push(Editor.assetdb.uuidToUrl(uuid))
        }
        break
      }
      case "node": {
        for (const selectedUUID of unSelectInfoList) {
          if (this.nodesSelectedList.includes(selectedUUID)) {
            const index = this.nodesSelectedList.indexOf(selectedUUID)
            this.nodesSelectedList.splice(index, 1)
          }
        }

        const selectedList2URL = []
        for (const uuid of this.nodesSelectedList) {
          selectedList2URL.push(Editor.assetdb.uuidToUrl(uuid))
        }
        break
      }
    }
  },

  refreshAssets(uuid) {
    const assetInfo = Editor.assetdb.assetInfoByUuid(uuid)
    if (assetInfo.type == "folder") {
      Editor.assetdb.queryAssets(`${assetInfo.url}/*/`, this['assetTypes'], (err, assetInfos) => {
        for (const asset of assetInfos) {
          this.refreshAssets(asset.uuid)
        }
      })
    } else {
      Editor.assetdb.refresh(assetInfo.url, (err, refreshResult) => {
        if (err) return Editor.error(err)
        Editor.success(`[Hyrm's-Plugin]:刷新资源成功=>${refreshResult[0].url}`)
      })
    }
  },

  generateAssetTyps() {
    Editor.assetdb.deepQuery((err, result) => {
      if (err) return Editor.error(`[Hyrm's-Plugin]${err}`)

      for (const asset of result) {
        if (!this.assetTypes.includes(asset.type)) this.assetTypes.push(asset.type)
      }
    })
  },

  watchFile() {
    if (this.monitor) return Editor.error("[Hyrm's-Plugin]:文件监听已开启，请勿重复开启")

    const assetsPath = Editor.assetdb.urlToFspath("db://assets")
    if (!assetsPath) return Editor.error("[Hyrm's-Plugin]:文件监听开启失败，请尝试在菜单中手动开启")

    watch.createMonitor(Editor.assetdb.urlToFspath("db://assets"), { interval: 0.01 }, (monitor) => {

      monitor.on("created", (FileFspath, stat) => {
        const parentURL = Editor.assetdb.fspathToUrl(path.dirname(FileFspath))
        const targetDirectory = path.join(path.dirname(assetsPath), "/hyrm-plugin-file")

        if (fs.existsSync(targetDirectory) && !Editor.assetdb.existsByPath(FileFspath) && path.extname(FileFspath) != ".meta") {

          if (stat.isDirectory()) {

            copyFolder(FileFspath, path.join(targetDirectory, path.basename(FileFspath)))
            deleteFolderRecursive(FileFspath)

          } else {
            fs.copyFileSync(FileFspath, path.join(targetDirectory, path.basename(FileFspath)))
            fs.unlinkSync(FileFspath)
          }
          Editor.assetdb.import([path.join(targetDirectory, path.basename(FileFspath))], parentURL, (err, result) => {
            if (err) return Editor.error(`[Hyrm's-Plugin]${err}`)
            Editor.success(`[Hyrm's-Plugin]:导入资源成功=>${parentURL}/${path.basename(FileFspath)}`)
          })
        }
      })

      monitor.on("changed", (FileFspath, curr, prev) => {
        if (path.extname(FileFspath) == ".meta") return
        const fileUUID = Editor.assetdb.fspathToUuid(FileFspath)
        this.refreshAssets(fileUUID)
      })

      monitor.on("removed", (FileFspath, stat) => {
        // if (Editor.assetdb.existsByPath(FileFspath) && path.extname(FileFspath) != ".meta") {
        //   Editor.log(Editor.assetdb.fspathToUrl(FileFspath), this.refreshAssets, Editor.assetdb.fspathToUuid(FileFspath))
        //   this.refreshAssets(Editor.assetdb.fspathToUuid(FileFspath))
        // }
      })

      this.monitor = monitor
      Editor.success("[Hyrm's-Plugin]:文件监听=》开启成功")

    })

  },
}