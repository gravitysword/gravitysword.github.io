import { BLOG_getContent } from '/res/js/blog_msg.js';

// 配置marked解析器选项
const markedOptions = {
    gfm: true, // GitHub风格Markdown
    breaks: true, // 允许回车换行
    pedantic: false, // 尽可能地兼容markdown.pl
    smartLists: true, // 使用比原生markdown更时髦的列表
    smartypants: true, // 使用更为时髦的标点
    xhtml: true, // 使用xhtml闭合标签
    html: true, // 允许HTML标签
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

// 图片放大功能
const initImageZoom = () => {
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.style.display = 'none';
  
  const modalImg = document.createElement('img');
  modalImg.className = 'modal-image';
  modalImg.crossOrigin = 'anonymous';
  modalImg.referrerPolicy = 'no-referrer';
  modalImg.onerror = function() {
    this.src = '/res/media/svg/sys/image-error.svg';
    this.onerror = null;
  };
  
  const closeBtn = document.createElement('div');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '×';
  
  modal.appendChild(modalImg);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);

  const showImage = (src) => {
    modalImg.classList.remove('active');
    modal.style.display = 'flex';
    modalImg.src = src;
    // 禁用目录功能
    const tocContainer = document.querySelector('.toc-container');
    const tocToggleButton = document.querySelector('.toc-toggle-button');
    if (tocContainer) {
      tocContainer.style.display = 'none';
    }
    if (tocToggleButton) {
      tocToggleButton.style.display = 'none';
    }
    requestAnimationFrame(() => {
      modalImg.classList.add('active');
    });
  };

  const closeModal = () => {
    modalImg.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
      modalImg.src = '';
      // 重新启用目录功能
      const tocContainer = document.querySelector('.toc-container');
      const tocToggleButton = document.querySelector('.toc-toggle-button');
      if (tocContainer) {
        tocContainer.style.display = '';
      }
      if (tocToggleButton) {
        tocToggleButton.style.display = window.innerWidth <= 1200 ? 'flex' : 'none';
      }
    }, 300);
  };

  const handleImageClick = (e) => {
    if (e.target.tagName === 'IMG' && !e.target.classList.contains('weather')) {
      const originalSrc = e.target.src;
      showImage(originalSrc);
    }
  };

  document.addEventListener('click', handleImageClick);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
};

// 添加视频错误处理
const handleVideoError = () => {
    document.querySelectorAll('video').forEach(video => {
        if (!video.hasAttribute('onerror')) {
            video.crossOrigin = 'anonymous';
            video.onerror = function() {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'video-error';
                errorMsg.textContent = '视频加载失败';
                this.parentNode.insertBefore(errorMsg, this);
                this.style.display = 'none';
            };
            video.setAttribute('onerror', 'true');
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    initImageZoom();
    {
        async function a1() {
            // 加载数据
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const blogId = urlParams.get('id');
                console.log(`Blog ID: ${blogId}`);

                const response = await fetch(`${blogId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const markdown = await response.text();
                // 使用配置的选项解析markdown
                const html = marked.parse(markdown, markedOptions);
                document.getElementById('markdown-content').innerHTML = html;
                // 为所有视频元素添加跨域属性
                document.querySelectorAll('video').forEach(video => {
                    video.crossOrigin = 'anonymous';
                });
                
                // 处理视频错误
                handleVideoError();
                
                // 添加视频时间跳转功能
                document.querySelectorAll('.video-time-jump').forEach(span => {
                    span.addEventListener('click', function() {
                        const timeStr = this.textContent.trim();
                        const bindId = this.getAttribute('bind-id');
                        const video = document.querySelector(`video[video-id="${bindId}"]`);
                        console.log(`Video ID: ${bindId}`);
                        if (video) {
                            const timeParts = timeStr.split(':').map(Number);
                            let seconds = 0;
                            
                            if (timeParts.length === 3) {
                                // 格式为 HH:MM:SS
                                seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                            } else if (timeParts.length === 2) {
                                // 格式为 MM:SS
                                seconds = timeParts[0] * 60 + timeParts[1];
                            }
                            
                            video.currentTime = seconds;
                            video.play();
                        }
                    });
                });
                
               
                
                

                const blog_details = await BLOG_getContent(blogId);
                console.log('Blog Details:', blog_details);

                document.querySelector('.title').textContent = blog_details["title"];
                document.querySelector('.blog-date').textContent = blog_details["date"];

                const weatherElement = document.querySelector('.weather');
                if (weatherElement) {
                    if (blog_details["weather"] === "" || blog_details["weather"] === undefined) {
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

                // 添加文件链接跳转功能
                document.querySelectorAll('files').forEach(fileElement => {
                    fileElement.style.cursor = 'pointer'; // 添加指针样式，提示用户可点击
                    fileElement.addEventListener('click', async function() {
                        const fileId = this.getAttribute('file-id');
                        if (!fileId) {
                            console.error('File element is missing an id attribute.');
                            alert('文件元素缺少ID属性。');
                            return;
                        }
                        try {
                            // 获取files.json配置
                            const response = await fetch('/config/files.json');
                            if (!response.ok) {
                                throw new Error(`HTTP error! Status: ${response.status} when fetching files.json`);
                            }
                            const config = await response.json();
                            const fileData = config.file[fileId];

                            if (fileData && fileData.id) {
                                const host = config.host;
                                const Url = host + fileData.id;
                                window.location.href = Url;

        
                                
                            } else {
                                console.error(`File with id "${fileId}" not found or has no ID in files.json.`);
                                alert(`未能找到文件 "${this.textContent.trim()}" 的链接信息。`);
                            }
                        } catch (error) {
                            console.error('Error processing file link:', error);
                            alert('处理文件链接时出错，请检查控制台获取更多信息。');
                        }
                    });
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

            // 在markdown内容渲染完成后执行KaTeX渲染
            renderMathInElement(document.getElementById("markdown-content"), {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false}
                ],
                throwOnError: false
            });

        }

        a1();
    }
});
