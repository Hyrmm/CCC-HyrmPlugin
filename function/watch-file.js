const fs = require('fs')
const path = require('path')
const watch = require('watch')
const { log } = require('../utils/index')
exports.watchFile = class {

    static monitor = null
    static iswatching = false
    static assetTypes = []

    static addFileMap = new Map()
    static addFileInterval = null

    static changeFileMap = new Map()
    static changeFileInterval = null

    static init() {
        if (global.setting.watchAuto) this.onwatch()
    }

    static onwatch() {
        if (this.iswatching) return log.warn("文件监听已开启，请勿重复开启")


        if (!this.monitor) {
            const assetsPath = Editor.assetdb.urlToFspath("db://assets")
            if (!assetsPath) return setTimeout(() => { this.onwatch() }, 3000)
            watch.createMonitor(Editor.assetdb.urlToFspath("db://assets"), { interval: global.setting.watchInterval / 1000 }, (monitor) => {

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
                    this.changeFileMap.set(FileFspath, FileFspath)
                })

                Editor.assetdb.deepQuery((err, result) => {

                    if (err) return log.error(err)

                    result.forEach(asset => { if (!this.assetTypes.includes(asset.type)) this.assetTypes.push(asset.type) })
                })

                this.iswatching = true
                this.monitor = monitor
                this.addFileInterval = setInterval(this.clearAddFileMap.bind(this), 3000)
                this.changeFileInterval = setInterval(this.clearChangeFileMap.bind(this), global.setting.refreshInterval)
                log.success(`文件监听开启成功，刷新间隔:${global.setting.refreshInterval}ms，监听间隔:${global.setting.watchInterval}ms`)
            })
        } else {
            this.iswatching = true
            this.addFileInterval = setInterval(this.clearAddFileMap.bind(this), 3000)
            this.changeFileInterval = setInterval(this.clearChangeFileMap.bind(this), global.setting.refreshInterval)
            log.success(`文件监听开启成功，刷新间隔:${global.setting.refreshInterval}ms，，监听间隔:${global.setting.watchInterval}ms`)
        }


    }

    static unwatch() {
        if (!this.iswatching) return

        this.iswatching = false

        this.addFileInterval = null
        clearInterval(this.addFileInterval)

        this.changeFileInterval = null
        clearInterval(this.changeFileInterval)

        log.success("文件监听关闭成功")
    }

    static rewatch() {
        if (!this.iswatching) return
        this.unwatch()
        this.onwatch()
    }

    static resetMonitor() {
        this.iswatching = false
        
        this.monitor.stop()
        this.monitor = null

        watch.createMonitor(Editor.assetdb.urlToFspath("db://assets"), { interval: global.setting.watchInterval / 1000 }, (monitor) => {

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
                this.changeFileMap.set(FileFspath, FileFspath)
            })

            Editor.assetdb.deepQuery((err, result) => {

                if (err) return log.error(err)

                result.forEach(asset => { if (!this.assetTypes.includes(asset.type)) this.assetTypes.push(asset.type) })
            })

            this.iswatching = true
            this.monitor = monitor
        })
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

    static clearChangeFileMap() {
        if (this.changeFileMap.size == 0) return

        for (const fileFspath of this.changeFileMap.keys()) {
            const fileUUID = Editor.assetdb.fspathToUuid(fileFspath)
            this.refresh(fileUUID)
        }

        this.changeFileMap.clear()
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