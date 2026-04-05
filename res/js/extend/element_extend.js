import { backend, CORS_file_config } from '/res/js/blog_msg.js';

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
        fileId = files.files[String(fileId)].file_id;

        try {
          // 获取files.json配置
          const config = await backend();
          const fileApi = config.fileApi;
          const downloadUrl = `${fileApi}/${fileId}`;
          
          // 显示下载提醒模态窗
          const downloadModal = document.getElementById('downloadModal');
          const confirmDownloadBtn = document.getElementById('confirmDownload');
          
          // 设置模态窗为flex显示以居中内容
          downloadModal.style.display = 'flex';
          // 添加active类以触发动画
          setTimeout(() => downloadModal.classList.add('active'), 10);
          
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

// 图片UUID4资源链接处理模块
const ImageUUIDHandler = {
  // UUID4正则表达式（不含扩展名）
  uuid4Pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // 检查是否为UUID4格式
  isUUID4(filename) {
    return this.uuid4Pattern.test(filename);
  },
  
  // 从URL中提取文件名
  extractFilename(url) {
    if (!url) return null;
    try {
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      return filename;
    } catch (e) {
      // 如果URL解析失败，尝试直接提取文件名
      const parts = url.split('/');
      return parts[parts.length - 1];
    }
  },
  
  // 处理单个图片元素
  async processImage(img) {
    const src = img.getAttribute('src');
    if (!src) return;
    
    // 提取文件名
    const filename = this.extractFilename(src);
    if (!filename) return;
    
    // 检查是否为UUID4格式
    if (this.isUUID4(filename)) {
      try {
        // 获取fileApi配置
        const config = await backend();
        if (!config || !config.fileApi) {
          console.warn('无法获取fileApi配置');
          return;
        }
        
        const fileApi = config.fileApi;
        const uuid4 = filename;
        
        // 构建缩略图URL
        const previewUrl = `${fileApi}/${uuid4}/thumbnail`;
        // 构建原图URL
        const originalUrl = `${fileApi}/${uuid4}/content`;
        
        // 设置缩略图为src
        img.src = previewUrl;
        // 存储原图URL到data属性
        img.setAttribute('data-original-src', originalUrl);
      } catch (error) {
        console.error('处理图片UUID4资源链接时出错:', error);
      }
    }
  },
  
  // 处理图片资源链接
  async processImageLinks() {
    // 查找所有图片元素
    const images = document.querySelectorAll('img');
    
    for (const img of images) {
      await this.processImage(img);
    }
  },
  
  // 启动MutationObserver监听DOM变化
  startObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            // 检查添加的节点是否为图片元素
            if (node.nodeName === 'IMG') {
              this.processImage(node);
            }
            // 检查添加的节点是否包含图片元素
            if (node.querySelectorAll) {
              const images = node.querySelectorAll('img');
              images.forEach(img => this.processImage(img));
            }
          });
        }
      });
    });
    
    // 开始观察整个文档
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return observer;
  }
};

// 自动初始化图片UUID4处理
// 如果DOM已经加载完成，立即执行；否则等待DOMContentLoaded事件
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ImageUUIDHandler.processImageLinks();
    ImageUUIDHandler.startObserver();
    FileLinkHandler.addFileLinkHandler();
  });
} else {
  // DOM已经加载完成，立即执行
  ImageUUIDHandler.processImageLinks();
  ImageUUIDHandler.startObserver();
  FileLinkHandler.addFileLinkHandler();
}



