const util = require('../utils/index')
exports.spinePreview = class {

    static state = false

    static init() {
        if (global.setting.spineAutoPreview) this.open()
    }

    static open() {
        if (this.state) return util.log.warn("Spine预览已开启,请勿重复开启")
        Editor.Scene.callSceneScript('hyrm-plugin', 'open-spine-preview', (err) => {
            // 编辑器渲染进程初始化时机较晚,间隔反复尝试
            if (err) return setTimeout(() => this.open(), 100)
            this.state = true
            util.log.success(`Spine预览开启成功`)
        })
    }
}