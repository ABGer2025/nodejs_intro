const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Erlaubt Cross-Origin Requests vom Frontend
app.use(bodyParser.json()); // Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded requests

// In-Memory Todo Storage (später durch Datenbank ersetzen)
let todos = [
    {
        id: 1,
        title: "Erste Todo-Aufgabe",
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    },
    {
        id: 2,
        title: "Zweite Todo-Aufgabe",
        completed: true,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
    }
];

let nextId = 3;

// Routes

// GET /api/todos - Alle Todos abrufen
app.get('/api/todos', (req, res) => {
    try {
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Todos' });
    }
});

// GET /api/todos/:id - Einzelnes Todo abrufen
app.get('/api/todos/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const todo = todos.find(t => t.id === id);
        
        if (!todo) {
            return res.status(404).json({ error: 'Todo nicht gefunden' });
        }
        
        res.json(todo);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen des Todos' });
    }
});

// POST /api/todos - Neues Todo erstellen
app.post('/api/todos', (req, res) => {
    try {
        const { title, completed = false } = req.body;
        
        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Titel ist erforderlich' });
        }
        
        const newTodo = {
            id: nextId++,
            title: title.trim(),
            completed: completed,
            createdAt: new Date().toISOString(),
            completedAt: completed ? new Date().toISOString() : null
        };
        
        todos.unshift(newTodo);
        res.status(201).json(newTodo);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Erstellen des Todos' });
    }
});

// PUT /api/todos/:id - Todo aktualisieren
app.put('/api/todos/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, completed } = req.body;
        
        const todoIndex = todos.findIndex(t => t.id === id);
        
        if (todoIndex === -1) {
            return res.status(404).json({ error: 'Todo nicht gefunden' });
        }
        
        const todo = todos[todoIndex];
        
        if (title !== undefined) {
            if (title.trim() === '') {
                return res.status(400).json({ error: 'Titel darf nicht leer sein' });
            }
            todo.title = title.trim();
        }
        
        if (completed !== undefined) {
            todo.completed = completed;
            todo.completedAt = completed ? new Date().toISOString() : null;
        }
        
        todos[todoIndex] = todo;
        res.json(todo);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Todos' });
    }
});

// DELETE /api/todos/:id - Todo löschen
app.delete('/api/todos/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const todoIndex = todos.findIndex(t => t.id === id);
        
        if (todoIndex === -1) {
            return res.status(404).json({ error: 'Todo nicht gefunden' });
        }
        
        const deletedTodo = todos.splice(todoIndex, 1)[0];
        res.json({ message: 'Todo gelöscht', todo: deletedTodo });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Löschen des Todos' });
    }
});

// DELETE /api/todos - Alle Todos löschen
app.delete('/api/todos', (req, res) => {
    try {
        const deletedCount = todos.length;
        todos = [];
        nextId = 1;
        res.json({ message: `${deletedCount} Todos gelöscht` });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Löschen aller Todos' });
    }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        totalTodos: todos.length,
        completedTodos: todos.filter(t => t.completed).length
    });
});

// 404 Handler für API Routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API Endpoint nicht gefunden' });
});

// Root Route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Todo Backend API',
        version: '1.0.0',
        endpoints: {
            'GET /api/todos': 'Alle Todos abrufen',
            'POST /api/todos': 'Neues Todo erstellen',
            'GET /api/todos/:id': 'Einzelnes Todo abrufen',
            'PUT /api/todos/:id': 'Todo aktualisieren',
            'DELETE /api/todos/:id': 'Todo löschen',
            'DELETE /api/todos': 'Alle Todos löschen',
            'GET /api/health': 'Health Check'
        }
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Interner Serverfehler' });
});

// Server starten
app.listen(PORT, () => {
    console.log(`🚀 Todo Backend Server läuft auf Port ${PORT}`);
    console.log(`📝 API verfügbar unter: http://localhost:${PORT}/api`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📋 Aktuelle Todos: ${todos.length}`);
});

module.exports = app;
