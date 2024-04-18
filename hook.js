ignoreMsg = ['scene:query-node'];

(() => {
    //** 开启Spine动画预览模式 */
    if (CC_EDITOR) {
        // 重写update方法 达到在编辑模式下 自动播放动画的功能
        sp.Skeleton.prototype['update'] = function (dt) {
            if (CC_EDITOR) {
                cc['engine']._animatingInEditMode = 1;
                cc['engine'].animatingInEditMode = 1;
            }
            if (this.paused) return;

            dt *= this.timeScale * sp['timeScale'];

            if (this.isAnimationCached()) {

                // Cache mode and has animation queue.
                if (this._isAniComplete) {
                    if (this._animationQueue.length === 0 && !this._headAniInfo) {
                        let frameCache = this._frameCache;
                        if (frameCache && frameCache.isInvalid()) {
                            frameCache.updateToFrame();
                            let frames = frameCache.frames;
                            this._curFrame = frames[frames.length - 1];
                        }
                        return;
                    }
                    if (!this._headAniInfo) {
                        this._headAniInfo = this._animationQueue.shift();
                    }
                    this._accTime += dt;
                    if (this._accTime > this._headAniInfo.delay) {
                        let aniInfo = this._headAniInfo;
                        this._headAniInfo = null;
                        this.setAnimation(0, aniInfo.animationName, aniInfo.loop);
                    }
                    return;
                }

                this._updateCache(dt);
            } else {
                this._updateRealtime(dt);
            }
        }
    }

    //** IPC消息劫持调试 */

    if (!Editor.Ipc.sendToAll.isHook) {
        const preSendToAll = Editor.Ipc.sendToAll
        Editor.Ipc.sendToAll = (...args) => {
            console.log("[sendToAll]", ...args)
            return preSendToAll(...args);
        }
        Editor.Ipc.sendToAll.isHook = true
    }

    if (!Editor.Ipc.sendToMain.isHook) {
        const preSendToMain = Editor.Ipc.sendToMain
        Editor.Ipc.sendToMain = (...args) => {
            console.log("[sendToMain]", ...args)
            return preSendToMain(...args);
        }
        Editor.Ipc.sendToMain.isHook = true
    }

    if (!Editor.Ipc.sendToPanel.isHook) {
        const preSendToPanel = Editor.Ipc.sendToPanel
        Editor.Ipc.sendToPanel = (...args) => {
            if (!ignoreMsg.includes(args[0] || args[1])) {
                console.log("[sendToPanel]", ...args)
            }
            return preSendToPanel(...args);
        }
        Editor.Ipc.sendToPanel.isHook = true
    }

    if (!Editor.Ipc.sendToMainWin.isHook) {
        const preSendToMainWin = Editor.Ipc.sendToMainWin
        Editor.Ipc.sendToMainWin = (...args) => {
            console.log("[sendToMainWin]", ...args)
            return preSendToMainWin(...args);
        }
        Editor.Ipc.sendToMainWin.isHook = true
    }

    if (!Editor.Ipc.sendToPackage.isHook) {
        const preSendToPackage = Editor.Ipc.sendToPackage
        Editor.Ipc.sendToPackage = (...args) => {
            console.log("[sendToPackage]", ...args)
            return preSendToPackage(...args);
        }
        Editor.Ipc.sendToPackage.isHook = true
    }

    if (!Editor.Ipc.sendToWins.isHook) {
        const preSendToWins = Editor.Ipc.sendToWins
        Editor.Ipc.sendToWins = (...args) => {
            console.log("[sendToWins]", ...args)
            return preSendToWins(...args);
        }
        Editor.Ipc.sendToWins.isHook = true
    }
















})()

