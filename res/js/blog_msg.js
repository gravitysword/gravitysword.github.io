/**
 * 通用函数：获取文章列表（带分页功能）
 * @param {string} type - 文章类型（blogs 或 tech_stack）
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页显示数量
 * @returns {Promise<Object>} 包含文章列表和总页数的对象
 */
async function getArticleList(type, page = 1, pageSize = 10) {
    try {
        const response = await fetch("/config/blogs.json");
        const data = await response.json();
        const articles = data[type] || [];
        
        // 计算总页数
        const totalItems = articles.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        
        // 计算当前页的数据范围
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        
        // 获取当前页的文件路径
        const pageData = articles.slice(startIndex, endIndex);
        
        // 并行获取文章数据
        const articlesData = await Promise.all(
            pageData.map(async (filePath) => {
                const fullPath = `/article/${type === 'blogs' ? 'blog' : 'tech_stack'}/${filePath}`;
                try {
                    const content = await BLOG_getContent(fullPath);
                    content.id = fullPath;
                    return content;
                } catch (error) {
                    console.error(`Error fetching ${type} article ${fullPath}:`, error);
                    return null;
                }
            })
        );
        
        // 过滤掉null值
        const validArticles = articlesData.filter(article => article !== null);
        
        return {
            items: validArticles,
            total: totalItems,
            page,
            pageSize,
            totalPages
        };
    } catch (error) {
        console.error(`Error fetching ${type} list:`, error);
        return null;
    }
}

/**
 * 获取博客文章列表（带分页功能）
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页显示数量
 * @returns {Promise<Object>} 包含文章列表和总页数的对象
 */
export async function BLOG_getBlogItems(page = 1, pageSize = 10) {
    return getArticleList('blogs', page, pageSize);
}

/**
 * 获取文章内容
 * @param {string} blogId - 文章ID/路径
 * @returns {Promise<Object>} 文章内容对象
 */
export async function BLOG_getContent(blogId) {
    try {
        const response = await fetch(`${blogId}`);
        const data = await response.text();

        // 使用正则表达式匹配 <div> 标签内容
        const regex = /<div style="display:none;" class="author">([\s\S]*?)<\/div>/i;
        const match = data.match(regex);
        return match && match[1] ? JSON.parse(match[1]) : "文章异常，请联系博主";
    } catch (error) {
        console.error('Error fetching blog:', error);
        return "未找到文章";
    }
}

/**
 * 获取技术栈文章列表（带分页功能）
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页显示数量
 * @returns {Promise<Object>} 包含文章列表和总页数的对象
 */
export async function BLOG_getKnowledgeItems(page = 1, pageSize = 10) {
    return getArticleList('tech_stack', page, pageSize);
}

/**
 * 加载指定文章的完整内容（用于搜索）
 * @param {Object} article - 文章对象
 * @returns {Promise<Object>} 包含完整内容的文章对象
 */
export async function loadArticleFullContent(article) {
    try {
        const response = await fetch(article.id);
        const content = await response.text();
        // 提取文章内容部分（移除元数据）
        const contentMatch = content.match(/<div style="display:none;" class="author">[\s\S]*?<\/div>([\s\S]*)/i);
        article.fullContent = contentMatch && contentMatch[1] 
            ? contentMatch[1].toLowerCase() 
            : (article.description ? article.description.toLowerCase() : '');
        return article;
    } catch (error) {
        console.error(`加载文章 ${article.id} 内容失败:`, error);
        article.fullContent = article.description ? article.description.toLowerCase() : '';
        return article;
    }
}

/**
 * 获取后端配置
 * @returns {Promise<Object>} 后端配置对象
 */
export async function backend() {
    try {
        const response = await fetch("/config/backend.json");
        const { test_host, work_host, env } = await response.json();
        
        return {
            test_host,
            work_host,
            host: window.location.hostname === "127.0.0.1" 
                ? (env === "web" ? work_host : test_host) 
                : work_host
        };
    } catch (error) {
        console.error('Error fetching backend.json:', error);
        return null;
    }
}

/**
 * 获取CORS文件配置
 * @returns {Promise<Object>} 文件配置对象
 */
export async function CORS_file_config() {
    // 使用Gitee API获取文件内容
    const OWNER = 'gravitysword';
    const REPO = 'blog';
    const PATH = 'files.json';
    
    const apiUrl = `https://gitee.com/api/v5/repos/${OWNER}/${REPO}/contents/${PATH}`;
    
    try {
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Gitee API返回的文件内容是base64编码的，需要解码
        if (data.content) {
            const decodedContent = atob(data.content);
            return JSON.parse(decodedContent);
        } else {
            throw new Error('文件内容为空');
        }
    } catch (error) {
        console.error('使用Gitee API获取文件失败:', error);
        return {};
    }
}

/**
 * 从后端API获取书籍数据
 * 返回格式: {'1': {'book_id': '1', 'name': '书名', 'path': '路径', 'author': '作者', 'publisher': '出版社', 'read_status': '状态', 'node_id': '节点ID'}}
 */
export async function getBooksData() {
    try {
        const config = await backend();
        if (!config) throw new Error('无法获取后端配置');
        
        const response = await fetch(`${config.host}/books`, {
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('成功加载书籍数据:', data);
        return data;
        
    } catch (error) {
        console.error('获取书籍数据失败:', error);
        return {};
    }
}
