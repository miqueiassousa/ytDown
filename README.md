# 🎵 YDown (MP3 e Vídeo AVI)

YDown com conversão para **MP3 (áudio)** ou **AVI (vídeo)**. Foi construído com Node.js, yt-dlp, ffmpeg e Bootstrap.

---

## ✅ Requisitos do Sistema

Antes de rodar o projeto, você precisa instalar o seguinte:

### 1. Node.js
- Baixe e instale a versão LTS do Node.js:  
  👉 https://nodejs.org/

### 2. yt-dlp 
- Ferramenta de linha de comando usada para down de vídeos e áudios
- Faça o download do binário do `yt-dlp.exe`:  
  👉 https://github.com/yt-dlp/yt-dlp/releases  
- Copie o `yt-dlp.exe` para uma pasta fixa no sistema, ex: `C:\yt-dlp\yt-dlp.exe`

### 3. FFmpeg
- Ferramenta de linha de comando usada para processamento de áudio e vídeo
- Baixe o FFmpeg:  
  👉 https://www.gyan.dev/ffmpeg/builds/
- Extraia o conteúdo e copie o caminho da pasta `bin`, ex: `C:\ffmpeg\bin`
- Adicione esse caminho às **variáveis de ambiente do sistema** (opcional, mas recomendado)

---

## 🔐 Cookie

### 4. Instalar extensão do Chrome: "Get cookies.txt"
- Extensão para exportar cookies do YT:  
  👉 https://chrome.google.com/webstore/detail/get-cookiestxt/gieohaicffldbmiilohjjfdnfaokifpg

### 5. Exportar cookies
- Clique no ícone da extensão e baixe o arquivo `cookies.txt`
- Salve este arquivo na raiz do projeto (ou onde indicado no `app.js`)

---

## 📁 Estrutura de Pastas Esperada

seu-projeto/
├── app.js
├── cookies.txt
├── downloads/
├── public/
│ ├── index.html
│ ├── script.js
│ └── style.css
├── package.json

---

## ⚙️ Instalação do Projeto

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio

# Instala dependências
npm install
```

| Recurso                            | Suporte |
| ---------------------------------- | -------  |
| YDown MP3                          | ✅       |
| YDown Vídeo AVI 480p               | ✅       |
| Cookies para YT Premium/login      | ✅       |
| YDown playlist completa            | ✅       |
| Interface responsiva (Bootstrap)   | ✅       |
| Barra de progresso                 | ✅       |
