let monitor = null

const fs = require('fs')
const watch = require('watch')
exports.watchFile = () => {
    if (monitor) return Editor.error("[Hyrm's-Plugin]:文件监听已开启，请勿重复开启")

    const assetsPath = Editor.assetdb.urlToFspath("db://assets")
    if (!assetsPath) return Editor.error("[Hyrm's-Plugin]:文件监听开启失败，请尝试在菜单中手动开启")

    watch.createMonitor(Editor.assetdb.urlToFspath("db://assets"), (monitor) => {

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

        })

        this.monitor = monitor
        Editor.success("[Hyrm's-Plugin]:文件监听=》开启成功")

    })

}