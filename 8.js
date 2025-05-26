document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const originalCanvas = document.getElementById('originalCanvas');
    const resultCanvas = document.getElementById('resultCanvas');
    const originalCtx = originalCanvas.getContext('2d');
    const resultCtx = resultCanvas.getContext('2d');
    const imageUpload = document.getElementById('imageUpload');
    const transformBtn = document.getElementById('transformBtn');
    const resetBtn = document.getElementById('resetBtn');
    const originalContainer = document.getElementById('originalContainer');
    const resultContainer = document.getElementById('resultContainer');

    // State variables
    let originalImage = null;
    let originalPoints = [];
    let resultPoints = [];
    let pointMarkers = [];
    let isSelectingOriginal = true;

    // Event listeners
    imageUpload.addEventListener('change', handleImageUpload);
    transformBtn.addEventListener('click', transformImage);
    resetBtn.addEventListener('click', resetAll);
    originalCanvas.addEventListener('click', handleCanvasClick);
    resultCanvas.addEventListener('click', handleCanvasClick);

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            originalImage = new Image();
            originalImage.onload = function() {
                setupCanvases();
                transformBtn.disabled = false;
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function setupCanvases() {
        // Set original canvas size
        originalCanvas.width = Math.min(originalImage.width, 600);
        originalCanvas.height = (originalImage.height / originalImage.width) * originalCanvas.width;
        originalCtx.drawImage(originalImage, 0, 0, originalCanvas.width, originalCanvas.height);

        // Set result canvas to same size initially
        resultCanvas.width = originalCanvas.width;
        resultCanvas.height = originalCanvas.height;
        resultCtx.fillStyle = '#f0f0f0';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
    }

    function handleCanvasClick(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this === originalCanvas && originalPoints.length < 3) {
            // Add point to original image
            originalPoints.push({ x, y });
            addPointMarker(originalContainer, x, y, 'original');
            
            if (originalPoints.length === 3) {
                isSelectingOriginal = false;
            }
        } else if (this === resultCanvas && resultPoints.length < 3 && !isSelectingOriginal) {
            // Add point to result canvas
            resultPoints.push({ x, y });
            addPointMarker(resultContainer, x, y, 'result');
        }
    }

    function addPointMarker(container, x, y, type) {
        // Create marker
        const marker = document.createElement('div');
        marker.className = type === 'original' ? 'point-marker' : 'point-marker result-point-marker';
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        
        // Create label
        const label = document.createElement('div');
        label.className = type === 'original' ? 'point-label' : 'point-label result-point-label';
        label.style.left = `${x}px`;
        label.style.top = `${y}px`;
        label.textContent = type === 'original' ? originalPoints.length : resultPoints.length;
        
        // Add to DOM
        container.appendChild(marker);
        container.appendChild(label);
        
        // Store reference for removal
        pointMarkers.push({ marker, label });
    }

    function transformImage() {
        if (originalPoints.length !== 3 || resultPoints.length !== 3 || !originalImage) {
            alert('Please select 3 points on both images');
            return;
        }

        // Calculate transformation matrix
        const matrix = calculateTransformationMatrix(originalPoints, resultPoints);
        
        // Determine if we're enlarging or reducing
        const originalArea = calculateTriangleArea(originalPoints);
        const resultArea = calculateTriangleArea(resultPoints);
        const isEnlarging = resultArea > originalArea;
        
        // Apply transformation
        applyTransformation(matrix, isEnlarging);
    }

    function calculateTransformationMatrix(srcPoints, dstPoints) {
        // Create matrices for the equation system
        const A = [
            [srcPoints[0].x, srcPoints[0].y, 1, 0, 0, 0],
            [0, 0, 0, srcPoints[0].x, srcPoints[0].y, 1],
            [srcPoints[1].x, srcPoints[1].y, 1, 0, 0, 0],
            [0, 0, 0, srcPoints[1].x, srcPoints[1].y, 1],
            [srcPoints[2].x, srcPoints[2].y, 1, 0, 0, 0],
            [0, 0, 0, srcPoints[2].x, srcPoints[2].y, 1]
        ];
        
        const B = [
            dstPoints[0].x,
            dstPoints[0].y,
            dstPoints[1].x,
            dstPoints[1].y,
            dstPoints[2].x,
            dstPoints[2].y
        ];
        
        // Solve the system A * X = B for X
        const X = solveLinearSystem(A, B);
        
        // Return the transformation matrix
        return [
            [X[0], X[1], X[2]],
            [X[3], X[4], X[5]],
            [0, 0, 1]
        ];
    }

    function solveLinearSystem(A, B) {
        // Simple Gaussian elimination for 6x6 system
        const n = 6;
        
        // Create augmented matrix
        let augmented = [];
        for (let i = 0; i < n; i++) {
            augmented.push([...A[i], B[i]]);
        }
        
        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find the row with maximum element in current column
            let maxRow = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = j;
                }
            }
            
            // Swap rows
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            
            // Make all rows below this one 0 in current column
            for (let j = i + 1; j < n; j++) {
                const factor = augmented[j][i] / augmented[i][i];
                for (let k = i; k < n + 1; k++) {
                    augmented[j][k] -= factor * augmented[i][k];
                }
            }
        }
        
        // Back substitution
        const X = new Array(n);
        for (let i = n - 1; i >= 0; i--) {
            X[i] = augmented[i][n] / augmented[i][i];
            for (let j = i - 1; j >= 0; j--) {
                augmented[j][n] -= augmented[j][i] * X[i];
            }
        }
        
        return X;
    }

    function applyTransformation(matrix, isEnlarging) {
        const width = resultCanvas.width;
        const height = resultCanvas.height;
        
        // Create temporary canvas for the result
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        const imageData = tempCtx.createImageData(width, height);
        
        // Get original image data
        originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
        originalCtx.drawImage(originalImage, 0, 0, originalCanvas.width, originalCanvas.height);
        const originalData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height).data;
        
        // Inverse matrix to map from destination to source
        const invMatrix = invertMatrix(matrix);
        
        // Transform each pixel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Apply inverse transformation to get source coordinates
                const srcX = invMatrix[0][0] * x + invMatrix[0][1] * y + invMatrix[0][2];
                const srcY = invMatrix[1][0] * x + invMatrix[1][1] * y + invMatrix[1][2];
                
                let r, g, b, a;
                
                if (isEnlarging) {
                    // Bilinear interpolation for enlargement
                    [r, g, b, a] = bilinearInterpolation(srcX, srcY, originalData, originalCanvas.width, originalCanvas.height);
                } else {
                    // Trilinear interpolation (simplified) for reduction
                    [r, g, b, a] = trilinearInterpolation(srcX, srcY, originalData, originalCanvas.width, originalCanvas.height);
                }
                
                // Set pixel in result
                const idx = (y * width + x) * 4;
                imageData.data[idx] = r;
                imageData.data[idx + 1] = g;
                imageData.data[idx + 2] = b;
                imageData.data[idx + 3] = a;
            }
        }
        
        // Put the result on the canvas
        tempCtx.putImageData(imageData, 0, 0);
        resultCtx.clearRect(0, 0, width, height);
        resultCtx.drawImage(tempCanvas, 0, 0);
    }

    function bilinearInterpolation(x, y, srcData, width, height) {
        const x1 = Math.floor(x);
        const y1 = Math.floor(y);
        const x2 = Math.min(x1 + 1, width - 1);
        const y2 = Math.min(y1 + 1, height - 1);
        
        // Check if coordinates are out of bounds
        if (x1 < 0 || y1 < 0 || x1 >= width || y1 >= height) {
            return [0, 0, 0, 0]; // Transparent black
        }
        
        // Get the four neighboring pixels
        const idx11 = (y1 * width + x1) * 4;
        const idx12 = (y1 * width + x2) * 4;
        const idx21 = (y2 * width + x1) * 4;
        const idx22 = (y2 * width + x2) * 4;
        
        // Calculate weights
        const wx = x - x1;
        const wy = y - y1;
        
        // Interpolate each channel
        const r = Math.round(
            (1 - wx) * (1 - wy) * srcData[idx11] +
            wx * (1 - wy) * srcData[idx12] +
            (1 - wx) * wy * srcData[idx21] +
            wx * wy * srcData[idx22]
        );
        
        const g = Math.round(
            (1 - wx) * (1 - wy) * srcData[idx11 + 1] +
            wx * (1 - wy) * srcData[idx12 + 1] +
            (1 - wx) * wy * srcData[idx21 + 1] +
            wx * wy * srcData[idx22 + 1]
        );
        
        const b = Math.round(
            (1 - wx) * (1 - wy) * srcData[idx11 + 2] +
            wx * (1 - wy) * srcData[idx12 + 2] +
            (1 - wx) * wy * srcData[idx21 + 2] +
            wx * wy * srcData[idx22 + 2]
        );
        
        const a = Math.round(
            (1 - wx) * (1 - wy) * srcData[idx11 + 3] +
            wx * (1 - wy) * srcData[idx12 + 3] +
            (1 - wx) * wy * srcData[idx21 + 3] +
            wx * wy * srcData[idx22 + 3]
        );
        
        return [r, g, b, a];
    }

    function trilinearInterpolation(x, y, srcData, width, height) {
        // Simplified version (actual trilinear would use mipmaps)
        // Here we'll just use area averaging as an approximation
        
        const scale = 0.5; // Scaling factor for area sampling
        const radius = 1;
        
        
        let r = 0, g = 0, b = 0, a = 0;
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const srcX = Math.round(x + dx * scale);
                const srcY = Math.round(y + dy * scale);
                
                if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                    const idx = (srcY * width + srcX) * 4;
                    r += srcData[idx];
                    g += srcData[idx + 1];
                    b += srcData[idx + 2];
                    a += srcData[idx + 3];
                    count++;
                }
            }
        }
        
        if (count > 0) {
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            a = Math.round(a / count);
        }
        
        return [r, g, b, a];
    }

    function invertMatrix(matrix) {
        // Invert 2D affine transformation matrix
        const a = matrix[0][0], b = matrix[0][1], c = matrix[0][2];
        const d = matrix[1][0], e = matrix[1][1], f = matrix[1][2];
        
        const det = a * e - b * d;
        
        return [
            [e / det, -b / det, (b * f - c * e) / det],
            [-d / det, a / det, (c * d - a * f) / det],
            [0, 0, 1]
        ];
    }

    function calculateTriangleArea(points) {
        // Using the shoelace formula
        const [p1, p2, p3] = points;
        return Math.abs(
            (p1.x * (p2.y - p3.y) + 
             p2.x * (p3.y - p1.y) + 
             p3.x * (p1.y - p2.y)) / 2
        );
    }

    function resetAll() {
        // Reset state
        originalPoints = [];
        resultPoints = [];
        isSelectingOriginal = true;
        
        // Clear canvases
        originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
        resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
        
        // Redraw original image if it exists
        if (originalImage) {
            originalCtx.drawImage(originalImage, 0, 0, originalCanvas.width, originalCanvas.height);
        } else {
            resultCtx.fillStyle = '#f0f0f0';
            resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
        }
        
        // Remove markers
        pointMarkers.forEach(marker => {
            if (marker.marker.parentNode) marker.marker.parentNode.removeChild(marker.marker);
            if (marker.label.parentNode) marker.label.parentNode.removeChild(marker.label);
        });
        pointMarkers = [];
        
        // Reset button state
        transformBtn.disabled = !originalImage;
    }
});