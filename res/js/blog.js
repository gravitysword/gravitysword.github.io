import { BLOG_getBlog, BLOG_getBlogItems } from '/res/js/blog_msg.js';

document.addEventListener('DOMContentLoaded', () => {

    {
        async function a1() {
            // 加载数据
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const blogId = urlParams.get('id');
                console.log(`Blog ID: ${blogId}`);

                const response = await fetch(`/blog/${blogId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const markdown = await response.text();
                const html = marked.parse(markdown);
                document.getElementById('markdown-content').innerHTML = html;

                const blog_details = await BLOG_getBlog(blogId);
                console.log('Blog Details:', blog_details);

                document.querySelector('.title').textContent = blog_details["title"];
                document.querySelector('.blog-date').textContent = blog_details["date"];

                const weatherElement = document.querySelector('.weather');
                if (weatherElement) {
                    if (blog_details["weather"] === "") {
                        weatherElement.style.display = 'none';
                        console.log("天气信息为空，隐藏天气图标");
                    } else {
                        weatherElement.setAttribute('src', `/res/media/svg/weather/${blog_details["weather"]}.svg`);
                    }
                } else {
                    console.warn("未找到 .weather 元素");
                }

                let tag = "";
                for (const tag_item of blog_details["tag"]) {
                    tag += `<span class="blog-tag">${tag_item}</span>`;
                }
                document.querySelector('.blog-introduce').innerHTML += tag;

                document.querySelectorAll('p').forEach(p => {
                    if (p.parentElement.tagName.toLowerCase() !== 'li') {
                        const parts = p.innerHTML.split('<br>');
                        const modifiedParts = parts.map(part => `&emsp;&emsp;${part}`);
                        p.innerHTML = modifiedParts.join('<br>');
                    }
                });
            } catch (error) {
                console.error('Error loading blog:', error);
            }

            //分享
            {
                const shareButton = document.getElementsByClassName('share-button')[0];
                const articleTitle = document.querySelector('.title').textContent;
                const articleUrl = window.location.href;
                const articleTime = document.querySelector('.blog-date').textContent;
                let shareContent = `泛舟游客的博客：《${articleTitle}》已于${articleTime}发布，点击查看：${articleUrl}`
                shareButton.addEventListener('click', () => {
                    try {
                        navigator.clipboard.writeText(shareContent)
                            .then(() => {
                                alert('URL 已成功复制到剪贴板');
                            })
                            .catch(err => {
                                alert('无法复制 URL');
                            });
                    } catch (error) {
                        alert('复制 URL 时出错');
                    }
                });
            }

        }

        a1();
    }
});