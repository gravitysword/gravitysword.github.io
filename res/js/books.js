import { backend } from '/res/js/blog_msg.js';

// 当前视图模式
let currentView = 'grid'; // 'grid' or 'folder'
// 当前文件夹路径
let currentFolderPath = [];

// 获取书籍数据
async function loadBookData() {
    try {
        const response = await fetch('/config/files.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json()
        return data ;
    } catch (error) {
        console.error('加载书籍数据失败:', error);
        // 如果加载失败，使用默认数据
        return {
            books: []
        };
    }
}

// 渲染书籍网格视图
function renderBooks(books) {
    const bookshelf = document.getElementById('bookshelf');
    bookshelf.className = 'bookshelf';
    bookshelf.innerHTML = '';
    
    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book';
        bookElement.innerHTML = `
            <div class="book-inner">
                <div class="book-front">
                    <div class="book-cover-preview">
                        <div class="book-cover-img">
                            <i class="fas fa-book"></i>
                        </div>
                    </div>
                    
                    <div>
                        <div class="book-title">${book.name}</div>
                        <div class="book-author">${book.author}</div>
                        <div class="book-publisher">${book.publisher}</div>
                        <div book-id="${book.book_id}"></div>
                    </div>
                    
                </div>
                <div class="book-back">
                    <h3>${book.name}</h3>
                    <div class="book-desc">
                        ${book.desc}
                    </div>
                    <div class="book-actions">
                        <button class="download-btn"><i class="fas fa-download"></i> 下载</button>
                    </div>
                </div>
            </div>
        `;
        bookElement.style.cursor = 'pointer'; // 添加指针样式，提示用户可点击

        bookElement.addEventListener('click', async function() {
        let bookId = book.book_id

        try {
            // 获取files.json配置
            const config = await backend();
            const host = config.host;
            alert("为防止ddos攻击，请耐心等待5秒")
            location.href= `${host}/book_url/${bookId}`
            
        } catch (error) {
            // 出错时移除提示框并显示错误
            console.error('Error processing file link:', error);
            alert('处理文件链接时出错，请检查控制台获取更多信息。');
        }
    });

        bookshelf.appendChild(bookElement);
    });
    
    // 添加书籍交互效果
    document.querySelectorAll('.book').forEach(book => {
        book.addEventListener('click', function(e) {
            // 避免收藏按钮触发翻转
            if (!e.target.closest('.book-favorite')) {
                this.querySelector('.book-inner').classList.toggle('flipped');
            }
        });
    });
    
    // 添加收藏功能
    document.querySelectorAll('.book-favorite').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            const bookId = this.closest('.book').getAttribute('data-id');
            // 在实际应用中，这里会更新书籍的收藏状态
        });
    });
}

// 获取状态文本
function getStatusText(status) {
    switch(status) {
        case 'unread': return '未读';
        case 'reading': return '阅读中';
        case 'finished': return '已读完';
        default: return '';
    }
}

// 从路径获取标签
function getBookTags(path) {
    const parts = path.split('/').filter(part => part.trim() !== '');
    return parts.slice(0, 2); // 最多返回前两个标签
}

// 构建文件夹树结构
function buildFolderTree(books) {
    const tree = {};
    
    books.forEach(book => {
        const pathParts = book.from.split('/').filter(part => part.trim() !== '');
        let currentLevel = tree;
        
        // 创建文件夹层级
        pathParts.forEach((part, index) => {
            if (!currentLevel[part]) {
                currentLevel[part] = {
                    isFolder: true,
                    name: part,
                    path: pathParts.slice(0, index + 1).join('/'),
                    children: {},
                    books: []
                };
            }
            
            // 如果是最后一级，添加书籍
            if (index === pathParts.length - 1) {
                currentLevel[part].books.push(book);
            }
            
            currentLevel = currentLevel[part].children;
        });
    });
    
    return tree;
}

// 渲染文件夹导航栏
function renderFolderNavigation() {
    const bookshelf = document.getElementById('bookshelf');
    const navElement = document.createElement('div');
    navElement.className = 'folder-navigation';
    
    let navHTML = '<div class="folder-nav-item" data-path="">根目录</div>';
    
    currentFolderPath.forEach((folderName, index) => {
        const path = currentFolderPath.slice(0, index + 1).join('/');
        navHTML += `<span class="folder-nav-separator">></span>`;
        navHTML += `<div class="folder-nav-item" data-path="${path}">${folderName}</div>`;
    });
    
    navElement.innerHTML = navHTML;
    bookshelf.prepend(navElement);
    
    // 添加导航点击事件
    navElement.querySelectorAll('.folder-nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const path = this.getAttribute('data-path');
            if (path === '') {
                currentFolderPath = [];
            } else {
                currentFolderPath = path.split('/');
            }
            loadBookData().then(data => {
                renderFolderView(data.books);
            });
        });
    });
}

