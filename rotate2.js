// DOM 元素
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const uploadContainer = document.getElementById('upload-container');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const imagePreview = document.getElementById('image-preview');
const previewImage = document.getElementById('preview-image');
const changeImageButton = document.getElementById('change-image');
const downloadContainer = document.getElementById('download-container');
const downloadButton = document.getElementById('download-button');
const resetButton = document.getElementById('reset-button');
const resultContainer = document.getElementById('result-container');
const noImagePlaceholder = document.getElementById('no-image-placeholder');
const resultImageContainer = document.getElementById('result-image-container');
const resultImage = document.getElementById('result-image');
const currentFilterName = document.getElementById('current-filter-name');
const filterOptions = document.querySelectorAll('.filter-option');

// 当前选择的滤镜
let currentFilter = 'none';
let originalImageUrl = null;

// 点击上传按钮
uploadButton.addEventListener('click', () => {
    fileInput.click();
});

// 点击更换图片按钮
changeImageButton.addEventListener('click', () => {
    fileInput.click();
});

// 拖放功能
uploadContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadContainer.classList.add('border-primary');
    uploadContainer.classList.add('bg-primary/5');
});

uploadContainer.addEventListener('dragleave', () => {
    uploadContainer.classList.remove('border-primary');
    uploadContainer.classList.remove('bg-primary/5');
});

uploadContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadContainer.classList.remove('border-primary');
    uploadContainer.classList.remove('bg-primary/5');
    
    if (e.dataTransfer.files.length) {
        handleImageUpload(e.dataTransfer.files[0]);
    }
});

// 文件选择
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleImageUpload(e.target.files[0]);
    }
});

// 处理图片上传
function handleImageUpload(file) {
    // 检查文件类型
    if (!file.type.match('image.*')) {
        showNotification('请选择图片文件！', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const imageUrl = e.target.result;
        
        // 保存原始图片URL
        originalImageUrl = imageUrl;
        
        // 更新预览图
        previewImage.src = imageUrl;
        resultImage.src = imageUrl;
        
        // 显示预览，隐藏上传提示
        uploadPlaceholder.classList.add('hidden');
        imagePreview.classList.remove('hidden');
        noImagePlaceholder.classList.add('hidden');
        resultImageContainer.classList.remove('hidden');
        downloadContainer.classList.remove('hidden');
        
        // 应用当前滤镜
        applyFilter(currentFilter);
        
        // 显示成功通知
        showNotification('图片上传成功！', 'success');
    };
    
    reader.onerror = () => {
        showNotification('读取图片时发生错误！', 'error');
    };
    
    reader.readAsDataURL(file);
}

// 应用滤镜
function applyFilter(filter) {
    if (!originalImageUrl) return;
    
    // 更新当前滤镜
    currentFilter = filter;
    
    // 更新UI显示
    filterOptions.forEach(option => {
        if (option.dataset.filter === filter) {
            option.classList.add('border-primary');
            option.classList.add('shadow-md');
        } else {
            option.classList.remove('border-primary');
            option.classList.remove('shadow-md');
        }
    });
    
    // 更新滤镜名称显示
    const filterNames = {
        'none': '原图',
        'grayscale': '黑白',
        'sepia': '复古',
        'invert': '反色',
        'saturate': '高饱和',
        'hue-rotate': '色调旋转',
        'contrast': '高对比度'
    };
    
    currentFilterName.textContent = filterNames[filter] || filter;
    
    // 添加过渡动画
    resultImage.style.transition = 'filter 0.5s ease';
    
    // 应用滤镜到预览图
    resultImage.className = `w-full h-auto max-h-[500px] object-contain filter-${filter}`;
}

// 点击滤镜选项
filterOptions.forEach(option => {
    option.addEventListener('click', () => {
        const filter = option.dataset.filter;
        applyFilter(filter);
        
        // 添加点击动画效果
        option.classList.add('scale-up');
        setTimeout(() => {
            option.classList.remove('scale-up');
        }, 300);
    });
});

// 下载图片
downloadButton.addEventListener('click', () => {
    if (!resultImage.src || resultImage.src.startsWith('data:image/gif;base64')) {
        showNotification('请先上传有效的图片！', 'error');
        return;
    }
    
    // 创建一个临时canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        // 设置canvas尺寸
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 清空canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 应用滤镜到canvas
        switch(currentFilter) {
            case 'grayscale':
                ctx.filter = 'grayscale(100%)';
                break;
            case 'sepia':
                ctx.filter = 'sepia(100%)';
                break;
            case 'invert':
                ctx.filter = 'invert(100%)';
                break;
            case 'saturate':
                ctx.filter = 'saturate(200%)';
                break;
            case 'hue-rotate':
                ctx.filter = 'hue-rotate(90deg)';
                break;
            case 'contrast':
                ctx.filter = 'contrast(150%)';
                break;
            default:
                ctx.filter = 'none';
        }
        
        // 绘制图片
        ctx.drawImage(img, 0, 0);
        
        // 创建下载链接
        try {
            const link = document.createElement('a');
            link.download = `filtered-image-${currentFilter}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            showNotification('图片下载成功！', 'success');
        } catch (error) {
            showNotification('下载图片时发生错误！', 'error');
            console.error('Download error:', error);
        }
    };
    
    img.onerror = () => {
        showNotification('处理图片时发生错误！', 'error');
    };
    
    img.src = resultImage.src;
});

// 重置按钮
resetButton.addEventListener('click', () => {
    if (!originalImageUrl) return;
    
    // 重置滤镜
    applyFilter('none');
    
    // 添加重置动画
    resultImage.classList.add('opacity-0');
    setTimeout(() => {
        resultImage.classList.remove('opacity-0');
    }, 300);
    
    showNotification('已重置滤镜！', 'info');
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-500 translate-x-full`;
    
    // 设置通知类型样式
    switch(type) {
        case 'success':
            notification.classList.add('bg-green-500', 'text-white');
            notification.innerHTML = `<i class="fa-solid fa-check-circle mr-2"></i>${message}`;
            break;
        case 'error':
            notification.classList.add('bg-red-500', 'text-white');
            notification.innerHTML = `<i class="fa-solid fa-exclamation-circle mr-2"></i>${message}`;
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500', 'text-white');
            notification.innerHTML = `<i class="fa-solid fa-exclamation-triangle mr-2"></i>${message}`;
            break;
        default:
            notification.classList.add('bg-blue-500', 'text-white');
            notification.innerHTML = `<i class="fa-solid fa-info-circle mr-2"></i>${message}`;
    }
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // 自动关闭
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// 初始应用默认滤镜
applyFilter('none');
    