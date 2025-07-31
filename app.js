// app.js - Version 7: Asynchrones Parsen des POST-Bodys

import http from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const { port, hostname } = config;

let posts = [
    { id: 1, title: 'Mein erster Blogbeitrag', content: 'Das ist der Inhalt meines ersten Beitrags. Willkommen in der Welt von Node.js!', author: 'Alice', date: '2024-07-29' },
    { id: 2, title: 'Node.js Grundlagen verstehen', content: 'Heute lernen wir die Event Loop und asynchrone Programmierung kennen.', author: 'Bob', date: '2024-07-28' }
];
let nextId = 3;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Hilfsfunktion zum asynchronen Sammeln des Request-Bodys
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(body);
        });
        req.on('error', err => {
            reject(err);
        });
    });
}

const server = http.createServer(async (req, res) => {
    console.log(`Anfrage erhalten: ${req.method} ${req.url}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/posts' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        await delay(500);
        res.end(JSON.stringify(posts));
    } else if (req.url.match(/^\/posts\/(\d+)$/) && req.method === 'GET') {
        const id = parseInt(req.url.split('/')[2]);
        const post = posts.find(p => p.id === id);

        if (post) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            await delay(300);
            res.end(JSON.stringify(post));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Blogbeitrag nicht gefunden' }));
        }
    } else if (req.url === '/posts' && req.method === 'POST') {
        try {
            const body = await getRequestBody(req);
            const newPost = JSON.parse(body);

            if (!newPost.title || !newPost.content || !newPost.author) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Fehlende Felder: title, content und author sind erforderlich.' }));
                return;
            }

            newPost.id = nextId++;
            newPost.date = new Date().toISOString().split('T')[0];
            posts.push(newPost);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            await delay(200);
            res.end(JSON.stringify(newPost));
        } catch (error) {
            console.error('Fehler beim Parsen der Anfrage oder ungültiges JSON:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Ungültige Anfrage: JSON-Format erwartet oder Daten fehlen.' }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Endpunkt nicht gefunden' }));
    }
});

server.listen(port, hostname, () => {
    console.log(`Server läuft unter http://${hostname}:${port}/`);
    console.log('API-Endpunkte zum Testen:');
    console.log(`GET http://${hostname}:${port}/posts`);
    console.log(`GET http://${hostname}:${port}/posts/1`);
    console.log(`POST http://${hostname}:${port}/posts (mit JSON-Body)`);
});