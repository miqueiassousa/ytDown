// Obtém os elementos HTML do formulário, da área de output e da barra de progresso
const form = document.getElementById('download-form');  // Formulário para download
const output = document.getElementById('output');  // Área de output para mensagens
const progressBar = document.getElementById('progress-bar');  // Barra de progresso

// Função que simula o progresso da barra de download
function simulateProgress() {
  let width = 0;  // Variável para armazenar o progresso atual da barra (0 a 100%)
  
  // Função que atualiza a barra de progresso a cada 300ms
  const interval = setInterval(() => {
    if (width >= 95) {  // Quando o progresso atinge 95%, para a simulação
      clearInterval(interval);
    } else {
      // Aumenta o progresso de forma aleatória, simulando o download
      width += Math.random() * 5;
      progressBar.style.width = width + '%';  // Atualiza o estilo da barra
      progressBar.textContent = Math.floor(width) + '%';  // Atualiza o texto dentro da barra
    }
  }, 300);  // A cada 300ms, o progresso é incrementado
  return interval;  // Retorna o identificador do intervalo
}

// Adiciona um listener para o evento de submit do formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault();  // Previne o comportamento padrão de envio do formulário

  // Exibe a mensagem de "iniciando download" e ajusta a cor do texto
  output.textContent = '⏳ Iniciando download...\n';
  output.style.color = 'black';

  // Reseta a barra de progresso
  progressBar.style.width = '0%';  // A barra começa em 0%
  progressBar.textContent = '0%';  // O texto da barra é 0%
  progressBar.style.backgroundColor = '#4caf50';  // Cor da barra (verde)

  // Cria um objeto FormData para pegar os dados do formulário
  const formData = new FormData(form);
  // Converte o FormData para URLSearchParams para ser usado em uma requisição HTTP
  const data = new URLSearchParams(formData);

  // Inicia a simulação de progresso
  const loading = simulateProgress();

  try {
    // Faz a requisição para o servidor para iniciar o download
    const res = await fetch('/download', {
      method: 'POST',  // Método POST
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },  // Define o tipo de conteúdo
      body: data,  // Envia os dados do formulário no corpo da requisição
    });

    // Se o download for concluído com sucesso, limpa a simulação de progresso
    clearInterval(loading);
    // Ajusta a barra de progresso para 100%
    progressBar.style.width = '100%';
    progressBar.textContent = '100%';  // Atualiza o texto da barra

    // Verifica se a resposta do servidor foi bem-sucedida
    if (res.ok) {
      output.textContent += '✅ Download concluído com sucesso!';  // Mensagem de sucesso
    } else {
      throw new Error();  // Se o servidor retornar erro, dispara uma exceção
    }
  } catch (err) {
    // Se ocorrer algum erro durante o download, exibe a mensagem de erro
    output.textContent += '❌ Erro durante o download.';
    progressBar.style.backgroundColor = '#f44336';  // Altera a cor da barra para vermelho
    progressBar.textContent = 'Erro';  // Exibe 'Erro' na barra de progresso
  }
});
