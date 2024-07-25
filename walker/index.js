module.exports = {

    'sort-editor-node': (event, uuid, sortFunc) => {

        const getChild = (node, uuid) => {

            if (node.uuid === uuid) return node

            for (const child of node.children) {
                const result = getChild(child, uuid)
                if (result) return result
            }

            return null
        }

        const root = cc.director._scene

        const result = getChild(root, uuid)
        if (!result) return event.reply(null, false)

        if (result) {
            const func = new Function('node1', 'node2', sortFunc)
            result.children.sort(func)
            event.reply(null, true)
        }

    },

    'open-spine-preview': (event) => {
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
        event.reply(null)
    }
}