import { backend, CORS_file_config } from '/res/js/blog_msg.js';

// 当前视图模式
let currentView = 'grid'; // 'grid' or 'folder'
// 当前文件夹路径
let currentFolderPath = [];

// 书籍管理器
const BookManager = {
    // 获取书籍数据
    async loadBookData() {
        try {
            const response = await CORS_file_config();
            console.log('成功加载书籍数据:', response);
            
            // 创建结果对象
            let result = { books: [] };
            
            // 检查响应数据
            if (response && response.books) {
                // 检查books是否为对象
                if (typeof response.books === 'object' && !Array.isArray(response.books)) {
                    // 将对象转换为数组
                    result.books = Object.values(response.books);
                } else {
                    // 如果已经是数组，直接使用
                    result.books = Array.isArray(response.books) ? response.books : [];
                }
            }
            
            return result;
        } catch (error) {
            console.error('加载书籍数据失败:', error);
            // 如果加载失败，使用默认数据
            return { books: [] };
        }
    },

    // 获取状态文本和类名
    getStatusInfo(status) {
        if (status === '已读') {
            return { text: '已读', className: 'status-read', tooltip: '' };
        } else if (status === '在读') {
            return { text: '在读', className: 'status-reading', tooltip: '' };
        } else if (status.includes('未读')) {
            // 提取'-'后的内容作为tooltip
            const tooltip = status.includes('-') ? status.split('-')[1] : status;
            return { text: '未读', className: 'status-unread', tooltip: tooltip };
        } else {
            return { text: '', className: '', tooltip: '' };
        }
    },

    // 从路径获取标签
    getBookTags(path) {
        const parts = path.split('/').filter(part => part.trim() !== '');
        return parts.slice(0, 2); // 最多返回前两个标签
    }
};

// 视图渲染器
const ViewRenderer = {
    // 渲染书籍网格视图
    renderBooks(books) {
        const bookshelf = document.getElementById('bookshelf');
        bookshelf.className = 'bookshelf';
        bookshelf.innerHTML = '';
        
        // 显示搜索栏
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.style.display = 'flex';
        }
        
        books.forEach(book => {
            const statusInfo = BookManager.getStatusInfo(book.read_status);
            const bookElement = document.createElement('div');
            bookElement.className = 'book-card';
            bookElement.innerHTML = `
    <div class="book-cover">
        <div class="book-cover-img">
            <i class="fas fa-book"></i>
        </div>
    </div>
    <div class="reading-status ${statusInfo.className}">
        ${statusInfo.text}
        ${statusInfo.tooltip ? `<span class="reading-plan-tooltip">${statusInfo.tooltip}</span>` : ''}
    </div>
    <div class="book-info">
        <h3 class="book-title">${book.name}</h3>
        <p class="book-author">${book.author}</p>
        <p class="book-publisher">${book.publisher}</p>
        <div book-id="${book.book_id}"></div>
    </div>
            `;
            bookElement.style.cursor = 'pointer'; // 添加指针样式，提示用户可点击

            bookElement.addEventListener('click', () => this.handleBookClick(book.book_id));
            bookshelf.appendChild(bookElement);
        });
    },

    // 处理书籍点击事件
    async handleBookClick(bookId) {
        try {
            // 获取files.json配置
            const config = await backend();
            const host = config.host;
            const downloadUrl = `${host}/book_url/${bookId}`;
            
            // 显示下载提醒模态窗
            const downloadModal = document.getElementById('downloadModal');
            const confirmDownloadBtn = document.getElementById('confirmDownload');
            
            // 设置模态窗为flex显示以居中内容
            downloadModal.style.display = 'flex';
            // 添加active类以触发动画
            setTimeout(() => {
                downloadModal.classList.add('active');
            }, 10);
            
            // 确认按钮点击事件
            const handleConfirmDownload = function() {
                // 移除事件监听以防止多次绑定
                confirmDownloadBtn.removeEventListener('click', handleConfirmDownload);
                
                // 添加关闭动画
                downloadModal.classList.remove('active');
                
                // 隐藏模态窗后跳转
                setTimeout(() => {
                    downloadModal.style.display = 'none';
                    // 跳转到下载链接
                    location.href = downloadUrl;
                }, 300);
            };
            
            // 绑定点击事件
            confirmDownloadBtn.addEventListener('click', handleConfirmDownload);
            
        } catch (error) {
            // 出错时隐藏模态窗并显示错误
            console.error('Error processing file link:', error);
            alert('处理文件链接时出错，请检查控制台获取更多信息。');
        }
    },

    // 构建文件夹树结构
    buildFolderTree(books) {
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
    },

    // 渲染文件夹导航栏
    renderFolderNavigation() {
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
                BookManager.loadBookData().then(data => {
                    ViewRenderer.renderFolderView(data.books);
                });
            });
        });
    },

    // 获取当前路径下的内容
    getCurrentFolderContent(tree, path) {
        let current = tree;
        
        for (const folderName of path) {
            if (current[folderName]) {
                current = current[folderName].children;
            } else {
                return {}; // 路径不存在
            }
        }
        
        return current;
    },

    // 渲染文件夹视图
    renderFolderView(books) {
        const bookshelf = document.getElementById('bookshelf');
        bookshelf.className = 'bookshelf folder-view';
        bookshelf.innerHTML = '';
        
        // 隐藏搜索栏
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.style.display = 'none';
        }
        
        // 构建文件夹树
        const folderTree = this.buildFolderTree(books);
        
        // 获取当前路径下的内容
        const currentContent = this.getCurrentFolderContent(folderTree, currentFolderPath);
        
        // 渲染导航栏
        this.renderFolderNavigation();
        
        // 渲染当前路径下的文件夹
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
                            <div class="folder-book" data-id="${book.book_id}">
                                <div class="reading-status ${BookManager.getStatusInfo(book.read_status).className}">
                                    ${BookManager.getStatusInfo(book.read_status).text}
                                    ${BookManager.getStatusInfo(book.read_status).tooltip ? `<span class="reading-plan-tooltip">${BookManager.getStatusInfo(book.read_status).tooltip}</span>` : ''}
                                </div>
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
        
        // 渲染当前路径下的书籍
        const fullPath = currentFolderPath.length > 0 ? currentFolderPath.join('/') + '/' : '';
        const currentFolderBooks = books.filter(book => book.from === fullPath);
        
        if (currentFolderBooks.length > 0) {
            const booksContainer = document.createElement('div');
            booksContainer.className = 'current-folder-books';
            booksContainer.innerHTML = `
            <h3><i class="fas fa-books"></i> 当前文件夹的书籍 (${currentFolderBooks.length})</h3>
            <div class="folder-books">
                ${currentFolderBooks.map(book => `
                    <div class="folder-book" data-id="${book.book_id}">
                        <div class="reading-status ${BookManager.getStatusInfo(book.read_status).className}">
                            ${BookManager.getStatusInfo(book.read_status).text}
                            ${BookManager.getStatusInfo(book.read_status).tooltip ? `<span class="reading-plan-tooltip">${BookManager.getStatusInfo(book.read_status).tooltip}</span>` : ''}
                        </div>
                        <div class="book-icon">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="book-title">${book.name}</div>
                        <div class="book-author">${book.author}</div>
                        <div class="book-publisher">${book.publisher}</div>
                    </div>
                `).join('')}
            </div>
        `;
            bookshelf.appendChild(booksContainer);
        }
        
        // 添加文件夹点击事件
        document.querySelectorAll('.folder-header').forEach(header => {
            header.addEventListener('click', function() {
                const folderName = this.getAttribute('data-folder');
                currentFolderPath.push(folderName);
                BookManager.loadBookData().then(data => {
                    ViewRenderer.renderFolderView(data.books);
                });
            });
        });
        
        // 添加书籍点击事件
        document.querySelectorAll('.folder-book').forEach(book => {
            book.addEventListener('click', (e) => {
                const bookId = e.currentTarget.getAttribute('data-id');
                this.handleBookClick(bookId);
            });
        });
    }
};

