/**
 * 技术栈页面主脚本
 */
import { BLOG_getKnowledgeItems, loadArticleFullContent } from '/res/js/blog_msg.js';

// 初始化全局变量
let knowledgeList = []; // 所有文章的元数据列表
let currentPage = 1;
let itemsPerPage = 6;
let totalPages = 1;
let totalItems = 0;
let isSearchMode = false; // 是否处于搜索模式
let searchResults = []; // 搜索结果列表

/**
 * 知识库文章点击事件
 */
function bindKnowledgeItemEvents() {
    document.querySelectorAll('.blog-card').forEach(card => {
        card.addEventListener('click', () => {
            const articleId = card.dataset.id;
            if (articleId) {
                window.location.href = `/view/blog.html?id=${articleId}`;
            }
        });
        
        // 添加键盘导航支持
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
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
    const listElement = document.querySelector('.blog-grid');
    listElement.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <h3>正在加载</h3>
            <p>精彩内容即将呈现...</p>
        </div>
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
    const listElement = document.querySelector('.blog-grid');
    listElement.innerHTML = `
        <div class="error-content">
            <div class="error-icon">⚠️</div>
            <h3>加载失败</h3>
            <p>${message}</p>
            <button class="retry-button" onclick="location.reload()">重新加载</button>
        </div>
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
    
    const listElement = document.querySelector('.blog-grid');
    
    if (pageItems.length === 0 && !isSearchMode) {
        listElement.innerHTML = `
            <div class="empty-content">
                <div class="empty-icon">📝</div>
                <h3>暂无文章内容</h3>
                <p>敬请期待更多精彩内容</p>
            </div>
        `;
    } else {
        listElement.innerHTML = pageItems.map(item => `
            <article class="blog-card" data-id="${item.id}">
                <header class="card-header">
                    <h2 class="blog-title">${item.subtitle}</h2>
                    <p class="blog-subtitle">${item.title}</p>
                </header>
                
                <div class="card-content">
                    <p class="blog-summary">${item.description}</p>
                </div>
                
                <div class="card-meta">
                    <div class="meta-left">
                        <div class="date-info">
                            <svg class="calendar-icon" viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                            </svg>
                            <time class="blog-date">${item.date}</time>
                        </div>
                    </div>
                    <div class="meta-right">
                        <div class="blog-tags">
                            ${item.tag.slice(0, 3).map(t => `<span class="blog-tag">${t}</span>`).join('')}
                            ${item.tag.length > 3 ? `<span class="blog-tag more-tags">+${item.tag.length - 3}</span>` : ''}
                        </div>
                    </div>
                </div>
            </article>
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
        
        pageNumbersHTML = Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
        ).map(page => `
            <a href="#" class="page-number ${page === currentPage ? 'active' : ''}">${page}</a>
        `).join('');
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
 * 显示无结果提示
 * @param {Array} keywords - 关键词数组
 */
function displayNoResultsMessage(keywords) {
    const listElement = document.querySelector('.blog-grid');
    listElement.innerHTML = `
        <div class="no-results">
            <div class="no-results-content">
                <div class="no-results-icon">🔍</div>
                <h3>未找到相关文章</h3>
                <p>抱歉，没有找到与 "${keywords.join(' ')}" 相关的文章</p>
                <div class="no-results-actions">
                    <button class="clear-search-btn">清除搜索</button>
                    <button class="search-tips-btn">搜索建议</button>
                </div>
            </div>
        </div>
    `;
    
    // 绑定清除搜索事件
    listElement.querySelector('.clear-search-btn').addEventListener('click', () => {
        clearSearch();
    });
    
    // 绑定搜索建议事件
    listElement.querySelector('.search-tips-btn').addEventListener('click', () => {
        alert('搜索建议：\n• 尝试使用不同的关键词\n• 检查拼写是否正确\n• 使用更通用的词汇');
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
    let searchStats = document.querySelector('.search-stats');
    if (!searchStats) {
        // 创建搜索结果统计元素
        const searchSection = document.querySelector('.search-section');
        searchStats = document.createElement('div');
        searchStats.className = 'search-stats';
        searchSection.appendChild(searchStats);
    }
    
    // 更新统计信息
    searchStats.innerHTML = `
        <div class="search-result-info">
            <span class="result-count">找到 ${filteredList.length} 篇相关文章</span>
            <span class="search-keywords">关键词：${keywords.join('、')}</span>
            <button class="clear-search">清除搜索</button>
        </div>
    `;
    
    // 绑定清除搜索事件
    searchStats.querySelector('.clear-search').addEventListener('click', () => {
        clearSearch();
    });
    
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
        const inTitle = keywords.some(keyword => item.subtitle.toLowerCase().includes(keyword));
        const inTags = keywords.some(keyword => item.tag.some(t => t.toLowerCase().includes(keyword)));
        const inDate = keywords.some(keyword => item.date.toLowerCase().includes(keyword));
        const inContent = item.fullContent && keywords.some(keyword => item.fullContent.includes(keyword));
        
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
    
    // 处理搜索按键事件
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 添加实时搜索
    searchInput.addEventListener('input', () => {
        // 延迟执行搜索，避免频繁触发
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(performSearch, 500);
    });
    
    // 添加窗口大小变化事件监听
    window.addEventListener('resize', () => {
        // 重新计算并更新布局
        displayKnowledgeItems();
    });
    
    // 初始化加载第一页数据
    await loadKnowledgeData(1);
});