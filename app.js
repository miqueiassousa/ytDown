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
  if (!playlist) {
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
  ytDlp.on('close', (code) => {
    if (code === 0) {
      if (format === 'video') {
        const fs = require('fs');
        const { spawn } = require('child_process');

        fs.readdir(resolvedFolder, (err, files) => {
          if (err) {
            console.error('Erro ao ler a pasta:', err);
            return res.status(500).send('Erro ao acessar arquivos.');
          }

          const inputFile = files.find(f => f.endsWith('.webm') || f.endsWith('.mkv') || f.endsWith('.mp4'));
          if (!inputFile) {
            return res.status(500).send('Arquivo de vídeo não encontrado.');
          }

          const inputPath = path.join(resolvedFolder, inputFile);
          const outputPath = path.join(resolvedFolder, path.parse(inputFile).name + '.avi');

          const ffmpeg = spawn('C:/ffmpeg/bin/ffmpeg.exe', [
            '-i', inputPath,
            '-vf', 'scale=854:480',
            '-vcodec', 'libxvid',
            '-acodec', 'libmp3lame',
            '-b:v', '1000k',
            '-b:a', '192k',
            outputPath
          ]);

          ffmpeg.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
          });

          ffmpeg.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
          });

          ffmpeg.on('close', (code) => {
            if (code === 0) {
              // ✅ Após conversão bem-sucedida, remove o arquivo original
              fs.unlink(inputPath, (err) => {
                if (err) {
                  console.warn(`⚠️ Não foi possível remover o arquivo original: ${inputPath}`);
                } else {
                  console.log(`🗑️ Arquivo original removido: ${inputPath}`);
                }
              });

              return res.status(200).send('✅ Download e conversão concluídos com sucesso!');
            } else {
              return res.status(500).send('❌ Erro na conversão para AVI.');
            }
          });
        });
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
