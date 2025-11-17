/**
 * 技术栈页面主脚本
 */
import { BLOG_getKnowledgeItems, loadArticleFullContent } from '/res/js/blog_msg.js';

// 初始化全局变量
let knowledgeList = []; // 所有文章的元数据列表
let currentPage = 1;
let itemsPerPage = 5;
let totalPages = 1;
let totalItems = 0;
let isSearchMode = false; // 是否处于搜索模式
let searchResults = []; // 搜索结果列表

/**
 * 知识库文章点击事件
 */
function bindKnowledgeItemEvents() {
    document.querySelectorAll('.blog-list ul li').forEach(item => {
        item.addEventListener('click', () => {
            const subtitle = item.querySelector('.blog-title').textContent;
            // 去除高亮标签
            const cleanSubtitle = subtitle.replace(/<[^>]*>/g, '');
            
            // 在当前列表中查找对应的文章
            const currentList = isSearchMode ? searchResults : knowledgeList;
            const article = currentList.find(a => a.subtitle === cleanSubtitle);
            
            if (article && article.id) {
                window.location.href = `/view/blog.html?id=${article.id}`;
            }
        });
    });
}

/**
 * 加载知识库数据（分页加载）
 * @param {number} page - 当前页码
 * @param {boolean} showLoading - 是否显示加载指示器
 */
async function loadKnowledgeData(page = 1, showLoading = true) {
    try {
        if (showLoading) {
            // 显示加载指示器
            showLoadingIndicator();
        }
        
        // 获取分页数据
        const result = await BLOG_getKnowledgeItems(page, itemsPerPage);
        
        if (result && result.items) {
            if (page === 1) {
                knowledgeList = []; // 清空列表
            }
            
            // 添加当前页的数据到列表
            knowledgeList = [...knowledgeList, ...result.items];
            
            totalItems = result.total;
            totalPages = result.totalPages;
            
            // 如果是第一页，并且有搜索功能，预先加载前几页的完整内容用于搜索
            if (page === 1) {
                // 预加载前10篇文章的完整内容（用于快速搜索）
                const preloadItems = knowledgeList.slice(0, 10);
                await Promise.all(preloadItems.map(item => loadArticleFullContent(item)));
            }
            
            displayKnowledgeItems();
        } else {
            displayErrorMessage('加载失败，请稍后重试');
        }
    } catch (error) {
        console.error('Error loading knowledge data:', error);
        displayErrorMessage('加载失败，请稍后重试');
    } finally {
        if (showLoading) {
            // 隐藏加载指示器
            hideLoadingIndicator();
        }
    }
}

/**
 * 显示加载指示器
 */
function showLoadingIndicator() {
    const listElement = document.querySelector('.blog-list ul');
    listElement.innerHTML = `
        <li class="loading-content">
            <div class="loading-spinner"></div>
            <p>正在加载文章内容...</p>
        </li>
    `;
}

/**
 * 隐藏加载指示器
 */
function hideLoadingIndicator() {
    const loadingElement = document.querySelector('.loading-content');
    if (loadingElement) {
        loadingElement.remove();
    }
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
function displayErrorMessage(message) {
    const listElement = document.querySelector('.blog-list ul');
    listElement.innerHTML = `
        <li class="error-content">
            <p>${message}</p>
        </li>
    `;
}

/**
 * 显示知识库文章
 */
function displayKnowledgeItems() {
    const currentList = isSearchMode ? searchResults : knowledgeList;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, currentList.length);
    const pageItems = currentList.slice(startIndex, endIndex);
    
    const listElement = document.querySelector('.blog-list ul');
    
    if (pageItems.length === 0 && !isSearchMode) {
        listElement.innerHTML = `
            <li class="empty-content">
                <p>暂无文章内容</p>
            </li>
        `;
    } else {
        listElement.innerHTML = pageItems.map(item => `
            <li>
                <div class="geometric-decoration"></div>
                <div class="right-line"></div>
                <div class="bottom-line"></div>
                <div class="card-header">
                    <span class="blog-title">${item.subtitle}</span>
                    <span class="blog-subtitle">${item.title}</span>
                </div>
                <div class="blog-introduce">
                    <img class="calendar" src="/res/media/svg/sys/calendar.svg" alt="logo">
                    <span class="blog-date">${item.date}</span>
                    <div class="blog-tags-container">
                        ${item.tag.map(t => `<span class="blog-tag">${t}</span>`).join('')}
                    </div>
                </div>
                <div class="blog-summary">${item.description}</div>
            </li>
        `).join('');
    }
    
    updatePagination();
    bindKnowledgeItemEvents();
}

