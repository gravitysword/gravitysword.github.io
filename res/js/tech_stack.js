import { BLOG_getKnowledgeItems } from '/res/js/blog_msg.js';

// 初始化全局变量
let knowledgeList = [];
let currentPage = 1;
let itemsPerPage = 5;
let totalPages = 1;
let currentTag = '全部';

// 标签切换功能
async function initializeTags() {
    try {
        const response = await fetch("/config/blogs.json");
        const data = await response.json();
        const tags = ["全部", ...data.tech_stack.tag];
        
        // 更新标签容器
        const tagsContainer = document.querySelector('.tags-container');
        tagsContainer.innerHTML = tags.map(tag => 
            `<span class="tag ${tag === '全部' ? 'active' : ''}">${tag}</span>`
        ).join('');
        
        // 重新绑定标签点击事件
        const categoryTags = document.querySelectorAll('.tags-container .tag');
        categoryTags.forEach(tag => {
            tag.addEventListener('click', function() {
                // 移除所有分类标签的active类
                categoryTags.forEach(t => t.classList.remove('active'));
                
                // 为当前点击的标签添加active类
                this.classList.add('active');
                
                // 清空搜索框
                document.querySelector('.search-input').value = '';
                
                // 更新当前标签并重新显示文章
                currentTag = this.textContent;
                console.log('选中分类标签:', currentTag);
                displayKnowledgeItems();
            });
        });
    } catch (error) {
        console.error('Error loading tags:', error);
    }
}

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
    
    // 执行搜索
    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm === '') {
            alert('请输入搜索内容');
            return;
        }
        
        console.log('搜索关键词:', searchTerm);
        
        // 获取所有博客项
        const blogItems = document.querySelectorAll('.blog-list li');
        let foundCount = 0;
        
        // 遍历博客项进行搜索匹配
        blogItems.forEach(item => {
            const title = item.querySelector('.blog-title').textContent.toLowerCase();
            const summary = item.querySelector('.blog-summary').textContent.toLowerCase();
            const tag = item.querySelector('.blog-tag').textContent.toLowerCase();
            
            // 如果标题、摘要或标签中包含搜索词，则显示该项
            if (title.includes(searchTerm) || summary.includes(searchTerm) || tag.includes(searchTerm)) {
                item.style.display = '';
                foundCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // 显示搜索结果
        if (foundCount === 0) {
            alert('没有找到匹配的内容');
            // 恢复显示所有博客项
            blogItems.forEach(item => {
                item.style.display = '';
            });
        }
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
            knowledgeList = await BLOG_getKnowledgeItems();
            totalPages = Math.ceil(knowledgeList.length / itemsPerPage);
            await initializeTags();
            displayKnowledgeItems();
        } catch (error) {
            console.error('Error loading knowledge data:', error);
        }
    }

    // 显示知识库文章
    function displayKnowledgeItems() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // 根据当前标签筛选文章
        const filteredList = currentTag === '全部' 
            ? knowledgeList 
            : knowledgeList.filter(item => item.tag.includes(currentTag));
        
        const listElement = document.querySelector('.blog-list ul');
        listElement.innerHTML = filteredList.slice(startIndex, endIndex).map(item => `
            <li>
                <span class="blog-title">${item.subtitle}</span>
                <span class="blog-subtitle">${item.title}</span>
                <span class="blog-introduce">
                    <img class="calendar" src="/res/media/svg/sys/calendar.svg" alt="logo">
                    <span class="blog-date">${item.date}</span>
                    ${item.tag.map(t => `<span class="blog-tag">#${t}</span>`).join('')}
                </span>
                <span class="blog-summary">${item.description}</span>
            </li>
        `).join('');
        
        totalPages = Math.ceil(filteredList.length / itemsPerPage);
        updatePagination();
        bindKnowledgeItemEvents();
    }

    // 初始化加载
    await loadKnowledgeData();
    
    // 搜索功能实现
    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm === '') {
            alert('请输入搜索内容');
            return;
        }
        
        const filteredList = knowledgeList.filter(item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.subtitle.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.tag.some(tag => tag.toLowerCase().includes(searchTerm))
        );
        
        if (filteredList.length === 0) {
            alert('没有找到匹配的内容');
            searchInput.value = '';
            displayKnowledgeItems();
            return;
        }
        
        currentPage = 1;
        const listElement = document.querySelector('.blog-list ul');
        listElement.innerHTML = filteredList.map(item => `
            <li>
                <span class="blog-title">${item.subtitle}</span>
                <span class="blog-subtitle">${item.title}</span>
                <span class="blog-introduce">
                    <img class="calendar" src="./res/media/svg/sys/calendar.svg" alt="logo">
                    <span class="blog-date">${item.date}</span>
                    ${item.tag.map(t => `<span class="blog-tag">${t}</span>`).join('')}
                </span>
                <span class="blog-summary">${item.description}</span>
            </li>
        `).join('');
        
        totalPages = Math.ceil(filteredList.length / itemsPerPage);
        updatePagination();
    }
    
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