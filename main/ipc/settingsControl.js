const { ipcMain, dialog, app } = require("electron");
const {parseEnv,saveEnv} = require("../utils/processenv")

module.exports = function registerSettingsControl() {
    ipcMain.handle("settings:get", async () => {
        return parseEnv();
    });
    ipcMain.handle("settings:save", async (event, config) => {
        try {
            saveEnv(config);
            return { success: true, message: "Ayarlar kaydedildi. Değişiklikler için uygulamayı yeniden başlatın." };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });
    ipcMain.handle("app:restart", () => {
        app.relaunch();
        app.exit();
    });
};