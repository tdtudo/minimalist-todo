const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

const todoFilePath = path.join(app.getPath('userData'), 'todos.json');

let win;
let settingsWin;
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
    const iconPath = path.join(__dirname, 'icon.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    
    tray = new Tray(icon);
    tray.setToolTip('待办清单');
    
    updateTrayMenu();
    
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

function updateTrayMenu() {
    const autostartEnabled = app.getLoginItemSettings().openAtLogin;
    
    const contextMenu = Menu.buildFromTemplate([
        { label: '显示窗口', click: () => { if (win) { win.show(); win.focus(); } } },
        { type: 'separator' },
        { 
            label: autostartEnabled ? '✓ 开机自启动' : '开机自启动', 
            click: () => { 
                app.setLoginItemSettings({
                    openAtLogin: !autostartEnabled,
                    openAsHidden: true
                });
                updateTrayMenu();
            } 
        },
        { type: 'separator' },
        { label: '退出', click: () => { 
            tray.destroy();
            app.exit(); 
        } }
    ]);
    
    tray.setContextMenu(contextMenu);
}

function createWindow() {
    const iconPath = path.join(__dirname, 'icon.png');
    
    win = new BrowserWindow({
        width: 280,
        height: 400,
        frame: false,
        transparent: true,
        hasShadow: true,
        movable: true,
        skipTaskbar: true,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    win.loadFile('index.html');
}

function createSettingsWindow() {
    if (settingsWin) {
        settingsWin.focus();
        return;
    }
    
    const mainBounds = win.getBounds();
    
    settingsWin = new BrowserWindow({
        width: 360,
        height: 280,
        x: mainBounds.x + (mainBounds.width - 360) / 2,
        y: mainBounds.y + (mainBounds.height - 280) / 2,
        frame: false,
        transparent: true,
        hasShadow: true,
        resizable: false,
        parent: win,
        modal: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    settingsWin.loadFile('settings.html');
    
    settingsWin.on('closed', () => {
        settingsWin = null;
        if (win) {
            win.webContents.send('settings-closed');
        }
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('open-settings', () => {
    createSettingsWindow();
});

ipcMain.on('close-settings', () => {
    if (settingsWin) {
        settingsWin.close();
    }
});

ipcMain.on('settings-changed', (event, data) => {
    if (win) {
        win.webContents.send('settings-updated', data);
    }
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

ipcMain.handle('get-autostart', () => {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
});

ipcMain.handle('set-autostart', (event, enable) => {
    app.setLoginItemSettings({
        openAtLogin: enable,
        openAsHidden: true
    });
    return enable;
});
