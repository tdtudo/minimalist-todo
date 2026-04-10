const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const todoFilePath = path.join(app.getPath('userData'), 'todos.json');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 280,
        height: 400,
        frame: false,
        transparent: true,
        hasShadow: true,
        movable: true,
        skipTaskbar: true,
        type: 'toolbar',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    win.loadFile('index.html');
    
    win.setSkipTaskbar(true);
}

app.whenReady().then(() => {
    createWindow();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('read-todos', async () => {
    try {
        if (fs.existsSync(todoFilePath)) {
            const data = fs.readFileSync(todoFilePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        return [];
    }
});

ipcMain.handle('write-todos', async (event, todos) => {
    try {
        fs.writeFileSync(todoFilePath, JSON.stringify(todos, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.on('window-minimize', () => {
    if (win) win.minimize();
});

ipcMain.on('window-close', () => {
    if (win) win.close();
});

ipcMain.handle('toggle-pin', () => {
    if (win) {
        const isPinned = win.isAlwaysOnTop();
        win.setAlwaysOnTop(!isPinned);
        return !isPinned;
    }
    return false;
});
