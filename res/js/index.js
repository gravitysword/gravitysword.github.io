document.addEventListener('DOMContentLoaded', () => {
    const sidebarDivs = document.querySelectorAll('.content-container .sidebar > div');

    sidebarDivs.forEach(div => {
        div.addEventListener('mouseenter', () => {
            const randomColor = getRandomColor();
            div.style.boxShadow = `0 0px 10px ${randomColor}`;
        });

        div.addEventListener('mouseleave', () => {
            div.style.boxShadow = '0 0px 2px rgba(0, 0, 0, 0.2)';
        });
    });

    const blogLis = document.querySelectorAll('.content-container .blog-list ul li'); // 修改选择器

    blogLis.forEach(li => {
        li.addEventListener('mouseenter', () => {
            const randomColor = getRandomColor();
            li.style.boxShadow = `0 0px 10px ${randomColor}`;
        });

        li.addEventListener('mouseleave', () => {
            li.style.boxShadow = '0 0px 2px rgba(0, 0, 0, 0.2)';
        });
    });

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
});