# Todo Backend API

Node.js Express Backend für die Todo-Anwendung.

## 🚀 Installation

1. **Dependencies installieren:**
   ```bash
   cd Backend
   npm install
   ```

2. **Environment-Variablen konfigurieren:**
   - Kopieren Sie `.env.example` zu `.env`
   - Passen Sie die Werte nach Bedarf an

3. **Server starten:**
   ```bash
   # Entwicklungsmodus (mit Auto-Reload)
   npm run dev
   
   # Produktionsmodus
   npm start
   ```

## 📡 API Endpoints

### Todos
- `GET /api/todos` - Alle Todos abrufen
- `POST /api/todos` - Neues Todo erstellen
- `GET /api/todos/:id` - Einzelnes Todo abrufen
- `PUT /api/todos/:id` - Todo aktualisieren
- `DELETE /api/todos/:id` - Todo löschen
- `DELETE /api/todos` - Alle Todos löschen

### System
- `GET /api/health` - Health Check
- `GET /` - API Information

## 📋 Todo Datenmodell

```javascript
{
  id: Number,
  title: String,
  completed: Boolean,
  createdAt: String (ISO Date),
  completedAt: String (ISO Date) | null
}
```

## 🔧 Konfiguration

Die Anwendung nutzt folgende Environment-Variablen:

- `PORT` - Server Port (Standard: 3000)
- `NODE_ENV` - Umgebung (development/production)

## 📝 Beispiel-Requests

### Neues Todo erstellen
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Neue Aufgabe", "completed": false}'
```

### Todo aktualisieren
```bash
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Aktualisierte Aufgabe", "completed": true}'
```

### Todo löschen
```bash
curl -X DELETE http://localhost:3000/api/todos/1
```

## 🛠️ Entwicklung

- Der Server nutzt `nodemon` für automatisches Neuladen bei Änderungen
- CORS ist aktiviert für Frontend-Integration
- Fehlerbehandlung für alle Endpoints implementiert

## 🚀 Deployment

Für Produktionsumgebung:
1. `NODE_ENV=production` setzen
2. `npm start` verwenden
3. Reverse Proxy (nginx) konfigurieren
4. Datenbank anbinden (optional)

## 📦 Dependencies

- **express** - Web Framework
- **cors** - Cross-Origin Resource Sharing
- **body-parser** - Request Body Parsing
- **dotenv** - Environment Variables
- **nodemon** - Development Auto-Reload (Dev-Dependency)
