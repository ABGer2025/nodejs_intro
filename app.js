import http from "http";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, "config.json");

const config = JSON.parse(readFileSync(configPath, "utf-8"));
const { hostname, port } = config;

let posts = [
    {id: 1, title: "Erster Blogeintrag", content: "Dies ist der Inhalt des ersten Blogeintrags.", author: "ABG", date: "2025-07-29"},
    {id: 2, title: "Node.js Grundlagen", content: "Dies ist der Inhalt des zweiten Blogeintrags.", author: "ABG", date: "2025-07-30"},
];
let nextId = 3;


const server = http.createServer((req, res) => {
  console.log(`Anfrage erhalten: ${req.method} ${req.url}`);

  // CORS-Header hinzufügen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS-Anfragen (Preflight) behandeln
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
    
  res.writeHead(200, {"Content-type": "text/plain"});
  res.end("Hello Welt vom Node.js Server!");
});

server.listen(port, hostname, () =>{
  console.log(`Server erfolgreich gestartet unter http://${hostname}:${port}/`);
});