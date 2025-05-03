document.addEventListener('DOMContentLoaded', function() {
    // Get all DOM elements
    const imageUpload = document.getElementById('imageUpload');
    const rotateBtn = document.getElementById('rotateBtn');
    const rotationDegrees = document.getElementById('rotationDegrees');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const downloadBtn = document.getElementById('downloadBtn');
    const fileInfo = document.getElementById('fileInfo');

    let currentImage = null;
    let currentRotation = 0; // Track current rotation angle

    // Image upload handler
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        fileInfo.textContent = `Selected: ${file.name}`;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImage = new Image();
            currentImage.onload = function() {
                resetCanvas();
                downloadBtn.disabled = false;
            };
            currentImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Rotate button handler
    rotateBtn.addEventListener('click', function() {
        if (!currentImage) {
            alert('Please upload an image first!');
            return;
        }
        
        const degrees = parseInt(rotationDegrees.value);
        currentRotation = (currentRotation + degrees) % 360;
        applyRotation();
    });

    // Reset canvas to original image
    function resetCanvas() {
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        ctx.drawImage(currentImage, 0, 0);
        currentRotation = 0;
    }

    // Apply rotation to image
    function applyRotation() {
        // Calculate new canvas size to fit rotated image
        const radians = currentRotation * Math.PI / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));
        const newWidth = Math.floor(currentImage.width * cos + currentImage.height * sin);
        const newHeight = Math.floor(currentImage.width * sin + currentImage.height * cos);

        // Create temporary canvas for rotation
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;

        // Rotate and draw image
        tempCtx.translate(newWidth / 2, newHeight / 2);
        tempCtx.rotate(radians);
        tempCtx.drawImage(currentImage, -currentImage.width / 2, -currentImage.height / 2);

        // Update main canvas
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(tempCanvas, 0, 0);
    }

    // Download button handler
    downloadBtn.addEventListener('click', function() {
        if (!currentImage) {
            alert('No image to download!');
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'rotated-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});