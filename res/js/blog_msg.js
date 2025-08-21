export async function BLOG_getBlogItems() {
    try {
        const response = await fetch("/config/blogs.json");
        let data = await response.text();
        data = JSON.parse(data)["blogs"];
        let blogsData = [];
        for (let i of data) {
            i = "/article/blog/"+i
            let j  = await BLOG_getContent(i)
            j.id = i
            blogsData.push(j)
        }
        // 直接使用blogs.json中的顺序，不进行排序
        return blogsData
    } catch (error) {
        console.error('Error fetching blogs.json:', error);
        return null;
    }
}

export async function BLOG_getContent(blogId) {
    try {
        const response = await fetch(`${blogId}`);
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


export async function BLOG_getKnowledgeItems() {
    try {
        const response = await fetch("/config/blogs.json");
        let data = await response.text();
        data = JSON.parse(data)["tech_stack"];
        let blogsData = [];
        for (let i of data) {
            i = "/article/tech_stack/"+i
            console.log(i)
            let j  = await BLOG_getContent(i)
            j.id = i
            blogsData.push(j)
        }
        // 直接使用blogs.json中的顺序，不进行排序
        return blogsData
    } catch (error) {
        console.error('Error fetching blogs.json:', error);
        return null;
    }
}


export async function backend() {
    try {
        const response = await fetch("/config/backend.json");
        const { test_host, work_host ,env} = await response.json();
        
        const config = {
            test_host,
            work_host,
            host: window.location.hostname === "127.0.0.1" ? (env === "web" ? work_host: test_host ) : work_host

        };

        
        return config;
    } catch (error) {
        console.error('Error fetching backend.json:', error);
        return null;
    }
}


