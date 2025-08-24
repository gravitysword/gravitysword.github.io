import { BLOG_getBlogItems } from '/res/js/blog_msg.js';

// 状态变量
let bloglist = [];
let currentPage = 1;
const itemsPerPage = 5;
let totalPages = 1;

// DOM 元素引用
const blogListElement = document.querySelector('.content-container .blog-list ul');
const paginationElement = document.querySelector('.pagination');

// 显示博客项
function displayBlogItems(page) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, bloglist.length);
    
    blogListElement.innerHTML = bloglist.slice(startIndex, endIndex).map(item => `
        <li>
            <span class="blog-id" style="display:none">${item.id}</span>
            <span class="blog-title">${item.title}</span>
            <span class="blog-introduce">
                <img class="calendar" src="./res/media/svg/sys/calendar.svg">
                <span class="blog-date">${item.date}</span>
                ${item.tag.map(t => `<span class="blog-tag">#${t}</span>`).join('')}
            </span>
            <span class="blog-description">${item.description}</span>
        </li>
    `).join('');
    
    setTitleUnderlineWidth();
    addBlogItemClickEvents();
}

// 更新分页组件
function updatePagination() {
    // 生成页码按钮
    const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const endPage = Math.min(startPage + 4, totalPages);
    
    const pageNumbers = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
    );
    
    const pageNumbersHTML = pageNumbers.map(page => `
        <a href="#" class="page-number ${page === currentPage ? 'active' : ''}">${page}</a>
    `).join('');
    
    // 构建分页HTML
    paginationElement.innerHTML = `
        <button class="pagination-button prev-button" 
            ${currentPage === 1 ? 'disabled' : ''} title="上一页">&lt;</button>
        <div class="page-numbers">${pageNumbersHTML}</div>
        <button class="pagination-button next-button" 
            ${currentPage === totalPages ? 'disabled' : ''} title="下一页">&gt;</button>
        <div class="goto-container">
            <span class="goto-text">跳转</span>
            <input type="text" class="page-input" value="${currentPage}" readonly>
            <button class="pagination-button edit-button" title="编辑页码">✎</button>
            <button class="pagination-button jump-button" title="跳转" style="display:none">跳转</button>
        </div>
    `;
    
    // 绑定事件
    bindPaginationEvents();
}

// 绑定分页事件
function bindPaginationEvents() {
    // 页码点击
    paginationElement.querySelectorAll('.page-number').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = parseInt(link.textContent);
            displayBlogItems(currentPage);
            updatePagination();
        });
    });
    
    // 上一页/下一页
    paginationElement.querySelector('.prev-button').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayBlogItems(currentPage);
            updatePagination();
        }
    });
    
    paginationElement.querySelector('.next-button').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayBlogItems(currentPage);
            updatePagination();
        }
    });
    
    // 编辑/跳转按钮
    const editButton = paginationElement.querySelector('.edit-button');
    const jumpButton = paginationElement.querySelector('.jump-button');
    const pageInput = paginationElement.querySelector('.page-input');
    
    editButton.addEventListener('click', () => {
        pageInput.readOnly = false;
        pageInput.focus();
        jumpButton.style.display = 'inline-block';
        editButton.style.display = 'none';
    });
    
    jumpButton.addEventListener('click', () => {
        const inputPage = parseInt(pageInput.value);
        
        if (!isNaN(inputPage)) {
            currentPage = Math.max(1, Math.min(inputPage, totalPages));
            displayBlogItems(currentPage);
            updatePagination();
        } else {
            alert('请输入有效的页码！');
        }
    });
    
    // 输入框回车事件
    pageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            jumpButton.click();
        }
    });
}

// 设置标题下划线
function setTitleUnderlineWidth() {
    document.querySelectorAll('.blog-title').forEach(title => {
        const measureSpan = document.createElement('span');
        measureSpan.textContent = title.textContent;
        measureSpan.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: nowrap;
            font: ${getComputedStyle(title).font}
        `;
        
        document.body.appendChild(measureSpan);
        title.style.setProperty('--title-width', `${measureSpan.offsetWidth + 10}px`);
        measureSpan.remove();
    });
}

// 博客项点击事件
function addBlogItemClickEvents() {
    document.querySelectorAll('.content-container .blog-list ul li').forEach(item => {
        item.addEventListener('click', () => {
            const blogId = item.querySelector('.blog-id').textContent;
            window.location.href = `/view/blog.html?id=${blogId}`;
        });
    });
}

// 加载博客数据
async function loadBlogList() {
    bloglist = await BLOG_getBlogItems();
    totalPages = Math.ceil(bloglist.length / itemsPerPage);
    updatePagination();
    displayBlogItems(currentPage);
}

document.addEventListener('DOMContentLoaded', () => {
    // 启动博客列表
    loadBlogList();
});