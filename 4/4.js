document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('imageUpload');
    const segmentBtn = document.getElementById('segmentBtn');
    const resetBtn = document.getElementById('resetBtn');
    const originalCanvas = document.getElementById('originalCanvas');
    const segmentedCanvas = document.getElementById('segmentedCanvas');
    const resultsDiv = document.getElementById('results');
    
    const originalCtx = originalCanvas.getContext('2d');
    const segmentedCtx = segmentedCanvas.getContext('2d');
    
    let originalImage = null;
    
    // Load image when file is selected
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                originalImage = new Image();
                originalImage.onload = function() {
                    // Set canvas dimensions to match image
                    originalCanvas.width = originalImage.width;
                    originalCanvas.height = originalImage.height;
                    segmentedCanvas.width = originalImage.width;
                    segmentedCanvas.height = originalImage.height;
                    
                    // Draw original image
                    originalCtx.drawImage(originalImage, 0, 0);
                    
                    // Clear segmented canvas and results
                    segmentedCtx.clearRect(0, 0, segmentedCanvas.width, segmentedCanvas.height);
                    resultsDiv.innerHTML = '';
                };
                originalImage.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Segment image button click handler
    segmentBtn.addEventListener('click', function() {
        if (!originalImage) {
            alert('Please upload an image first');
            return;
        }
        
        // Copy original image to segmented canvas
        segmentedCtx.drawImage(originalImage, 0, 0);
        
        // Perform actual shape detection
        detectShapes(segmentedCanvas, segmentedCtx);
    });
    
    // Reset button click handler
    resetBtn.addEventListener('click', function() {
        originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
        segmentedCtx.clearRect(0, 0, segmentedCanvas.width, segmentedCanvas.height);
        resultsDiv.innerHTML = '';
        imageUpload.value = '';
        originalImage = null;
    });
    
    // Function to detect shapes in the image
    function detectShapes(canvas, ctx) {
        resultsDiv.innerHTML = '<h3>Detected Shapes:</h3>';
        
        // Convert image to grayscale for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const grayData = convertToGrayscale(imageData.data, canvas.width, canvas.height);
        
        // Apply edge detection
        const edgeData = detectEdges(grayData, canvas.width, canvas.height);
        
        // Find contours
        const contours = findContours(edgeData, canvas.width, canvas.height);
        
        // Approximate shapes from contours
        const shapes = approximateShapes(contours);
        
        // Draw detected shapes and display results
        drawDetectedShapes(ctx, shapes, canvas.width, canvas.height);
        displayShapeResults(shapes);
    }
    
    // Helper functions for image processing
    function convertToGrayscale(imageData, width, height) {
        const grayData = new Uint8Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = imageData[idx];
                const g = imageData[idx + 1];
                const b = imageData[idx + 2];
                grayData[y * width + x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            }
        }
        return grayData;
    }
    
    function detectEdges(grayData, width, height) {
        const edgeData = new Uint8Array(width * height);
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (y + ky) * width + (x + kx);
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        gx += grayData[idx] * sobelX[kernelIdx];
                        gy += grayData[idx] * sobelY[kernelIdx];
                    }
                }
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                edgeData[y * width + x] = magnitude > 50 ? 255 : 0;
            }
        }
        return edgeData;
    }
    
    function findContours(edgeData, width, height) {
        const visited = new Array(width * height).fill(false);
        const contours = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (edgeData[idx] === 255 && !visited[idx]) {
                    const contour = [];
                    const stack = [[x, y]];
                    visited[idx] = true;
                    
                    while (stack.length > 0) {
                        const [cx, cy] = stack.pop();
                        contour.push([cx, cy]);
                        
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = cx + dx;
                                const ny = cy + dy;
                                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                    const nidx = ny * width + nx;
                                    if (edgeData[nidx] === 255 && !visited[nidx]) {
                                        visited[nidx] = true;
                                        stack.push([nx, ny]);
                                    }
                                }
                            }
                        }
                    }
                    
                    if (contour.length > 20) { // Filter small contours
                        contours.push(contour);
                    }
                }
            }
        }
        return contours;
    }
    
    function approximateShapes(contours) {
        const shapes = [];
        const shapeColors = [
            'rgba(255, 0, 0, 0.5)',
            'rgba(0, 255, 0, 0.5)',
            'rgba(0, 0, 255, 0.5)',
            'rgba(255, 255, 0, 0.5)',
            'rgba(255, 0, 255, 0.5)',
            'rgba(0, 255, 255, 0.5)'
        ];
        
        contours.forEach((contour, i) => {
            // Simple shape approximation
            const points = contour;
            const color = shapeColors[i % shapeColors.length];
            
            // Calculate bounding box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            points.forEach(([x, y]) => {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            });
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Determine shape type based on properties
            let type = 'unknown';
            const area = points.length;
            const rectArea = width * height;
            const circularity = (4 * Math.PI * area) / (Math.pow(contour.length, 2));
            
            if (circularity > 0.8) {
                type = 'circle';
            } else if (Math.abs(width - height) < Math.max(width, height) * 0.2) {
                type = 'square';
            } else if (width > height * 1.5 || height > width * 1.5) {
                type = 'rectangle';
            } else if (points.length === 3) {
                type = 'triangle';
            }
            
            shapes.push({
                type,
                points,
                color,
                center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
                boundingBox: { x: minX, y: minY, width, height }
            });
        });
        
        return shapes;
    }
    
    function drawDetectedShapes(ctx, shapes, width, height) {
        // Clear canvas first
        ctx.clearRect(0, 0, width, height);
        
        shapes.forEach(shape => {
            ctx.fillStyle = shape.color;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            
            if (shape.type === 'circle' || shape.type === 'square') {
                const radius = shape.boundingBox.width / 2;
                ctx.beginPath();
                ctx.arc(shape.center.x, shape.center.y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (shape.type === 'rectangle') {
                ctx.fillRect(
                    shape.boundingBox.x, 
                    shape.boundingBox.y, 
                    shape.boundingBox.width, 
                    shape.boundingBox.height
                );
                ctx.strokeRect(
                    shape.boundingBox.x, 
                    shape.boundingBox.y, 
                    shape.boundingBox.width, 
                    shape.boundingBox.height
                );
            } else if (shape.type === 'triangle' && shape.points.length >= 3) {
                ctx.beginPath();
                ctx.moveTo(shape.points[0][0], shape.points[0][1]);
                ctx.lineTo(shape.points[1][0], shape.points[1][1]);
                ctx.lineTo(shape.points[2][0], shape.points[2][1]);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else {
                // Draw the contour for unknown shapes
                ctx.beginPath();
                ctx.moveTo(shape.points[0][0], shape.points[0][1]);
                for (let i = 1; i < shape.points.length; i++) {
                    ctx.lineTo(shape.points[i][0], shape.points[i][1]);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            
            // Draw center point
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(shape.center.x, shape.center.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    function displayShapeResults(shapes) {
        shapes.forEach((shape, i) => {
            const shapeInfo = document.createElement('div');
            shapeInfo.className = 'shape-info';
            shapeInfo.textContent = `Shape ${i + 1}: ${shape.type} at (${Math.round(shape.center.x)}, ${Math.round(shape.center.y)})`;
            shapeInfo.style.color = shape.color.replace('0.5)', '1)');
            resultsDiv.appendChild(shapeInfo);
        });
    }
});