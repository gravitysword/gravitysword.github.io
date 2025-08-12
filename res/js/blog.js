import { BLOG_getContent,backend } from '/res/js/blog_msg.js';

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

// Markdown内容处理模块
const MarkdownHandler = {
    // 解析并渲染Markdown内容
    async renderMarkdown(blogId) {
        try {
            const response = await fetch(`${blogId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const markdown = await response.text();
            // 使用配置的选项解析markdown
            const html = marked.parse(markdown, markedOptions);
            document.getElementById('markdown-content').innerHTML = html;
            
            // 渲染数学公式
            this.renderMath();
            
            return html;
        } catch (error) {
            console.error('Error loading blog:', error);
            throw error;
        }
    },
    
    // 渲染数学公式
    renderMath() {
        renderMathInElement(document.getElementById("markdown-content"), {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false}
            ],
            throwOnError: false
        });
    }
};

// 博客信息处理模块
const BlogInfoHandler = {
    // 更新博客标题、日期和标签
    updateBlogInfo(blog_details) {
        document.querySelector('.title').textContent = blog_details["subtitle"] ? blog_details["subtitle"] : blog_details["title"];
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
        const metaContainer = document.querySelector('.meta-info');
        const tagContainer = document.createElement('div');
        tagContainer.className = 'meta-item blog-tags';
        tagContainer.innerHTML = tag;
        metaContainer.appendChild(tagContainer);
    }
};

// 代码块处理模块
const CodeBlockHandler = {
    // 为代码块添加语言标签和复制按钮
    addCodeBlockFeatures() {
        document.querySelectorAll('pre code').forEach(codeBlock => {
            const pre = codeBlock.parentElement;
            if (pre.tagName !== 'PRE') return;
            
            // 添加语言标签
            this.addLanguageLabel(codeBlock, pre);
            
            // 添加复制按钮
            this.addCopyButton(codeBlock, pre);
        });
    },
    
    // 添加语言标签
    addLanguageLabel(codeBlock, pre) {
        const classNames = codeBlock.className.split(' ');
        const languageClass = classNames.find(className => className.startsWith('language-'));
        
        if (languageClass) {
            const language = languageClass.replace('language-', '');
            const languageLabel = document.createElement('div');
            languageLabel.className = 'code-language-label';
            languageLabel.textContent = language;
            pre.appendChild(languageLabel);
        }
    },
    
    // 添加复制按钮
    addCopyButton(codeBlock, pre) {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-button';
        copyButton.textContent = '复制';
        copyButton.addEventListener('click', function() {
            const code = codeBlock.textContent;
            
            // 检查剪贴板权限
            if (!navigator.clipboard) {
                // 降级方案：使用传统的复制方法
                const textArea = document.createElement('textarea');
                textArea.value = code;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    copyButton.textContent = '已复制!';
                    setTimeout(() => {
                        copyButton.textContent = '复制';
                    }, 2000);
                } catch (err) {
                    console.error('复制失败:', err);
                    copyButton.textContent = '复制失败';
                    setTimeout(() => {
                        copyButton.textContent = '复制';
                    }, 2000);
                } finally {
                    document.body.removeChild(textArea);
                }
                return;
            }
            
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
        pre.appendChild(copyButton);
    }
};

// 图片处理模块
const ImageHandler = {
  // 初始化图片放大功能
  initImageZoom() {
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
        // 确保错误图标显示为白色
        this.style.filter = 'invert(100%) brightness(100%)';
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
  }
};

// 视频处理模块
const VideoHandler = {
  // 添加视频错误处理
  handleVideoError() {
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
  },
  
  // 添加视频时间跳转功能
  addVideoTimeJump() {
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
  }
};

// 表格处理模块
const TableHandler = {
  // 为表格添加样式和增强功能
  enhanceTables() {
    document.querySelectorAll('table').forEach((table, tableIndex) => {
      table.classList.add('styled-table');
      
      // 添加可访问性标题
      const caption = document.createElement('caption');
      caption.textContent = `数据表格 ${tableIndex + 1}`;
      table.insertBefore(caption, table.firstChild);
      
      // 添加跳过表格链接
      const skipLink = document.createElement('a');
      skipLink.href = `#table-${tableIndex + 1}-end`;
      skipLink.className = 'skip-table';
      skipLink.textContent = '跳过表格';
      table.parentNode.insertBefore(skipLink, table);
      
      // 包装表格
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      
      // 自动识别数据类型
      const headers = table.querySelectorAll('th');
      const rows = table.querySelectorAll('tbody tr');
      
      headers.forEach((header, colIndex) => {
        // 为可排序表头添加tabindex
        if (header.classList.contains('sortable')) {
          header.setAttribute('tabindex', '0');
          header.setAttribute('role', 'button');
          header.setAttribute('aria-sort', 'none');
        }
      });
      
      // 分析每列的数据类型
      headers.forEach((header, colIndex) => {
        const cells = Array.from(rows).map(row => 
          row.cells[colIndex]?.textContent.trim() || ''
        ).filter(text => text);
        
        const dataType = this.detectDataType(cells);
        
        // 为每个单元格添加数据类型属性
        rows.forEach(row => {
          const cell = row.cells[colIndex];
          if (cell) {
            cell.setAttribute('data-type', dataType);
            if (dataType === 'boolean') {
              cell.setAttribute('data-value', 
                cell.textContent.trim().toLowerCase() === 'true' ? 'true' : 'false'
              );
            }
          }
        });
      });
      
      // 键盘导航支持
      table.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'TH' && e.target.classList.contains('sortable')) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.target.click(); // 触发排序
          }
        }
      });
      
      // 添加表格结束标记
      const endMarker = document.createElement('div');
      endMarker.id = `table-${tableIndex + 1}-end`;
      endMarker.style.position = 'absolute';
      endMarker.style.left = '-10000px';
      table.parentNode.insertBefore(endMarker, table.nextSibling);
    });
  },
  
  // 数据类型检测函数
  detectDataType(values) {
    if (values.length === 0) return 'text';
    
    // 检测布尔值
    const boolValues = ['true', 'false', '是', '否', 'yes', 'no', '1', '0'];
    if (values.every(v => boolValues.includes(v.toLowerCase()))) {
      return 'boolean';
    }
    
    // 检测数字
    if (values.every(v => !isNaN(v) && !isNaN(parseFloat(v)))) {
      return 'number';
    }
    
    // 检测货币
    const currencyRegex = /^[¥$￥]?\d+(\.\d{1,2})?$/;
    if (values.every(v => currencyRegex.test(v))) {
      return 'currency';
    }
    
    // 检测百分比
    if (values.every(v => v.endsWith('%') && !isNaN(parseFloat(v.slice(0, -1))))) {
      return 'percentage';
    }
    
    // 检测日期
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/;
    if (values.every(v => dateRegex.test(v))) {
      return 'date';
    }
    
    return 'text';
  }
};

