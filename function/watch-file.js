const fs = require('fs')
const watch = require('watch')
const { log } = require('../utils/index')


// function getMainWebContents() {
//     let allwins = electron.BrowserWindow.getAllWindows();
//     for (let i = 0; i < allwins.length; i++) {
//         const win = allwins[i];
//         const url = win.getURL()
//         if (url.includes('windows/main.html') || url.includes('app.asar/editor/index.html') || win.title && win.title.includes('Cocos Creator')) {
//             return win.webContents;
//         }
//     }
//     return;
// }
// function copyFolder(source, target) {
//     if (!fs.existsSync(target)) {
//         fs.mkdirSync(target);
//     }

//     const files = fs.readdirSync(source);

//     files.forEach((file) => {
//         const sourcePath = path.join(source, file);
//         const targetPath = path.join(target, file);

//         if (fs.lstatSync(sourcePath).isDirectory()) {
//             copyFolder(sourcePath, targetPath);
//         } else {
//             fs.copyFileSync(sourcePath, targetPath);
//         }
//     });
// }
// function deleteFolderRecursive(folderPath) {
//     if (fs.existsSync(folderPath)) {
//         fs.readdirSync(folderPath).forEach((file) => {
//             const curPath = path.join(folderPath, file);

//             if (fs.lstatSync(curPath).isDirectory()) {
//                 deleteFolderRecursive(curPath);
//             } else {
//                 fs.unlinkSync(curPath);
//             }
//         });

//         fs.rmdirSync(folderPath);
//     }
// }

let monitor = null
const assetTypes = []

const refresh = (uuid) => {

    const assetInfo = Editor.assetdb.assetInfoByUuid(uuid)

    if (assetInfo.type == "folder") {
        Editor.assetdb.queryAssets(`${assetInfo.url}/*/`, assetTypes, (err, assetInfos) => assetInfos.forEach(info => refresh(info.uuid)))
    } else {
        Editor.assetdb.refresh(assetInfo.url, (err, refreshResult) => {
            if (err) return Editor.error(err)
            log.success(`刷新资源成功=>${refreshResult[0].url}`)
        })
    }

}

const onwatch = () => {
    if (monitor) return log.error("文件监听已开启，请勿重复开启")

    const assetsPath = Editor.assetdb.urlToFspath("db://assets")
    if (!assetsPath) return log.error("文件监听开启失败，请尝试在菜单中手动开启")

    watch.createMonitor(Editor.assetdb.urlToFspath("db://assets"), { interval: global.setting.watchInterval }, (mo) => {
        mo.on("removed", (FileFspath, stat) => {

        })

        mo.on("created", (FileFspath, stat) => {
            log.success(FileFspath)
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
                    if (err) return log.error(`${err}`)
                    log.success(`导入资源成功=>${parentURL}/${path.basename(FileFspath)}`)
                })
            }
        })

        mo.on("changed", (FileFspath, cur, prev) => {
            if (path.extname(FileFspath) == ".meta") return
            const fileUUID = Editor.assetdb.fspathToUuid(FileFspath)
            refresh(fileUUID)
        })

        Editor.assetdb.deepQuery((err, result) => {

            if (err) return log.error(err)

            result.forEach(asset => { if (!assetTypes.includes(asset.type)) assetTypes.push(asset.type) })
        })

        monitor = mo
        log.success(`文件监听开启成功，间隔:${global.setting.watchInterval}秒`)
    })
}

const unwatch = () => {
    if (!monitor) return
    monitor.stop()
    monitor = null
    log.success("文件监听关闭成功")
}

const rewatch = () => {
    if (!monitor) return
    monitor.stop()
    monitor = null
    onwatch()
}

exports.onwatch = onwatch
exports.unwatch = unwatch
exports.rewatch = rewatch