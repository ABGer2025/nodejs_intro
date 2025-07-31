import http from "http";
import { readFileSync } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, "config.json");

const config = JSON.parse(await readFile(configPath, "utf-8"));
const { hostname, port } = config;

let posts = [
    {id: 1, title: "Erster Blogeintrag", content: "Dies ist der Inhalt des ersten Blogeintrags.", author: "ABG", date: "2025-07-29"},
    {id: 2, title: "Node.js Grundlagen", content: "Dies ist der Inhalt des zweiten Blogeintrags.", author: "ABG", date: "2025-07-30"},
];
let nextId = 3;


const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


const server = http.createServer(async (req, res) => {
  console.log(`Anfrage erhalten: ${req.method} ${req.url}`);

  // CORS-Header hinzufügen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS-Anfragen (Preflight) behandeln
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
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Neuer Blogbeitrag empfangen (Body wird noch nicht verarbeitet)' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Endpunkt nicht gefunden' }));
    }
});

server.listen(port, hostname, () => {
    console.log(`Server läuft unter http://${hostname}:${port}/`);
    console.log(`Testen Sie: GET http://${hostname}:${port}/posts`);
    console.log(`Testen Sie: GET http://${hostname}:${port}/posts/1`); // Neue Testanweisung
    console.log(`Testen Sie: GET http://${hostname}:${port}/posts/99 (für 404 Fehler)`); // Neue Testanweisung
    console.log(`Testen Sie: POST http://${hostname}:${port}/posts (mit curl oder Postman)`);
});