export async function Bottom() {
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