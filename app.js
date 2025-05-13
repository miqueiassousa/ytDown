// Importando os módulos necessários
const express = require('express');  // Framework web para Node.js
const { spawn } = require('child_process');  // Para rodar comandos externos (yt-dlp)
const path = require('path');  // Para lidar com caminhos de arquivos e diretórios
const os = require('os');  // Para acessar informações do sistema operacional (como pasta "Música")

// Criando a aplicação Express
const app = express();
const PORT = 3000;  // Definindo a porta em que o servidor vai rodar

// Definir a pasta "Música" do sistema para ser o local padrão de downloads
const defaultFolder = path.join(os.homedir(), 'Music');  // Usando o diretório "Música" do sistema

// Middleware para interpretar dados do formulário (requisições POST)
app.use(express.urlencoded({ extended: true }));  // Permite a análise do corpo das requisições URL-encoded
app.use(express.static('public'));  // Serve arquivos estáticos da pasta 'public'

// Rota para retornar a pasta padrão de downloads
app.get('/default-folder', (req, res) => {
  res.json({ defaultFolder: defaultFolder });  // Retorna o caminho da pasta "Música"
});

// Rota para processar o download de vídeo ou áudio
app.post('/download', (req, res) => {
  // Desestruturando os parâmetros recebidos do formulário
  const { url, folder, format, playlist } = req.body;
  const resolvedFolder = path.resolve(folder || defaultFolder);  // Resolve o caminho da pasta para onde o arquivo será salvo

  // Argumentos do comando yt-dlp
  const args = [
    '--ffmpeg-location', 'C:/ffmpeg/bin',  // Caminho do ffmpeg, necessário para processamento de áudio e vídeo
    '--cookies', 'cookies.txt',  // Cookies, se necessário para autenticação
    '-o', `${resolvedFolder}/%(title)s.%(ext)s`,  // Padrão de saída para salvar o arquivo com o título e extensão correta
    '-f',
    format === 'mp3' ? 'bestaudio/best' : 'bestvideo+bestaudio',  // Define o formato do arquivo (audio ou vídeo)

  ];

  // Se for vídeo, adiciona conversão para AVI
  if (format === 'video') {
    args.push('--recode-video', 'webm');
  }

  // Se a flag 'playlist' NÃO for marcada, adiciona a opção --no-playlist para baixar apenas o vídeo/áudio do link único
  if (playlist !== '1') {
    args.push('--no-playlist');
  }


  // A URL do vídeo ou áudio deve ser passada por último no comando
  args.push(url);

  // Executa o comando yt-dlp com os argumentos configurados
  const ytDlp = spawn('C:/yt-dlp/yt-dlp.exe', args);

  // Evento para capturar dados padrão (stdout) do processo
  ytDlp.stdout.on('data', (data) => {
    console.log(data.toString());  // Exibe a saída do yt-dlp no console
  });

  // Evento para capturar erros (stderr) do processo
  ytDlp.stderr.on('data', (data) => {
    console.error(data.toString());  // Exibe erros do yt-dlp no console
  });

  // Evento acionado quando o processo termina
  ytDlp.on('close', async (code) => {
    if (code === 0) {
      if (format === 'video') {
        const fs = require('fs');
        const util = require('util');
        const readdir = util.promisify(fs.readdir);
        const unlink = util.promisify(fs.unlink);

        try {
          const files = await readdir(resolvedFolder);
          const videoFiles = files.filter(f => f.endsWith('.webm') || f.endsWith('.mkv') || f.endsWith('.mp4'));

          if (videoFiles.length === 0) {
            return res.status(500).send('Nenhum arquivo de vídeo encontrado.');
          }

          for (const inputFile of videoFiles) {
            const inputPath = path.join(resolvedFolder, inputFile);
            const outputPath = path.join(resolvedFolder, path.parse(inputFile).name + '.avi');

            await new Promise((resolve, reject) => {
              const ffmpeg = spawn('C:/ffmpeg/bin/ffmpeg.exe', [
                '-i', inputPath,
                '-vf', 'scale=854:480',
                '-vcodec', 'libxvid',
                '-acodec', 'libmp3lame',
                '-b:v', '1000k',
                '-b:a', '192k',
                outputPath
              ]);

              ffmpeg.stderr.on('data', (data) => console.error(`stderr: ${data}`));
              ffmpeg.stdout.on('data', (data) => console.log(`stdout: ${data}`));

              ffmpeg.on('close', async (code) => {
                if (code === 0) {
                  console.log(`✔️ Convertido: ${outputPath}`);
                  try {
                    await unlink(inputPath); // remove original
                    console.log(`🗑️ Removido: ${inputPath}`);
                  } catch (err) {
                    console.warn(`⚠️ Falha ao remover ${inputPath}:`, err);
                  }
                  resolve();
                } else {
                  reject(new Error(`Erro ao converter: ${inputFile}`));
                }
              });
            });
          }

          return res.status(200).send('✅ Todos os vídeos foram convertidos para AVI com sucesso!');
        } catch (err) {
          console.error('Erro ao converter vídeos:', err);
          return res.status(500).send('❌ Erro ao processar os vídeos.');
        }
      } else {
        res.status(200).send('✅ Download de MP3 concluído!');
      }
    } else {
      res.status(500).send('❌ Erro no download com yt-dlp.');
    }
  });




});

// Inicia o servidor Express na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);  // Exibe mensagem de que o servidor está rodando
});
