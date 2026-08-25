import { BLOG_getContent } from '/res/js/blog_msg.js';
import { initImageViewer } from '/res/js/extend/image_viewer.js';


// 配置marked解析器选项
const markedOptions = {
    gfm: true, // GitHub风格Markdown
    breaks: true, // 允许回车换行
    pedantic: false, // 尽可能地兼容markdown.pl
    smartLists: true, // 使用比原生markdown更时髦的列表
    smartypants: true, // 使用更为时髦的标点
    xhtml: true, // 使用xhtml闭合标签
    html: true // 允许HTML标签
    // 语法高亮由 Prism 在渲染后统一处理（见 CodeBlockHandler）
};

// 复制文本到剪贴板（navigator.clipboard 不可用时降级为 textarea + execCommand）
async function copyText(text) {
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
    } finally {
        document.body.removeChild(textArea);
    }
    return true;
}

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
    // 显示加载失败提示
    showError(message) {
        const titleElement = document.querySelector('.title');
        if (titleElement) titleElement.textContent = '文章加载失败';
        
        const contentElement = document.getElementById('markdown-content');
        if (contentElement) {
            contentElement.innerHTML = `<div class="content-error"><p>${message}</p></div>`;
        }
    },

    // 更新博客标题、日期和标签
    updateBlogInfo(blog_details) {
        // 校验元数据合法性，避免解析异常导致整页崩溃
        if (!blog_details || typeof blog_details !== 'object') {
            this.showError('文章信息加载异常，请联系博主');
            return;
        }
        
        // 更新标题
        const titleElement = document.querySelector('.title');
        titleElement.textContent = blog_details.subtitle || blog_details.title;
        
        // 同步更新浏览器标签页标题
        document.title = `${titleElement.textContent} - 泛舟游客的博客`;
        
        // 更新日期
        document.querySelector('.blog-date').textContent = blog_details.date;

        // 处理天气信息
        const weatherElement = document.querySelector('.weather');
        if (weatherElement) {
            if (!blog_details.weather) {
                weatherElement.style.display = 'none';
            } else {
                weatherElement.setAttribute('src', `/res/media/svg/weather/${blog_details.weather}.svg`);
            }
        }

        // 更新标签（无标签时跳过创建容器）
        const tags = Array.isArray(blog_details.tag) ? blog_details.tag : [];
        if (tags.length > 0) {
            const tagsHtml = tags.map(tag_item => 
                `<span class="blog-tag">#${tag_item}</span>`
            ).join('');
            
            const metaContainer = document.querySelector('.meta-info');
            const tagContainer = document.createElement('div');
            tagContainer.className = 'meta-item blog-tags';
            tagContainer.innerHTML = tagsHtml;
            metaContainer.appendChild(tagContainer);
        }
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
        const languageClass = codeBlock.className.split(' ').find(cls => cls.startsWith('language-'));
        
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
        
        copyButton.addEventListener('click', async () => {
            // 折叠状态下也复制全文（避免复制到截断的预览内容）
            const code = codeBlock.dataset.fullContent || codeBlock.textContent;
            
            try {
                await copyText(code);
                copyButton.textContent = '✓ 已复制';
            } catch (err) {
                console.error('复制失败:', err);
                copyButton.textContent = '✗ 失败';
            } finally {
                setTimeout(() => {
                    copyButton.textContent = '复制';
                }, 2000);
            }
        });
        
        pre.appendChild(copyButton);
    },
    
    // 添加代码折叠功能
    addCodeCollapse(codeBlock, pre) {
        const codeContent = codeBlock.textContent;
        const codeLines = codeContent.split('\n');
        
        // 仅超过15行的代码块才折叠，短代码直接完整展示
        if (codeLines.length <= 15) return;
        
        // 标记为可折叠代码块：只有它才需要底部按钮占位间距（见 md.css .has-collapse）
        pre.classList.add('has-collapse');
        
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
        codeBlock.dataset.fullContent = originalContent; // 供复制按钮获取全文
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
                // 折叠状态：显示前5行
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
        if (window.Prism) {
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
        } else {
            // 如果Prism还未加载，延迟执行
            setTimeout(() => this.reapplyPrismHighlighting(codeBlock), 100);
        }
    }
};

