// app.js
const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post('/download', (req, res) => {
  const { url, folder, format, playlist } = req.body;

  if (!url || !folder || !format) {
    return res.status(400).send('URL, pasta ou formato inválido.');
  }

  const resolvedFolder = path.resolve(folder);
  const args = [];

  if (!playlist) args.push('--no-playlist');

  if (format === 'mp3') {
    args.push(
      '-x',
      '--audio-format', 'mp3',
      '--postprocessor-args', '-ar 44100',
      '--ffmpeg-location', 'C:/ffmpeg/bin'
    );
  } else if (format === 'video') {
    args.push(
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
      '--merge-output-format', 'avi',
      '--ffmpeg-location', 'C:/ffmpeg/bin',
      '--postprocessor-args',
      '-vf scale=854:480 -vcodec libxvid -acodec libmp3lame -b:v 1000k -b:a 192k'
    );
  } else {
    return res.status(400).send('Formato inválido.');
  }

  args.push(
    '--cookies', 'cookies.txt',
    '-o', `${resolvedFolder}/%(title)s.%(ext)s`,
    url
  );

  const ytDlp = spawn('C:/yt-dlp/yt-dlp.exe', args);


  ytDlp.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[yt-dlp] ${output}`);
  });

  ytDlp.stderr.on('data', (data) => {
    console.error(`[yt-dlp error] ${data}`);
  });

  ytDlp.on('close', (code) => {
    console.log(`yt-dlp finalizou com código ${code}`);
    res.sendStatus(code === 0 ? 200 : 500);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});