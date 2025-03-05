/**
 * 获取所有博客文章的元数据
 * @returns {Promise<Array>} 博客文章列表
 */
export async function BLOG_getBlogItems() {
    try {
        const response = await fetch("/config/blogs.json");
        const blogList = JSON.parse(await response.text()).blogs;
        const blogsData = await Promise.all(
            blogList.map(async (blogId) => {
                const blogData = await BLOG_getBlog(blogId);
                return { ...blogData, id: blogId };
            })
        );
        return blogsData;
    } catch (error) {
        console.error('Error fetching blogs.json:', error);
        return [];
    }
}

/**
 * 获取单篇博客文章的元数据
 * @param {string} blogId - 博客文章ID
 * @returns {Promise<Object>} 博客文章元数据
 */
export async function BLOG_getBlog(blogId) {
    try {
        const response = await fetch(`/blog/${blogId}`);
        const content = await response.text();

        // 提取文章元数据（JSON格式）
        const metadataRegex = /<div style="display:none;" class="author">([^<]*(?:<(?!\/div>)[^<]*)*)<\/div>/i;
        const match = content.match(metadataRegex);
        
        if (!match?.[1]) {
            throw new Error('Invalid blog metadata format');
        }
        
        return JSON.parse(match[1]);
    } catch (error) {
        console.error('Error fetching blog:', error);
        return {
            title: "文章加载失败",
            date: "",
            weather: "",
            description: "请联系博主或稍后重试",
            tag: []
        };
    }
}

/**
 * 刷新缓存
 * @returns {Promise<void>}
 */
export async function refreshSelf() {
    try {
        const response = await fetch("/all.txt");
        const urls = (await response.text()).split("\n");
        
        // 并行请求所有资源以刷新缓存
        await Promise.all(
            urls.filter(url => url.trim()).map(url => fetch(url))
        );
    } catch (error) {
        console.error('Error refreshing cache:', error);
    }
}

/**
 * 实现博客列表分页
 * @param {number} pageIndex - 页码（从0开始）
 * @returns {Promise<Object>} 分页数据和分页信息
 */
export async function pageSplit(pageIndex = 0) {
    try {
        const blogs = await BLOG_getBlogItems();
        const PAGE_SIZE = 5;
        const totalPages = Math.ceil(blogs.length / PAGE_SIZE);
        
        // 预加载下一页数据（如果存在）
        if (pageIndex < totalPages - 1) {
            // 异步预加载，不等待结果
            setTimeout(() => {
                const nextPageData = blogs.slice((pageIndex + 1) * PAGE_SIZE, (pageIndex + 2) * PAGE_SIZE);
                console.log('预加载下一页数据完成', nextPageData.length);
            }, 100);
        }
        
        return {
            data: blogs.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE),
            pagination: {
                currentPage: pageIndex,
                totalPages,
                totalItems: blogs.length,
                pageSize: PAGE_SIZE,
                // 添加辅助信息，方便前端判断
                isFirstPage: pageIndex === 0,
                isLastPage: pageIndex >= totalPages - 1
            }
        };
    } catch (error) {
        console.error('Error in pageSplit:', error);
        return {
            data: [],
            pagination: {
                currentPage: 0,
                totalPages: 0,
                totalItems: 0,
                pageSize: 6,
                isFirstPage: true,
                isLastPage: true
            }
        };
    }
}




