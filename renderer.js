const { ipcRenderer } = require('electron');

let todos = [];
let isPinned = false;
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
    
    document.getElementById('minimize-btn').addEventListener('click', () => {
        ipcRenderer.send('window-minimize');
    });
    
    document.getElementById('close-btn').addEventListener('click', () => {
        ipcRenderer.send('window-close');
    });
    
    document.getElementById('pin-btn').addEventListener('click', togglePin);
    
    document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);
    
    document.addEventListener('click', (e) => {
        const overlay = document.getElementById('input-overlay');
        const toggle = document.getElementById('add-toggle');
        if (isAddOpen && !overlay.contains(e.target) && !toggle.contains(e.target)) {
            toggleAddOverlay();
        }
    });
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

async function togglePin() {
    isPinned = await ipcRenderer.invoke('toggle-pin');
    const pinBtn = document.getElementById('pin-btn');
    if (isPinned) {
        pinBtn.classList.add('pinned');
        pinBtn.title = t('unpinTitle');
    } else {
        pinBtn.classList.remove('pinned');
        pinBtn.title = t('pinTitle');
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