// 图片处理模块
const ImageHandler = {
  // 初始化图片放大功能（实现见共享模块 extend/image_viewer.js）
  initImageZoom() {
    // 打开模态窗时隐藏目录，关闭时恢复
    const setTocVisible = (visible) => {
      const tocContainer = document.querySelector('.toc-container');
      const tocToggleButton = document.querySelector('.toc-toggle-button');
      if (tocContainer) tocContainer.style.display = visible ? '' : 'none';
      if (tocToggleButton) tocToggleButton.style.display = visible ? (window.innerWidth <= 1200 ? 'flex' : 'none') : 'none';
    };

    initImageViewer({
      shouldOpen: (img) => !img.classList.contains('weather') && !img.classList.contains('modal-image'),
      onOpen: () => {
        document.body.style.overflow = 'hidden'; // 锁定背景滚动
        setTocVisible(false);
      },
      onClose: () => {
        document.body.style.overflow = '';
        setTocVisible(true);
      },
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
      if (!video.dataset.errorHandled) {
        video.crossOrigin = 'anonymous';
        video.onerror = function() {
          const errorMsg = document.createElement('div');
          errorMsg.className = 'video-error';
          errorMsg.textContent = '视频加载失败';
          this.parentNode.insertBefore(errorMsg, this);
          this.style.display = 'none';
        };
        video.dataset.errorHandled = 'true';
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
          setTimeout(() => this.classList.remove('jumping'), 600);
          
          // 跳转到指定时间并播放
          video.currentTime = seconds;
          video.play().catch(error => console.warn('视频播放失败:', error));
          
          // 高亮效果：滚动到视频位置
          video.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // 添加视频边框高亮效果
          video.style.boxShadow = '0 0 20px rgba(255, 107, 102, 0.6)';
          setTimeout(() => video.style.boxShadow = '', 1000);
        } else {
          console.warn(`未找到视频元素，video-id: ${bindId}`);
        }
      };
      
      // 点击事件
      span.addEventListener('click', handleJump);
      
      // 键盘事件
      span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleJump.call(this);
        }
      });
    });
  }
};

// 段落缩进由 md.css 的 .content p { text-indent: 2em } 统一处理，
// 旧的内联缩进模块已删除（避免 innerHTML 重写破坏段内格式）

// 表格处理模块
const TableHandler = {
  // 为表格添加样式和增强功能
  enhanceTables() {
    document.querySelectorAll('table').forEach((table) => {
      table.classList.add('styled-table');
      
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      
      const headers = table.querySelectorAll('th');
      const rows = table.querySelectorAll('tbody tr');
      
      headers.forEach((header, colIndex) => {
        const cells = Array.from(rows)
          .map(row => row.cells[colIndex]?.textContent.trim() || '')
          .filter(text => text);
        
        const dataType = this.detectDataType(cells);
        
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
    });
  },
  
  // 数据类型检测函数
  detectDataType(values) {
    if (values.length === 0) return 'text';
    
    // 先检测数字（避免 1/0 被误判为布尔值）
    if (values.every(v => !isNaN(v) && !isNaN(parseFloat(v)))) {
      return 'number';
    }
    
    // 检测布尔值
    const boolValues = ['true', 'false', '是', '否', 'yes', 'no'];
    if (values.every(v => boolValues.includes(v.toLowerCase()))) {
      return 'boolean';
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
      const shareContent = `泛舟游客的博客：《${articleTitle}》已于${articleTime}发布，点击查看：${articleUrl}`;
      
      this.copyToClipboard(shareContent);
    });
  },
  
  // 复制到剪贴板
  async copyToClipboard(content) {
    try {
      if (await copyText(content)) {
        alert('URL 已成功复制到剪贴板');
      }
    } catch (error) {
      console.error('复制 URL 时出错:', error);
      alert('复制 URL 时出错');
    }
  }
};

// 回到顶部模块
const ReadingProgressHandler = {
  // 初始化回到顶部按钮
  init() {
    // 回到顶部按钮
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.textContent = '↑';
    backToTop.title = '回到顶部';
    backToTop.setAttribute('aria-label', '回到顶部');
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(backToTop);
    
    // 根据滚动位置显示/隐藏按钮
    const update = () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    };
    
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 初始化图片放大功能
  ImageHandler.initImageZoom();
  
  // 初始化阅读进度条和回到顶部按钮
  ReadingProgressHandler.init();
  
  // 主要初始化函数
  async function initBlog() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const blogId = urlParams.get('id');
      
      // 缺少 id 参数时给出友好提示，避免空白页
      if (!blogId) {
        BlogInfoHandler.showError('未找到文章，请从首页或文章列表进入');
        return;
      }
      
      // 渲染Markdown内容
      await MarkdownHandler.renderMarkdown(blogId);
      
      // 处理视频相关功能（handleVideoError 内部会统一设置 crossOrigin）
      VideoHandler.handleVideoError();
      VideoHandler.addVideoTimeJump();
      
      // 获取并更新博客信息
      const blog_details = await BLOG_getContent(blogId);
      BlogInfoHandler.updateBlogInfo(blog_details);
      
      // 为代码块添加功能
      CodeBlockHandler.addCodeBlockFeatures();
      
      // 为表格添加样式和增强功能
      TableHandler.enhanceTables();
      
      // 识别图片alt属性并添加注释
      ImageHandler.addImageCaptions();
      
      // 初始化分享功能
      ShareHandler.initShare();
      
      // 加载prism.js语法高亮库，并在加载完成后重新应用高亮
      const prismScript = document.createElement('script');
      prismScript.src = '/res/js/prism/prism.js';
      prismScript.onload = function() {
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
      // 内容未加载成功时显示友好提示，避免空白页
      const contentElement = document.getElementById('markdown-content');
      if (contentElement && contentElement.children.length === 0) {
        BlogInfoHandler.showError('文章加载失败，请刷新重试或联系博主');
      }
    }
  }
  
  // 执行初始化
  initBlog();
});
