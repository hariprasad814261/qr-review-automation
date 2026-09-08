const https = require('https');

https.get('https://www.google.com/search?q=Burmix+Porur+Chennai', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const pid = b.match(/data-pid="([^"]+)"/);
    console.log('data-pid:', pid ? pid[1] : 'none');
    const chij = b.match(/ChIJ[a-zA-Z0-9_\-]{20,35}/g);
    console.log('ChIJ:', chij ? [...new Set(chij)] : 'none');
    const fid = b.match(/0x3a5261[a-zA-Z0-9:]+/g);
    console.log('fid:', fid ? [...new Set(fid)] : 'none');
  });
}).on('error', console.error);
