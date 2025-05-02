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
  const resolvedFolder = path.resolve(folder || defaultFolder); // Usa a pasta escolhida ou a padrão
    // Remove parâmetros como "list=" da URL se playlist não for marcada
    let cleanedUrl = url;
    if (!playlist) {
      try {
        const parsedUrl = new URL(url);
        parsedUrl.searchParams.delete('list');
        cleanedUrl = parsedUrl.toString();
      } catch (err) {
        // Se der erro, mantém a URL original
      }
    }
  
    const args = [
      '-f',
      format === 'mp3' ? 'bestaudio/best' : 'bestvideo+bestaudio',
      '--ffmpeg-location', 'C:/ffmpeg/bin',
      '--cookies', 'cookies.txt',
      '-o', `${resolvedFolder}/%(title)s.%(ext)s`,
    ];
  
    if (!playlist) {
      args.push('--no-playlist');
    }
  
    args.push(cleanedUrl);
  

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