// 搜索处理器
const SearchHandler = {
    performSearch(data) {
        const searchInput = document.querySelector('.search-bar input');
        const term = searchInput.value.toLowerCase();
        
        if (term.trim() === '') {
            if (currentView === 'grid') {
                ViewRenderer.renderBooks(data.books);
            } else {
                ViewRenderer.renderFolderView(data.books);
            }
            return;
        }
        
        const filteredBooks = data.books.filter(book => 
            book.name.toLowerCase().includes(term) || 
            book.author.toLowerCase().includes(term) ||
            book.from.toLowerCase().includes(term)
        );
        
        if (currentView === 'grid') {
            ViewRenderer.renderBooks(filteredBooks);
        } else {
            ViewRenderer.renderFolderView(filteredBooks);
        }
    }
};

// 视图控制器
const ViewController = {
    init(data) {
        ViewRenderer.renderBooks(data.books);
        
        // 视图切换功能
        const gridViewBtn = document.getElementById('gridView');
        const folderViewBtn = document.getElementById('folderView');
        
        gridViewBtn.addEventListener('click', () => this.switchView('grid', data));
        folderViewBtn.addEventListener('click', () => this.switchView('folder', data));
        
        // 搜索功能
        const searchInput = document.querySelector('.search-bar input');
        const searchButton = document.querySelector('.search-bar button');
        
        searchButton.addEventListener('click', () => SearchHandler.performSearch(data));
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') SearchHandler.performSearch(data);
        });
    },

    switchView(view, data) {
        currentView = view;
        const gridViewBtn = document.getElementById('gridView');
        const folderViewBtn = document.getElementById('folderView');
        
        if (view === 'grid') {
            gridViewBtn.classList.add('active');
            folderViewBtn.classList.remove('active');
            ViewRenderer.renderBooks(data.books);
        } else {
            folderViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            currentFolderPath = []; // 重置路径
            ViewRenderer.renderFolderView(data.books);
        }
    }
};

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    BookManager.loadBookData().then(data => {
        ViewController.init(data);
    });
});