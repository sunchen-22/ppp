document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const toggleBtn = document.getElementById('toggleInterpolation');
    const clearBtn = document.getElementById('clearCanvas');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 500;
    
    let points = [];
    let isInterpolationOn = false;
    
    // Event listeners
    canvas.addEventListener('click', handleCanvasClick);
    toggleBtn.addEventListener('click', toggleInterpolation);
    clearBtn.addEventListener('click', clearCanvas);
    
    function handleCanvasClick(e) {
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Add new point
        points.push({x, y});
        
        // Redraw everything
        redrawCanvas();
    }
    
    function toggleInterpolation() {
        isInterpolationOn = !isInterpolationOn;
        toggleBtn.textContent = `Toggle Interpolation (${isInterpolationOn ? 'On' : 'Off'})`;
        redrawCanvas();
    }
    
    function clearCanvas() {
        points = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (points.length === 0) return;
        
        // Draw points
        ctx.fillStyle = 'red';
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw broken line
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        
        // Draw spline if interpolation is on and we have enough points
        if (isInterpolationOn && points.length >= 2) {
            drawSpline();
        }
    }
    
    function drawSpline() {
        // Catmull-Rom spline implementation
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        // Draw first segment
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = i === 0 ? points[0] : points[i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2];
            
            // Draw curve between p1 and p2
            for (let t = 0; t <= 1; t += 0.05) {
                const x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
                const y = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
    
    function catmullRom(p0, p1, p2, p3, t) {
        // Catmull-Rom spline calculation
        const t2 = t * t;
        const t3 = t2 * t;
        
        return 0.5 * (
            (2 * p1) +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
    }
});