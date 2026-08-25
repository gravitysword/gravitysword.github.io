/**
 * 时间轴动态功能
 */

import { backend } from '/res/js/blog_msg.js';
import { initImageViewer } from '/res/js/extend/image_viewer.js';

const UUID4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUUID4(filename) {
    return UUID4_PATTERN.test(filename);
}

let backendConfig = null;
async function getBackendConfig() {
    if (!backendConfig) {
        backendConfig = await backend();
    }
    return backendConfig;
}

// 全局配置和状态
let dailyFilePaths = []; // 所有daily文件路径
let loadedItems = []; // 已加载的动态内容
let currentPage = 1;
let itemsPerPage = 5;
let totalPages = 1;
let isLoading = false;

/**
 * 从blogs.json获取daily文件路径列表
 * @returns {Promise<Array>} 文件路径数组
 */
async function fetchDailyFilePaths() {
    try {
        const response = await fetch('/config/blogs.json');
        const data = await response.json();
        return data.daily || [];
    } catch (error) {
        console.error('Error fetching daily file paths:', error);
        return [];
    }
}

/**
 * 加载指定范围的daily数据
 * @param {number} page - 当前页码
 * @returns {Promise<Array>} 加载的动态内容数组
 */
async function loadDailyPage(page) {
    if (isLoading) return [];
    
    isLoading = true;
    
    try {
        // 如果是第一次加载，先获取所有文件路径
        if (dailyFilePaths.length === 0) {
            dailyFilePaths = await fetchDailyFilePaths();
            totalPages = Math.ceil(dailyFilePaths.length / itemsPerPage);
        }
        
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, dailyFilePaths.length);
        const pageFilePaths = dailyFilePaths.slice(startIndex, endIndex);
        
        // 并行加载当前页的所有文件
        const pageItems = await Promise.all(
            pageFilePaths.map(async (filePath) => {
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
                            
                            // 处理数组类型的字段
                            const processArrayField = (field) => 
                                field ? (Array.isArray(field) ? field : [field]) : [];
                            
                            return {
                                date: metadata.date,
                                content: textContent,
                                hashtags: processArrayField(metadata.hashtag),
                                weather: metadata.weather,
                                pictures: processArrayField(metadata.picture),
                                videos: processArrayField(metadata.video)
                            };
                        } catch (jsonError) {
                            console.error(`JSON解析错误 ${filePath}:`, jsonError);
                            return null;
                        }
                    }
                    return null;
                } catch (err) {
                    console.error(`Error processing file ${filePath}:`, err);
                    return null;
                }
            })
        );
        
        // 过滤掉null值并按日期排序
        const validItems = pageItems.filter(item => item !== null);
        
        // 将新加载的项目添加到已加载项目数组
        loadedItems = [...loadedItems, ...validItems];
        
        return validItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('Error loading daily page data:', error);
        return [];
    } finally {
        isLoading = false;
    }
}

/**
 * 格式化日期为中文显示格式
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year} 年 ${month} 月 ${day} 日 `;
}

/**
 * 创建单个动态项的DOM元素
 * @param {Object} item - 动态内容项
 * @param {number} index - 索引
 * @returns {HTMLElement} DOM元素
 */
