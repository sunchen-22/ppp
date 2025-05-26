document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('imageUpload');
    const originalImage = document.getElementById('originalImage');
    const filteredImage = document.getElementById('filteredImage');
    const sepiaFilter = document.getElementById('sepiaFilter');
    const grayscaleFilter = document.getElementById('grayscaleFilter');
    const invertFilter = document.getElementById('invertFilter');
    const resetFilter = document.getElementById('resetFilter');

 
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                originalImage.src = event.target.result;
                filteredImage.src = event.target.result;
            };
            
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    function applyFilter(filterType) {
        if (!originalImage.src || originalImage.src === '') {
            alert('Please upload an image first!');
            return;
        }

      
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = originalImage.naturalWidth;
        canvas.height = originalImage.naturalHeight;
        
     
        ctx.drawImage(originalImage, 0, 0);
        
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
     
        switch(filterType) {
            case 'sepia':
             
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                break;
                
         
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;    
                    data[i + 1] = avg;  
                    data[i + 2] = avg;  
                }
                break;
                
            case 'invert':
             
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];      
                    data[i + 1] = 255 - data[i + 1]; 
                    data[i + 2] = 255 - data[i + 2]; 
                }
                break;
                
            case 'reset':
                
                filteredImage.src = originalImage.src;
                return;
        }
        
       
        ctx.putImageData(imageData, 0, 0);
        
      
        filteredImage.src = canvas.toDataURL();
    }

  
    sepiaFilter.addEventListener('click', () => applyFilter('sepia'));
    grayscaleFilter.addEventListener('click', () => applyFilter('grayscale'));
    invertFilter.addEventListener('click', () => applyFilter('invert'));
    resetFilter.addEventListener('click', () => applyFilter('reset'));
});