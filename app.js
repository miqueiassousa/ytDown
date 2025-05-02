const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

// Definir a pasta "Música" do sistema
const defaultFolder = path.join(os.homedir(), 'Music');

// Middleware para interpretar dados do formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rota para retornar a pasta padrão
app.get('/default-folder', (req, res) => {
  res.json({ defaultFolder: defaultFolder });
});
// Rota para baixar o vídeo ou áudio
app.post('/download', (req, res) => {
  const { url, folder, format, playlist } = req.body;
  const resolvedFolder = path.resolve(folder || defaultFolder);

  const args = [
    '--ffmpeg-location', 'C:/ffmpeg/bin',
    '--cookies', 'cookies.txt',
    '-o', `${resolvedFolder}/%(title)s.%(ext)s`,
    '-f',
    format === 'mp3' ? 'bestaudio/best' : 'bestvideo+bestaudio'
  ];

  // Se a flag playlist NÃO foi marcada, adiciona --no-playlist
  if (!playlist) {
    args.push('--no-playlist');
  }

  // A URL deve vir por último
  args.push(url);

  const ytDlp = spawn('C:/yt-dlp/yt-dlp.exe', args);

  ytDlp.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  ytDlp.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  ytDlp.on('close', (code) => {
    if (code === 0) {
      res.status(200).send('Download concluído!');
    } else {
      res.status(500).send('Erro no download.');
    }
  });
});



// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
