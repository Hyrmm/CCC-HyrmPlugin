const fs = require('fs')
const path = require('path')
const watch = require('watch')
const { log } = require('../utils/index')
exports.watchFile = class {

    static monitor = null
    static assetTypes = []

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
                // const parentURL = Editor.assetdb.fspathToUrl(path.dirname(FileFspath))
                // const targetDirectory = path.join(path.dirname(assetsPath), "/hyrm-plugin-file")

                // if (fs.existsSync(targetDirectory) && !Editor.assetdb.existsByPath(FileFspath) && path.extname(FileFspath) != ".meta") {

                //     if (stat.isDirectory()) {
                //         copyFolder(FileFspath, path.join(targetDirectory, path.basename(FileFspath)))
                //         deleteFolderRecursive(FileFspath)
                //     } else {
                //         fs.copyFileSync(FileFspath, path.join(targetDirectory, path.basename(FileFspath)))
                //         fs.unlinkSync(FileFspath)
                //     }

                //     Editor.assetdb.import([path.join(targetDirectory, path.basename(FileFspath))], parentURL, (err, result) => {
                //         if (err) return log.error(`${err}`)
                //         log.success(`导入资源成功=>${parentURL}/${path.basename(FileFspath)}`)
                //     })
                // }
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
            log.success(`文件监听开启成功，间隔:${global.setting.watchInterval}秒`)
        })
    }

    static unwatch() {
        if (!this.monitor) return
        this.monitor.stop()
        this.monitor = null
        log.success("文件监听关闭成功")
    }

    static rewatch() {
        if (!this.monitor) return
        this.monitor.stop()
        this.monitor = null
        this.onwatch()
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