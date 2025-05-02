const form = document.getElementById('download-form');
const output = document.getElementById('output');
const progressBar = document.getElementById('progress-bar');

function simulateProgress() {
  let width = 0;
  const interval = setInterval(() => {
    if (width >= 95) {
      clearInterval(interval);
    } else {
      width += Math.random() * 5;
      progressBar.style.width = width + '%';
      progressBar.textContent = Math.floor(width) + '%';
    }
  }, 300);
  return interval;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  output.textContent = '⏳ Iniciando download...\n';
  progressBar.style.width = '0%';
  progressBar.textContent = '0%';
  progressBar.style.backgroundColor = '#4caf50';

  const formData = new FormData(form);
  const data = new URLSearchParams(formData);
  const loading = simulateProgress();

  try {
    const res = await fetch('/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data,
    });

    clearInterval(loading);
    progressBar.style.width = '100%';
    progressBar.textContent = '100%';

    if (res.ok) {
      output.textContent += '✅ Download concluído com sucesso!';
    } else {
      throw new Error();
    }
  } catch (err) {
    output.textContent += '❌ Erro durante o download.';
    progressBar.style.backgroundColor = '#f44336';
    progressBar.textContent = 'Erro';
  }
});
