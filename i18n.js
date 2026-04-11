const translations = {
    zh: {
        placeholder: '输入新任务...',
        add: '添加',
        delete: '删除',
        emptyState: '暂无任务',
        lockTitle: '锁定位置',
        unlockTitle: '解锁位置',
        addTitle: '添加任务',
        dialogTitle: '关闭确认',
        dialogMessage: '您想要如何处理？',
        dialogDetail: '选择"最小化到托盘"将隐藏窗口但保持应用运行。',
        dontAskAgain: '不再询问',
        minimizeToTray: '最小化到托盘',
        closeApp: '关闭应用'
    },
    en: {
        placeholder: 'Enter a new task...',
        add: 'Add',
        delete: 'Delete',
        emptyState: 'No tasks',
        lockTitle: 'Lock position',
        unlockTitle: 'Unlock position',
        addTitle: 'Add task',
        dialogTitle: 'Close Confirmation',
        dialogMessage: 'What would you like to do?',
        dialogDetail: 'Minimize to tray will hide the window but keep the app running.',
        dontAskAgain: "Don't ask again",
        minimizeToTray: 'Minimize to tray',
        closeApp: 'Close app'
    }
};

let currentLanguage = 'zh';

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateUI();
}

function getLanguage() {
    const saved = localStorage.getItem('language');
    if (saved) {
        currentLanguage = saved;
    }
    return currentLanguage;
}

function t(key) {
    return translations[currentLanguage][key] || key;
}

function updateUI() {
    const input = document.getElementById('todo-input');
    if (input) {
        input.placeholder = t('placeholder');
    }
    
    const addBtn = document.getElementById('add-btn');
    if (addBtn) {
        addBtn.textContent = t('add');
    }
    
    const pinBtn = document.getElementById('pin-btn');
    if (pinBtn) {
        pinBtn.title = document.getElementById('pin-btn').classList.contains('locked') 
            ? t('unlockTitle') 
            : t('lockTitle');
    }
    
    const addToggle = document.getElementById('add-toggle');
    if (addToggle) {
        addToggle.title = t('addTitle');
    }
    
    const dialogTitle = document.querySelector('.dialog-title');
    if (dialogTitle) dialogTitle.textContent = t('dialogTitle');
    
    const dialogMessage = document.querySelector('.dialog-message');
    if (dialogMessage) dialogMessage.textContent = t('dialogMessage');
    
    const dialogDetail = document.querySelector('.dialog-detail');
    if (dialogDetail) dialogDetail.textContent = t('dialogDetail');
    
    const dontAskAgain = document.querySelector('.dialog-checkbox span');
    if (dontAskAgain) dontAskAgain.textContent = t('dontAskAgain');
    
    const dialogMinimize = document.getElementById('dialog-minimize');
    if (dialogMinimize) dialogMinimize.textContent = t('minimizeToTray');
    
    const dialogClose = document.getElementById('dialog-close');
    if (dialogClose) dialogClose.textContent = t('closeApp');
    
    renderTodos();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, setLanguage, getLanguage, t, updateUI };
}
