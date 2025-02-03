export async function BLOG_getBlogItems() {
    try {
        const response = await fetch("/config/blogs.json");
        let data = await response.text();
        data = JSON.parse(data)["blogs"];
        let blogsData = [];
        for (let i of data) {
            blogsData.push(await BLOG_getBlog(i));
        }
        return blogsData;
    } catch (error) {
        console.error('Error fetching blogs.json:', error);
        return null;
    }
}

export async function BLOG_getBlog(blogId) {
    try {
        const response = await fetch(`/blog/${blogId}.md`);
        const data = await response.text();
        console.log(data);

        // 使用正确的正则表达式匹配 <div> 标签内容
        const regex = /<div style="display:none;" class="author">([^<]*(?:<(?!\/div>)[^<]*)*)<\/div>/i;
const match = data.match(regex);
        return match[1] ? JSON.parse(match[1]) : "文章异常，请联系博主";
    } catch (error) {
        console.error('Error fetching blog:', error);
        return "未找到文章";
    }
}

export async function refreshSelf() {
    try {
        const response = await fetch("/all.txt");
        let data = await response.text();
        data = data.split("\n");
        for (let i of data) {
            await fetch(i)
            console.log(i)
            
        }
        return ;
    } catch (error) {
        console.error(error);
        return null;
    }
}
