export async function BLOG_getBlogItems() {
    try {
        const response = await fetch("/config/blogs.json");
        let data = await response.text();
        data = JSON.parse(data)["blogs"];
        let blogsData = [];
        for (let i of data) {
            let j  = await BLOG_getBlog(i)
            j.id = i
            blogsData.push(j)
        }
        return blogsData
    } catch (error) {
        console.error('Error fetching blogs.json:', error);
        return null;
    }
}

export async function BLOG_getBlog(blogId) {
    try {
        const response = await fetch(`/blog/${blogId}`);
        const data = await response.text();

        // 使用正确的正则表达式匹配 <div> 标签内容
        const regex = /<div style="display:none;" class="author">([^<]*(?:<(?!\/div>)[^<]*)*)<\/div>/i;
        const match = data.match(regex);
        return match[1] ? JSON.parse(match[1]) : "文章异常，请联系博主";
    } catch (error) {
        console.error('Error fetching blog:', error);
        return "未找到文章";
    }
}





