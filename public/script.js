const form = document.getElementById('download-form');
const output = document.getElementById('output');
const progressBar = document.getElementById('progress-bar');

// Conexão SSE
const eventSource = new EventSource('/progress');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  const progress = data.progress;

  // Atualiza a barra de progresso
  progressBar.style.width = progress + '%';
  progressBar.textContent = Math.floor(progress) + '%';

  // Se o progresso chegar a 100%, fecha a conexão
  if (progress === 100) {
    eventSource.close();
  }
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  output.textContent = '⏳ Iniciando download...\n';
  progressBar.style.width = '0%';
  progressBar.textContent = '0%';

  const data = new URLSearchParams(new FormData(form));

  const res = await fetch('/download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data,
  });

  if (res.ok) {
    output.textContent += '✅ Download concluído com sucesso!';
  } else {
    output.textContent += '❌ Erro durante o download.';
    progressBar.style.backgroundColor = '#f44336';
    progressBar.textContent = 'Erro';
  }
});
