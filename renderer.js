const { ipcRenderer } = require('electron');

let todos = [];
let isLocked = false;
let isAddOpen = false;
let isSettingsOpen = false;
let currentFilterTag = 'all';
let isTagWindow = false;
let hiddenTags = [];
let customTags = JSON.parse(localStorage.getItem('customTags') || '[]').filter(tag => tag && tag.trim() !== '');
let currentBgColor = localStorage.getItem('bgColor') || 'rgba(255, 255, 255, 0.25)';
let currentBgImage = localStorage.getItem('bgImage') || '';
let savedOpacity = localStorage.getItem('bgOpacity');
let currentBgOpacity = savedOpacity !== null ? parseFloat(savedOpacity) : 0.3;
let currentFontColor = localStorage.getItem('fontColor') || 'rgba(0, 0, 0, 0.85)';

document.addEventListener('DOMContentLoaded', () => {
    getLanguage();
    loadTodos();
    applyBackground();
    applyFontColor();
    setupEventListeners();
    updateUI();
    renderTagList();
    
    const header = document.querySelector('.window-header');
    let isHeaderDragging = false;
    let headerDragStartX = 0;
    let headerDragStartY = 0;
    
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        isHeaderDragging = true;
        headerDragStartX = e.screenX;
        headerDragStartY = e.screenY;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isHeaderDragging) return;
        const dx = e.screenX - headerDragStartX;
        const dy = e.screenY - headerDragStartY;
        headerDragStartX = e.screenX;
        headerDragStartY = e.screenY;
        ipcRenderer.send('window-move', dx, dy);
    });
    
    document.addEventListener('mouseup', () => {
        isHeaderDragging = false;
    });
});

ipcRenderer.on('settings-updated', (event, data) => {
    currentBgColor = localStorage.getItem('bgColor') || 'rgba(255, 255, 255, 0.25)';
    currentBgImage = localStorage.getItem('bgImage') || '';
    const savedOpacity = localStorage.getItem('bgOpacity');
    currentBgOpacity = savedOpacity !== null ? parseFloat(savedOpacity) : 0.3;
    currentFontColor = localStorage.getItem('fontColor') || 'rgba(0, 0, 0, 0.85)';
    
    if (data.type === 'language') {
        getLanguage();
    }
    applyBackground();
    applyFontColor();
});

ipcRenderer.on('settings-closed', () => {
    isSettingsOpen = false;
});

ipcRenderer.on('set-filter-tag', (event, tag) => {
    currentFilterTag = tag;
    isTagWindow = true;
    renderTagsFilter();
    renderTodos();
});

ipcRenderer.on('todos-updated', async () => {
    todos = await ipcRenderer.invoke('read-todos');
    renderTodos();
});

ipcRenderer.on('tag-window-opened', (event, tag) => {
    if (!hiddenTags.includes(tag)) {
        hiddenTags.push(tag);
        renderTodos();
    }
});

ipcRenderer.on('tag-window-closed', (event, tag) => {
    hiddenTags = hiddenTags.filter(t => t !== tag);
    renderTodos();
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
        document.querySelector('.window-header').style.background = 'transparent';
        document.querySelector('.container').style.background = 'transparent';
    } else {
        root.style.setProperty('--bg-image', 'none');
        document.body.style.background = currentBgColor;
        document.querySelector('.window-header').style.background = currentBgColor;
        document.querySelector('.container').style.background = currentBgColor;
    }
}

function applyFontColor() {
    document.documentElement.style.setProperty('--font-color', currentFontColor);
    document.body.style.color = currentFontColor;
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
    
    const tagsFilter = document.getElementById('tags-filter');
    tagsFilter.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag-btn') && !isTagWindow) {
            document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentFilterTag = e.target.dataset.tag;
            renderTodos();
        }
    });
    
    document.getElementById('minimize-btn').addEventListener('click', () => {
        ipcRenderer.send('window-minimize');
    });
    
    document.getElementById('close-btn').addEventListener('click', handleClose);
    
    document.getElementById('pin-btn').addEventListener('click', toggleLock);
    
    document.getElementById('pin-btn').addEventListener('dblclick', toggleAlwaysOnTop);
    
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
    if (currentFilterTag !== 'all') {
        ipcRenderer.send('window-close');
        return;
    }
    
    ipcRenderer.send('window-minimize');
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
        ipcRenderer.send('window-close');
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

async function toggleAlwaysOnTop() {
    const isOnTop = await ipcRenderer.invoke('toggle-always-on-top');
    const pinBtn = document.getElementById('pin-btn');
    if (isOnTop) {
        pinBtn.classList.add('on-top');
    } else {
        pinBtn.classList.remove('on-top');
    }
}

