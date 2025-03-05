import { BLOG_getBlog, BLOG_getBlogItems } from '/res/js/blog_msg.js';

document.addEventListener('DOMContentLoaded', () => {
    async function initBlogPage() {
        try {
            // 1. 获取博客ID并加载内容
            const urlParams = new URLSearchParams(window.location.search);
            const blogId = urlParams.get('id');
            console.log(`Blog ID: ${blogId}`);

            // 2. 获取并渲染Markdown内容
            const response = await fetch(`/blog/${blogId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const markdown = await response.text();
            const html = marked.parse(markdown);
            document.getElementById('markdown-content').innerHTML = html;

            // 3. 获取博客元数据并更新页面
            const blogDetails = await BLOG_getBlog(blogId);
            console.log('Blog Details:', blogDetails);
            updateBlogMetadata(blogDetails);
            
            // 4. 格式化段落文本（添加首行缩进）
            formatParagraphs();
            
            // 5. 生成目录
            generateTableOfContents();
            
            // 6. 设置分享功能
            setupShareButton(blogDetails);
            
        } catch (error) {
            console.error('Error loading blog:', error);
        }
    }
    
    /**
     * 更新博客元数据（标题、日期、天气、标签）
     */
    function updateBlogMetadata(blogDetails) {
        // 更新标题和日期
        document.querySelector('.title').textContent = blogDetails.title;
        document.querySelector('.blog-date').textContent = blogDetails.date;

        // 处理天气图标
        const weatherElement = document.querySelector('.weather');
        if (weatherElement) {
            if (!blogDetails.weather) {
                weatherElement.style.display = 'none';
            } else {
                weatherElement.setAttribute('src', `/res/media/svg/weather/${blogDetails.weather}.svg`);
            }
        }

        // 添加标签
        let tagsHtml = "";
        for (const tag of blogDetails.tag) {
            tagsHtml += `<span class="blog-tag">${tag}</span>`;
        }
        document.querySelector('.blog-introduce').innerHTML += tagsHtml;
    }
    
    /**
     * 为段落添加首行缩进
     */
    function formatParagraphs() {
        document.querySelectorAll('p').forEach(paragraph => {
            if (paragraph.parentElement.tagName.toLowerCase() !== 'li') {
                const parts = paragraph.innerHTML.split('<br>');
                const indentedParts = parts.map(part => `&emsp;&emsp;${part}`);
                paragraph.innerHTML = indentedParts.join('<br>');
            }
        });
    }
    
    /**
     * 设置分享按钮功能
     */
    function setupShareButton(blogDetails) {
        const shareButton = document.getElementsByClassName('share-button')[0];
        if (!shareButton) return;
        
        const articleTitle = blogDetails.title;
        const articleUrl = window.location.href;
        const articleTime = blogDetails.date;
        const shareContent = `泛舟游客的博客：《${articleTitle}》已于${articleTime}发布，点击查看：${articleUrl}`;
        
        shareButton.addEventListener('click', () => {
            try {
                navigator.clipboard.writeText(shareContent)
                    .then(() => alert('URL 已成功复制到剪贴板'))
                    .catch(() => alert('无法复制 URL'));
            } catch (error) {
                alert('复制 URL 时出错');
            }
        });
    }

    /**
     * 生成文章目录
     */
    function generateTableOfContents() {
        const content = document.getElementById('markdown-content');
        const toc = document.querySelector('.toc-content');
        if (!content || !toc) return;
        
        const headings = content.querySelectorAll('h2, h3, h4, h5, h6');

        // 如果没有标题，隐藏目录容器
        if (headings.length === 0) {
            const tocContainer = document.querySelector('.toc-container');
            if (tocContainer) tocContainer.style.display = 'none';
            return;
        }

        // 为每个标题创建目录项
        headings.forEach((heading, index) => {
            // 为标题添加ID以便跳转
            const id = `heading-${index}`;
            heading.id = id;

            // 创建目录链接
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = heading.textContent;
            link.className = `toc-${heading.tagName.toLowerCase()}`; // 根据标题级别添加类名

            // 添加平滑滚动效果
            link.addEventListener('click', (e) => {
                e.preventDefault();
                heading.scrollIntoView({ behavior: 'smooth' });
            });

            toc.appendChild(link);
        });

        // 添加滚动监听，高亮当前阅读位置
        setupScrollHighlight(headings);
    }
    
    /**
     * 设置滚动高亮功能
     */
    function setupScrollHighlight(headings) {
        const tocLinks = document.querySelectorAll('.toc-content a');
        const headingElements = Array.from(headings);
        
        window.addEventListener('scroll', () => {
            // 获取当前滚动位置（添加偏移量以提高准确性）
            const scrollPosition = window.scrollY + 100;
            
            // 查找当前可见的标题
            let currentHeadingIndex = -1;
            headingElements.forEach((heading, index) => {
                if (heading.offsetTop <= scrollPosition) {
                    currentHeadingIndex = index;
                }
            });
            
            // 更新高亮状态
            if (currentHeadingIndex >= 0) {
                tocLinks.forEach(link => link.classList.remove('active'));
                tocLinks[currentHeadingIndex].classList.add('active');
            }
        });
    }

    // 初始化页面
    initBlogPage();
});