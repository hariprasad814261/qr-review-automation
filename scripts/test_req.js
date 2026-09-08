const http = require('http');

function check(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function run() {
  const page = await check('http://localhost:3000/admin/studio');
  console.log('Page status:', page.status);
  const matches = page.data.match(/href="(\/_next\/static\/css\/[^"]+)"/g) || [];
  console.log('CSS links found:', matches);
  for (const m of matches) {
    const cssUrl = 'http://localhost:3000' + m.replace('href="', '').replace('"', '');
    const cssRes = await check(cssUrl);
    console.log('CSS URL:', cssUrl, 'Status:', cssRes.status, 'Bytes:', cssRes.data.length);
  }
}

run().catch(console.error);
