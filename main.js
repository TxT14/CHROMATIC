const { app, BrowserWindow } = require('electron');

const winWidth = 500;
const winHeight = 508;

function createWindow() {
const win = new BrowserWindow({
width: winWidth,
height: winHeight,
transparent: true,
frame: false,
resizable: false,
webPreferences: {
nodeIntegration: true,
contextIsolation: false
}
});
win.loadFile('index.html');
}

app.whenReady().then(createWindow);