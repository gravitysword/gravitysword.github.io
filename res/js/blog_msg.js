export async function getBlogItems() {
    try {
        const response = await fetch("/config/blogs.json");
        let data = await response.text();
        data = JSON.parse(data)["blogs"];
        let blogsData = [];
        for (let i of data) {
            blogsData.push(JSON.parse(await getBlog(i)));
        }
        return blogsData; 
    } catch (error) {
        console.error('Error fetching blogs.json:', error);
        return null;
    }
}

export async function getBlog(blogId) {
    try {
        const response = await fetch(`/blog/${blogId}.md`);
        const data = await response.text();
        
        // 使用正确的正则表达式匹配 <div> 标签内容
        const regex = /<div\s+display="none"\s+class="author">(.*?)<\/div>/s;
        const match = data.match(regex);
        return match[1] ? match[1] : "文章异常，请联系博主";
    } catch (error) {
        console.error('Error fetching blog:', error);
        return "未找到文章";
    }
}

