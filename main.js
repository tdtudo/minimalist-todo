const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

const todoFilePath = path.join(app.getPath('userData'), 'todos.json');

let mainWin;
let settingsWin;
let tray;
const tagWindows = new Map();

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWin) {
            if (mainWin.isMinimized()) mainWin.restore();
            mainWin.show();
            mainWin.focus();
        }
    });

    app.whenReady().then(() => {
        createTray();
        createMainWindow();
    });
}

function createTray() {
    const iconPath = path.join(__dirname, 'icon.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    
    tray = new Tray(icon);
    tray.setToolTip('待办清单');
    
    updateTrayMenu();
    
    tray.on('click', () => {
        if (mainWin) {
            if (mainWin.isVisible()) {
                mainWin.hide();
            } else {
                mainWin.show();
                mainWin.focus();
            }
        }
    });
}

function updateTrayMenu() {
    const autostartEnabled = app.getLoginItemSettings().openAtLogin;
    
    const contextMenu = Menu.buildFromTemplate([
        { label: '显示主窗口', click: () => { if (mainWin) { mainWin.show(); mainWin.focus(); } } },
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

function createMainWindow() {
    const iconPath = path.join(__dirname, 'icon.png');
    
    mainWin = new BrowserWindow({
        width: 280,
        height: 400,
        frame: false,
        transparent: true,
        hasShadow: true,
        movable: true,
        resizable: false,
        skipTaskbar: true,
        icon: iconPath,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    mainWin.setMenu(null);
    mainWin.loadFile('index.html');
    
    mainWin.webContents.on('context-menu', (e) => {
        e.preventDefault();
    });
}

function createTagWindow(tag, x, y) {
    if (tagWindows.has(tag)) {
        const win = tagWindows.get(tag);
        win.show();
        win.focus();
        return;
    }
    
    const iconPath = path.join(__dirname, 'icon.png');
    
    const windowWidth = 280;
    const windowHeight = 400;
    
    const tagWin = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: x !== undefined ? x - windowWidth / 2 : undefined,
        y: y !== undefined ? y - 20 : undefined,
        frame: false,
        transparent: true,
        hasShadow: true,
        movable: true,
        resizable: false,
        skipTaskbar: true,
        icon: iconPath,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    tagWin.setMenu(null);
    tagWin.loadFile('index.html');
    
    tagWin.webContents.on('context-menu', (e) => {
        e.preventDefault();
    });
    
    tagWin.once('ready-to-show', () => {
        tagWin.webContents.send('set-filter-tag', tag);
        if (mainWin) {
            mainWin.webContents.send('tag-window-opened', tag);
        }
    });
    
    tagWin.on('closed', () => {
        tagWindows.delete(tag);
        if (mainWin) {
            mainWin.webContents.send('tag-window-closed', tag);
        }
    });
    
    tagWindows.set(tag, tagWin);
}

function createSettingsWindow() {
    if (settingsWin) {
        settingsWin.focus();
        return;
    }
    
    const mainBounds = mainWin.getBounds();
    
    settingsWin = new BrowserWindow({
        width: 360,
        height: 280,
        x: mainBounds.x + (mainBounds.width - 360) / 2,
        y: mainBounds.y + (mainBounds.height - 280) / 2,
        frame: false,
        transparent: true,
        hasShadow: true,
        resizable: false,
        parent: mainWin,
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
        if (mainWin) {
            mainWin.webContents.send('settings-closed');
        }
    });
}

app.on('window-all-closed', () => {
    const windowCount = BrowserWindow.getAllWindows().length;
    if (windowCount === 0 && tray) {
        tray.destroy();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
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
    if (mainWin) {
        mainWin.webContents.send('settings-updated', data);
    }
});

ipcMain.handle('create-tag-window', async (event, tag, x, y) => {
    createTagWindow(tag, x, y);
    return { success: true };
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
        
        const allWindows = BrowserWindow.getAllWindows();
        allWindows.forEach(win => {
            win.webContents.send('todos-updated');
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.hide();
});

ipcMain.on('window-move', (event, dx, dy) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        const [x, y] = win.getPosition();
        win.setPosition(x + dx, y + dy);
    }
});

ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
});

ipcMain.on('window-quit', () => {
    if (tray) tray.destroy();
    app.exit();
});

ipcMain.handle('toggle-lock', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        const isMovable = win.isMovable();
        win.setMovable(!isMovable);
        return isMovable;
    }
    return false;
});

ipcMain.handle('toggle-always-on-top', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        const isOnTop = win.isAlwaysOnTop();
        win.setAlwaysOnTop(!isOnTop);
        return !isOnTop;
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
