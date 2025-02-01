import { BLOG_getBlog, BLOG_getBlogItems } from '/res/js/blog_msg.js';

document.addEventListener('DOMContentLoaded', () => {
    
    {
        async function a1() {
            {
                //加载列表
                const blogList_element = document.querySelector('.content-container .blog-list ul')
                const bloglist = await BLOG_getBlogItems();
                for (const item of bloglist) {
                    let tag = ""
                    for (const tag_item of item["tag"]) {
                        tag += `<span class="blog-tag">${tag_item}</span>`
                    }
                    const lis = `
                    <li>
                        <span class="blog-id" style="display: none;">${item["id"]}</span>
                        <span class="blog-title">${item["title"]}</span>
                        <span class="blog-introduce">
                            <img class="calendar" src="./res/media/svg/calendar.svg" alt="logo">
                            <span class="blog-date">${item["date"]}</span>
                            ${tag}
                        </span>
                        <span class="blog-description">${item["description"]}</span>
                    </li>`
                    blogList_element.innerHTML += lis;
                }

            }


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

                // 移动 getRandomColor 函数定义到此处
                function getRandomColor() {
                    const letters = '0123456789ABCDEF';
                    let color = '#';
                    for (let i = 0; i < 6; i++) {
                        color += letters[Math.floor(Math.random() * 16)];
                    }
                    return color;
                }

                const blogLis = document.querySelectorAll('.content-container .blog-list ul li');
                blogLis.forEach(li => {
                    li.addEventListener('mouseenter', () => {
                        const randomColor = getRandomColor();
                        li.style.boxShadow = `0 0px 10px ${randomColor}`;
                    });

                    li.addEventListener('mouseleave', () => {
                        li.style.boxShadow = '0 0px 2px rgba(0, 0, 0, 0.2)';
                    });

                    // 添加点击事件监听器
                    li.addEventListener('click', () => {
                        const blogIdElement = li.querySelector('.blog-id');
                        if (blogIdElement) {
                            const blogId = blogIdElement.textContent;
                            window.location.href = `/blog.html?id=${blogId}`;
                        }
                    });
                });

            }
            {
            //翻页
            const a = document.querySelectorAll('.pagination a');
            for(const item of a){
                item.addEventListener('click',()=>{
                    alert("这是假的翻页栏，真的我还没做好 ^_^")
                })
            }
            }
        }

        a1();
    }
});