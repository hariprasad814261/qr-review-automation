const https = require('https');

const urls = [
  'https://qr-review-automation.vercel.app/s/ST-101',
  'https://qr-review-automation.vercel.app/admin/batch',
  'https://qr-review-automation.vercel.app/admin/studio',
  'https://qr-review-automation.vercel.app/'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const titleMatch = data.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'No title tag';
        resolve({
          url,
          status: res.statusCode,
          title,
          hasBurmix: data.includes('BURMIX'),
          hasWriteReview: data.includes('writereview') || data.includes('ChIJUwNMnqBhUjoR-60P8RSKHwo')
        });
      });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing live deployment...');
  for (const url of urls) {
    const res = await checkUrl(url);
    console.log(JSON.stringify(res, null, 2));
  }
}

run();
