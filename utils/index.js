exports.log = {
    error: (...msg) => Editor.error(`[Hyrm's-Plugin]`,...msg),
    success: (...msg) => Editor.success(`[Hyrm's-Plugin]`,...msg)
}