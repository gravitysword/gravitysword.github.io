import { BLOG_getContent,backend,CORS_file_config } from '/res/js/blog_msg.js';


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
    // 为代码块添加语言标签、复制按钮和折叠功能
    addCodeBlockFeatures() {
        document.querySelectorAll('pre code').forEach(codeBlock => {
            const pre = codeBlock.parentElement;
            if (pre.tagName !== 'PRE') return;
            
            // 添加语言标签
            this.addLanguageLabel(codeBlock, pre);
            
            // 添加复制按钮
            this.addCopyButton(codeBlock, pre);
            
            // 添加折叠功能
            this.addCodeCollapse(codeBlock, pre);
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
    },
    
    // 添加代码折叠功能
    addCodeCollapse(codeBlock, pre) {
        const codeContent = codeBlock.textContent;
        const codeLines = codeContent.split('\n');
        
        // 创建顶部折叠控制器
        const topCollapseButton = document.createElement('button');
        topCollapseButton.className = 'code-collapse-button';
        topCollapseButton.textContent = '展开';
        topCollapseButton.setAttribute('aria-expanded', 'false');
        
        // 创建底部折叠按钮（在展开状态时显示）
        const bottomCollapseButton = document.createElement('button');
        bottomCollapseButton.className = 'code-collapse-bottom-button';
        bottomCollapseButton.textContent = '折叠';
        bottomCollapseButton.style.display = 'none'; // 初始隐藏
        
        // 保存原始内容和前5行内容
        const originalContent = codeContent;
        const previewLines = codeLines.slice(0, 5);
        const previewContent = previewLines.join('\n') + (codeLines.length > 5 ? '\n...' : '');
        
        let isCollapsed = true;
        
        // 默认折叠代码块
        codeBlock.textContent = previewContent;
        pre.classList.add('code-collapsed');
        
        // 折叠/展开功能
        const toggleCollapse = () => {
            isCollapsed = !isCollapsed;
            
            if (isCollapsed) {
                // 折叠状态：显示前三行
                codeBlock.textContent = previewContent;
                topCollapseButton.textContent = '展开';
                topCollapseButton.setAttribute('aria-expanded', 'false');
                bottomCollapseButton.style.display = 'none';
                pre.classList.add('code-collapsed');
            } else {
                // 展开状态：显示全部内容
                codeBlock.textContent = originalContent;
                topCollapseButton.textContent = '折叠';
                topCollapseButton.setAttribute('aria-expanded', 'true');
                bottomCollapseButton.style.display = 'block';
                pre.classList.remove('code-collapsed');
            }
            
            // 重新应用Prism高亮
            this.reapplyPrismHighlighting(codeBlock);
        };
        
        // 为两个按钮添加相同的事件处理
        topCollapseButton.addEventListener('click', toggleCollapse);
        bottomCollapseButton.addEventListener('click', toggleCollapse);
        
        pre.appendChild(topCollapseButton);
        pre.appendChild(bottomCollapseButton);
    },
    
    // 重新应用Prism高亮
    reapplyPrismHighlighting(codeBlock) {
        // 确保Prism已加载
        if (typeof window.Prism !== 'undefined') {
            // 清除已有的高亮样式
            const existingSpans = codeBlock.querySelectorAll('.token');
            existingSpans.forEach(span => {
                const parent = span.parentNode;
                parent.insertBefore(document.createTextNode(span.textContent), span);
                parent.removeChild(span);
            });
            
            // 合并相邻的文本节点
            codeBlock.normalize();
            
            // 重新应用高亮
            window.Prism.highlightElement(codeBlock);
            
            console.log('Prism highlighting reapplied');
        } else {
            // 如果Prism还未加载，延迟执行
            setTimeout(() => {
                this.reapplyPrismHighlighting(codeBlock);
            }, 100);
        }
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
  },

  // 识别图片alt属性并添加注释
  addImageCaptions() {
    const content = document.getElementById('markdown-content');
    if (!content) return;

    // 查找所有图片元素（排除天气图标）
    const images = content.querySelectorAll('img:not(.weather)');
    
    images.forEach(img => {
      const altText = img.getAttribute('alt');
      
      // 如果有alt属性且不为空，添加注释
      if (altText && altText.trim()) {
        // 创建注释容器
        const caption = document.createElement('div');
        caption.className = 'image-caption';
        caption.textContent = altText.trim();
        
        // 将图片包装在容器中
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        
        // 如果图片已经有父元素，将wrapper插入到相同位置
        if (img.parentNode) {
          img.parentNode.insertBefore(wrapper, img);
          wrapper.appendChild(img);
          wrapper.appendChild(caption);
        }
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
      // 添加键盘可访问性
      span.setAttribute('tabindex', '0');
      span.setAttribute('role', 'button');
      span.setAttribute('aria-label', `跳转到视频时间点: ${span.textContent.trim()}`);
      
      const handleJump = function() {
        const timeStr = this.textContent.trim();
        const bindId = this.getAttribute('bind-id');
        const video = document.querySelector(`video[video-id="${bindId}"]`);
        
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
          
          // 添加跳转动画
          this.classList.add('jumping');
          setTimeout(() => {
            this.classList.remove('jumping');
          }, 600);
          
          // 跳转到指定时间并播放
          video.currentTime = seconds;
          video.play().catch(error => {
            console.warn('视频播放失败:', error);
          });
          
          // 高亮效果：滚动到视频位置
          video.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // 添加视频边框高亮效果
          video.style.boxShadow = '0 0 20px rgba(255, 107, 102, 0.6)';
          setTimeout(() => {
            video.style.boxShadow = '';
          }, 1000);
        } else {
          console.warn(`未找到视频元素，video-id: ${bindId}`);
        }
      };
      
      // 点击事件
      span.addEventListener('click', handleJump);
      
      // 键盘事件
      span.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleJump.call(this);
        }
      });
    });
  }
};

