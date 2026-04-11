const { ipcRenderer } = require('electron');

let todos = [];
let isLocked = false;
let isAddOpen = false;

document.addEventListener('DOMContentLoaded', () => {
    getLanguage();
    loadTodos();
    setupEventListeners();
    updateUI();
});

async function loadTodos() {
    todos = await ipcRenderer.invoke('read-todos');
    renderTodos();
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
        if (e.key === 'Escape' && isAddOpen) {
            toggleAddOverlay();
        }
    });
    
    document.getElementById('minimize-btn').addEventListener('click', () => {
        ipcRenderer.send('window-minimize');
    });
    
    document.getElementById('close-btn').addEventListener('click', handleClose);
    
    document.getElementById('pin-btn').addEventListener('click', toggleLock);
    
    document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);
    
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

function toggleLanguage() {
    const newLang = currentLanguage === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
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
    
    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false
    };
    
    todos.unshift(newTodo);
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
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button class="delete-btn" onclick="deleteTodo(${todo.id})">${t('delete')}</button>
            `;
            list.appendChild(li);
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
