const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function generateLiveQr() {
  const targetUrl = 'https://qr-review-automation.vercel.app/s/ST-101';
  const outPath = path.join(__dirname, 'qrs', 'ST-101_LIVE.png');
  
  if (!fs.existsSync(path.dirname(outPath))) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
  }

  await QRCode.toFile(outPath, targetUrl, {
    width: 600,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  console.log('Successfully created live QR code for:', targetUrl);
  console.log('File saved to:', outPath);
}

generateLiveQr();
