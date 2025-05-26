document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const applyBtn = document.getElementById('applyBtn');
    const originalCanvas = document.getElementById('originalCanvas');
    const processedCanvas = document.getElementById('processedCanvas');
    const amountSlider = document.getElementById('amount');
    const radiusSlider = document.getElementById('radius');
    const thresholdSlider = document.getElementById('threshold');
    const amountValue = document.getElementById('amountValue');
    const radiusValue = document.getElementById('radiusValue');
    const thresholdValue = document.getElementById('thresholdValue');

    let originalImage = null;
    let ctxOriginal = originalCanvas.getContext('2d');
    let ctxProcessed = processedCanvas.getContext('2d');

    // Update slider values
    amountSlider.addEventListener('input', () => amountValue.textContent = `${amountSlider.value}%`);
    radiusSlider.addEventListener('input', () => radiusValue.textContent = radiusSlider.value);
    thresholdSlider.addEventListener('input', () => thresholdValue.textContent = thresholdSlider.value);

    // Load image when uploaded
    imageUpload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                originalImage = new Image();
                originalImage.onload = () => {
                    drawOriginalImage();
                };
                originalImage.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Draw original image on canvas
    function drawOriginalImage() {
        originalCanvas.width = originalImage.width;
        originalCanvas.height = originalImage.height;
        processedCanvas.width = originalImage.width;
        processedCanvas.height = originalImage.height;
        ctxOriginal.drawImage(originalImage, 0, 0);
    }

    // Apply Unsharp Masking
    applyBtn.addEventListener('click', () => {
        if (!originalImage) {
            alert('Please upload an image first!');
            return;
        }

        const amount = parseFloat(amountSlider.value) / 100;
        const radius = parseFloat(radiusSlider.value);
        const threshold = parseFloat(thresholdSlider.value);

        // Get image data
        ctxOriginal.drawImage(originalImage, 0, 0);
        const imageData = ctxOriginal.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
        const processedData = unsharpMask(imageData, amount, radius, threshold);

        // Draw processed image
        ctxProcessed.putImageData(processedData, 0, 0);
    });

    // Unsharp Mask Algorithm
    function unsharpMask(imageData, amount, radius, threshold) {
        const { data, width, height } = imageData;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);

        // Apply Gaussian blur (simplified)
        tempCtx.filter = `blur(${radius}px)`;
        tempCtx.drawImage(tempCanvas, 0, 0);
        const blurredData = tempCtx.getImageData(0, 0, width, height).data;

        // Create a copy of the original data
        const output = new ImageData(new Uint8ClampedArray(data), width, height);
        const outputData = output.data;

        for (let i = 0; i < data.length; i += 4) {
            // Calculate difference between original and blurred
            const diffR = data[i] - blurredData[i];
            const diffG = data[i + 1] - blurredData[i + 1];
            const diffB = data[i + 2] - blurredData[i + 2];

            // Apply threshold (only sharpen if difference > threshold)
            if (Math.abs(diffR) > threshold || Math.abs(diffG) > threshold || Math.abs(diffB) > threshold) {
                outputData[i] = data[i] + diffR * amount; // R
                outputData[i + 1] = data[i + 1] + diffG * amount; // G
                outputData[i + 2] = data[i + 2] + diffB * amount; // B
            }
            // Alpha remains unchanged
        }

        return output;
    }
});