function createDailyItem(item, index) {
    const date = formatDate(item.date);
    
    const itemElement = document.createElement('div');
    itemElement.className = 'timeline-item';
    itemElement.dataset.index = index;
    
    const dot = document.createElement('div');
    dot.className = 'timeline-dot';
    itemElement.appendChild(dot);
    
    const content = document.createElement('div');
    content.className = 'timeline-item-content';
    
    // 日期和天气
    const dateElement = document.createElement('div');
    let dateHtml = `<div>${date}`;
    if (item.weather) {
        dateHtml += `<img class="weather" src="/res/media/svg/weather/${item.weather}.svg" alt="${item.weather}">`;
    }
    dateHtml += `</div>`;
    dateElement.innerHTML = dateHtml;
    content.appendChild(dateElement);
    
    // 内容
    const paragraph = document.createElement('p');
    paragraph.innerHTML = item.content.replace(/\n/g, '<br>');
    content.appendChild(paragraph);
    
    // 图片
    if (item.pictures && item.pictures.length > 0) {
        const picturesContainer = document.createElement('div');
        picturesContainer.className = 'pictures-grid';
        
        item.pictures.forEach(async (picUrl) => {
            const pictureWrapper = document.createElement('div');
            pictureWrapper.className = 'picture-wrapper';
            
            const picture = document.createElement('img');
            picture.alt = 'Timeline Image';
            picture.className = 'timeline-image';
            
            if (isUUID4(picUrl)) {
                try {
                    const config = await getBackendConfig();
                    if (config && config.fileApi) {
                        const previewUrl = `${config.fileApi}/${picUrl}/thumbnail`;
                        const originalUrl = `${config.fileApi}/${picUrl}/content`;
                        
                        picture.src = previewUrl;
                        picture.setAttribute('data-original-src', originalUrl);
                        picture.classList.add('loaded');
                    }
                } catch (error) {
                    console.error('处理图片时出错:', error);
                    picture.src = '/res/media/svg/sys/image-error.svg';
                }
            } else {
                const lazyLoadImg = new Image();
                lazyLoadImg.onload = () => {
                    picture.src = lazyLoadImg.src;
                    picture.classList.add('loaded');
                };
                lazyLoadImg.src = picUrl;
            }
            
            picture.onerror = function() {
                this.src = '/res/media/svg/sys/image-error.svg';
                this.onerror = null;
            };
            
            pictureWrapper.appendChild(picture);
            picturesContainer.appendChild(pictureWrapper);
        });
        
        content.appendChild(picturesContainer);
    }

    // 视频
    if (item.videos && item.videos.length > 0) {
        const videosContainer = document.createElement('div');
        videosContainer.className = 'videos-grid';
        
        item.videos.forEach(videoUrl => {
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            videoElement.controls = true;
            videoElement.preload = 'metadata'; // 仅预加载元数据以提高性能
            videoElement.className = 'timeline-video';
            videoElement.style.maxWidth = '100%';
            videoElement.style.height = 'auto';
            
            videosContainer.appendChild(videoElement);
        });
        
        content.appendChild(videosContainer);
    }

    // 标签
    if (item.hashtags && item.hashtags.length > 0) {
        const hashtagsContainer = document.createElement('div');
        
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

/**
 * 创建加载更多按钮
 * @param {HTMLElement} container - 容器元素
 */
function createLoadMoreButton(container) {
    // 移除已有的加载更多按钮和容器
    const existingButton = document.querySelector('.load-more-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // 只有当还有更多页面时才创建加载更多按钮
    if (currentPage < totalPages) {
        const button = document.createElement('button');
        button.className = 'load-more-button';
        button.textContent = '加载更多动态';
        button.onclick = loadNextPage;
        container.appendChild(button);
    }
}

/**
 * 加载下一页数据
 */
async function loadNextPage() {
    if (currentPage >= totalPages || isLoading) return;
    
    const timelineContainer = document.getElementById('timeline-container');
    const loadMoreButton = document.querySelector('.load-more-button');
    
    // 显示加载状态
    if (loadMoreButton) {
        loadMoreButton.innerHTML = '<div class="loading-spinner-small"></div> 加载中...';
        loadMoreButton.disabled = true;
    }
    
    currentPage++;
    const newItems = await loadDailyPage(currentPage);
    
    // 添加新内容到时间轴
    newItems.forEach((item, index) => {
        const dailyItem = createDailyItem(item, loadedItems.length - newItems.length + index);
        timelineContainer.appendChild(dailyItem);
    });
    
    // 更新加载更多按钮状态
    if (loadMoreButton) {
        loadMoreButton.remove();
    }
    
    // 创建新的加载更多按钮
    createLoadMoreButton(timelineContainer);
    
    // 重新启动Intersection Observer以观察新添加的元素
    setupIntersectionObserver();
}

/**
 * 设置Intersection Observer以实现滚动动画
 */
function setupIntersectionObserver() {
    // 使用Intersection Observer实现滚动动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // 观察所有未显示的时间轴项
    document.querySelectorAll('.timeline-item:not(.visible)').forEach((item) => {
        observer.observe(item);
    });
}

/**
 * 初始化时间轴并添加动画效果
 */
async function initTimeline() {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;
    
    // 显示加载指示器
    timelineContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
    
    // 加载第一页数据（loadDailyPage 内部会初始化文件路径并计算总页数）
    const initialItems = await loadDailyPage(1);
    
    timelineContainer.innerHTML = '';
    
    const timelineLine = document.createElement('div');
    timelineLine.className = 'timeline-line';
    timelineContainer.appendChild(timelineLine);
    
    if (initialItems.length === 0 && dailyFilePaths.length === 0) {
        const emptyMessage = document.createElement('div');
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
    
    // 添加第一页内容
    initialItems.forEach((item, index) => {
        const dailyItem = createDailyItem(item, index);
        timelineContainer.appendChild(dailyItem);
    });
    
    // 创建加载更多按钮
    createLoadMoreButton(timelineContainer);
    
    // 设置滚动动画
    setTimeout(() => setupIntersectionObserver(), 200);
}

/**
 * 图片放大功能（实现见共享模块 extend/image_viewer.js）
 */
initImageViewer({
  shouldOpen: (img) => img.classList.contains('timeline-image') && img.classList.contains('loaded'),
});

// 初始化时调用
document.addEventListener('DOMContentLoaded', initTimeline);