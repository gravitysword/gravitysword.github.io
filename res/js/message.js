// 博客留言板 JavaScript 功能

// 导入backend函数
import { backend } from '/res/js/blog_msg.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取表单和评论容器
    const commentForm = document.getElementById('commentForm');
    const commentsContainer = document.getElementById('commentsContainer');
    
    // 从backend.json加载留言
    loadCommentsFromBackend();
    
    // 表单提交事件处理
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault(); // 阻止表单默认提交行为
        
        // 获取表单数据
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        const contact = document.getElementById('contact').value;
        
        // 创建新评论对象
        const newComment = {
            id: Date.now(), // 使用时间戳作为唯一ID
            name: name,
            email: email,
            message: message,
            contact: contact,
            date: new Date().toLocaleString('zh-CN')
        };
        
        // 发送数据到服务器并根据返回值显示提示
        sendCommentToServer(newComment)
            .then(result => {
                const messageTip = document.getElementById('messageTip');
                if (result === 'ok') {
                    messageTip.textContent = '评论提交成功';
                    messageTip.className = 'message-tip success';
                    messageTip.style.display = 'block';
                    
                    // 3秒后隐藏提示
                    setTimeout(() => {
                        messageTip.style.display = 'none';
                    }, 3000);
                } else {
                    messageTip.textContent = '异常';
                    messageTip.className = 'message-tip error';
                    messageTip.style.display = 'block';
                    
                    // 3秒后隐藏提示
                    setTimeout(() => {
                        messageTip.style.display = 'none';
                    }, 3000);
                }
            })
            .catch(error => {
                const messageTip = document.getElementById('messageTip');
                messageTip.textContent = '异常';
                messageTip.className = 'message-tip error';
                messageTip.style.display = 'block';
                
                // 3秒后隐藏提示
                setTimeout(() => {
                    messageTip.style.display = 'none';
                }, 3000);
            });
        

    });
    
    // 从backend.json加载留言
    function loadCommentsFromBackend() {
        fetch('/config/backend.json')
            .then(response => response.json())
            .then(data => {
                // 处理留言数据
                if (data.message && Array.isArray(data.message)) {
                    data.message.forEach(comment => {
                        // 忽略空的留言对象
                        if (comment && comment.name && comment.message) {
                            addCommentToPage(comment);
                        }
                    });
                }
            })
            .catch(error => {
                console.error('加载留言数据失败:', error);
                // 如果加载失败，可以显示错误信息或使用默认数据
            });
    }
    
    // 发送评论到服务器
    async function sendCommentToServer(comment) {
        try {
            // 获取后端配置
            const config = await backend();
            if (!config) {
                console.error('无法获取后端配置');
                return 'error';
            }
            
            // 将评论对象转换为查询参数
            const queryParams = new URLSearchParams(comment).toString();
            
            // 构造请求URL
            const url = `${config.host}/message_board?${queryParams}`;
            
            // 直接跳转到URL
            window.location.href = url;
            
            // 由于页面跳转，以下代码不会执行
            return 'ok';
        } catch (error) {
            console.error('发送留言时发生错误:', error);
            return 'error';
        }
    }
    
    // 添加评论到页面
    function addCommentToPage(comment) {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        
        // 构建联系方式显示内容
        let contactInfo = '';
        if (comment.contact) {
            contactInfo = `<div class="comment-contact">联系方式: ${comment.contact}</div>`;
        }
        
        // 使用comment.date如果存在，否则使用当前时间
        const displayTime = comment.date || new Date().toLocaleString('zh-CN');
        
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-name">${comment.name}</span>
                <span class="comment-date">${displayTime}</span>
            </div>
            <div class="comment-message">
                ${comment.message}
            </div>
            ${contactInfo}
        `;
        
        // 将新评论添加到容器顶部
        commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
    }
});