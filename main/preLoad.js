const { contextBridge, ipcRenderer } = require("electron");

// Güvenli kanal listesi
const validChannels = [
  "server:start",
  "server:stop",
  "server:status",
  "file:createSerie",
  "file:createSeason",
  "dialog:openFile",
];

contextBridge.exposeInMainWorld("api", {
  // IPC renderer sent message to main
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn("Blocked IPC channel:", channel);
    }
  },

  // IPC get message from main
  receive: (channel, func) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    } else {
      console.warn("Blocked IPC channel:", channel);
    }
  },

  // promise returning
  invoke: (channel, args) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, args);
    } else {
      console.warn("Blocked IPC channel:", channel);
    }
  },

  // Clear listener
  remove: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
