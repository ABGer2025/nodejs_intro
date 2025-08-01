// Todo App JavaScript
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    initializeElements() {
        this.todoForm = document.getElementById('todoForm');
        this.todoInput = document.getElementById('todoInput');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.clearAllBtn = document.getElementById('clearAll');
        this.totalTodosEl = document.getElementById('totalTodos');
        this.completedTodosEl = document.getElementById('completedTodos');
        this.pendingTodosEl = document.getElementById('pendingTodos');
        this.toast = document.getElementById('toast');
    }

    bindEvents() {
        // Form submission
        this.todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
            });
        });

        // Clear buttons
        this.clearCompletedBtn.addEventListener('click', () => {
            this.clearCompleted();
        });

        this.clearAllBtn.addEventListener('click', () => {
            this.clearAll();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                this.todoInput.focus();
            }
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        if (text.length > 100) {
            this.showToast('Aufgabe ist zu lang (max. 100 Zeichen)', 'error');
            return;
        }

        const todo = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.todos.unshift(todo);
        this.todoInput.value = '';
        this.saveTodos();
        this.render();
        this.updateStats();
        this.showToast('Aufgabe hinzugefügt!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        todo.completed = !todo.completed;
        todo.completedAt = todo.completed ? new Date().toISOString() : null;
        
        this.saveTodos();
        this.render();
        this.updateStats();
        
        const message = todo.completed ? 'Aufgabe erledigt!' : 'Aufgabe wieder geöffnet!';
        this.showToast(message, 'success');
    }

    deleteTodo(id) {
        if (confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showToast('Aufgabe gelöscht!', 'info');
        }
    }

    editTodo(id) {
        if (this.editingId) {
            this.cancelEdit();
        }
        
        this.editingId = id;
        this.renderTodoItem(id);
        
        const editInput = document.querySelector(`[data-id="${id}"] .edit-input`);
        if (editInput) {
            editInput.focus();
            editInput.select();
        }
    }

    saveTodoEdit(id) {
        const editInput = document.querySelector(`[data-id="${id}"] .edit-input`);
        if (!editInput) return;

        const newText = editInput.value.trim();
        if (!newText) {
            this.showToast('Aufgabe darf nicht leer sein', 'error');
            return;
        }

        if (newText.length > 100) {
            this.showToast('Aufgabe ist zu lang (max. 100 Zeichen)', 'error');
            return;
        }

        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            this.saveTodos();
            this.editingId = null;
            this.render();
            this.showToast('Aufgabe aktualisiert!', 'success');
        }
    }

    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.render();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            default:
                return this.todos;
        }
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showToast('Keine erledigten Aufgaben vorhanden', 'info');
            return;
        }

        if (confirm(`Möchten Sie ${completedCount} erledigte Aufgabe(n) löschen?`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showToast(`${completedCount} erledigte Aufgabe(n) gelöscht!`, 'info');
        }
    }

    clearAll() {
        if (this.todos.length === 0) {
            this.showToast('Keine Aufgaben vorhanden', 'info');
            return;
        }

        if (confirm(`Möchten Sie alle ${this.todos.length} Aufgabe(n) löschen?`)) {
            this.todos = [];
            this.saveTodos();
            this.render();
            this.updateStats();
            this.showToast('Alle Aufgaben gelöscht!', 'info');
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTodosEl.textContent = total;
        this.completedTodosEl.textContent = completed;
        this.pendingTodosEl.textContent = pending;
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.style.display = 'none';
            this.emptyState.classList.add('show');
        } else {
            this.todoList.style.display = 'block';
            this.emptyState.classList.remove('show');
            
            this.todoList.innerHTML = filteredTodos.map(todo => 
                this.createTodoHTML(todo)
            ).join('');
            
            // Bind events for todo items
            filteredTodos.forEach(todo => {
                this.bindTodoEvents(todo.id);
            });
        }
    }

    renderTodoItem(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            todoElement.outerHTML = this.createTodoHTML(todo);
            this.bindTodoEvents(id);
        }
    }

    createTodoHTML(todo) {
        const isEditing = this.editingId === todo.id;
        const createdDate = new Date(todo.createdAt).toLocaleDateString('de-DE');
        
        return `
            <li class="todo-item ${todo.completed ? 'completed' : ''} ${isEditing ? 'editing' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-action="toggle">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                
                <div class="todo-text" title="Erstellt am: ${createdDate}">
                    ${this.escapeHtml(todo.text)}
                </div>
                
                ${isEditing ? `
                    <input type="text" class="edit-input" value="${this.escapeHtml(todo.text)}" maxlength="100">
                    <div class="edit-actions">
                        <button class="todo-btn save-btn" data-action="save" title="Speichern">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="todo-btn cancel-btn" data-action="cancel" title="Abbrechen">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : `
                    <div class="todo-actions">
                        <button class="todo-btn edit-btn" data-action="edit" title="Bearbeiten">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="todo-btn delete-btn" data-action="delete" title="Löschen">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `}
            </li>
        `;
    }

    bindTodoEvents(id) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (!todoElement) return;

        // Toggle completion
        const checkbox = todoElement.querySelector('[data-action="toggle"]');
        if (checkbox) {
            checkbox.addEventListener('click', () => this.toggleTodo(id));
        }

        // Edit button
        const editBtn = todoElement.querySelector('[data-action="edit"]');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editTodo(id));
        }

        // Delete button
        const deleteBtn = todoElement.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteTodo(id));
        }

        // Save button (in edit mode)
        const saveBtn = todoElement.querySelector('[data-action="save"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveTodoEdit(id));
        }

        // Cancel button (in edit mode)
        const cancelBtn = todoElement.querySelector('[data-action="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelEdit());
        }

        // Edit input events
        const editInput = todoElement.querySelector('.edit-input');
        if (editInput) {
            editInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveTodoEdit(id);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            });
            
            editInput.addEventListener('blur', () => {
                // Small delay to allow save button click to register
                setTimeout(() => {
                    if (this.editingId === id) {
                        this.cancelEdit();
                    }
                }, 150);
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    showToast(message, type = 'info') {
        const toastContent = this.toast.querySelector('.toast-content');
        const icon = this.toast.querySelector('.toast-icon');
        const messageEl = this.toast.querySelector('.toast-message');
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        icon.className = `toast-icon ${icons[type] || icons.info}`;
        messageEl.textContent = message;
        
        // Remove existing type classes and add new one
        this.toast.className = `toast ${type}`;
        
        // Show toast
        this.toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    // Export/Import functionality
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Todos exportiert!', 'success');
    }

    importTodos(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTodos = JSON.parse(e.target.result);
                if (Array.isArray(importedTodos)) {
                    this.todos = importedTodos;
                    this.saveTodos();
                    this.render();
                    this.updateStats();
                    this.showToast('Todos importiert!', 'success');
                } else {
                    this.showToast('Ungültiges Dateiformat', 'error');
                }
            } catch (error) {
                this.showToast('Fehler beim Importieren', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
    
    // Add some helpful keyboard shortcuts info
    console.log('Todo App Keyboard Shortcuts:');
    console.log('Ctrl+A: Focus on input field');
    console.log('Enter: Add new todo (when input is focused)');
    console.log('Enter: Save edit (when editing)');
    console.log('Escape: Cancel edit (when editing)');
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
