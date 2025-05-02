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

// Rota para SSE (progresso)
app.get('/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Envia o progresso inicial
  res.write('data: {"progress": 0}\n\n');

  const sendProgress = (percent) => {
    res.write(`data: {"progress": ${percent}}\n\n`);
  };

  // Rota de download
  app.post('/download', (req, res) => {
    const { url, folder, format } = req.body;

    if (!url || !folder || !['mp3', 'video'].includes(format)) {
      return res.status(400).send('URL, pasta ou formato inválido.');
    }

    const resolvedFolder = path.resolve(folder);
    const ytDlpPath = 'C:/yt-dlp/yt-dlp.exe'; // Ajuste se necessário
    const ffmpegPath = 'C:/ffmpeg/bin';       // Ajuste se necessário
    const cookiesPath = 'cookies.txt';        // Certifique-se de que o arquivo de cookies está na raiz do projeto

    const baseArgs = [
      '--ffmpeg-location', ffmpegPath,
      '--cookies', cookiesPath,
      '--no-post-overwrites',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    ];

    let args;

    if (format === 'mp3') {
      args = [
        ...baseArgs,
        '-x',
        '--audio-format', 'mp3',
        '-o', `${resolvedFolder}/%(title)s.%(ext)s`,
        url
      ];
    } else if (format === 'video') {
      args = [
        ...baseArgs,
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
        '--merge-output-format', 'avi',
        '-o', `${resolvedFolder}/%(title)s.avi`,
        url
      ];
    }

    const ytDlp = spawn(ytDlpPath, args);

    ytDlp.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output); // Exibe no terminal

      // Extração de progresso
      const match = output.match(/\[download\]\s+(\d+\.\d+)%/);
      if (match) {
        const percent = parseFloat(match[1]);
        sendProgress(percent); // Envia progresso para o frontend
      }
    });

    ytDlp.stderr.on('data', (data) => {
      console.error(`[yt-dlp error] ${data}`);
    });

    ytDlp.on('close', (code) => {
      console.log(`yt-dlp finalizou com código ${code}`);
      res.sendStatus(code === 0 ? 200 : 500);
    });
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🌐 Servidor rodando em http://localhost:${PORT}`);
});
