exports.log = {
    warn: (...msg) => Editor.warn(`[Hyrm's-Plugin]`,...msg),
    error: (...msg) => Editor.error(`[Hyrm's-Plugin]`,...msg),
    success: (...msg) => Editor.success(`[Hyrm's-Plugin]`,...msg)
}