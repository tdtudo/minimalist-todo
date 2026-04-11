const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

const todoFilePath = path.join(app.getPath('userData'), 'todos.json');

let win;
let tray;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (win) {
            if (win.isMinimized()) win.restore();
            win.show();
            win.focus();
        }
    });

    app.whenReady().then(() => {
        createTray();
        createWindow();
    });
}

function createTray() {
    const icon = nativeImage.createFromDataURL(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWklEQVQ4T2NkoBAwUqifYdAY8B8I/v9ngOwCZWVlRkNDw/8wA4DCMDAMAAPksBd4xP1HCQeYGPzPwIhh2IEZwPj/nwHhM5D5DzD9B8j8ZyDzH2D6D5D5D2D6j5j+A2T+M5D5z0DmPwOZ/wxk/gsAMgwDAwAqngGmTQY4IQAAAABJRU5ErkJggg=='
    );
    
    tray = new Tray(icon);
    tray.setToolTip('待办清单');
    
    const contextMenu = Menu.buildFromTemplate([
        { label: '显示窗口', click: () => { if (win) { win.show(); win.focus(); } } },
        { type: 'separator' },
        { label: '退出', click: () => { 
            tray.destroy();
            app.exit(); 
        } }
    ]);
    
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        if (win) {
            if (win.isVisible()) {
                win.hide();
            } else {
                win.show();
                win.focus();
            }
        }
    });
}

function createWindow() {
    win = new BrowserWindow({
        width: 280,
        height: 400,
        frame: false,
        transparent: true,
        hasShadow: true,
        movable: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    win.loadFile('index.html');
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
    if (win) win.hide();
});

ipcMain.on('window-quit', () => {
    if (tray) tray.destroy();
    app.exit();
});

ipcMain.handle('toggle-lock', () => {
    if (win) {
        const isMovable = win.isMovable();
        win.setMovable(!isMovable);
        return isMovable;
    }
    return false;
});
