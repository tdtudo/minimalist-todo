const { ipcRenderer } = require('electron');

let todos = [];
let isLocked = false;
let isAddOpen = false;
let isSettingsOpen = false;
let currentBgColor = localStorage.getItem('bgColor') || 'rgba(255, 255, 255, 0.25)';
let currentBgImage = localStorage.getItem('bgImage') || '';
let currentBgOpacity = parseFloat(localStorage.getItem('bgOpacity')) || 0.3;

document.addEventListener('DOMContentLoaded', () => {
    getLanguage();
    loadTodos();
    applyBackground();
    setupEventListeners();
    updateUI();
});

ipcRenderer.on('settings-updated', (event, data) => {
    currentBgColor = localStorage.getItem('bgColor') || 'rgba(255, 255, 255, 0.25)';
    currentBgImage = localStorage.getItem('bgImage') || '';
    currentBgOpacity = parseFloat(localStorage.getItem('bgOpacity')) || 0.3;
    
    if (data.type === 'language') {
        getLanguage();
    }
    applyBackground();
});

ipcRenderer.on('settings-closed', () => {
    isSettingsOpen = false;
});

async function loadTodos() {
    todos = await ipcRenderer.invoke('read-todos');
    renderTodos();
}

function applyBackground() {
    updateBackgroundStyle();
}

function updateBackgroundStyle() {
    const root = document.documentElement;
    
    root.style.setProperty('--bg-opacity', currentBgOpacity);
    
    if (currentBgImage) {
        root.style.setProperty('--bg-image', `url(${currentBgImage})`);
        document.body.style.background = 'transparent';
        document.querySelector('.window-header').style.background = 'rgba(255, 255, 255, 0.25)';
        document.querySelector('.container').style.background = 'rgba(255, 255, 255, 0.25)';
    } else {
        root.style.setProperty('--bg-image', 'none');
        document.body.style.background = currentBgColor;
        document.querySelector('.window-header').style.background = currentBgColor;
        document.querySelector('.container').style.background = currentBgColor;
    }
}

function setupEventListeners() {
    document.getElementById('add-toggle').addEventListener('click', toggleAddOverlay);
    
    document.getElementById('add-btn').addEventListener('click', addTodo);
    
    document.getElementById('todo-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (!isAddOpen) {
                toggleAddOverlay();
            }
        }
        if (e.key === 'Escape') {
            if (isAddOpen) toggleAddOverlay();
        }
    });
    
    document.getElementById('minimize-btn').addEventListener('click', () => {
        ipcRenderer.send('window-minimize');
    });
    
    document.getElementById('close-btn').addEventListener('click', handleClose);
    
    document.getElementById('pin-btn').addEventListener('click', toggleLock);
    
    document.getElementById('settings-toggle').addEventListener('click', toggleSettings);
    
    document.getElementById('dialog-minimize').addEventListener('click', () => handleDialogChoice('minimize'));
    document.getElementById('dialog-close').addEventListener('click', () => handleDialogChoice('close'));
    
    document.addEventListener('click', (e) => {
        const overlay = document.getElementById('input-overlay');
        const toggle = document.getElementById('add-toggle');
        if (isAddOpen && !overlay.contains(e.target) && !toggle.contains(e.target)) {
            toggleAddOverlay();
        }
    });
}

function toggleSettings() {
    if (isSettingsOpen) {
        ipcRenderer.send('close-settings');
    } else {
        ipcRenderer.send('open-settings');
        isSettingsOpen = true;
    }
}

function handleClose() {
    const savedChoice = localStorage.getItem('closeChoice');
    if (savedChoice) {
        if (savedChoice === 'minimize') {
            ipcRenderer.send('window-minimize');
        } else {
            ipcRenderer.send('window-quit');
        }
    } else {
        showCloseDialog();
    }
}

function showCloseDialog() {
    document.getElementById('dialog-overlay').classList.add('show');
    document.getElementById('dont-ask-again').checked = false;
}

function hideCloseDialog() {
    document.getElementById('dialog-overlay').classList.remove('show');
}

