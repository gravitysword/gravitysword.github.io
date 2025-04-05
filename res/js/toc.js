document.addEventListener('DOMContentLoaded', function() {
    // 等待blog.js加载完markdown内容后再初始化目录
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.id === 'markdown-content') {
                // 确保内容已经加载
                if (mutation.target.children.length > 0) {
                    initializeTOC();
                    observer.disconnect(); // 停止观察
                }
            }
        });
    });

    // 配置观察选项
    const config = { childList: true, subtree: true };
    const markdownContent = document.querySelector('#markdown-content');
    observer.observe(markdownContent, config);

    // 初始化目录功能
    function initializeTOC() {
        // 创建目录容器
        const tocContainer = document.createElement('div');
        tocContainer.className = 'toc-container';
        document.body.appendChild(tocContainer);

        // 获取所有标题元素
        const content = document.querySelector('#markdown-content');
        const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        if (headings.length === 0) {
            tocContainer.style.display = 'none';
            return;
        }

        // 创建目录列表
        const tocList = document.createElement('ul');
        tocContainer.appendChild(tocList);

        // 为每个标题创建目录项
        headings.forEach((heading, index) => {
            // 为标题添加ID
            if (!heading.id) {
                heading.id = `heading-${index}`;
            }

            // 创建目录项
            const listItem = document.createElement('li');
            listItem.className = heading.tagName.toLowerCase();
            
            const link = document.createElement('a');
            link.href = `#${heading.id}`;
            link.textContent = heading.textContent;
            
            // 添加点击事件，实现平滑滚动
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetHeading = document.querySelector(this.getAttribute('href'));
                const offset = targetHeading.offsetTop - (window.innerHeight / 2) + (targetHeading.offsetHeight / 2);
                
                // 先移除所有高亮
                tocLinks.forEach(link => link.classList.remove('active'));
                // 为当前点击的链接添加高亮
                this.classList.add('active');
                
                // 设置一个标志，表示用户点击了目录项
                window.tocLinkClicked = true;
                // 存储当前点击的链接，以便在滚动事件中使用
                window.clickedTocLink = this;
                
                window.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });
                
                // 滚动完成后重置标志
                setTimeout(() => {
                    window.tocLinkClicked = false;
                }, 1000); // 假设滚动在1秒内完成
            });

            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });

        // 监听滚动事件，更新目录高亮状态
        let tocLinks = tocList.querySelectorAll('a');
        let headingPositions = [];

        // 防抖函数
        function debounce(func, wait) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        }

        // 更新标题位置信息
        function updateHeadingPositions() {
            headingPositions = Array.from(headings).map(heading => ({
                id: heading.id,
                top: heading.offsetTop - (window.innerHeight / 4)
            }));
        }

        // 初始更新位置信息
        updateHeadingPositions();

        // 监听窗口大小变化，更新位置信息
        window.addEventListener('resize', debounce(updateHeadingPositions, 100));

        // 更新目录高亮状态
        function updateTocHighlight() {
            // 如果是由点击目录项触发的滚动，则跳过自动高亮更新
            if (window.tocLinkClicked) {
                return;
            }
            
            const scrollPosition = window.scrollY;

            // 找到当前可见的标题
            let currentHeading = headingPositions[0];
            for (let position of headingPositions) {
                if (scrollPosition >= position.top) {
                    currentHeading = position;
                } else {
                    break;
                }
            }

            // 更新高亮状态
            tocLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentHeading.id}`) {
                    link.classList.add('active');
                }
            });
        }

        // 添加滚动监听
        window.addEventListener('scroll', debounce(updateTocHighlight, 50));

        // 初始化高亮状态
        updateTocHighlight();

        // 检查URL中是否有锚点，如果有则滚动到对应位置
        if (window.location.hash) {
            const targetHeading = document.querySelector(window.location.hash);
            if (targetHeading) {
                setTimeout(() => {
                    const offset = targetHeading.offsetTop - (window.innerHeight / 4) + (targetHeading.offsetHeight / 2);
                    window.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }

        // 创建TOC切换按钮
        createTocToggleButton(tocContainer);
    }

    // 创建TOC切换按钮
    function createTocToggleButton(tocContainer) {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'toc-toggle-button';
        toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"></path><path fill="currentColor" d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"></path></svg>';
        toggleButton.title = '显示/隐藏目录';
        document.body.appendChild(toggleButton);
        
        // 添加动画效果
        setTimeout(() => {
            toggleButton.classList.add('visible');
        }, 500);

        // 添加点击事件
        toggleButton.addEventListener('click', function() {
            if (tocContainer) {
                if (tocContainer.classList.contains('toc-visible')) {
                    tocContainer.classList.remove('toc-visible');
                } else {
                    tocContainer.classList.add('toc-visible');
                }
            }
        });

        // 监听窗口大小变化
        window.addEventListener('resize', function() {
            if (tocContainer) {
                // 在小屏幕上自动隐藏TOC
                if (window.innerWidth <= 1200) {
                    toggleButton.style.display = 'flex';
                    tocContainer.classList.remove('toc-visible');
                } else {
                    toggleButton.style.display = 'none';
                    tocContainer.classList.remove('toc-visible');
                }
            }
        });

        // 初始化状态
        if (window.innerWidth <= 1200) {
            toggleButton.style.display = 'flex';
        } else {
            toggleButton.style.display = 'none';
        }
    }
});