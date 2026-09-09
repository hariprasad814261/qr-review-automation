const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function generateDirectGoogleQr() {
  const targetUrl = 'https://search.google.com/local/writereview?placeid=ChIJUwNMnqBhUjoR-60P8RSKHwo';
  const outPath = path.join(__dirname, 'qrs', 'ST-101_DIRECT_GOOGLE.png');
  
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

  console.log('Successfully created Direct Google Review QR code for:', targetUrl);
  console.log('File saved to:', outPath);
}

generateDirectGoogleQr();