/**
 * 更新分页状态
 */
function updatePagination() {
    const paginationElement = document.querySelector('.pagination');
    const currentList = isSearchMode ? searchResults : knowledgeList;
    const totalItemsToShow = isSearchMode ? currentList.length : totalItems;
    totalPages = Math.ceil(totalItemsToShow / itemsPerPage);
    
    let pageNumbersHTML = '';
    
    // 生成页码HTML
    if (totalPages > 1) {
        // 计算起始页码，确保显示5个页码
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const endPage = Math.min(startPage + 4, totalPages);
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbersHTML += `<a href="#" class="page-number ${i === currentPage ? 'active' : ''}">${i}</a>`;
        }
    }
    
    paginationElement.innerHTML = `
        <button class="pagination-button prev-button" ${currentPage === 1 ? 'disabled' : ''} title="上一页">&lt;</button>
        <div class="page-numbers">${pageNumbersHTML}</div>
        <button class="pagination-button next-button" ${currentPage === totalPages ? 'disabled' : ''} title="下一页">&gt;</button>
        <div class="goto-container">
            <span class="goto-text">跳转</span>
            <input type="text" class="page-input" value="${currentPage}">
            <button class="pagination-button jump-button">GO</button>
        </div>
    `;
    
    // 绑定分页事件
    bindPaginationEvents();
}

/**
 * 绑定分页相关事件
 */
function bindPaginationEvents() {
    const paginationElement = document.querySelector('.pagination');
    
    // 上一页
    paginationElement.querySelector('.prev-button').addEventListener('click', () => {
        if (currentPage > 1) {
            loadPage(currentPage - 1);
        }
    });
    
    // 下一页
    paginationElement.querySelector('.next-button').addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadPage(currentPage + 1);
        }
    });
    
    // 页码点击
    paginationElement.querySelectorAll('.page-number').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.textContent);
            if (page !== currentPage) {
                loadPage(page);
            }
        });
    });
    
    // 跳转按钮
    const jumpButton = paginationElement.querySelector('.jump-button');
    const pageInput = paginationElement.querySelector('.page-input');
    
    const handlePageJump = () => {
        const inputPage = parseInt(pageInput.value);
        if (inputPage >= 1 && inputPage <= totalPages) {
            loadPage(inputPage);
        } else {
            alert('请输入有效的页码！');
            pageInput.value = currentPage;
        }
    };
    
    jumpButton.addEventListener('click', handlePageJump);
    pageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handlePageJump();
        }
    });
}

/**
 * 加载指定页
 * @param {number} page - 页码
 */
async function loadPage(page) {
    currentPage = page;
    
    if (isSearchMode) {
        // 搜索模式下，直接显示当前页的搜索结果
        displayKnowledgeItems();
    } else {
        // 非搜索模式下，加载指定页的数据
        await loadKnowledgeData(page, false);
    }
}

/**
 * 高亮搜索关键词
 * @param {string} text - 文本内容
 * @param {Array} keywords - 关键词数组
 * @returns {string} 高亮后的文本
 */
function highlightKeywords(text, keywords) {
    if (!text || keywords.length === 0) return text;
    
    let highlightedText = text;
    keywords.forEach(keyword => {
        if (keyword.length > 0) {
            const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        }
    });
    
    return highlightedText;
}

/**
 * 转义正则表达式特殊字符
 * @param {string} string - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 显示无结果提示
 * @param {Array} keywords - 关键词数组
 */
function displayNoResultsMessage(keywords) {
    const listElement = document.querySelector('.blog-list ul');
    listElement.innerHTML = `
        <li class="no-results">
            <div class="no-results-content">
                <h3>未找到相关文章</h3>
                <p>抱歉，没有找到与 "${keywords.join(' ')}" 相关的文章</p>
                <button class="clear-search-btn">清除搜索</button>
            </div>
        </li>
    `;
    
    // 绑定清除搜索事件
    listElement.querySelector('.clear-search-btn').addEventListener('click', () => {
        clearSearch();
    });
    
    // 隐藏分页
    document.querySelector('.pagination').innerHTML = '';
}

