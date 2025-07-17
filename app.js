import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { createServer } from 'http';
import crypto from 'crypto';

const PORT = 3000;
const DATA_FILE = path.join("data", "links.json");

const loadLinks = async () => {
    try {
        const data = await readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            await writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        throw error;
    }
};

const saveLinks = async (links) => {
    await writeFile(DATA_FILE, JSON.stringify(links,null,2));
};

const serveFile = async (res, filePath, contentType) => {
    try {
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Page not found");
    }
};

const server = createServer(async (req, res) => {
try {
    const links = await loadLinks();
if (req.url.startsWith('/') && req.url.length > 1) {
    const shortCode = req.url.slice(1);
    if (links[shortCode]) {
        res.writeHead(302, { Location: links[shortCode] });
        return res.end();
    }
    
     };
       

    if (req.method === 'GET') {
        switch (req.url) {
            case '/':
                return serveFile(res, path.join("public", "index.html"), "text/html");
            case '/style.css':
                return serveFile(res, path.join("public", "style.css"), "text/css");
            case '/links':
                const links= await loadLinks();
                res.writeHead(200,{"Content-Type": "application/json"});
                return res.end(JSON.stringify(links));
            default:
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("404 Not Found");

                
        }
    } else if (req.method === 'POST' && req.url === '/shorten') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', async () => {
            try {
                const { url, shortCode } = JSON.parse(body);
                
                if (!url) {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    return res.end("URL is required");
                }


                const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');
                
                if (links[finalShortCode]) {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    return res.end("Short code already exists. Please enter another short code");
                }

                links[finalShortCode] = url;
                await saveLinks(links);

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, shortCode: finalShortCode }));
            } catch (error) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Internal Server Error");
            }
        });
    } else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method Not Allowed");
    }
    
}
catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("500 Internal Server Error");
  }
});

server.listen(PORT, () => {
    console.log(`Server running successfully at PORT ${PORT}`);
});