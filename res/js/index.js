import {  BLOG_getBlogItems } from '/res/js/blog_msg.js';

document.addEventListener('DOMContentLoaded', () => {

    {
        // 初始化博客列表和分页信息
        async function a1() {
            let bloglist = [];
            let currentPage = 1;
            let itemsPerPage = 5;
            let totalPages = 1;

            // 加载博客列表数据
            async function loadBlogList() {
                const blogList_element = document.querySelector('.content-container .blog-list ul');
                bloglist = await BLOG_getBlogItems();
                totalPages = Math.ceil(bloglist.length / itemsPerPage);
                updatePagination();
                displayBlogItems(currentPage);
            }

            // 显示分页博客项
            function displayBlogItems(page) {
                const blogList_element = document.querySelector('.content-container .blog-list ul');
                let htmlContent = '';

                bloglist.slice((page - 1) * itemsPerPage, page * itemsPerPage).forEach(item => {
                    htmlContent += `<li>
                        <span class="blog-id" style="display:none">${item.id}</span>
                        <span class="blog-title">${item.title}</span>
                        <span class="blog-introduce">
                            <img class="calendar" src="./res/media/svg/sys/calendar.svg">
                            <span class="blog-date">${item.date}</span>
                            ${item.tag.map(t => `<span class="blog-tag">#${t}</span>`).join('')}
                        </span>
                        <span class="blog-description">${item.description}</span>
                    </li>`;
                });

                blogList_element.innerHTML = htmlContent;
                setTitleUnderlineWidth();

                // 新增：调用事件绑定函数
                addBlogItemClickEvents();
            }

            // 更新分页组件
            function updatePagination() {
                const paginationElement = document.querySelector('.pagination');
                let pageNumbersHTML = '';

                Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return;
                    pageNumbersHTML += `<a href="#" class="page-number ${page === currentPage ? 'active' : ''}">${page}</a>`;
                });

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

                // 为所有按钮添加点击事件
                paginationElement.querySelectorAll('button').forEach(btn => {
                    btn.onclick = handlePaginationAction;
                });

                // 为页码链接添加点击事件
                paginationElement.querySelectorAll('.page-number').forEach(link => {
                    link.onclick = (e) => {
                        e.preventDefault();
                        currentPage = parseInt(link.textContent);
                        displayBlogItems(currentPage);
                        updatePagination();
                    };
                });
            }

            // 分页事件处理器
            function handlePaginationAction(e) {
                const action = e.target.closest('button').className.replace('pagination-button ', '');

                if (action === 'prev-button') currentPage--;
                if (action === 'next-button') currentPage++;
                if (action === 'jump-button') {
                    currentPage = Math.min(totalPages, Math.max(1, parseInt(document.querySelector('.page-input').value)));
                }

                displayBlogItems(currentPage);
                updatePagination();
            }

            // 设置标题下划线
            function setTitleUnderlineWidth() {
                document.querySelectorAll('.blog-title').forEach(title => {
                    const measureSpan = Object.assign(document.createElement('span'), {
                        textContent: title.textContent,
                        style: `position:absolute;visibility:hidden;white-space:nowrap;${getComputedStyle(title).font}`
                    });
                    document.body.appendChild(measureSpan);
                    title.style.setProperty('--title-width', `${measureSpan.offsetWidth + 10}px`);
                    measureSpan.remove();
                });
            }


            await loadBlogList();
        }
        a1();
    }
});

{
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
}

// 新增：为博客列表项绑定点击事件
function addBlogItemClickEvents() {
    document.querySelectorAll('.content-container .blog-list ul li').forEach(item => {
        item.addEventListener('click', () => {
            const blogId = item.querySelector('.blog-id').textContent;
            window.location.href = `/blog.html?id=${blogId}`;
        });
    });
}
