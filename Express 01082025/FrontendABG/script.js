// Todo App JavaScript
class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.currentDateFilter = 'all';
        this.selectedMonth = null;
        this.selectedYear = null;
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadTodos();
    }

    initializeElements() {
        this.todoForm = document.getElementById('todoForm');
        this.todoInput = document.getElementById('todoInput');
        this.todoDateInput = document.getElementById('todoDateInput');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.dateFilterButtons = document.querySelectorAll('.date-filter-btn');
        this.monthSelect = document.getElementById('monthSelect');
        this.yearSelect = document.getElementById('yearSelect');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.clearAllBtn = document.getElementById('clearAll');
        this.exportTodosBtn = document.getElementById('exportTodos');
        this.importTodosInput = document.getElementById('importTodos');
        this.totalTodosEl = document.getElementById('totalTodos');
        this.completedTodosEl = document.getElementById('completedTodos');
        this.pendingTodosEl = document.getElementById('pendingTodos');
        this.toast = document.getElementById('toast');
        
        // Set default date to today
        this.todoDateInput.value = new Date().toISOString().split('T')[0];
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

        // Date filter buttons
        this.dateFilterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setDateFilter(btn.dataset.dateFilter);
            });
        });

        // Month and year selects
        this.monthSelect.addEventListener('change', () => {
            this.setCustomDateFilter();
        });

        this.yearSelect.addEventListener('change', () => {
            this.setCustomDateFilter();
        });

        // Clear buttons
        this.clearCompletedBtn.addEventListener('click', () => {
            this.clearCompleted();
        });

        this.clearAllBtn.addEventListener('click', () => {
            this.clearAll();
        });

        // Export/Import buttons
        this.exportTodosBtn.addEventListener('click', () => {
            this.exportTodos();
        });

        this.importTodosInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importTodos(file);
                // Reset the input so the same file can be selected again
                e.target.value = '';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                this.todoInput.focus();
            }
        });
        
        // Tab between input fields
        this.todoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.todoDateInput.focus();
            }
        });
        
        this.todoDateInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                this.todoInput.focus();
            }
        });

        // Backup reminder on browser close
        window.addEventListener('beforeunload', (e) => {
            this.handleBackupReminderOnClose(e);
        });

        // Additional event for page visibility changes (when tab is hidden/closed)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.checkBackupOnHidden();
            }
        });

        // Detect when user is about to leave the page
        window.addEventListener('pagehide', (e) => {
            this.handleBackupReminderOnClose(e);
        });
    }

    // Load todos from localStorage
    loadTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            this.todos = JSON.parse(savedTodos);
        }
        
        this.populateYearSelect();
        this.render();
        this.updateStats();
        this.checkMissedBackup();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        const dateValue = this.todoDateInput.value;
        
        if (!text) {
            this.showToast('Bitte geben Sie eine Aufgabe ein', 'error');
            return;
        }
        
        if (!dateValue) {
            this.showToast('Bitte wählen Sie ein Datum', 'error');
            return;
        }

        if (text.length > 100) {
            this.showToast('Aufgabe ist zu lang (max. 100 Zeichen)', 'error');
            return;
        }

        // Create date from input and set to beginning of day
        const selectedDate = new Date(dateValue + 'T00:00:00.000Z');

        const todo = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: selectedDate.toISOString(),
            completedAt: null
        };

        this.todos.unshift(todo);
        this.todoInput.value = '';
        this.saveTodos();
        this.populateYearSelect();
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

    setDateFilter(dateFilter) {
        this.currentDateFilter = dateFilter;
        this.selectedMonth = null;
        this.selectedYear = null;
        
        // Update active date filter button
        this.dateFilterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.dateFilter === dateFilter) {
                btn.classList.add('active');
            }
        });
        
        // Reset custom selects
        this.monthSelect.value = '';
        this.yearSelect.value = '';
        
        this.render();
    }

    setCustomDateFilter() {
        const month = this.monthSelect.value;
        const year = this.yearSelect.value;
        
        if (month !== '' || year !== '') {
            this.currentDateFilter = 'custom';
            this.selectedMonth = month !== '' ? parseInt(month) : null;
            this.selectedYear = year !== '' ? parseInt(year) : null;
            
            // Deactivate predefined date filter buttons
            this.dateFilterButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            this.render();
        }
    }

    populateYearSelect() {
        const currentYear = new Date().getFullYear();
        const years = [];
        
        // Get years from todos
        this.todos.forEach(todo => {
            const year = new Date(todo.createdAt).getFullYear();
            if (!years.includes(year)) {
                years.push(year);
            }
        });
        
        // Add current year if not present
        if (!years.includes(currentYear)) {
            years.push(currentYear);
        }
        
        // Sort years in descending order
        years.sort((a, b) => b - a);
        
        // Clear and populate year select
        this.yearSelect.innerHTML = '<option value="">Jahr wählen...</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            this.yearSelect.appendChild(option);
        });
    }

    getFilteredTodos() {
        let filteredTodos = this.todos;
        
        // Apply status filter
        switch (this.currentFilter) {
            case 'completed':
                filteredTodos = filteredTodos.filter(todo => todo.completed);
                break;
            case 'pending':
                filteredTodos = filteredTodos.filter(todo => !todo.completed);
                break;
            default:
                // 'all' - no status filtering
                break;
        }
        
        // Apply date filter
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (this.currentDateFilter) {
            case 'today':
                filteredTodos = filteredTodos.filter(todo => {
                    const todoDate = new Date(todo.createdAt);
                    const todoDay = new Date(todoDate.getFullYear(), todoDate.getMonth(), todoDate.getDate());
                    return todoDay.getTime() === today.getTime();
                });
                break;
                
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
                
                filteredTodos = filteredTodos.filter(todo => {
                    const todoDate = new Date(todo.createdAt);
                    const todoDay = new Date(todoDate.getFullYear(), todoDate.getMonth(), todoDate.getDate());
                    return todoDay >= weekStart && todoDay <= weekEnd;
                });
                break;
                
            case 'month':
                filteredTodos = filteredTodos.filter(todo => {
                    const todoDate = new Date(todo.createdAt);
                    return todoDate.getMonth() === now.getMonth() && 
                           todoDate.getFullYear() === now.getFullYear();
                });
                break;
                
            case 'year':
                filteredTodos = filteredTodos.filter(todo => {
                    const todoDate = new Date(todo.createdAt);
                    return todoDate.getFullYear() === now.getFullYear();
                });
                break;
                
            case 'next-year':
                filteredTodos = filteredTodos.filter(todo => {
                    const todoDate = new Date(todo.createdAt);
                    return todoDate.getFullYear() === (now.getFullYear() + 1);
                });
                break;
                
            case 'custom':
                filteredTodos = filteredTodos.filter(todo => {
                    const todoDate = new Date(todo.createdAt);
                    let matches = true;
                    
                    if (this.selectedMonth !== null) {
                        matches = matches && todoDate.getMonth() === this.selectedMonth;
                    }
                    
                    if (this.selectedYear !== null) {
                        matches = matches && todoDate.getFullYear() === this.selectedYear;
                    }
                    
                    return matches;
                });
                break;
                
            default:
                // 'all' - no date filtering
                break;
        }
        
        return filteredTodos;
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
                
                <div class="todo-content">
                    <div class="todo-text" title="Erstellt am: ${createdDate}">
                        ${this.escapeHtml(todo.text)}
                    </div>
                    <div class="todo-date">
                        <i class="fas fa-calendar"></i>
                        ${createdDate}
                    </div>
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
        
        // Create detailed filename with date and time
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        const todoCount = this.todos.length;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos-backup-${dateStr}_${timeStr}-${todoCount}aufgaben.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        // Mark backup as done for today
        this.markBackupDone();
        
        this.showToast(`${todoCount} Aufgaben exportiert! ✅ Backup für heute erledigt.`, 'success');
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

    // Handle backup reminder when browser is closing
    handleBackupReminderOnClose(e) {
        const lastBackup = localStorage.getItem('lastBackupDate');
        const now = new Date().toDateString(); // Today's date as string
        
        // Check if user has todos and hasn't backed up today
        if (this.todos.length > 0 && lastBackup !== now) {
            // For Firefox compatibility - show alert first
            const shouldBackup = confirm(`⚠️ BACKUP-ERINNERUNG ⚠️\n\nSie haben ${this.todos.length} Aufgabe(n), aber heute noch kein Backup erstellt!\n\nMöchten Sie Ihre Aufgaben jetzt sichern?\n\n✅ OK = Backup erstellen\n❌ Abbrechen = Ohne Backup schließen`);
            
            if (shouldBackup) {
                // Prevent the page from closing
                e.preventDefault();
                e.returnValue = '';
                
                // Trigger export automatically
                this.exportTodos();
                
                // Show message that they can now close safely
                setTimeout(() => {
                    alert('✅ Backup erstellt! Sie können den Browser jetzt sicher schließen.');
                }, 500);
                
                return false;
            }
        }
    }

    // Check backup when tab becomes hidden (Firefox/Chrome compatibility)
    checkBackupOnHidden() {
        const lastBackup = localStorage.getItem('lastBackupDate');
        const now = new Date().toDateString();
        
        if (this.todos.length > 0 && lastBackup !== now) {
            // Store a flag that backup reminder was needed
            localStorage.setItem('backupReminderNeeded', 'true');
        }
    }

    // Check if user missed a backup opportunity
    checkMissedBackup() {
        const backupNeeded = localStorage.getItem('backupReminderNeeded');
        const lastBackup = localStorage.getItem('lastBackupDate');
        const today = new Date().toDateString();
        
        // If backup was needed and still no backup today
        if (backupNeeded === 'true' && lastBackup !== today && this.todos.length > 0) {
            setTimeout(() => {
                const shouldBackup = confirm(`🔔 VERPASSTE BACKUP-ERINNERUNG!\n\nSie haben den Browser geschlossen, ohne ein Backup zu erstellen.\n\nSie haben ${this.todos.length} Aufgabe(n).\n\nMöchten Sie jetzt ein Backup erstellen?`);
                
                if (shouldBackup) {
                    this.exportTodos();
                }
                
                // Clear the reminder flag
                localStorage.removeItem('backupReminderNeeded');
            }, 1000);
        }
    }

    // Call this when user successfully exports
    markBackupDone() {
        const now = new Date().toDateString();
        localStorage.setItem('lastBackupDate', now);
        localStorage.removeItem('backupReminderNeeded');
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
