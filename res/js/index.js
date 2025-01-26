import { getBlog, getBlogItems } from '/res/js/blog_msg.js';

document.addEventListener('DOMContentLoaded', () => {
    // 随机颜色的阴影
    {
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

        const blogLis = document.querySelectorAll('.content-container .blog-list ul li');

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
    }

    //加载列表
    {

        async function a1() {
            const blogList_element = document.querySelector('.content-container .blog-list ul')
            const bloglist = await getBlogItems();
            for (const i of bloglist) {
                console.log(i["title"]);
                const a = `
                    <li>
                        <span class="blog-title">${i["title"]}</span>
                        <span class="blog-introduce">
                            <img class="calendar" src="./res/media/svg/calendar.svg" alt="weibo">
                            <span class="blog-time">${i["date"]}</span>
                            <span class="blog-tag">${i["tag"]}</span>
                        </span>
                        <span class="blog-summary">测试内容</span>
                    </li>`
                blogList_element.innerHTML += a;
            }


        }

        a1();
    }





});