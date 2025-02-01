import { BLOG_getBlog, BLOG_getBlogItems } from '/res/js/blog_msg.js';

document.addEventListener('DOMContentLoaded', () => {
    //加载列表
    {
        async function a1() {

            const urlParams = new URLSearchParams(window.location.search);
            const blogId = urlParams.get('id');
            console.log(blogId);

            fetch(`/blog/${blogId}.md`)
                .then(response => response.text())
                .then(markdown => {
                    const html = marked.parse(markdown);
                    document.getElementById('markdown-content').innerHTML = html;
                });

            const blog_details = await BLOG_getBlog(blogId)
            console.log(blog_details);
            document.querySelector('.title').textContent = blog_details["title"]
            document.querySelector('.blog-date').textContent = blog_details["date"]
            let tag = ""
            for (const tag_item of blog_details["tag"]) {
                tag += `<span class="blog-tag">${tag_item}</span>`
            }
            document.querySelector('.blog-introduce').innerHTML += tag


            document.querySelectorAll('p').forEach(p => {
                const parts = p.innerHTML.split('<br>');
                const modifiedParts = parts.map(part => `&emsp;&emsp;${part}`);
                p.innerHTML = modifiedParts.join('<br>');
            });

        }

        a1();
    }
});