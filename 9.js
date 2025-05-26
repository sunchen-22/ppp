const cube = document.getElementById('cube');
const xAxis = document.getElementById('xAxis');
const yAxis = document.getElementById('yAxis');
const zAxis = document.getElementById('zAxis');

function updateCube() {
    cube.style.transform = `
        rotateX(${xAxis.value}deg) 
        rotateY(${yAxis.value}deg) 
        rotateZ(${zAxis.value}deg)
    `;
}

xAxis.addEventListener('input', updateCube);
yAxis.addEventListener('input', updateCube);
zAxis.addEventListener('input', updateCube);

updateCube();