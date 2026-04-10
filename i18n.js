const translations = {
    zh: {
        placeholder: '输入新任务...',
        add: '添加',
        delete: '删除',
        emptyState: '暂无任务',
        pinTitle: '固定到桌面',
        unpinTitle: '取消固定',
        addTitle: '添加任务'
    },
    en: {
        placeholder: 'Enter a new task...',
        add: 'Add',
        delete: 'Delete',
        emptyState: 'No tasks',
        pinTitle: 'Pin to desktop',
        unpinTitle: 'Unpin from desktop',
        addTitle: 'Add task'
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
        pinBtn.title = document.getElementById('pin-btn').classList.contains('pinned') 
            ? t('unpinTitle') 
            : t('pinTitle');
    }
    
    const addToggle = document.getElementById('add-toggle');
    if (addToggle) {
        addToggle.title = t('addTitle');
    }
    
    renderTodos();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, setLanguage, getLanguage, t, updateUI };
}
