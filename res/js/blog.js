import { BLOG_getBlog, BLOG_getBlogItems } from '/res/js/blog_msg.js';

// 配置marked解析器选项
const markedOptions = {
    gfm: true, // GitHub风格Markdown
    breaks: true, // 允许回车换行
    pedantic: false, // 尽可能地兼容markdown.pl
    smartLists: true, // 使用比原生markdown更时髦的列表
    smartypants: true, // 使用更为时髦的标点
    highlight: function(code, lang) {
        // 如果有语言标识且有hljs库，则进行高亮
        if (lang && window.hljs) {
            try {
                return window.hljs.highlight(code, { language: lang }).value;
            } catch (e) {
                console.error('语法高亮错误:', e);
            }
        }
        return code; // 如果没有语言标识或没有hljs库，则返回原代码
    }
};

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
                // 使用配置的选项解析markdown
                const html = marked.parse(markdown, markedOptions);
                document.getElementById('markdown-content').innerHTML = html;
                
                // 初始化MathJax渲染LaTeX公式
                if (window.MathJax) {
                    MathJax.typesetPromise().catch(err => {
                        console.error('MathJax渲染错误:', err);
                    });
                }
                
                

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
                    tag += `<span class="blog-tag">#${tag_item}</span>`;
                }
                document.querySelector('.blog-introduce').innerHTML += tag;

                // 改进段落缩进方式，使用CSS类而不是直接修改HTML
                document.querySelectorAll('p').forEach(p => {
                    if (p.parentElement.tagName.toLowerCase() !== 'li' && 
                        p.parentElement.tagName.toLowerCase() !== 'blockquote') {
                        p.classList.add('indented-paragraph');
                    }
                });
                
                // 为代码块添加语言标签显示
                document.querySelectorAll('pre code').forEach(codeBlock => {
                    const classNames = codeBlock.className.split(' ');
                    const languageClass = classNames.find(className => className.startsWith('language-'));
                    
                    if (languageClass) {
                        const language = languageClass.replace('language-', '');
                        const languageLabel = document.createElement('div');
                        languageLabel.className = 'code-language-label';
                        languageLabel.textContent = language;
                        codeBlock.parentElement.insertBefore(languageLabel, codeBlock);
                    }
                    
                    // 添加复制按钮
                    const copyButton = document.createElement('button');
                    copyButton.className = 'copy-code-button';
                    copyButton.textContent = '复制';
                    copyButton.addEventListener('click', function() {
                        const code = codeBlock.textContent;
                        navigator.clipboard.writeText(code).then(() => {
                            copyButton.textContent = '已复制!';
                            setTimeout(() => {
                                copyButton.textContent = '复制';
                            }, 2000);
                        }).catch(err => {
                            console.error('复制失败:', err);
                            copyButton.textContent = '复制失败';
                            setTimeout(() => {
                                copyButton.textContent = '复制';
                            }, 2000);
                        });
                    });
                    codeBlock.parentElement.insertBefore(copyButton, codeBlock);
                });
                
                // 为表格添加样式
                document.querySelectorAll('table').forEach(table => {
                    table.classList.add('styled-table');
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-wrapper';
                    table.parentNode.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
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