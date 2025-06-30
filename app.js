let model;
const imageSize = 224; // según metadata.json

// Función para mostrar mensajes con estilo
function showMessage(message, type = 'info') {
  const resultDiv = document.getElementById('result');
  resultDiv.style.opacity = '0';

  setTimeout(() => {
    resultDiv.innerHTML = message;
    resultDiv.style.opacity = '1';

    if (type === 'success') {
      resultDiv.style.color = '#2E8B57';
    } else if (type === 'error') {
      resultDiv.style.color = '#8B0000';
    }
  }, 300);
}

// Función para animar la carga de la imagen
function animateImageLoad(img) {
  img.style.opacity = '0';
  img.style.transform = 'scale(0.95)';

  setTimeout(() => {
    img.style.transition = 'all 0.5s ease';
    img.style.opacity = '1';
    img.style.transform = 'scale(1)';
  }, 100);
}

async function loadModel() {
  try {
    model = await tf.loadLayersModel('model.json');
    showMessage('Modelo cargado. Por favor, selecciona una obra de arte.', 'success');
  } catch (error) {
    showMessage('Error al cargar el modelo. Por favor, recarga la página.', 'error');
    console.error('Error loading model:', error);
  }
}

loadModel();

document.getElementById('imageUpload').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const img = document.getElementById('inputImage');
  img.src = URL.createObjectURL(file);

  img.onload = async () => {
    animateImageLoad(img);
    showMessage('Analizando la obra de arte...', 'info');

    try {
      // Preprocesar la imagen
      const tensor = tf.browser.fromPixels(img)
        .resizeNearestNeighbor([imageSize, imageSize])
        .toFloat()
        .div(255.0)
        .expandDims();

      const prediction = await model.predict(tensor).data();
      const response = await fetch('metadata.json');
      const metadata = await response.json();
      const labels = metadata.labels;

      // Obtener el índice con mayor probabilidad
      const topIndex = prediction.indexOf(Math.max(...prediction));
      const label = labels[topIndex];
      const confidence = (prediction[topIndex] * 100).toFixed(2);

      // Mostrar resultado con estilo
      showMessage(`Estilo identificado: ${label}<br>Confianza: ${confidence}%`, 'success');

      // Liberar memoria
      tensor.dispose();
    } catch (error) {
      showMessage('Error al procesar la imagen. Por favor, intenta con otra obra.', 'error');
      console.error('Error processing image:', error);
    }
  };
});
