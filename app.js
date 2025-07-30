import http from "http";


const hostname = "127.0.0.1";
const port = 3000;


const server = http.createServer((req, res) => {
  console.log(`Anfrage erhalten: ${req.method} ${req.url}`);
    
  res.writeHead(200, {"Content-type": "text/plain"});
  res.end("Hello Welt vom Node.js Server!");
});

server.listen(port, hostname, () =>{
  console.log(`Server erfolgreich gestartet unter http://${hostname}:${port}/`);
});