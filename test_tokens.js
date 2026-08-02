const http = require('http');
http.get('http://localhost:3000/api/dex/tokens-list', (res) => {
  let body = '';
  res.on('data', (d) => (body += d));
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      let missing = 0;
      let found = 0;
      if (data && data.data) {
        data.data.forEach((p) => {
          if (p.info && p.info.imageUrl) found++;
          else missing++;
        });
      }
      console.log(`Found: ${found}, Missing: ${missing}`);
    } catch (e) {
      console.error(e.message);
    }
  });
});
