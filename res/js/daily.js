/**
 * 时间轴动态功能
 */

// 从blogs.json获取动态数据
async function fetchDailyData() {
    try {
        const response = await fetch('/config/blogs.json');
        const data = await response.json();
        const dailyFiles = data.daily || [];
        
        const dailyItems = [];
        for (const filePath of dailyFiles) {
            try {
                const response = await fetch(`/daily/${filePath}`);
                const content = await response.text();
                // 使用更健壮的正则表达式匹配 <div> 标签内容，参考blog_msg.js的实现
                const regex = /<div style="display:none;" class="author">([^<]*(?:<(?!\/div>)[^<]*)*)<\/div>([\s\S]*)/i;
                const match = content.match(regex);
                console.log('匹配结果:', match);
                if (match && match[1] && match[2]) {
                    try {
                        // 尝试修复JSON中的尾随逗号问题
                        let metadataStr = match[1].trim();
                        metadataStr = metadataStr.replace(/,\s*}/g, '}');
                        metadataStr = metadataStr.replace(/,\s*\n\s*}/g, '}');
                        console.log('处理后的元数据:', metadataStr);
                        const metadata = JSON.parse(metadataStr);
                        let textContent = match[2].trim();
                        if (textContent.length === 0) {
                            textContent = metadata.description || '';
                        }
                        dailyItems.push({
                            date: metadata.date,
                            content: textContent,
                            hashtags: metadata.hashtag ? (Array.isArray(metadata.hashtag) ? metadata.hashtag : [metadata.hashtag]) : [],
                            weather: metadata.weather
                        });
                    } catch (jsonError) {
                        console.error(`JSON解析错误 ${filePath}:`, jsonError, '原始数据:', match[1]);
                    }
                }
            } catch (err) {
                console.error(`Error processing file ${filePath}:`, err);
            }
        }
        
        // 按时间倒序排序
        return dailyItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('Error fetching daily data:', error);
        return [];
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year} 年 ${month} 月 ${day} 日 ${hours}:${minutes}`;
}

// 创建单个动态项
function createDailyItem(item, index) {
    const date = formatDate(item.date);
    
    // 创建容器
    const itemElement = document.createElement('div');
    itemElement.className = 'relative mb-16 timeline-item';
    itemElement.dataset.index = index;
    
    // 创建时间轴点
    const dot = document.createElement('div');
    dot.className = 'timeline-dot';
    itemElement.appendChild(dot);
    
    // 创建内容容器
    const content = document.createElement('div');
    content.className = 'ml-16 bg-white rounded-md p-6 shadow-lg timeline-item-content';
    
    // 添加日期和天气
    const dateElement = document.createElement('div');
    dateElement.className = 'flex items-center mb-3';
    let dateHtml = `<div class="text-sm text-gray-500">${date}`;
    if (item.weather) {
        dateHtml += `<img class="weather" src="/res/media/svg/weather/${item.weather}.svg" alt="${item.weather}">`;
    }
    dateHtml += `</div>`;
    dateElement.innerHTML = dateHtml;
    content.appendChild(dateElement);
    
    // 添加文本内容
    const paragraph = document.createElement('p');
    paragraph.className = 'text-gray-500 mb-4';
    // 将换行符转换为HTML的<br>标签
    paragraph.innerHTML = item.content.replace(/\n/g, '<br>');
    content.appendChild(paragraph);
    
    // 添加标签
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

// 初始化时间轴
async function initTimeline() {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;
    
    // 显示加载动画
    timelineContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
    
    // 获取数据
    const dailyItems = await fetchDailyData();
    
    // 清空容器
    timelineContainer.innerHTML = '';
    
    // 添加时间轴线
    const timelineLine = document.createElement('div');
    timelineLine.className = 'timeline-line';
    timelineContainer.appendChild(timelineLine);
    
    if (dailyItems.length === 0) {
        // 没有数据时显示提示
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center text-white py-8';
        emptyMessage.textContent = '暂无动态内容';
        timelineContainer.appendChild(emptyMessage);
        return;
    }
    
    // 添加所有动态项
    dailyItems.forEach((item, index) => {
        const dailyItem = createDailyItem(item, index);
        timelineContainer.appendChild(dailyItem);
    });
    
    // 添加动画效果
    setTimeout(() => {
        document.querySelectorAll('.timeline-item').forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('visible');
            }, index * 100);
        });
    }, 100);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initTimeline);