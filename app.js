// Importando os módulos necessários
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);
const ytdl = require('ytdl-core');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;
const defaultFolder = path.join(os.homedir(), 'Music');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/default-folder', (req, res) => {
  res.json({ defaultFolder: defaultFolder });
});

app.post('/download', async (req, res) => {
  const { url, folder, format, playlist } = req.body;
  const resolvedFolder = path.resolve(folder || defaultFolder);

  // Se for uma playlist
  if (playlist === '1') {
    const extractArgs = [
      '--flat-playlist',
      '--print', 'url',
      url
    ];

    const urls = [];

    const ytDlpExtract = spawn('C:/yt-dlp/yt-dlp.exe', extractArgs);

    ytDlpExtract.stdout.on('data', (data) => {
      urls.push(...data.toString().trim().split(/\r?\n/));
    });

    ytDlpExtract.stderr.on('data', (data) => {
      console.error('Erro ao extrair playlist:', data.toString());
    });

    ytDlpExtract.on('close', async () => {
      if (urls.length === 0) {
        return res.status(500).send('❌ Nenhum link extraído da playlist.');
      }

      try {
        for (const singleUrl of urls) {
          await processDownload(singleUrl, resolvedFolder, format);
        }
        res.status(200).send('✅ Todos os vídeos foram baixados e convertidos com sucesso!');
      } catch (err) {
        console.error('Erro geral:', err);
        res.status(500).send('❌ Erro durante o processamento da playlist.');
      }
    });

  } else {
    try {
      await processDownload(url, resolvedFolder, format, true); // força --no-playlist
      res.status(200).send(`✅ Download de ${format === 'video' ? 'vídeo' : 'MP3'} concluído!`);
    } catch (err) {
      console.error('Erro:', err);
      res.status(500).send('❌ Erro ao processar o vídeo.');
    }
  }
});

async function processDownload(videoUrl, resolvedFolder, format, forceNoPlaylist = false) {
  return new Promise((resolve, reject) => {
    const args = [
      '--ffmpeg-location', 'C:/ffmpeg/bin', // Informa o caminho para o executável do FFmpeg necessário para processar áudio/vídeo
      '--cookies', path.join(__dirname, 'cookies.txt'), // Usa um arquivo de cookies exportado do navegador para acessar vídeos privados ou restritos
      '-o', `${resolvedFolder}/%(title)s.%(ext)s`, // Define o nome e local de saída do arquivo baixado. Usa o título do vídeo como nome
      '-f', format === 'mp3' ? 'bestaudio/best' : 'bestvideo+bestaudio', // Define o formato de download:
      // '--merge-output-format', 'mp4',       // garante que seja mp4 (suporta legenda embutida)
      // '--write-sub',                        // tenta baixar legenda manual (se existir)
      // '--write-auto-sub',                   // baixa legenda automática (caso não tenha manual)
      // '--sub-lang', 'pt.*',                 // legenda em português (todas variantes)
      // '--embed-subs'                        // embute legenda no vídeo
    ];

    if (format === 'video') {
      args.push('--recode-video', 'webm');
    }

    if (forceNoPlaylist) {
      args.push('--no-playlist');
    }

    args.push(videoUrl);

    const ytDlp = spawn('C:/yt-dlp/yt-dlp.exe', args);

    ytDlp.stdout.on('data', (data) => console.log(data.toString()));
    ytDlp.stderr.on('data', (data) => console.error(data.toString()));

    ytDlp.on('close', async (code) => {
      console.log('yt-dlp finalizado com código:', code);
      if (code !== 0) return reject(new Error('Erro no yt-dlp'));

      if (format === 'video') {
        try {
          const files = await readdir(resolvedFolder);
          const videoFiles = files.filter(f => f.endsWith('.webm') || f.endsWith('.mkv') || f.endsWith('.mp4'));

          const newest = videoFiles.map(f => ({
            name: f,
            time: fs.statSync(path.join(resolvedFolder, f)).mtime.getTime()
          })).sort((a, b) => b.time - a.time)[0];

          const inputPath = path.join(resolvedFolder, newest.name);
          const outputPath = path.join(resolvedFolder, path.parse(newest.name).name + '.avi');

          const ffmpeg = spawn('C:/ffmpeg/bin/ffmpeg.exe', [
            '-i', inputPath,
            '-vf', 'scale=854:480',
            '-vcodec', 'libxvid',
            '-acodec', 'libmp3lame',
            '-b:v', '1000k',
            '-b:a', '192k',
            outputPath
          ]);

          ffmpeg.stdout.on('data', data => console.log(`stdout: ${data}`));
          ffmpeg.stderr.on('data', data => console.error(`stderr: ${data}`));

          ffmpeg.on('close', async (ffCode) => {
            if (ffCode === 0) {
              try {
                await unlink(inputPath);
                console.log(`🗑️ Removido: ${inputPath}`);
              } catch (err) {
                console.warn(`⚠️ Falha ao remover ${inputPath}:`, err);
              }
              resolve();
            } else {
              reject(new Error(`Erro ao converter ${newest.name}`));
            }
          });
        } catch (err) {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });
}

app.get('/video-info', (req, res) => {
  const url = req.query.url;

  if (!url) return res.status(400).json({ error: 'URL não fornecida.' });

  const args = [
    '--cookies', path.join(__dirname, 'cookies.txt'),
    '--print', '%(title)s|%(thumbnail)s|%(duration_string)s',
    '--no-playlist',
    url
  ];

  let output = '';
  const ytDlpInfo = spawn('C:/yt-dlp/yt-dlp.exe', args);

  ytDlpInfo.stdout.on('data', data => {
    output += data.toString();
  });

  ytDlpInfo.stderr.on('data', data => {
    console.error('Erro yt-dlp:', data.toString());
  });

  ytDlpInfo.on('close', () => {
    const [title, thumbnail, duration] = output.trim().split('|');
    if (!title || !thumbnail) {
      return res.status(500).json({ error: 'Erro ao obter informações do vídeo.' });
    }

    res.json({ title, thumbnail, duration });
  });
});



app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
