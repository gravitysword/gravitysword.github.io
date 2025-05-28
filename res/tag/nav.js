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

// 窗口尺寸监听
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    }
});