function handleDialogChoice(choice) {
    const dontAskAgain = document.getElementById('dont-ask-again').checked;
    
    if (dontAskAgain) {
        localStorage.setItem('closeChoice', choice);
    }
    
    hideCloseDialog();
    
    if (choice === 'minimize') {
        ipcRenderer.send('window-minimize');
    } else {
        ipcRenderer.send('window-quit');
    }
}

function toggleAddOverlay() {
    isAddOpen = !isAddOpen;
    const overlay = document.getElementById('input-overlay');
    const toggle = document.getElementById('add-toggle');
    
    if (isAddOpen) {
        overlay.classList.add('show');
        toggle.classList.add('active');
        document.getElementById('todo-input').focus();
    } else {
        overlay.classList.remove('show');
        toggle.classList.remove('active');
    }
}

async function toggleLock() {
    isLocked = await ipcRenderer.invoke('toggle-lock');
    const lockBtn = document.getElementById('pin-btn');
    if (isLocked) {
        lockBtn.classList.add('locked');
        lockBtn.title = t('unlockTitle');
    } else {
        lockBtn.classList.remove('locked');
        lockBtn.title = t('lockTitle');
    }
}

async function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    
    if (text === '') return;
    
    const tasks = text.split(/[;；]/).map(t => t.trim()).filter(t => t !== '');
    
    const now = Date.now();
    tasks.forEach((taskText, index) => {
        const newTodo = {
            id: now + index,
            text: taskText,
            completed: false
        };
        todos.unshift(newTodo);
    });
    
    await saveTodos();
    renderTodos();
    input.value = '';
    toggleAddOverlay();
}

async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        await saveTodos();
        renderTodos();
        
        if (todo.completed) {
            const todoItem = document.querySelector(`[onclick="toggleTodo(${id})"]`).closest('.todo-item');
            if (todoItem) {
                todoItem.classList.add('just-completed');
                setTimeout(() => {
                    todoItem.classList.remove('just-completed');
                }, 600);
            }
        }
    }
}

async function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    await saveTodos();
    renderTodos();
}

async function saveTodos() {
    await ipcRenderer.invoke('write-todos', todos);
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    
    if (todos.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>${t('emptyState')}</p></div>`;
    } else {
        const activeTodos = todos.filter(t => !t.completed);
        const completedTodos = todos.filter(t => t.completed);
        const sortedTodos = [...activeTodos, ...completedTodos];
        
        sortedTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item' + (todo.completed ? ' completed' : '');
            li.dataset.id = todo.id;
            li.draggable = true;
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})">
                <span class="todo-text" ondblclick="editTodo(${todo.id})">${escapeHtml(todo.text)}</span>
                <button class="delete-btn" onclick="deleteTodo(${todo.id})">${t('delete')}</button>
            `;
            
            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragend', handleDragEnd);
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('drop', handleDrop);
            
            list.appendChild(li);
        });
    }
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    if (this !== draggedItem) {
        const draggedId = parseInt(draggedItem.dataset.id);
        const targetId = parseInt(this.dataset.id);
        
        const draggedIndex = todos.findIndex(t => t.id === draggedId);
        const targetIndex = todos.findIndex(t => t.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const [removed] = todos.splice(draggedIndex, 1);
            todos.splice(targetIndex, 0, removed);
            saveTodos();
            renderTodos();
        }
    }
    
    this.classList.remove('drag-over');
}

function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const li = document.querySelector(`li[data-id="${id}"]`);
    const textSpan = li.querySelector('.todo-text');
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = todo.text;
    
    input.addEventListener('blur', () => saveEdit(id, input.value));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit(id, input.value);
        } else if (e.key === 'Escape') {
            renderTodos();
        }
    });
    
    textSpan.replaceWith(input);
    input.focus();
    input.select();
}

async function saveEdit(id, newText) {
    const trimmedText = newText.trim();
    if (trimmedText === '') {
        renderTodos();
        return;
    }
    
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.text = trimmedText;
        await saveTodos();
    }
    renderTodos();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
