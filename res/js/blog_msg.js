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


export async function CORS_file_config() {
    // 使用Gitee API获取文件内容
    // 注意：需要替换为有效的访问令牌
    const OWNER = 'gravitysword';
    const REPO = 'blog';
    const PATH = 'files.json';
    
    const apiUrl = `https://gitee.com/api/v5/repos/${OWNER}/${REPO}/contents/${PATH}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Gitee API返回的文件内容是base64编码的，需要解码
        if (data.content) {
            // 解码base64内容
            const decodedContent = atob(data.content);
            // 确保以UTF-8格式处理解码后的内容
            const utf8Content = new TextDecoder('utf-8').decode(
                new Uint8Array([...decodedContent].map(char => char.charCodeAt(0)))
            );
            console.log(utf8Content);
            return JSON.parse(utf8Content);
        } else {
            throw new Error('文件内容为空');
        }
    } catch (error) {
        console.error('使用Gitee API获取文件失败:', error);
        
    }
}

/**
 * 从后端API获取书籍数据
 * 返回格式: {'1': {'book_id': '1', 'name': '书名', 'path': '路径', 'author': '作者', 'publisher': '出版社', 'read_status': '状态', 'node_id': '节点ID'}}
 */
export async function getBooksData() {
    try {
        const config = await backend();
        const host = config.host;
        
        // 构建书籍数据API地址
        const booksApiUrl = `${host}/books`;
        
        const response = await fetch(booksApiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
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
