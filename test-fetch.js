const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ referer: req.headers.referer || req.headers.referrer || '<empty>' }));
});

server.listen(4000, async () => {
  try {
    const r1 = await fetch('http://localhost:4000', {
      headers: { Referer: 'https://ringscale.ai/' }
    });
    console.log('Using headers.Referer:', await r1.json());
    
    const r2 = await fetch('http://localhost:4000', {
      referrer: 'https://ringscale.ai/'
    });
    console.log('Using referrer option:', await r2.json());
    
  } catch (e) {
    console.error(e);
  } finally {
    server.close();
  }
});
