import { BLOG_getBlog, BLOG_getBlogItems, refreshSelf, pageSplit } from '/res/js/blog_msg.js';

document.addEventListener('DOMContentLoaded', () => {
    {
        async function a1() {
            // 当前页码，从URL参数获取或默认为0
            let currentPage = 0;
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('page')) {
                currentPage = parseInt(urlParams.get('page'));
                if (isNaN(currentPage) || currentPage < 0) {
                    currentPage = 0;
                }
            }

            //加载列表
            {
                const blogList_element = document.querySelector('.content-container .blog-list ul');
                blogList_element.innerHTML = ''; // 清空现有内容
                
                // 显示加载中提示
                blogList_element.innerHTML = '<li><span class="blog-title">加载中...</span></li>';
                
                try {
                    const result = await pageSplit(currentPage);
                    const bloglist = result.data;
                    const pagination = result.pagination;
                    
                    console.log('Blog List:', bloglist);
                    console.log('Pagination:', pagination);
                    
                    // 清空加载提示
                    blogList_element.innerHTML = '';
                    
                    if (bloglist.length === 0) {
                        blogList_element.innerHTML = '<li><span class="blog-title">暂无博客内容</span></li>';
                    } else {
                        for (const item of bloglist) {
                            let tag = "";
                            for (const tag_item of item["tag"]) {
                                tag += `<span class="blog-tag"><span style="font-size:1.1em; display:inline-block; margin-bottom:1px; color:#000;">|</span> ${tag_item}</span>`;
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
                    }
                    
                    // 更新分页导航
                    updatePagination(pagination);
                } catch (error) {
                    console.error('Error loading blogs:', error);
                    blogList_element.innerHTML = '<li><span class="blog-title">加载失败，请稍后重试</span></li>';
                }
            }

            // 随机颜色的阴影
            {
                const sidebarDivs = document.querySelectorAll('.content-container .sidebar > div');

                sidebarDivs.forEach(div => {
                    div.addEventListener('mouseenter', () => {
                        const randomColor = getRandomColor();
                        div.style.boxShadow = `0 0px 10px ${randomColor}`;
                    });

                    div.addEventListener('mouseleave', () => {
                        div.style.boxShadow = '0 0px 2px rgba(0, 0, 0, 0.2)';
                    });
                });


                function getRandomColor() {
                    const letters = '0123456789ABCDEF';
                    let color = '#';
                    for (let i = 0; i < 6; i++) {
                        color += letters[Math.floor(Math.random() * 16)];
                    }
                    return color;
                }

                const blogLis = document.querySelectorAll('.content-container .blog-list ul li');
                blogLis.forEach(li => {
                    li.addEventListener('mouseenter', () => {
                        const randomColor = getRandomColor();
                        li.style.boxShadow = `0 0px 10px ${randomColor}`;
                    });

                    li.addEventListener('mouseleave', () => {
                        li.style.boxShadow = '0 0px 2px rgba(0, 0, 0, 0.2)';
                    });


                    li.addEventListener('click', () => {
                        const blogIdElement = li.querySelector('.blog-id');
                        if (blogIdElement) {
                            const blogId = blogIdElement.textContent;
                            window.location.href = `/blog.html?id=${blogId}`;
                        }
                    });
                });

            }


            //翻页
            /**
             * 更新分页导航
             * @param {Object} pagination - 分页信息
             */
            function updatePagination(pagination) {
                const paginationElement = document.querySelector('.pagination');
                if (!paginationElement) return;
                
                paginationElement.innerHTML = '';
                
                if (pagination.totalPages <= 1) {
                    paginationElement.style.display = 'none';
                    return;
                }
                
                paginationElement.style.display = 'flex';
                
                // 上一页按钮
                const prevButton = document.createElement('button');
                prevButton.className = 'pagination-button prev-button';
                prevButton.innerHTML = '上一页';
                if (pagination.isFirstPage) {
                    prevButton.classList.add('disabled');
                    prevButton.setAttribute('disabled', 'disabled');
                }
                paginationElement.appendChild(prevButton);
                
                // 添加页码输入框
                const pageInput = document.createElement('input');
                pageInput.type = 'number';
                pageInput.className = 'page-input';
                pageInput.min = 1;
                pageInput.max = pagination.totalPages;
                pageInput.value = pagination.currentPage + 1;
                
                // 页码显示
                const pageInfo = document.createElement('div');
                pageInfo.className = 'page-info';
                pageInfo.textContent = `/ ${pagination.totalPages}`;
                
                const pageInputContainer = document.createElement('div');
                pageInputContainer.className = 'page-input-container';
                pageInputContainer.appendChild(pageInput);
                pageInputContainer.appendChild(pageInfo);
                
                paginationElement.appendChild(pageInputContainer);
                
                // 下一页按钮
                const nextButton = document.createElement('button');
                nextButton.className = 'pagination-button next-button';
                nextButton.innerHTML = '下一页';
                if (pagination.isLastPage) {
                    nextButton.classList.add('disabled');
                    nextButton.setAttribute('disabled', 'disabled');
                }
                paginationElement.appendChild(nextButton);
                
                // 为输入框添加事件监听
                pageInput.addEventListener('change', function() {
                    let page = parseInt(this.value) - 1;
                    if (isNaN(page) || page < 0) {
                        page = 0;
                    } else if (page >= pagination.totalPages) {
                        page = pagination.totalPages - 1;
                    }
                    this.value = page + 1;
                    navigateToPage(page);
                });
                
                // 原有的按钮点击事件
                prevButton.addEventListener('click', function() {
                    if (!pagination.isFirstPage) {
                        navigateToPage(pagination.currentPage - 1);
                    }
                });
                
                nextButton.addEventListener('click', function() {
                    if (!pagination.isLastPage) {
                        navigateToPage(pagination.currentPage + 1);
                    }
                });
            }

            /**
             * 导航到指定页面
             * @param {number} page - 目标页码
             */
            function navigateToPage(page) {
                // 更新URL但不刷新页面
                window.history.pushState({}, '', `?page=${page}`);
                
                // 重新加载博客列表
                a1();
            }

            //刷新整体
            {
                refreshSelf();
            }
            
            // 导航栏按钮加载
            {
                document.querySelectorAll('.nav-button').forEach(button => {
                    button.addEventListener('click', function () {
                        const target = this.getAttribute('href');
                        if (target.startsWith('http')) {
                            window.open(target, '_blank'); 
                        } else {
                            window.location.href = target; 
                        }
                    });
                });

            }
            // 底部分页
            {
                pageSplit();

            }
        }

        a1();
        
        // 监听浏览器前进后退按钮
        window.addEventListener('popstate', () => {
            a1();
        });
    }
});