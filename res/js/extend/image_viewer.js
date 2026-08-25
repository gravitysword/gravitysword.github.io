/**
 * 通用图片放大查看器（博客正文页与碎碎念页共用）
 *
 * 用法：
 *   import { initImageViewer } from '/res/js/extend/image_viewer.js';
 *   initImageViewer({
 *     shouldOpen: (img) => img.tagName === 'IMG' && !img.classList.contains('weather'),
 *     onOpen: () => { document.body.style.overflow = 'hidden'; },
 *     onClose: () => { document.body.style.overflow = ''; },
 *   });
 */
export function initImageViewer(options = {}) {
    const {
        // 点击图片时是否打开查看器
        shouldOpen = () => true,
        // 打开/关闭时的钩子（如锁定滚动、隐藏目录）
        onOpen = () => {},
        onClose = () => {},
        // 图片加载失败时显示的占位图标
        errorIcon = '/res/media/svg/sys/image-error.svg',
    } = options;

    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.style.display = 'none';

    const modalImg = document.createElement('img');
    modalImg.className = 'modal-image';
    modalImg.onerror = function () {
        this.src = errorIcon;
        this.onerror = null;
        // 用 !important 覆盖 .modal-image 的 filter:none，让错误图标保持白色可见
        this.style.setProperty('filter', 'invert(100%) brightness(100%)', 'important');
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
        // 清除上一次错误占位时残留的反色滤镜，保证正常图片原色显示
        modalImg.style.removeProperty('filter');
        modalImg.src = src;
        onOpen();
        requestAnimationFrame(() => modalImg.classList.add('active'));
    };

    const closeModal = () => {
        modalImg.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            // 不用 src='' 清空：空字符串会触发 error 事件，连带设置永久反色滤镜
            modalImg.removeAttribute('src');
            onClose();
        }, 300);
    };

    // 添加触摸事件支持
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);

    modal.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        // 水平滑动距离大于垂直滑动距离且超过 50px 时关闭
        if (Math.abs(touchEndX - touchStartX) > Math.abs(touchEndY - touchStartY)
            && Math.abs(touchEndX - touchStartX) > 50) {
            closeModal();
        }
    }, false);

    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' && shouldOpen(e.target)) {
            // 优先使用 data-original-src 属性（原图 URL）
            const originalSrc = e.target.getAttribute('data-original-src') || e.target.src;
            showImage(originalSrc);
        }
    });
    closeBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        closeModal();
    });
    modal.addEventListener('click', (e) => e.target === modal && closeModal());
    modal.addEventListener('touchstart', (e) => e.target === modal && closeModal());
    document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());
}
