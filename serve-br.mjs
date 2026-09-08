// Static server that brotli-compresses text responses, so local Lighthouse
// runs are comparable to Cloudflare. python3 -m http.server does not compress,
// which inflates the document from 78 KB to 477 KB and tanks the score.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const ROOT = process.argv[2] || 'dist';
const PORT = +(process.argv[3] || 8911);
const TYPES = {'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript',
  '.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png',
  '.jpg':'image/jpeg','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain'};
const COMPRESS = new Set(['.html','.css','.js','.json','.svg','.xml','.txt']);
const DELAY=+(process.argv[4]||0);
http.createServer(async (req,res)=>{
  if(DELAY) await new Promise(r=>setTimeout(r,DELAY));
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  const ext = path.extname(f);
  const body = fs.readFileSync(f);
  const h = {'content-type': TYPES[ext] || 'application/octet-stream',
             'cache-control': ext==='.html' ? 'public,max-age=0,must-revalidate' : 'public,max-age=31536000,immutable'};
  if (COMPRESS.has(ext) && /br/.test(req.headers['accept-encoding']||'')) {
    const out = zlib.brotliCompressSync(body);
    res.writeHead(200, {...h, 'content-encoding':'br', 'content-length': out.length});
    return res.end(out);
  }
  res.writeHead(200, {...h, 'content-length': body.length});
  res.end(body);
}).listen(PORT, ()=>console.log(`  serving ${ROOT} with brotli on :${PORT}`));
