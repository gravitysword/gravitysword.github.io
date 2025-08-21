import { BLOG_getKnowledgeItems } from '/res/js/blog_msg.js';

// 初始化全局变量
let knowledgeList = [];
let currentPage = 1;
let itemsPerPage = 5;
let totalPages = 1;



document.addEventListener('DOMContentLoaded', async function() {
    
    // 搜索功能
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button');
    
    // 搜索按钮点击事件
    searchButton.addEventListener('click', function() {
        performSearch();
    });
    
    // 输入框回车事件
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 实时搜索 - 输入时延迟触发
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch();
        }, 300); // 300ms延迟，避免频繁搜索
    });
    
    // 增强版搜索功能 - 支持多维度检索和多关键词搜索
    function performSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm === '') {
            // 空搜索时显示所有文章
            currentPage = 1;
            displayKnowledgeItems();
            return;
        }
        
        console.log('搜索关键词:', searchTerm);
        
        // 分割多个关键词（支持空格分隔）
        const keywords = searchTerm.split(/\s+/).filter(keyword => keyword.length > 0);
        
        if (keywords.length === 0) {
            currentPage = 1;
            displayKnowledgeItems();
            return;
        }
        
        // 多维度搜索过滤（包含文章内容）
        const filteredList = knowledgeList.filter(item => {
            // 搜索维度：标题、副标题、描述、标签、日期、完整内容
            const searchableFields = [
                item.title?.toLowerCase() || '',
                item.subtitle?.toLowerCase() || '',
                item.description?.toLowerCase() || '',
                item.date?.toLowerCase() || '',
                item.fullContent || '', // 添加完整内容搜索
                ...(item.tag?.map(tag => tag.toLowerCase()) || [])
            ];
            
            // 将所有可搜索字段合并为一个字符串
            const combinedText = searchableFields.join(' ');
            
            // 检查是否包含所有关键词（AND逻辑）
            return keywords.every(keyword => {
                // 支持模糊匹配和部分匹配
                return combinedText.includes(keyword) || 
                       // 日期格式支持：2024-01-01, 2024年1月, 2024/01/01
                       item.date?.includes(keyword) ||
                       // 标签精确匹配
                       item.tag?.some(tag => tag.toLowerCase().includes(keyword));
            });
        });
        
        // 显示搜索结果统计
        displaySearchResults(filteredList, keywords);
    }
    
    // 显示搜索结果和统计信息
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
                document.querySelector('.search-input').value = '';
                currentPage = 1;
                displayKnowledgeItems();
                statsDiv.remove();
            });
        } else {
            // 更新统计信息
            searchStats.querySelector('.result-count').textContent = `找到 ${filteredList.length} 篇相关文章`;
            searchStats.querySelector('.search-keywords').textContent = `关键词：${keywords.join('、')}`;
        }
        
        // 显示过滤后的文章列表
        currentPage = 1;
        const listElement = document.querySelector('.blog-list ul');
        listElement.innerHTML = filteredList.map(item => `
            <li>
                <div class="geometric-decoration"></div>
                <div class="right-line"></div>
                <div class="bottom-line"></div>
                <div class="right-line"></div>
                <div class="bottom-line"></div>
                <div class="right-line"></div>
                <div class="bottom-line"></div>
                <div class="card-header">
                    <span class="blog-title">${highlightKeywords(item.subtitle, keywords)}</span>
                    <span class="blog-subtitle">${highlightKeywords(item.title, keywords)}</span>
                </div>
                <div class="blog-introduce">
                    <img class="calendar" src="/res/media/svg/sys/calendar.svg" alt="logo">
                    <span class="blog-date">${highlightKeywords(item.date, keywords)}</span>
                    <div class="blog-tags-container">
                        ${item.tag.map(t => `<span class="blog-tag">${highlightKeywords(t, keywords)}</span>`).join('')}
                    </div>
                </div>
                <div class="blog-summary">${highlightKeywords(item.description, keywords)}</div>
            </li>
        `).join('');
        
        totalPages = Math.ceil(filteredList.length / itemsPerPage);
        updatePagination();
        bindKnowledgeItemEvents();
    }
    
    // 显示无结果提示
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
            document.querySelector('.search-input').value = '';
            currentPage = 1;
            displayKnowledgeItems();
        });
        
        // 隐藏分页和搜索结果信息
        document.querySelector('.pagination').innerHTML = '';
        const searchResultInfo = document.querySelector('.search-result-info');
        if (searchResultInfo) {
            searchResultInfo.remove();
        }
    }
    
    // 高亮搜索关键词
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
    
    // 转义正则表达式特殊字符
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
});
    
    // 知识库文章点击事件
    function bindKnowledgeItemEvents() {
        document.querySelectorAll('.blog-list ul li').forEach(item => {
            item.addEventListener('click', () => {
                const subtitle = item.querySelector('.blog-title').textContent;
                const article = knowledgeList.find(a => a.subtitle === subtitle);
                if (article && article.id) {
                    window.location.href = `/view/blog.html?id=${article.id}`;
                }
            });
        });
    }
    
    // 加载知识库数据
    async function loadKnowledgeData() {
        try {
            // 显示加载指示器
            showLoadingIndicator();
            
            knowledgeList = await BLOG_getKnowledgeItems();
            
            // 为每篇文章加载完整内容，用于内容搜索
            console.log('开始加载文章内容...');
            for (let item of knowledgeList) {
                try {
                    const response = await fetch(item.id);
                    const content = await response.text();
                    // 提取文章内容部分（移除元数据）
                    const contentMatch = content.match(/<div style="display:none;" class="author">[\s\S]*?<\/div>([\s\S]*)/i);
                    if (contentMatch && contentMatch[1]) {
                        item.fullContent = contentMatch[1].toLowerCase();
                    } else {
                        item.fullContent = item.description.toLowerCase(); // 回退到描述
                    }
                } catch (error) {
                    console.error(`加载文章 ${item.id} 内容失败:`, error);
                    item.fullContent = item.description.toLowerCase(); // 回退到描述
                }
            }
            console.log('文章内容加载完成');
            
            totalPages = Math.ceil(knowledgeList.length / itemsPerPage);
            displayKnowledgeItems();
            
            // 隐藏加载指示器
            hideLoadingIndicator();
        } catch (error) {
            console.error('Error loading knowledge data:', error);
            hideLoadingIndicator();
        }
    }
    
    // 显示加载指示器
    function showLoadingIndicator() {
        const listElement = document.querySelector('.blog-list ul');
        listElement.innerHTML = `
            <li class="loading-content">
                <div class="loading-spinner"></div>
                <p>正在加载文章内容...</p>
            </li>
        `;
        
        // 隐藏分页
        document.querySelector('.pagination').innerHTML = '';
    }
    
    // 隐藏加载指示器
    function hideLoadingIndicator() {
        // 加载指示器会在displayKnowledgeItems中被替换
    }

    // 显示知识库文章
    function displayKnowledgeItems() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        const listElement = document.querySelector('.blog-list ul');
        listElement.innerHTML = knowledgeList.slice(startIndex, endIndex).map(item => `
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
        
        totalPages = Math.ceil(knowledgeList.length / itemsPerPage);
        updatePagination();
        bindKnowledgeItemEvents();
    }

    // 初始化加载
    await loadKnowledgeData();
    
    // 更新分页状态
    function updatePagination() {
        const paginationElement = document.querySelector('.pagination');
        let pageNumbersHTML = '';
        
        // 生成页码HTML
        for (let i = 1; i <= totalPages; i++) {
            pageNumbersHTML += `<a href="#" class="page-number ${i === currentPage ? 'active' : ''}">${i}</a>`;
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
    
    // 绑定分页相关事件
    function bindPaginationEvents() {
        const paginationElement = document.querySelector('.pagination');
        
        // 上一页
        paginationElement.querySelector('.prev-button').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayKnowledgeItems();
            }
        });
        
        // 下一页
        paginationElement.querySelector('.next-button').addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayKnowledgeItems();
            }
        });
        
        // 页码点击
        paginationElement.querySelectorAll('.page-number').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = parseInt(link.textContent);
                displayKnowledgeItems();
            });
        });
        
        // 跳转按钮
        const jumpButton = paginationElement.querySelector('.jump-button');
        const pageInput = paginationElement.querySelector('.page-input');
        
        jumpButton.addEventListener('click', () => {
            const inputPage = parseInt(pageInput.value);
            if (inputPage >= 1 && inputPage <= totalPages) {
                currentPage = inputPage;
                displayKnowledgeItems();
            } else {
                alert('请输入有效的页码！');
                pageInput.value = currentPage;
            }
        });
        
        // 输入框回车
        pageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const inputPage = parseInt(pageInput.value);
                if (inputPage >= 1 && inputPage <= totalPages) {
                    currentPage = inputPage;
                    displayKnowledgeItems();
                } else {
                    alert('请输入有效的页码！');
                    pageInput.value = currentPage;
                }
            }
        });
    };