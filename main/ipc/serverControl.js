const { ipcMain } = require("electron");
const { spawn, exec } = require("child_process");
let serverProcess = null;

module.exports = function registerServerControlIPC() {
  // start server
  ipcMain.handle("server:start", async () => {
    if (serverProcess) return { running: true, message: "Already running" };

    serverProcess = spawn("node", ["backend/index.js"], {
      cwd: process.cwd(),
      detached: false,
      stdio: "inherit",
    });

    return { running: true, message: "Server started" };
  });

  // Stop server
  ipcMain.handle("server:stop", async () => {
    if (!serverProcess) return { running: false, message: "Not running" };

    serverProcess.kill();
    serverProcess = null;

    return { running: false, message: "Server stopped" };
  });

  // Server status
  ipcMain.handle("server:status", async () => {
    return { running: serverProcess !== null };
  });
};
