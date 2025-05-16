document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('image-upload');
    const scaleRatio = document.getElementById('scale-ratio');
    const scaleBtn = document.getElementById('scale-btn');
    const resetBtn = document.getElementById('reset-btn');
    const originalImage = document.getElementById('original-image');
    const scaledImage = document.getElementById('scaled-image');
    const originalDimensions = document.getElementById('original-dimensions');
    const scaledDimensions = document.getElementById('scaled-dimensions');
    
    let originalWidth = 0;
    let originalHeight = 0;
    
    // Handle image upload
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                originalImage.src = event.target.result;
                
                originalImage.onload = function() {
                    originalWidth = originalImage.naturalWidth;
                    originalHeight = originalImage.naturalHeight;
                    originalDimensions.textContent = `Dimensions: ${originalWidth} × ${originalHeight} px`;
                    
                    // Reset scaled image
                    scaledImage.width = originalWidth;
                    scaledImage.height = originalHeight;
                    const ctx = scaledImage.getContext('2d');
                    ctx.clearRect(0, 0, scaledImage.width, scaledImage.height);
                    scaledDimensions.textContent = '';
                };
            };
            
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Scale image
    scaleBtn.addEventListener('click', function() {
        if (!originalImage.src) {
            alert('Please upload an image first');
            return;
        }
        
        const ratio = parseFloat(scaleRatio.value);
        
        if (isNaN(ratio) || ratio < 0.1 || ratio > 10) {
            alert('Please enter a valid scale ratio between 0.1 and 10');
            return;
        }
        
        const newWidth = Math.round(originalWidth * ratio);
        const newHeight = Math.round(originalHeight * ratio);
        
        scaledImage.width = newWidth;
        scaledImage.height = newHeight;
        
        const ctx = scaledImage.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);
        
        scaledDimensions.textContent = `Dimensions: ${newWidth} × ${newHeight} px (${ratio.toFixed(1)}x)`;
    });
    
    // Reset everything
    resetBtn.addEventListener('click', function() {
        originalImage.src = '';
        imageUpload.value = '';
        scaleRatio.value = '1';
        originalDimensions.textContent = '';
        scaledDimensions.textContent = '';
        
        const ctx = scaledImage.getContext('2d');
        ctx.clearRect(0, 0, scaledImage.width, scaledImage.height);
    });
});