// 段落缩进处理模块
const ParagraphIndentHandler = {
  // 为文章段落添加缩进
  addParagraphIndent() {
    const content = document.getElementById('markdown-content');
    if (!content) return;

    // 等待内容完全渲染
    setTimeout(() => {
      this.processContent(content);
    }, 100);
  },

  // 处理内容区域的段落缩进
  processContent(content) {
    // 处理现有的p标签
    this.handleExistingParagraphs(content);
    
    // 处理br标签分割的文本
    this.handleBrTags(content);
  },

  // 处理现有的p标签
  handleExistingParagraphs(content) {
    const paragraphs = content.querySelectorAll('p');
    paragraphs.forEach(p => {
      // 排除特定容器内的段落
      if (!this.shouldSkipIndent(p)) {
        this.handleParagraphWithBr(p);
      }
    });
  },

  // 处理包含br标签的段落
  handleParagraphWithBr(paragraph) {
    // 检查段落内是否有br标签
    const brTags = paragraph.querySelectorAll('br');
    if (brTags.length > 0) {
      // 有br标签的段落，创建新的结构来处理
      this.splitParagraphByBr(paragraph);
    } else {
      // 没有br标签的段落，直接缩进
      paragraph.style.textIndent = '2em';
    }
  },

  // 按br标签分割段落并添加缩进
  splitParagraphByBr(paragraph) {
    // 获取段落的所有文本内容
    const textContent = paragraph.textContent;
    
    // 保存原始HTML结构
    const originalHTML = paragraph.innerHTML;
    
    // 用br标签分割内容
    const parts = originalHTML.split(/<br\s*\/?>/gi);
    
    if (parts.length > 1) {
      // 创建新的HTML结构，保持原有格式
      let newHTML = '';
      parts.forEach((part, index) => {
        if (part.trim()) {
          // 清理空白字符
          const cleanPart = part.trim();
          
          if (index === 0) {
            // 第一段添加缩进
            newHTML += `<span style="display: block; text-indent: 2em;">${cleanPart}</span>`;
          } else {
            // 后续段落换行并缩进
            newHTML += `<span style="display: block; text-indent: 2em; margin-top: 0.5em;">${cleanPart}</span>`;
          }
        }
      });
      paragraph.innerHTML = newHTML;
    } else {
      // 只有一个段落，直接缩进
      paragraph.style.textIndent = '2em';
    }
  },

  // 处理br标签分割的文本
  handleBrTags(content) {
    // 找到所有br标签
    const brTags = content.querySelectorAll('br');
    
    brTags.forEach(br => {
      // 获取br标签的父元素
      const parent = br.parentNode;
      
      // 如果父元素是p标签，已在handleExistingParagraphs中处理
      if (parent.tagName === 'P') return;
      
      // 非P标签内的br标签，给父元素添加缩进
      if (parent && !this.shouldSkipIndent(parent)) {
        parent.style.textIndent = '2em';
      }
    });

    // 处理直接包含文本的div或其他元素
    const textContainers = content.querySelectorAll('div, section, article');
    textContainers.forEach(container => {
      if (!this.shouldSkipIndent(container)) {
        // 处理直接子文本节点
        const childNodes = Array.from(container.childNodes);
        childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            const p = document.createElement('p');
            p.textContent = node.textContent.trim();
            p.style.textIndent = '2em';
            container.replaceChild(p, node);
          }
        });
      }
    });
  },

  // 判断是否应该跳过缩进
  shouldSkipIndent(element) {
    // 跳过特定标签内的元素
    const skipSelectors = [
      'pre',
      'code',
      'table',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'li',
      'ol',
      'ul',
      'dt',
      'dd',
      'dl'
    ];
    
    return skipSelectors.some(selector => element.closest(selector));
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

        let files = await CORS_file_config();
        fileId = files["files"][String(fileId)]["file_id"];

        try {
          // 获取files.json配置
          const config = await backend();
          const host = config.host;
          const downloadUrl = `${host}/file_url/${fileId}`;
          
          // 显示下载提醒模态窗
          const downloadModal = document.getElementById('downloadModal');
          const confirmDownloadBtn = document.getElementById('confirmDownload');
          
          // 设置模态窗为flex显示以居中内容
          downloadModal.style.display = 'flex';
          // 添加active类以触发动画
          setTimeout(() => {
            downloadModal.classList.add('active');
          }, 10);
          
          // 确认按钮点击事件
          const handleConfirmDownload = function() {
            // 移除事件监听以防止多次绑定
            confirmDownloadBtn.removeEventListener('click', handleConfirmDownload);
            
            // 添加关闭动画
            downloadModal.classList.remove('active');
            
            // 隐藏模态窗后跳转
            setTimeout(() => {
              downloadModal.style.display = 'none';
              // 跳转到下载链接
              location.href = downloadUrl;
            }, 300);
          };
          
          // 绑定点击事件
          confirmDownloadBtn.addEventListener('click', handleConfirmDownload);
          
        } catch (error) {
          // 出错时隐藏模态窗并显示错误
          console.error('Error processing file link:', error);
          const downloadModal = document.getElementById('downloadModal');
          downloadModal.style.display = 'none';
          downloadModal.classList.remove('active');
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
      
      // 为代码块添加语言标签、复制按钮和折叠功能
      CodeBlockHandler.addCodeBlockFeatures();
      
      // 为表格添加样式和增强功能
      TableHandler.enhanceTables();
      
      // 为文章段落添加缩进
      ParagraphIndentHandler.addParagraphIndent();
      
      // 识别图片alt属性并添加注释
      ImageHandler.addImageCaptions();
      
      // 添加文件链接跳转功能（在所有DOM操作完成后执行）
      setTimeout(() => {
        FileLinkHandler.addFileLinkHandler();
      }, 500);

      
      // 初始化分享功能
      ShareHandler.initShare();
      
      // 加载prism.js语法高亮库，并在加载完成后重新应用高亮
      const prismScript = document.createElement('script');
      prismScript.src = '/res/js/prism/prism.js';
      prismScript.onload = function() {
        console.log('Prism.js loaded successfully');
        // Prism加载完成后，为所有代码块重新应用高亮
        document.querySelectorAll('pre code').forEach(codeBlock => {
          if (window.Prism) {
            window.Prism.highlightElement(codeBlock);
          }
        });
      };
      document.head.appendChild(prismScript);
    } catch (error) {
      console.error('Error loading blog:', error);
    }
  }
  
  // 执行初始化
  initBlog();
});
