/**
 * 时间轴动态功能
 */

// 从blogs.json获取并解析动态数据
async function fetchDailyData() {
    try {
        const response = await fetch('/config/blogs.json');
        const data = await response.json();
        const dailyFiles = data.daily || [];
        
        const dailyItems = [];
        for (const filePath of dailyFiles) {
            try {
                const response = await fetch(`/article/daily/${filePath}`);
                const content = await response.text();
                const regex = /<div style="display:none;" class="author">([^<]*(?:<(?!\/div>)[^<]*)*)<\/div>([\s\S]*)/i;
                const match = content.match(regex);
                
                if (match && match[1] && match[2]) {
                    try {
                        const metadataStr = match[1].trim().replace(/,\s*[\n\s]*}/g, '}');
                        const metadata = JSON.parse(metadataStr);
                        const textContent = match[2].trim() || metadata.description || '';
                        
                        dailyItems.push({
                            date: metadata.date,
                            content: textContent,
                            hashtags: metadata.hashtag ? (Array.isArray(metadata.hashtag) ? metadata.hashtag : [metadata.hashtag]) : [],
                            weather: metadata.weather,
                            pictures: metadata.picture ? (Array.isArray(metadata.picture) ? metadata.picture : [metadata.picture]) : [],
                            videos: metadata.video ? (Array.isArray(metadata.video) ? metadata.video : [metadata.video]) : []
                        });
                    } catch (jsonError) {
                        console.error(`JSON解析错误 ${filePath}:`, jsonError);
                    }
                }
            } catch (err) {
                console.error(`Error processing file ${filePath}:`, err);
            }
        }
        
        return dailyItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('Error fetching daily data:', error);
        return [];
    }
}

// 格式化日期为中文显示格式
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year} 年 ${month} 月 ${day} 日 `;
}

// 创建单个动态项的DOM元素
function createDailyItem(item, index) {
    const date = formatDate(item.date);
    
    const itemElement = document.createElement('div');
    itemElement.className = 'relative mb-16 timeline-item';
    itemElement.dataset.index = index;
    
    const dot = document.createElement('div');
    dot.className = 'timeline-dot';
    itemElement.appendChild(dot);
    
    const content = document.createElement('div');
    content.className = 'ml-16 bg-white rounded-md p-6 shadow-lg timeline-item-content';
    
    const dateElement = document.createElement('div');
    dateElement.className = 'flex items-center mb-3';
    let dateHtml = `<div class="text-sm text-gray-500">${date}`;
    if (item.weather) {
        dateHtml += `<img class="weather" src="/res/media/svg/weather/${item.weather}.svg" alt="${item.weather}">`;
    }
    dateHtml += `</div>`;
    dateElement.innerHTML = dateHtml;
    content.appendChild(dateElement);
    
    const paragraph = document.createElement('p');
    paragraph.className = 'text-gray-500 mb-4';
    paragraph.innerHTML = item.content.replace(/\n/g, '<br>');
    content.appendChild(paragraph);
    
    if (item.pictures && item.pictures.length > 0) {
        const picturesContainer = document.createElement('div');
        picturesContainer.className = 'pictures-grid mb-4';
        
        item.pictures.forEach(picUrl => {
            const pictureWrapper = document.createElement('div');
            pictureWrapper.className = 'picture-wrapper';
            
            const picture = document.createElement('img');
            picture.src = picUrl;
            picture.alt = 'Timeline Image';
            picture.className = 'timeline-image';
            picture.referrerPolicy = 'no-referrer';
            picture.crossOrigin = 'anonymous';
            picture.onerror = function() {
                this.src = '/res/media/svg/image-error.svg';
                this.onerror = null;
            };
            
            pictureWrapper.appendChild(picture);
            picturesContainer.appendChild(pictureWrapper);
        });
        
        content.appendChild(picturesContainer);
    }

    if (item.videos && item.videos.length > 0) {
        const videosContainer = document.createElement('div');
        videosContainer.className = 'videos-grid mb-4';
        
        item.videos.forEach(videoUrl => {
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            videoElement.controls = true;
            videoElement.preload = 'metadata';
            videoElement.className = 'timeline-video';
            videoElement.style.maxWidth = '100%';
            videoElement.style.height = 'auto';
            
            videosContainer.appendChild(videoElement);
        });
        
        content.appendChild(videosContainer);
    }

    if (item.hashtags && item.hashtags.length > 0) {
        const hashtagsContainer = document.createElement('div');
        hashtagsContainer.className = 'flex flex-wrap';
        
        item.hashtags.forEach(hashtag => {
            const hashtagElement = document.createElement('div');
            hashtagElement.className = 'hashtag';
            hashtagElement.textContent = `# ${hashtag} #`;
            hashtagsContainer.appendChild(hashtagElement);
        });
        
        content.appendChild(hashtagsContainer);
    }
    
    itemElement.appendChild(content);
    return itemElement;
}

// 初始化时间轴并添加动画效果
async function initTimeline() {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;
    
    timelineContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
    
    const dailyItems = await fetchDailyData();
    timelineContainer.innerHTML = '';
    
    const timelineLine = document.createElement('div');
    timelineLine.className = 'timeline-line';
    timelineContainer.appendChild(timelineLine);
    
    if (dailyItems.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center py-16';
        emptyMessage.innerHTML = `
            <div style="color: #888; font-size: 1.2rem; margin-bottom: 10px;">
                📭
            </div>
            <div style="color: #667eea; font-size: 1.1rem;">
                暂无动态内容
            </div>
            <div style="color: #666; font-size: 0.9rem; margin-top: 8px;">
                期待你的第一条碎碎念～
            </div>
        `;
        timelineContainer.appendChild(emptyMessage);
        return;
    }
    
    dailyItems.forEach((item, index) => {
        const dailyItem = createDailyItem(item, index);
        timelineContainer.appendChild(dailyItem);
    });
    
    // 使用 Intersection Observer 实现滚动动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    setTimeout(() => {
        document.querySelectorAll('.timeline-item').forEach((item) => {
            observer.observe(item);
        });
    }, 200);
}

// 图片放大和视频播放功能
const initMediaViewer = () => {
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.style.display = 'none';
  
  const modalImg = document.createElement('img');
  modalImg.className = 'modal-image';
  modalImg.crossOrigin = 'anonymous';
  modalImg.referrerPolicy = 'no-referrer';
  modalImg.onerror = function() {
    this.src = '/res/media/svg/sys/image-error.svg';
    this.onerror = null;
  };
  
  const closeBtn = document.createElement('div');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '×';
  
  modal.appendChild(modalImg);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);

  const showImage = (src) => {
    modalImg.classList.remove('active');
    modal.style.display = 'flex';
    modalImg.src = src;
    requestAnimationFrame(() => {
      modalImg.classList.add('active');
    });
  };

  const closeModal = () => {
    modalImg.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
      modalImg.src = '';
    }, 300);
  };

  const handleImageClick = (e) => {
    if (e.target.classList.contains('timeline-image')) {
      const originalSrc = e.target.src;
      showImage(originalSrc);
    }
  };

  document.addEventListener('click', handleImageClick);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
};

// 初始化时调用
window.addEventListener('DOMContentLoaded', initMediaViewer);
document.addEventListener('DOMContentLoaded', initTimeline);