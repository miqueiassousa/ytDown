const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Rota para baixar vídeo
app.post('/download', (req, res) => {
  const { url, folder } = req.body;

  if (!url || !folder) {
    return res.status(400).send('URL ou pasta inválida.');
  }

  const resolvedFolder = path.resolve(folder);

  const args = [
    '-x',
    '--audio-format', 'mp3',
    '--ffmpeg-location', 'C:/ffmpeg/bin',
    '--cookies', path.join(__dirname, 'cookies.txt'),
    '--no-post-overwrites',
    '-o', `${resolvedFolder}/%(title)s.%(ext)s`,
    url
  ];

  const ytDlp = spawn('C:/yt-dlp/yt-dlp.exe', args);

  ytDlp.stdout.on('data', (data) => {
    console.log(`[yt-dlp] ${data}`);
  });

  ytDlp.stderr.on('data', (data) => {
    console.error(`[yt-dlp error] ${data}`);
  });

  ytDlp.on('close', (code) => {
    console.log(`yt-dlp finalizou com código ${code}`);
    res.sendStatus(code === 0 ? 200 : 500);
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🌐 Servidor rodando em http://localhost:${PORT}`);
});
