document.addEventListener('DOMContentLoaded', function () {
    // 等待blog.js加载完markdown内容后再初始化目录
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList' && mutation.target.id === 'markdown-content') {
                // 确保内容已经加载
                if (mutation.target.children.length > 0) {
                    const tocContainer = initializeTOC();
                    if (tocContainer) {
                        createTocToggleButton(tocContainer);
                    }
                    observer.disconnect(); // 停止观察
                }
            }
        });
    });

    // 配置观察选项
    const config = { childList: true, subtree: true };
    const markdownContent = document.querySelector('#markdown-content');
    observer.observe(markdownContent, config);
    
    // 添加标志变量，用于跟踪用户是否刚点击过目录项
    window.tocItemClicked = false;

    // 更新可见的目录项
    function updateVisibleItems(currentHeadingId, tocListElement, showAll = false) {
        // 获取当前活动的标题元素
        const activeLink = tocListElement.querySelector(`a[href="#${currentHeadingId}"]`);
        if (!activeLink) return;

        // 获取当前标题的层级
        const activeLi = activeLink.parentElement;
        const activeLevel = activeLi.className; // 例如 'h2', 'h3' 等

        // 重置所有标题项的可见性
        const allItems = tocListElement.querySelectorAll('li');
        
        if (showAll) {
            // 显示所有标题
            allItems.forEach(item => {
                const link = item.querySelector('a');
                // 移除active类，除非是当前活动项
                if (!link.getAttribute('href').includes(currentHeadingId)) {
                    link.classList.remove('active');
                }
                // 移除隐藏文本的类，显示所有文本
                link.classList.remove('text-hidden');
                link.style.visibility = 'visible';
            });
            return;
        }

        // 隐藏所有标题文本，但保留横条
        allItems.forEach(item => {
            const link = item.querySelector('a');
            // 移除active类，让CSS控制非活动项的颜色
            link.classList.remove('active');
            // 添加一个类来隐藏文本但保持横条可见
            link.classList.add('text-hidden');
            // 确保链接本身是可见的
            link.style.visibility = 'visible';
        });

        // 获取当前标题的所有父级标题
        const parentHeadings = [];
        let currentLevel = parseInt(activeLevel.replace('h', ''));
        let currentItem = activeLi;

        while (currentLevel > 1) {
            currentLevel--;
            // 从当前元素向前查找最近的父级标题
            let prevSibling = currentItem;
            while (prevSibling) {
                prevSibling = prevSibling.previousElementSibling;
                if (prevSibling && prevSibling.classList.contains(`h${currentLevel}`)) {
                    parentHeadings.push(prevSibling);
                    currentItem = prevSibling;
                    break;
                }
            }
        }

        // 显示当前标题和父级标题
        const link = activeLi.querySelector('a');
        link.classList.add('active'); // 使用CSS类控制高亮
        link.classList.remove('text-hidden'); // 确保文本可见
        link.style.visibility = 'visible';

        parentHeadings.forEach(heading => {
            const link = heading.querySelector('a');
            // 移除可能存在的active类，确保只有当前项有高亮
            link.classList.remove('active');
            // 移除隐藏文本的类，确保文本可见
            link.classList.remove('text-hidden');
            link.style.visibility = 'visible';
        });
    }

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
            return null;
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
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetHeading = document.querySelector(this.getAttribute('href'));
                
                // 使用与updateTocHighlight相同的计算方式，确保一致性
                const offset = targetHeading.offsetTop - (window.innerHeight / 4) + (targetHeading.offsetHeight / 2);

                // 先移除所有高亮
                tocLinks.forEach(link => link.classList.remove('active'));
                // 为当前点击的链接添加高亮
                this.classList.add('active');
                
                // 更新当前高亮标题
                currentHeading = { id: targetHeading.id };
                
                // 设置标志，表示用户点击了目录项，不要立即隐藏其他标题
                window.tocItemClicked = true;
                // 显示所有标题（传入showAll=true）
                updateVisibleItems(targetHeading.id, tocList, true);

                // 设置一个标志，表示用户点击了目录项（用于防止滚动事件触发高亮更新）
                window.tocLinkClicked = true;
                
                // 执行滚动
                window.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });

                // 使用滚动事件监听器来检测滚动完成，而不是固定时间
                const scrollEndDetection = function() {
                    // 检测滚动是否已经停止
                    if (Math.abs(window.scrollY - offset) < 5 || 
                        (window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                        // 滚动已完成或已到达页面底部
                        window.tocLinkClicked = false;
                        window.removeEventListener('scroll', scrollEndDetection);
                    }
                };
                
                window.addEventListener('scroll', scrollEndDetection);
                
                // 设置一个备用超时，确保标志最终会被重置
                setTimeout(() => {
                    window.tocLinkClicked = false;
                    window.removeEventListener('scroll', scrollEndDetection);
                }, 2000); // 延长超时时间，确保长页面有足够时间滚动
            });

            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });

        // 监听滚动事件，更新目录高亮状态
        let tocLinks = tocList.querySelectorAll('a');
        let headingPositions = [];
        let currentHeading = null;

        // 防抖函数
        function debounce(func, wait) {
            let timeout;
            return function () {
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
                top: heading.offsetTop,
                height: heading.offsetHeight,
                element: heading // 存储元素引用以便快速访问
            }));
            console.log('更新标题位置:', headingPositions.map(h => ({id: h.id, top: h.top})));
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
            const viewportHeight = window.innerHeight;
            const referencePoint = viewportHeight / 4; // 使用视口的1/4位置作为参考点，与点击滚动保持一致
            
            // 找到当前可见的标题
            if (headingPositions.length > 0) {
                // 初始化变量
                let newCurrentHeading = null;
                let bestScore = -Infinity;
                
                // 为每个标题计算一个可见性得分
                for (let i = 0; i < headingPositions.length; i++) {
                    const position = headingPositions[i];
                    const heading = position.element || document.getElementById(position.id);
                    
                    if (!heading) continue;
                    
                    const rect = heading.getBoundingClientRect();
                    const headingTop = rect.top;
                    const headingBottom = rect.bottom;
                    const headingHeight = rect.height;
                    
                    // 计算标题的可见性得分
                    let score = 0;
                    
                    // 标题完全在视口内得高分
                    if (headingTop >= 0 && headingBottom <= viewportHeight) {
                        score += 100;
                    }
                    
                    // 标题部分在视口内得中等分数
                    else if ((headingTop < 0 && headingBottom > 0) || 
                             (headingTop < viewportHeight && headingBottom > viewportHeight)) {
                        score += 50;
                    }
                    
                    // 标题完全在视口外得低分或负分
                    else {
                        // 如果标题在视口上方，分数随距离增加而减少
                        if (headingBottom < 0) {
                            score -= Math.min(100, Math.abs(headingBottom) / 10);
                        }
                        // 如果标题在视口下方，分数随距离增加而减少
                        else {
                            score -= Math.min(100, (headingTop - viewportHeight) / 10);
                        }
                    }
                    
                    // 接近参考点的标题得额外加分
                    const distanceToReference = Math.abs(headingTop - referencePoint);
                    const referenceBonus = Math.max(0, 50 - (distanceToReference / 10));
                    score += referenceBonus;
                    
                    // 如果是当前标题，给予一些惯性加分以避免频繁切换
                    if (currentHeading && position.id === currentHeading.id) {
                        score += 20;
                    }
                    
                    // 更新最佳标题
                    if (score > bestScore) {
                        bestScore = score;
                        newCurrentHeading = position;
                    }
                }
                
                // 只有当高亮标题变化时才更新DOM
                if (newCurrentHeading && (!currentHeading || currentHeading.id !== newCurrentHeading.id)) {
                    currentHeading = newCurrentHeading;
                    console.log('当前高亮标题:', currentHeading.id);
                    
                    // 更新高亮状态
                    tocLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${currentHeading.id}`) {
                            link.classList.add('active');
                        }
                    });

                    // 更新可见性：如果用户没有点击过目录项或鼠标不在目录上，则只显示当前标题及其父级标题
                    // 否则保持所有标题可见
                    if (!window.tocItemClicked) {
                        updateVisibleItems(currentHeading.id, tocList);
                    }
                }
            }
        }
        
        // 监听内容变化，更新位置信息
        const contentObserver = new MutationObserver(debounce(() => {
            console.log('内容变化，更新标题位置');
            updateHeadingPositions();
            updateTocHighlight();
        }, 100));
        
        contentObserver.observe(content, { childList: true, subtree: true });

        // 初始化高亮状态
        if (headingPositions.length > 0) {
            updateTocHighlight();
            updateVisibleItems(headingPositions[0].id, tocList);
        }

        // 监听滚动事件，更新目录高亮状态 - 使用更合适的防抖时间
        window.addEventListener('scroll', debounce(updateTocHighlight, 100));
        
        // 确保在页面完全加载后再次更新位置
        window.addEventListener('load', () => {
            setTimeout(() => {
                updateHeadingPositions();
                updateTocHighlight();
            }, 500);
        });

        // 添加鼠标进入和离开事件
        tocContainer.addEventListener('mouseenter', () => {
            if (currentHeading) {
                updateVisibleItems(currentHeading.id, tocList, true);
            }
        });

        tocContainer.addEventListener('mouseleave', () => {
            if (currentHeading) {
                // 当鼠标离开目录区域时，如果之前点击过目录项，则隐藏其他标题
                updateVisibleItems(currentHeading.id, tocList, false);
                // 重置点击标志
                window.tocItemClicked = false;
            }
        });

        return tocContainer;
    }

    // 创建TOC切换按钮
    function createTocToggleButton(tocContainer) {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'toc-toggle-button';
        toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path fill="none" d="M0 0h24v24H0z"></path><path fill="currentColor" d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"></path></svg>';
        toggleButton.title = '显示/隐藏目录';
        document.body.appendChild(toggleButton);

        // 添加动画效果
        setTimeout(() => {
            toggleButton.classList.add('visible');
        }, 300);

        // 添加点击事件
        toggleButton.addEventListener('click', function () {
            if (tocContainer) {
                if (tocContainer.classList.contains('toc-visible')) {
                    tocContainer.classList.remove('toc-visible');
                } else {
                    tocContainer.classList.add('toc-visible');
                }
            }
        });

        // 监听窗口大小变化
        window.addEventListener('resize', function () {
            if (tocContainer) {
                // 在小屏幕上自动隐藏TOC
                if (window.innerWidth <= 1200) {
                    toggleButton.style.display = 'flex';
                    tocContainer.classList.remove('toc-visible');
                } else {
                    toggleButton.style.display = 'none';
                    tocContainer.classList.add('toc-visible');
                }
            }
        });

        // 初始化状态
        if (window.innerWidth <= 1200) {
            toggleButton.style.display = 'flex';
        } else {
            toggleButton.style.display = 'none';
            tocContainer.classList.add('toc-visible');
        }
    }

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
});