async function addTodo() {
    const input = document.getElementById('todo-input');
    const tagInput = document.getElementById('tag-input');
    const text = input.value.trim();
    let tag = tagInput.value.trim();
    
    if (text === '') return;
    
    if (tag === '' && currentFilterTag && currentFilterTag !== 'all') {
        tag = currentFilterTag;
    }
    
    const tasks = text.split(/[;；]/).map(t => t.trim()).filter(t => t !== '');
    
    const now = Date.now();
    tasks.forEach((taskText, index) => {
        const newTodo = {
            id: now + index,
            text: taskText,
            tag: tag,
            completed: false
        };
        todos.unshift(newTodo);
    });
    
    if (tag && !customTags.includes(tag)) {
        customTags.push(tag);
        localStorage.setItem('customTags', JSON.stringify(customTags.filter(t => t && t.trim() !== '')));
        renderTagList();
    }
    
    await saveTodos();
    renderTodos();
    input.value = '';
    tagInput.value = '';
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
    
    let filteredTodos = todos;
    if (currentFilterTag !== 'all') {
        filteredTodos = todos.filter(t => t.tag === currentFilterTag);
    } else {
        filteredTodos = todos.filter(t => !hiddenTags.includes(t.tag));
    }
    
    if (filteredTodos.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>${t('emptyState')}</p></div>`;
    } else {
        const activeTodos = filteredTodos.filter(t => !t.completed);
        const completedTodos = filteredTodos.filter(t => t.completed);
        const sortedTodos = [...activeTodos, ...completedTodos];
        
        sortedTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item' + (todo.completed ? ' completed' : '');
            li.dataset.id = todo.id;
            li.draggable = true;
            const tagHtml = todo.tag ? `<span class="tag-badge">${todo.tag}</span>` : '';
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})">
                <span class="todo-text" ondblclick="editTodo(${todo.id})">${escapeHtml(todo.text)}${tagHtml}</span>
                <button class="delete-btn" onclick="deleteTodo(${todo.id})">${t('delete')}</button>
            `;
            
            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragend', handleDragEnd);
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('drop', handleDrop);
            
            list.appendChild(li);
        });
    }
    
    renderTagsFilter();
}

function renderTagsFilter() {
    const tagsFilter = document.getElementById('tags-filter');
    
    if (isTagWindow) {
        tagsFilter.innerHTML = `<button class="tag-btn active draggable" data-tag="${escapeHtml(currentFilterTag)}" draggable="true">${escapeHtml(currentFilterTag)}</button>`;
    } else {
        const allTags = [...new Set(todos.map(t => t.tag).filter(tag => tag && tag.trim() !== '' && !hiddenTags.includes(tag)))];
        
        let html = `<button class="tag-btn ${currentFilterTag === 'all' ? 'active' : ''}" data-tag="all">${t('allTags')}</button>`;
        allTags.forEach(tag => {
            html += `<button class="tag-btn draggable ${currentFilterTag === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}" draggable="true">${escapeHtml(tag)}</button>`;
        });
        
        tagsFilter.innerHTML = html;
    }
    
    const tagBtns = tagsFilter.querySelectorAll('.tag-btn.draggable');
    tagBtns.forEach(btn => {
        btn.addEventListener('mousedown', handleTagMouseDown);
    });
}

function renderTagList() {
    const tagList = document.getElementById('tag-list');
    tagList.innerHTML = '';
    customTags.filter(tag => tag && tag.trim() !== '').forEach(tag => {
        const option = document.createElement('option');
        option.value = escapeHtml(tag);
        tagList.appendChild(option);
    });
}

let draggedItem = null;
let draggedTag = null;
let isDraggingOutside = false;
let dragPreview = null;
let dropIndicator = null;
let isTagDragging = false;
let tagDragStartX = 0;
let tagDragStartY = 0;

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

function handleTagMouseDown(e) {
    if (e.button !== 0) return;
    draggedTag = this.dataset.tag;
    isTagDragging = false;
    tagDragStartX = e.clientX;
    tagDragStartY = e.clientY;
    
    document.addEventListener('mousemove', handleTagMouseMove);
    document.addEventListener('mouseup', handleTagMouseUp);
    e.preventDefault();
}

function handleTagMouseMove(e) {
    const dx = e.clientX - tagDragStartX;
    const dy = e.clientY - tagDragStartY;
    
    if (!isTagDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isTagDragging = true;
        dragPreview = document.getElementById('drag-preview');
        dropIndicator = document.getElementById('drop-indicator');
        dragPreview.textContent = draggedTag;
        dragPreview.classList.add('visible');
    }
    
    if (isTagDragging && dragPreview) {
        dragPreview.style.left = e.clientX + 15 + 'px';
        dragPreview.style.top = e.clientY + 15 + 'px';
        
        const isOutside = e.clientX < 0 || e.clientX > window.innerWidth || 
                          e.clientY < 0 || e.clientY > window.innerHeight;
        
        if (isOutside) {
            isDraggingOutside = true;
            dropIndicator.classList.add('visible');
        } else {
            isDraggingOutside = false;
            dropIndicator.classList.remove('visible');
        }
    }
}

function handleTagMouseUp(e) {
    document.removeEventListener('mousemove', handleTagMouseMove);
    document.removeEventListener('mouseup', handleTagMouseUp);
    
    if (dragPreview) {
        dragPreview.classList.remove('visible');
    }
    if (dropIndicator) {
        dropIndicator.classList.remove('visible');
    }
    
    if (isTagDragging && isDraggingOutside && draggedTag) {
        ipcRenderer.invoke('create-tag-window', draggedTag, e.screenX, e.screenY);
    }
    
    isTagDragging = false;
    isDraggingOutside = false;
    draggedTag = null;
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
