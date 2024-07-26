const fs = require('fs')
const path = require('path')
const watch = require('watch')
const { log } = require('../utils/index')
exports.watchFile = class {

    static monitor = null
    static assetTypes = []

    static addFileMap = new Map()
    static addFileInterval = null

    static init() {
        if (global.setting.watchAuto) this.onwatch()
    }

    static onwatch() {
        if (this.monitor) return log.warn("文件监听已开启，请勿重复开启")
        // assetdb 初始化时机较晚,间隔反复尝试
        const assetsPath = Editor.assetdb.urlToFspath("db://assets")
        if (!assetsPath) {
            return setTimeout(() => this.onwatch(), 100)
        }

        watch.createMonitor(Editor.assetdb.urlToFspath("db://assets"), { interval: global.setting.watchInterval }, (monitor) => {

            monitor.on("removed", (FileFspath, stat) => {

            })

            monitor.on("created", (FileFspath, stat) => {

                const extName = path.extname(FileFspath) == ".meta"
                const isExist = Editor.assetdb.existsByPath(FileFspath)
                if (extName || isExist) return

                let root = path.dirname(FileFspath)
                while (true) {

                    const isExist = Editor.assetdb.existsByPath(root)
                    if (isExist) {
                        this.addFileMap.set(root, root)
                        log.success(`新增文件${FileFspath},所在资源目录:${Editor.assetdb.fspathToUrl(root)}`)
                        break
                    }
                    root = path.dirname(root)
                }

                clearInterval(this.addFileInterval)
                this.addFileInterval = setInterval(this.clearAddFileMap.bind(this), 3000)
            })

            monitor.on("changed", (FileFspath, cur, prev) => {
                if (path.extname(FileFspath) == ".meta") return
                const fileUUID = Editor.assetdb.fspathToUuid(FileFspath)
                this.refresh(fileUUID)
            })

            Editor.assetdb.deepQuery((err, result) => {

                if (err) return log.error(err)

                result.forEach(asset => { if (!this.assetTypes.includes(asset.type)) this.assetTypes.push(asset.type) })
            })

            this.monitor = monitor
            this.addFileInterval = setInterval(this.clearAddFileMap.bind(this), 3000)
            log.success(`文件监听开启成功，间隔:${global.setting.watchInterval}秒`)
        })
    }

    static unwatch() {
        if (!this.monitor) return
        this.monitor.stop()
        this.monitor = null
        this.addFileInterval = null
        clearInterval(this.addFileInterval)
        log.success("文件监听关闭成功")
    }

    static rewatch() {
        if (!this.monitor) return
        this.unwatch()
        this.onwatch()
    }

    static clearAddFileMap() {

        if (this.addFileMap.size == 0) return

        const result = []

        for (const path of this.addFileMap.keys()) {

            let flag = true

            result.filter((value) => {
                if (value.length > path.length) return !value.startsWith(path)
                if (path.startsWith(value)) flag = false
                return true
            })

            if (flag) result.push(path)
        }



        for (const path of result) {
            const dbPath = Editor.assetdb.fspathToUrl(path)
            log.success(`刷新新增目录:${dbPath}`)
            Editor.assetdb.refresh(dbPath, (err, refreshResult) => {
                if (err) return Editor.error(err)
            })
        }

        this.addFileMap.clear()
    }


    static refresh(uuid) {
        const assetInfo = Editor.assetdb.assetInfoByUuid(uuid)

        if (assetInfo.type == "folder") {
            Editor.assetdb.queryAssets(`${assetInfo.url}/*/`, this.assetTypes, (err, assetInfos) => assetInfos.forEach(info => refresh(info.uuid)))
        } else {
            Editor.assetdb.refresh(assetInfo.url, (err, refreshResult) => {
                if (err) return Editor.error(err)
                log.success(`刷新资源成功=>${refreshResult[0].url}`)
            })
        }
    }
}