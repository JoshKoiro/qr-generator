const express = require('express');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8080;

app.use(cors());
app.use(bodyParser.text());
app.use(express.static(path.join(__dirname, 'public')));

// Constants for QR code sizing
const MIN_MODULE_SIZE = 1.5; // 4 pixels per module at 72 PPI
const MAX_WIDTH = 8.5 * 72; // 8.5 inches in points
const MAX_HEIGHT = 11 * 72; // 11 inches in points
const MARGIN = 20; // margin in points

// Function to calculate QR code size and layout
function calculateLayout(dataList) {
  const sizes = dataList.map(data => calculateQRSize(data));
  const maxSize = Math.max(...sizes);
  
  const columns = Math.floor((MAX_WIDTH - 2 * MARGIN) / (maxSize + MARGIN));
  const rows = Math.ceil(dataList.length / columns);

  return { size: maxSize, columns, rows };
}

// Function to calculate the required size for a single QR code
function calculateQRSize(data) {
  // Get QR code version (size) required for the data
  const qr = QRCode.create(data, { errorCorrectionLevel: 'M' });
  const moduleCount = qr.modules.size;

  // Calculate the minimum size in points for legibility
  const minSize = moduleCount * (MIN_MODULE_SIZE / 72 * 72);

  // Ensure the size doesn't exceed the page width or height
  return Math.min(minSize, MAX_WIDTH - 2 * MARGIN, MAX_HEIGHT - 2 * MARGIN);
}

// Serve the index.html file at the root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.put('/api/generate-qr', async (req, res) => {
  const dataList = req.body.split('\n').filter(item => item.trim() !== '');
  const { size, columns, rows } = calculateLayout(dataList);

  const doc = new PDFDocument({ size: 'LETTER' });
  const filePath = path.join(__dirname, 'qrcodes.pdf');
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  let x = 0;
  let y = 0;

  for (const data of dataList) {
    const qrBuffer = await QRCode.toBuffer(data, { 
      errorCorrectionLevel: 'M',
      width: size,
      margin: 0 // We're handling margins manually
    });
    doc.image(qrBuffer, x * (size + MARGIN) + MARGIN, y * (size + MARGIN) + MARGIN, { width: size });

    x++;
    if (x >= columns) {
      x = 0;
      y++;
    }
    if (y >= rows) {
      y = 0;
      doc.addPage();
    }
  }

  doc.end();

  writeStream.on('finish', () => {
    res.json({ 
      viewLink: '/view-pdf',
      downloadLink: '/download-pdf'
    });
  });
});

app.get('/view-pdf', (req, res) => {
  const filePath = path.join(__dirname, 'qrcodes.pdf');
  res.contentType("application/pdf");
  fs.createReadStream(filePath).pipe(res);
});

app.get('/download-pdf', (req, res) => {
  const filePath = path.join(__dirname, 'qrcodes.pdf');
  res.download(filePath, 'qrcodes.pdf', (err) => {
    if (err) {
      res.status(500).send('Error downloading the file');
    }
    // Delete the file after download
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting file:', unlinkErr);
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