/**
 * 显示搜索结果和统计信息
 * @param {Array} filteredList - 过滤后的文章列表
 * @param {Array} keywords - 关键词数组
 */
function displaySearchResults(filteredList, keywords) {
    if (filteredList.length === 0) {
        // 显示友好的无结果提示
        displayNoResultsMessage(keywords);
        return;
    }
    
    // 显示结果统计
    const searchStats = document.querySelector('.search-stats');
    if (!searchStats) {
        // 创建搜索结果统计元素
        const searchSection = document.querySelector('.search-section');
        const statsDiv = document.createElement('div');
        statsDiv.className = 'search-stats';
        statsDiv.innerHTML = `
            <div class="search-result-info">
                <span class="result-count">找到 ${filteredList.length} 篇相关文章</span>
                <span class="search-keywords">关键词：${keywords.join('、')}</span>
                <button class="clear-search">清除搜索</button>
            </div>
        `;
        searchSection.appendChild(statsDiv);
        
        // 绑定清除搜索事件
        statsDiv.querySelector('.clear-search').addEventListener('click', () => {
            clearSearch();
        });
    } else {
        // 更新统计信息
        searchStats.querySelector('.result-count').textContent = `找到 ${filteredList.length} 篇相关文章`;
        searchStats.querySelector('.search-keywords').textContent = `关键词：${keywords.join('、')}`;
    }
    
    // 显示过滤后的文章列表
    searchResults = filteredList;
    isSearchMode = true;
    currentPage = 1;
    displayKnowledgeItems();
}

/**
 * 清除搜索状态
 */
function clearSearch() {
    document.querySelector('.search-input').value = '';
    isSearchMode = false;
    searchResults = [];
    currentPage = 1;
    
    // 移除搜索统计信息
    const searchStats = document.querySelector('.search-stats');
    if (searchStats) {
        searchStats.remove();
    }
    
    displayKnowledgeItems();
}

/**
 * 处理搜索输入事件
 */
function handleSearchInput() {
    // 延迟执行搜索，避免频繁触发
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(performSearch, 500);
}

/**
 * 处理搜索按键事件
 * @param {KeyboardEvent} e - 键盘事件
 */
function handleSearchKeypress(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
}

/**
 * 执行搜索
 */
async function performSearch() {
    const searchInput = document.querySelector('.search-input');
    const keywords = searchInput.value.trim().toLowerCase().split(/\s+/).filter(k => k.length > 0);
    
    if (keywords.length === 0) {
        // 如果没有关键词，清除搜索
        clearSearch();
        return;
    }
    
    // 如果是首次搜索或搜索词变化，需要加载所有文章的完整内容用于搜索
    if (knowledgeList.length < totalItems) {
        // 显示加载状态
        showLoadingIndicator();
        
        try {
            // 加载剩余文章的元数据
            for (let page = 2; page <= totalPages; page++) {
                const result = await BLOG_getKnowledgeItems(page, itemsPerPage);
                if (result && result.items) {
                    knowledgeList = [...new Map([...knowledgeList, ...result.items].map(item => [item.id, item])).values()];
                }
            }
            
            // 并行加载所有文章的完整内容
            await Promise.all(knowledgeList.map(item => loadArticleFullContent(item)));
        } catch (error) {
            console.error('Error loading full content for search:', error);
        } finally {
            hideLoadingIndicator();
        }
    }
    
    // 过滤文章（搜索所有内容：标题、标签、内容和日期）
    const filteredList = knowledgeList.filter(item => {
        // 检查标题
        const inTitle = keywords.some(keyword => item.subtitle.toLowerCase().includes(keyword));
        
        // 检查标签
        const inTags = keywords.some(keyword => item.tag.some(t => t.toLowerCase().includes(keyword)));
        
        // 检查日期
        const inDate = keywords.some(keyword => item.date.toLowerCase().includes(keyword));
        
        // 检查内容
        const inContent = item.fullContent && 
                        keywords.some(keyword => item.fullContent.includes(keyword));
        
        return inTitle || inTags || inDate || inContent;
    });
    
    // 显示搜索结果
    displaySearchResults(filteredList, keywords);
}

document.addEventListener('DOMContentLoaded', async function() {
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button');
    
    // 绑定搜索事件
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', handleSearchKeypress);
    // 添加实时搜索
    searchInput.addEventListener('input', handleSearchInput);
    
    // 初始化加载第一页数据
    await loadKnowledgeData(1);
});