// 文件链接处理模块
const FileLinkHandler = {
  // 添加文件链接跳转功能
  addFileLinkHandler() {
    document.querySelectorAll('files').forEach(fileElement => {
      fileElement.style.cursor = 'pointer'; // 添加指针样式，提示用户可点击

      fileElement.addEventListener('click', async function() {
        let fileId = this.getAttribute('file-id');
        if (!fileId) {
          console.error('File element is missing an id attribute.');
          alert('文件元素缺少ID属性。');
          return;
        }

        let response = await fetch("/config/files.json");
        let files = await response.json(); 
        fileId = files["files"][String(fileId)]["file_id"];

        try {
          // 获取files.json配置
          const config = await backend();
          const host = config.host;
          alert("为防止ddos攻击，请耐心等待5秒");
          location.href = `${host}/file_url/${fileId}`;
        } catch (error) {
          // 出错时移除提示框并显示错误
          console.error('Error processing file link:', error);
          alert('处理文件链接时出错，请检查控制台获取更多信息。');
        }
      });
    });
  }
};

// 分享功能模块
const ShareHandler = {
  // 初始化分享功能
  initShare() {
    const shareButton = document.getElementsByClassName('share-button')[0];
    if (!shareButton) return;
    
    shareButton.addEventListener('click', () => {
      const articleTitle = document.querySelector('.title').textContent;
      const articleUrl = window.location.href;
      const articleTime = document.querySelector('.blog-date').textContent;
      let shareContent = `泛舟游客的博客：《${articleTitle}》已于${articleTime}发布，点击查看：${articleUrl}`;
      
      this.copyToClipboard(shareContent);
    });
  },
  
  // 复制到剪贴板
  copyToClipboard(content) {
    try {
      if (!navigator.clipboard) {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          alert('URL 已成功复制到剪贴板');
        } catch (err) {
          alert('无法复制 URL');
        } finally {
          document.body.removeChild(textArea);
        }
        return;
      }
      
      navigator.clipboard.writeText(content)
        .then(() => {
          alert('URL 已成功复制到剪贴板');
        })
        .catch(err => {
          console.error('复制失败:', err);
          alert('无法复制 URL');
        });
    } catch (error) {
      console.error('复制 URL 时出错:', error);
      alert('复制 URL 时出错');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 初始化图片放大功能
  ImageHandler.initImageZoom();
  
  // 主要初始化函数
  async function initBlog() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const blogId = urlParams.get('id');
      console.log(`Blog ID: ${blogId}`);
      
      // 渲染Markdown内容
      await MarkdownHandler.renderMarkdown(blogId);
      
      // 为所有视频元素添加跨域属性
      document.querySelectorAll('video').forEach(video => {
        video.crossOrigin = 'anonymous';
      });
      
      // 处理视频错误
      VideoHandler.handleVideoError();
      
      // 添加视频时间跳转功能
      VideoHandler.addVideoTimeJump();
      
      // 获取并更新博客信息
      const blog_details = await BLOG_getContent(blogId);
      console.log('Blog Details:', blog_details);
      BlogInfoHandler.updateBlogInfo(blog_details);
      
      // 为代码块添加语言标签显示和复制按钮
      CodeBlockHandler.addCodeBlockFeatures();
      
      // 为表格添加样式和增强功能
      TableHandler.enhanceTables();
      
      // 添加文件链接跳转功能
      FileLinkHandler.addFileLinkHandler();
      
      // 初始化分享功能
      ShareHandler.initShare();
    } catch (error) {
      console.error('Error loading blog:', error);
    }
  }
  
  // 执行初始化
  initBlog();
});
