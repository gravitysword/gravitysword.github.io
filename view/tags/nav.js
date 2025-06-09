function initializeNavInteractions() {
    // 导航栏滚动效果
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navigation');
        nav.classList.toggle('scrolled', window.scrollY > 80);
    });

    // 汉堡菜单交互
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = `<span></span><span></span><span></span>`;
    document.querySelector('.navigation').prepend(hamburger);

    // 菜单切换逻辑
    const navLinks = document.querySelector('.nav-links');
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // 移动端下拉菜单处理
    const dropdownItems = document.querySelectorAll('.nav-dropdown');
    dropdownItems.forEach(item => {
        const dropdownButton = item.querySelector('.nav-button');
        dropdownButton.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                item.classList.toggle('active');
                dropdownItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
            }
        });
    });

    // 点击页面其他区域关闭菜单
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!e.target.closest('.navigation')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
                dropdownItems.forEach(item => {
                    item.classList.remove('active');
                });
            }
        }
    });

    // 窗口尺寸监听
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
            dropdownItems.forEach(item => {
                item.classList.remove('active');
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/view/tags/nav.html')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(data, 'text/html');
            const navContent = htmlDoc.querySelector('.navigation');

            if (navContent) {
                document.querySelector('.navigation').innerHTML = navContent.innerHTML;
                initializeNavInteractions(); // 初始化交互功能
            }
        })
        .catch(error => console.error('加载导航栏失败:', error));
});