// 获取当前路径下的内容
function getCurrentFolderContent(tree, path) {
    let current = tree;
    
    for (const folderName of path) {
        if (current[folderName]) {
            current = current[folderName].children;
        } else {
            return {}; // 路径不存在
        }
    }
    
    return current;
}

// 渲染文件夹视图
function renderFolderView(books) {
    const bookshelf = document.getElementById('bookshelf');
    bookshelf.className = 'bookshelf folder-view';
    bookshelf.innerHTML = '';
    
    // 构建文件夹树
    const folderTree = buildFolderTree(books);
    
    // 获取当前路径下的内容
    const currentContent = getCurrentFolderContent(folderTree, currentFolderPath);
    
    // 渲染导航栏
    renderFolderNavigation();
    
    // 检查当前路径是否为最深层（包含书籍的路径）
    let hasFolders = Object.keys(currentContent).length > 0;
    let currentFolderBooks = [];
    
    // 如果没有子文件夹，检查是否在书籍所在的路径
    if (!hasFolders && currentFolderPath.length > 0) {
        const fullPath = currentFolderPath.join('/') + '/';
        currentFolderBooks = books.filter(book => book.from === fullPath);
    }
    
    // 渲染当前路径下的文件夹和书籍
    for (const itemName in currentContent) {
        const item = currentContent[itemName];
        
        if (item.isFolder) {
            // 渲染文件夹
            const folderElement = document.createElement('div');
            folderElement.className = 'folder';
            folderElement.innerHTML = `
                <div class="folder-header" data-folder="${item.name}">
                    <i class="fas fa-folder"></i>
                    <span>${item.name} (${item.books.length + Object.keys(item.children).length})</span>
                </div>
                <div class="folder-content">
                    <div class="folder-books">
                        ${item.books.map(book => `
                            <div class="folder-book" data-id="${book.id}">
                                <div class="book-icon">
                                    <i class="fas fa-book"></i>
                                </div>
                                <div class="book-title">${book.name}</div>
                                <div class="book-author">${book.author}</div>
                                <div class="book-publisher">${book.publisher}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            bookshelf.appendChild(folderElement);
        }
    }
    
    // 如果在最深层文件夹且有书籍，则直接显示书籍
    if (!hasFolders && currentFolderBooks.length > 0) {
        const booksContainer = document.createElement('div');
        booksContainer.className = 'folder-books';
        booksContainer.innerHTML = currentFolderBooks.map(book => `
            <div class="folder-book" data-id="${book.id}">
                <div class="book-icon">
                    <i class="fas fa-book"></i>
                </div>
                <div class="book-title">${book.name}</div>
                <div class="book-author">${book.author}</div>
                <div class="book-publisher">${book.publisher}</div>
            </div>
        `).join('');
        bookshelf.appendChild(booksContainer);
    }
    
    // 添加文件夹点击事件
    document.querySelectorAll('.folder-header').forEach(header => {
        header.addEventListener('click', function() {
            const folderName = this.getAttribute('data-folder');
            currentFolderPath.push(folderName);
            loadBookData().then(data => {
                renderFolderView(data.books);
            });
        });
    });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    loadBookData().then(data => {
        renderBooks(data.books);
        
        // 视图切换功能
        const gridViewBtn = document.getElementById('gridView');
        const folderViewBtn = document.getElementById('folderView');
        
        gridViewBtn.addEventListener('click', function() {
            currentView = 'grid';
            gridViewBtn.classList.add('active');
            folderViewBtn.classList.remove('active');
            renderBooks(data.books);
        });
        
        folderViewBtn.addEventListener('click', function() {
            currentView = 'folder';
            folderViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            currentFolderPath = []; // 重置路径
            renderFolderView(data.books);
        });
        
        // 搜索功能
        const searchInput = document.querySelector('.search-bar input');
        const searchButton = document.querySelector('.search-bar button');
        
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') performSearch();
        });
        
        function performSearch() {
            const term = searchInput.value.toLowerCase();
            if (term.trim() === '') {
                if (currentView === 'grid') {
                    renderBooks(data.books);
                } else {
                    renderFolderView(data.books);
                }
                return;
            }
            
            const filteredBooks = data.books.filter(book => 
                book.name.toLowerCase().includes(term) || 
                book.author.toLowerCase().includes(term) ||
                book.from.toLowerCase().includes(term)
            );
            
            if (currentView === 'grid') {
                renderBooks(filteredBooks);
            } else {
                renderFolderView(filteredBooks);
            }
        }
    });
});
