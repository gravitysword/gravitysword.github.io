import { BLOG_getBlog, BLOG_getBlogItems } from '/res/js/blog_msg.js';

document.addEventListener('DOMContentLoaded', () => {

    {
        async function a1() {
            //加载列表
            let bloglist = [];
            let currentPage = 1;
            let itemsPerPage = 3;
            let totalPages = 1;
            
            // 获取博客列表数据
            async function loadBlogList() {
                const blogList_element = document.querySelector('.content-container .blog-list ul');
                bloglist = await BLOG_getBlogItems();
                console.log('Blog List:', bloglist);
                
                // 计算总页数
                totalPages = Math.ceil(bloglist.length / itemsPerPage);
                
                // 更新页码显示
                updatePagination();
                
                // 显示当前页的内容
                displayBlogItems(currentPage);
                
                // 添加鼠标悬停效果
                //addHoverEffects();
            }
            
            // 显示指定页的博客内容
            function displayBlogItems(page) {
                const blogList_element = document.querySelector('.content-container .blog-list ul');
                blogList_element.innerHTML = '';
                
                // 计算当前页的起始和结束索引
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = Math.min(startIndex + itemsPerPage, bloglist.length);
                
                // 显示当前页的博客项
                for (let i = startIndex; i < endIndex; i++) {
                    const item = bloglist[i];
                    let tag = "";
                    for (const tag_item of item["tag"]) {
                        tag += `<span class="blog-tag">#${tag_item} </span>`;
                    }
                    const lis = `
                    <li>
                        <span class="blog-id" style="display: none;">${item["id"]}</span>
                        <span class="blog-title">${item["title"]}</span>
                        <span class="blog-introduce">
                            <img class="calendar" src="./res/media/svg/sys/calendar.svg" alt="logo">
                            <span class="blog-date">${item["date"]}</span>
                            ${tag}
                        </span>
                        <span class="blog-description">${item["description"]}</span>
                    </li>`;
                    blogList_element.innerHTML += lis;
                }
                
                // 重新添加点击事件
                addBlogItemClickEvents();
                
                // 设置标题下划线宽度
                setTitleUnderlineWidth();
            }
            // 更新翻页栏
            function updatePagination() {
                const paginationElement = document.querySelector('.pagination');
                
                // 创建页码按钮HTML
                let pageNumbersHTML = '';
                const maxVisiblePages = 5; // 最多显示的页码数量
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                // 调整起始页，确保显示足够的页码
                if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                // 生成页码按钮
                for (let i = startPage; i <= endPage; i++) {
                    pageNumbersHTML += `<a href="#" class="page-number ${i === currentPage ? 'active' : ''}">${i}</a>`;
                }
                
                // 更新翻页栏HTML
                paginationElement.innerHTML = `
                    <button class="pagination-button prev-button" ${currentPage === 1 ? 'disabled' : ''} title="上一页">&lt;</button>
                    <div class="page-numbers">
                        ${pageNumbersHTML}
                    </div>
                    <button class="pagination-button next-button" ${currentPage === totalPages ? 'disabled' : ''} title="下一页">&gt;</button>
                    <div class="goto-container">
                        <span class="goto-text">Go to</span>
                        <input type="text" class="page-input" value="${currentPage}">
                    </div>
                `;
                
                // 添加翻页事件
                const prevButton = document.querySelector('.prev-button');
                const nextButton = document.querySelector('.next-button');
                const pageNumbers = document.querySelectorAll('.page-number');
                const pageInput = document.querySelector('.page-input');
                
                // 上一页按钮点击事件
                prevButton.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        displayBlogItems(currentPage);
                        updatePagination();
                    }
                });
                
                // 下一页按钮点击事件
                nextButton.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        displayBlogItems(currentPage);
                        updatePagination();
                    }
                });
                
                // 页码按钮点击事件
                pageNumbers.forEach(pageNumber => {
                    pageNumber.addEventListener('click', (e) => {
                        e.preventDefault();
                        const page = parseInt(pageNumber.textContent);
                        if (page !== currentPage) {
                            currentPage = page;
                            displayBlogItems(currentPage);
                            updatePagination();
                        }
                    });
                });
                
                // 页码输入框输入事件
                pageInput.addEventListener('input', () => {
                    const inputPage = parseInt(pageInput.value);
                    if (!isNaN(inputPage) && inputPage >= 1 && inputPage <= totalPages) {
                        currentPage = inputPage;
                        displayBlogItems(currentPage);
                        updatePagination();
                    }
                });
            }
            // 添加博客项点击事件
            function addBlogItemClickEvents() {
                const blogLis = document.querySelectorAll('.content-container .blog-list ul li');
                blogLis.forEach(li => {
                    li.addEventListener('click', () => {
                        const blogIdElement = li.querySelector('.blog-id');
                        if (blogIdElement) {
                            const blogId = blogIdElement.textContent;
                            window.location.href = `/blog.html?id=${blogId}`;
                        }
                    });
                });
            }
            
            // 设置标题下划线宽度与标题文本宽度匹配
            function setTitleUnderlineWidth() {
                const blogTitles = document.querySelectorAll('.content-container .blog-list li .blog-title');
                blogTitles.forEach(title => {
                    // 创建一个临时的span元素来精确测量文本宽度
                    const tempSpan = document.createElement('span');
                    // 复制标题元素的样式
                    const titleStyle = window.getComputedStyle(title);
                    tempSpan.style.font = titleStyle.font;
                    tempSpan.style.fontSize = titleStyle.fontSize;
                    tempSpan.style.fontWeight = titleStyle.fontWeight;
                    tempSpan.style.letterSpacing = titleStyle.letterSpacing;
                    // 设置为不可见但保持在文档流中以便测量
                    tempSpan.style.visibility = 'hidden';
                    tempSpan.style.position = 'absolute';
                    tempSpan.style.whiteSpace = 'nowrap';
                    // 设置文本内容
                    tempSpan.textContent = title.textContent;
                    // 添加到文档中进行测量
                    document.body.appendChild(tempSpan);
                    // 获取精确的文本宽度
                    const textWidth = tempSpan.offsetWidth;
                    // 移除临时元素
                    document.body.removeChild(tempSpan);
                    
                    // 设置自定义属性存储标题文本宽度
                    title.style.setProperty('--title-width', `${textWidth+10}px`);
                });
            }
            
            // 添加鼠标悬停效果
            
            
            // 加载博客列表
            await loadBlogList();
            
            
            // 导航栏按钮已改为a标签，不需要额外的点击事件处理
            // 保留此代码块位置以便将来可能的扩展
        }
        a1();
    }
});

                const pageInputContainer = document.querySelector('.goto-container');
                const editButton = document.createElement('button');
                editButton.classList.add('pagination-button', 'edit-button');
                editButton.title = '编辑页码';
                editButton.textContent = '✎';
                pageInputContainer.appendChild(editButton);

                const jumpButton = document.createElement('button');
                jumpButton.classList.add('pagination-button', 'jump-button');
                jumpButton.title = '跳转';
                jumpButton.textContent = '跳转';
                jumpButton.style.display = 'none';
                pageInputContainer.appendChild(jumpButton);

                // 编辑按钮点击事件
                editButton.addEventListener('click', () => {
                    pageInput.readOnly = false;
                    pageInput.focus();
                    jumpButton.style.display = 'inline-block';
                    editButton.style.display = 'none';
                });

                // 跳转按钮点击事件
                jumpButton.addEventListener('click', () => {
                    const inputPage = parseInt(pageInput.value);
                    if (!isNaN(inputPage) && inputPage >= 1 && inputPage <= totalPages) {
                        currentPage = inputPage;
                        displayBlogItems(currentPage);
                        updatePagination();
                    } else {
                        alert('请输入有效的页码！');
                    }
                    pageInput.readOnly = true;
                    jumpButton.style.display = 'none';
                    editButton.style.display = 'inline-block';
                });