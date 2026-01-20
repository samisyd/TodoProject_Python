const API_BASE_URL = window.location.origin;

let currentFilter = 'all';
let todos = [];

// DOM Elements
const todoForm = document.getElementById('todoForm');
const todosList = document.getElementById('todosList');
const todoCount = document.getElementById('todoCount');
const todosTitle = document.getElementById('todosTitle');
const messageDiv = document.getElementById('message');
const refreshBtn = document.getElementById('refreshBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const cancelEditBtn = document.getElementById('cancelEdit');
const closeModal = document.getElementsByClassName('close')[0];

// Filter buttons
const filterAll = document.getElementById('filterAll');
const filterActive = document.getElementById('filterActive');
const filterCompleted = document.getElementById('filterCompleted');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setupEventListeners();
    resetFormToDefaults(); // Set form to default values on page load
});

// Event Listeners
function setupEventListeners() {
    todoForm.addEventListener('submit', handleCreateTodo);
    refreshBtn.addEventListener('click', () => loadTodos(true));
    clearAllBtn.addEventListener('click', handleClearAll);
    editForm.addEventListener('submit', handleUpdateTodo);
    cancelEditBtn.addEventListener('click', closeEditModal);
    closeModal.addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // Filter buttons
    filterAll.addEventListener('click', () => setFilter('all'));
    filterActive.addEventListener('click', () => setFilter('active'));
    filterCompleted.addEventListener('click', () => setFilter('completed'));
}

// API Functions
async function loadTodos(showSuccessMessage = false) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`);
        if (!response.ok) throw new Error('Failed to load todos');
        todos = await response.json();
        renderTodos();
        if (showSuccessMessage) {
            showMessage(`Loaded ${todos.length} todo(s)`, 'success');
        }
    } catch (error) {
        showMessage('Error loading todos: ' + error.message, 'error');
    }
}

async function createTodo(todoData) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(todoData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create todo');
        }

        const newTodo = await response.json();
        todos.push(newTodo);
        showMessage('Todo created successfully!', 'success');
        renderTodos();
        resetFormToDefaults(); // Reset to default values after successful creation
    } catch (error) {
        showMessage('Error creating todo: ' + error.message, 'error');
    }
}

async function updateTodo(todoId, todoData) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(todoData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update todo');
        }

        const updatedTodo = await response.json();
        const index = todos.findIndex(t => t.id === todoId);
        if (index !== -1) {
            todos[index] = updatedTodo;
        }
        showMessage('Todo updated successfully!', 'success');
        renderTodos();
        closeEditModal();
    } catch (error) {
        showMessage('Error updating todo: ' + error.message, 'error');
    }
}

async function deleteTodo(todoId) {
    if (!confirm('Are you sure you want to delete this todo?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete todo');

        todos = todos.filter(t => t.id !== todoId);
        showMessage('Todo deleted successfully!', 'success');
        renderTodos();
    } catch (error) {
        showMessage('Error deleting todo: ' + error.message, 'error');
    }
}

async function clearAllTodos() {
    if (!confirm('Are you sure you want to delete all todos?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to clear todos');

        todos = [];
        showMessage('All todos deleted successfully!', 'success');
        renderTodos();
    } catch (error) {
        showMessage('Error clearing todos: ' + error.message, 'error');
    }
}

async function toggleTodoStatus(todoId, currentStatus) {
    await updateTodo(todoId, { completed: !currentStatus });
}

// Form Handlers
function handleCreateTodo(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const completed = document.getElementById('completed').checked; // Defaults to false if unchecked

    if (!title) {
        showMessage('Title is required!', 'error');
        return;
    }

    // Use defaults: description is null if empty, completed defaults to false
    createTodo({
        title,
        description: description || null, // Default: null if empty
        completed: completed || false, // Default: false (already handled by checkbox, but explicit)
    });
}

function handleUpdateTodo(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const title = document.getElementById('editTitle').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const completed = document.getElementById('editCompleted').checked;

    if (!title) {
        showMessage('Title is required!', 'error');
        return;
    }

    updateTodo(id, {
        title,
        description: description || null,
        completed,
    });
}

function handleClearAll() {
    clearAllTodos();
}

function resetFormToDefaults() {
    // Reset form to default values
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('completed').checked = false; // Default: unchecked (false)
}

// UI Functions
function renderTodos() {
    const filteredTodos = getFilteredTodos();
    todoCount.textContent = filteredTodos.length;

    if (filteredTodos.length === 0) {
        todosList.innerHTML = '<p class="empty-state">No todos to display.</p>';
        return;
    }

    todosList.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
            <div class="todo-header">
                <div style="flex: 1;">
                    <div class="todo-title">${escapeHtml(todo.title)}</div>
                    ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
                    <div class="todo-meta">
                        Created: ${formatDate(todo.created_at)} | 
                        Updated: ${formatDate(todo.updated_at)}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="btn btn-edit" onclick="openEditModal('${todo.id}')">Edit</button>
                    <button class="btn btn-delete" onclick="deleteTodo('${todo.id}')">Delete</button>
                    <button class="btn ${todo.completed ? 'btn-secondary' : 'btn-success'}" 
                            onclick="toggleTodoStatus('${todo.id}', ${todo.completed})">
                        ${todo.completed ? 'Mark Active' : 'Mark Done'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(t => !t.completed);
        case 'completed':
            return todos.filter(t => t.completed);
        default:
            return todos;
    }
}

function setFilter(filter) {
    currentFilter = filter;
    
    // Update active button
    [filterAll, filterActive, filterCompleted].forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (filter === 'all') filterAll.classList.add('active');
    else if (filter === 'active') filterActive.classList.add('active');
    else if (filter === 'completed') filterCompleted.classList.add('active');
    
    renderTodos();
}

function openEditModal(todoId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    document.getElementById('editId').value = todo.id;
    document.getElementById('editTitle').value = todo.title;
    document.getElementById('editDescription').value = todo.description || '';
    document.getElementById('editCompleted').checked = todo.completed;
    
    editModal.style.display = 'block';
}

function closeEditModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    setTimeout(() => {
        messageDiv.className = 'message';
        messageDiv.textContent = '';
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
