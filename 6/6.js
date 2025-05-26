class ImageRetoucher {
    constructor() {
        this.sourceCanvas = document.getElementById('source-canvas');
        this.retouchCanvas = document.getElementById('retouch-canvas');
        this.sourceCtx = this.sourceCanvas.getContext('2d');
        this.retouchCtx = this.retouchCanvas.getContext('2d');
        this.overlay = document.getElementById('canvas-overlay');
        
        this.imageUpload = document.getElementById('image-upload');
        this.retouchModeBtn = document.getElementById('retouch-mode');
        this.applyRetouchBtn = document.getElementById('apply-retouch');
        this.resetBtn = document.getElementById('reset-all');
        this.downloadBtn = document.getElementById('download-btn');
        this.brushSizeInput = document.getElementById('brush-size');
        this.brushOpacityInput = document.getElementById('brush-opacity');
        this.brushSizeValue = document.getElementById('brush-size-value');
        this.brushOpacityValue = document.getElementById('brush-opacity-value');
        
        this.isRetouching = false;
        this.isDrawing = false;
        this.image = null;
        this.retouchPaths = [];
        this.currentPath = null;
        
        this.initEventListeners();
        this.updateBrushInfo();
    }
    
    initEventListeners() {
        this.imageUpload.addEventListener('change', this.handleImageUpload.bind(this));
        this.retouchModeBtn.addEventListener('click', this.toggleRetouchMode.bind(this));
        this.applyRetouchBtn.addEventListener('click', this.applyRetouch.bind(this));
        this.resetBtn.addEventListener('click', this.resetAll.bind(this));
        this.downloadBtn.addEventListener('click', this.downloadImage.bind(this));
        
        this.brushSizeInput.addEventListener('input', this.updateBrushInfo.bind(this));
        this.brushOpacityInput.addEventListener('input', this.updateBrushInfo.bind(this));
        
        this.sourceCanvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.sourceCanvas.addEventListener('mousemove', this.draw.bind(this));
        this.sourceCanvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.sourceCanvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        
        // Touch support
        this.sourceCanvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.sourceCanvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.sourceCanvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }
    
    updateBrushInfo() {
        this.brushSizeValue.textContent = this.brushSizeInput.value;
        this.brushOpacityValue.textContent = this.brushOpacityInput.value;
    }
    
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            this.image = new Image();
            this.image.onload = () => {
                this.setupCanvases();
                this.drawSourceImage();
                this.overlay.style.display = 'none';
                this.downloadBtn.disabled = false;
            };
            this.image.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    setupCanvases() {
        const container = this.sourceCanvas.parentElement;
        const ratio = this.image.width / this.image.height;
        const maxWidth = container.clientWidth;
        const maxHeight = container.clientHeight;
        
        let canvasWidth = maxWidth;
        let canvasHeight = maxWidth / ratio;
        
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = maxHeight * ratio;
        }
        
        this.sourceCanvas.width = canvasWidth;
        this.sourceCanvas.height = canvasHeight;
        this.retouchCanvas.width = canvasWidth;
        this.retouchCanvas.height = canvasHeight;
    }
    
    drawSourceImage() {
        this.sourceCtx.clearRect(0, 0, this.sourceCanvas.width, this.sourceCanvas.height);
        this.sourceCtx.drawImage(this.image, 0, 0, this.sourceCanvas.width, this.sourceCanvas.height);
        this.clearRetouchCanvas();
    }
    
    clearRetouchCanvas() {
        this.retouchCtx.clearRect(0, 0, this.retouchCanvas.width, this.retouchCanvas.height);
        this.retouchPaths = [];
    }
    
    toggleRetouchMode() {
        if (!this.image) {
            alert('Please upload an image first');
            return;
        }
        
        this.isRetouching = !this.isRetouching;
        this.retouchModeBtn.textContent = this.isRetouching ? 'Disable Retouch' : 'Enable Retouch';
        this.retouchModeBtn.classList.toggle('active', this.isRetouching);
        this.applyRetouchBtn.disabled = !this.isRetouching;
        
        this.sourceCanvas.style.cursor = this.isRetouching ? 'crosshair' : 'default';
    }
    
    startDrawing(e) {
        if (!this.isRetouching) return;
        
        this.isDrawing = true;
        const pos = this.getCanvasPosition(e);
        this.currentPath = {
            points: [pos],
            size: parseInt(this.brushSizeInput.value),
            opacity: parseInt(this.brushOpacityInput.value) / 100
        };
        
        this.drawRetouchPoint(pos, this.currentPath.size, this.currentPath.opacity);
    }
    
    draw(e) {
        if (!this.isDrawing || !this.isRetouching) return;
        
        const pos = this.getCanvasPosition(e);
        this.currentPath.points.push(pos);
        
        this.drawRetouchLine(
            this.currentPath.points[this.currentPath.points.length - 2],
            pos,
            this.currentPath.size,
            this.currentPath.opacity
        );
    }
    
    stopDrawing() {
        if (!this.isDrawing || !this.currentPath) return;
        
        this.isDrawing = false;
        this.retouchPaths.push(this.currentPath);
        this.currentPath = null;
    }
    
    drawRetouchPoint(pos, size, opacity) {
        this.retouchCtx.globalCompositeOperation = 'source-over';
        this.retouchCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.retouchCtx.beginPath();
        this.retouchCtx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
        this.retouchCtx.fill();
    }
    
    drawRetouchLine(startPos, endPos, size, opacity) {
        this.retouchCtx.globalCompositeOperation = 'source-over';
        this.retouchCtx.lineWidth = size;
        this.retouchCtx.lineCap = 'round';
        this.retouchCtx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        this.retouchCtx.beginPath();
        this.retouchCtx.moveTo(startPos.x, startPos.y);
        this.retouchCtx.lineTo(endPos.x, endPos.y);
        this.retouchCtx.stroke();
    }
    
    applyRetouch() {
        if (this.retouchPaths.length === 0) {
            alert('No retouching has been done');
            return;
        }
        
        this.sourceCtx.globalCompositeOperation = 'destination-out';
        this.sourceCtx.lineCap = 'round';
        
        this.retouchPaths.forEach(path => {
            this.sourceCtx.lineWidth = path.size;
            this.sourceCtx.beginPath();
            
            path.points.forEach((point, i) => {
                if (i === 0) {
                    this.sourceCtx.moveTo(point.x, point.y);
                } else {
                    this.sourceCtx.lineTo(point.x, point.y);
                }
            });
            
            this.sourceCtx.stroke();
        });
        
        this.clearRetouchCanvas();
        this.toggleRetouchMode();
    }
    
    resetAll() {
        if (this.image) {
            this.drawSourceImage();
        } else {
            this.overlay.style.display = 'flex';
        }
        
        this.isRetouching = false;
        this.retouchModeBtn.textContent = 'Enable Retouch';
        this.retouchModeBtn.classList.remove('active');
        this.applyRetouchBtn.disabled = true;
        this.sourceCanvas.style.cursor = 'default';
    }
    
    downloadImage() {
        if (!this.image) return;
        
        const link = document.createElement('a');
        link.download = 'retouched-image.png';
        link.href = this.sourceCanvas.toDataURL('image/png');
        link.click();
    }
    
    getCanvasPosition(e) {
        const rect = this.sourceCanvas.getBoundingClientRect();
        let x, y;
        
        if (e.type.includes('touch')) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        
        return { x, y };
    }
    
    handleTouch(e) {
        e.preventDefault();
        
        if (e.type === 'touchstart') {
            this.startDrawing(e);
        } else if (e.type === 'touchmove') {
            this.draw(e);
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageRetoucher();
});