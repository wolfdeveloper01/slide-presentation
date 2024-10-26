// Configura o caminho para o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

let currentPage = 1;
let pdfDoc = null;
const pdfCanvas = document.getElementById('pdf-canvas');
const context = pdfCanvas.getContext('2d');
const loader = document.getElementById('loader'); // Elemento do loader

// Adiciona um ouvinte de eventos para o botão de upload
document.getElementById('upload-button').addEventListener('click', handleFileUpload);

// Adiciona um ouvinte de eventos para as teclas
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowRight') {
        nextSlide();
    } else if (event.key === 'ArrowLeft') {
        prevSlide();
    }
});

// Função para manipular o upload do arquivo
function handleFileUpload() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (file && file.type === 'application/pdf') {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const pdfData = new Uint8Array(this.result);
            renderPDF(pdfData);
            document.getElementById('upload-container').style.display = 'none'; // Oculta o formulário
            document.getElementById('presentation-container').classList.remove('hidden'); // Mostra a apresentação
            enterFullscreen(); // Entra em modo de tela cheia
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        alert('Por favor, envie um arquivo PDF válido.');
    }
}

// Função para renderizar o PDF
async function renderPDF(data) {
    loader.style.display = 'flex'; // Mostra o loader

    try {
        pdfDoc = await pdfjsLib.getDocument(data).promise;
        currentPage = 1; // Reinicia para a primeira página ao carregar um novo PDF
        await renderPage(currentPage);
    } catch (error) {
        console.error('Erro ao carregar PDF:', error);
    } finally {
        loader.style.display = 'none'; // Oculta o loader após a renderização
    }
}

// Função para renderizar uma página específica
async function renderPage(num) {
    const page = await pdfDoc.getPage(num);
    const originalViewport = page.getViewport({ scale: 1 });

    // Define a largura e altura do canvas para preencher a tela
    const canvasWidth = window.innerWidth; // largura da tela
    const canvasHeight = window.innerHeight; // altura da tela

    // Ajusta as dimensões do canvas
    pdfCanvas.width = canvasWidth;
    pdfCanvas.height = canvasHeight;

    // Define a escala para se ajustar ao canvas
    const scale = Math.min(canvasWidth / originalViewport.width, canvasHeight / originalViewport.height);
    const scaledViewport = originalViewport.clone({ scale: scale });

    // Renderiza a página no canvas com a nova proporção
    await page.render({
        canvasContext: context,
        viewport: scaledViewport,
    });
}

// Função para ir para a próxima página
function nextSlide() {
    if (pdfDoc && currentPage < pdfDoc.numPages) {
        currentPage++;
        renderPage(currentPage);
    }
}

// Função para ir para a página anterior
function prevSlide() {
    if (pdfDoc && currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
}

// Função para entrar em modo de tela cheia
function enterFullscreen() {
    const presentationContainer = document.getElementById('presentation-container');
    if (presentationContainer.requestFullscreen) {
        presentationContainer.requestFullscreen();
    } else if (presentationContainer.mozRequestFullScreen) { // Firefox
        presentationContainer.mozRequestFullScreen();
    } else if (presentationContainer.webkitRequestFullscreen) { // Chrome, Safari e Opera
        presentationContainer.webkitRequestFullscreen();
    } else if (presentationContainer.msRequestFullscreen) { // IE/Edge
        presentationContainer.msRequestFullscreen();
    }
}

// Atualiza a renderização quando a janela for redimensionada
window.addEventListener('resize', () => {
    if (pdfDoc) {
        renderPage(currentPage);
    }
});
