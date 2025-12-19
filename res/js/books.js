// 书籍管理器
const BookManager = {
    // 获取书籍数据 - 从本地配置文件加载
    async loadBookData() {
        try {
            const response = await fetch('/config/books.json');
            const configData = await response.json();
            
            // 检查配置数据格式
            if (configData && configData.books && Array.isArray(configData.books)) {
                // 转换数据格式以匹配现有视图渲染逻辑
                const books = configData.books.map(book => ({
                    book_id: book.id,
                    name: book.title,
                    author: book.author,
                    publisher: book.publisher,
                    read_status: book.status,
                    from: book.tags ? book.tags.join('/') : '',
                    created_at: book.created_at
                }));
                
                // 按照创建时间由近至远排序
                books.sort((a, b) => {
                    return new Date(b.created_at) - new Date(a.created_at);
                });
                
                console.log('成功从本地配置加载书籍数据:', books);
                return { books };
            } else {
                console.error('书籍配置文件格式不正确');
                return { books: [] };
            }
        } catch (error) {
            console.error('加载书籍数据失败:', error);
            // 如果加载失败，使用默认数据
            return { books: [] };
        }
    },

    // 获取状态文本和类名
    getStatusInfo(status) {
        // 解析双维度状态格式："活跃状态-阅读状态"
        const [activeStatus, readingStatus] = status.split('-') || ['阅读中', '待读'];
        
        // 根据活跃状态和阅读状态返回显示信息
        return {
            text: readingStatus,
            activeStatus: activeStatus,
            readingStatus: readingStatus,
            tooltip: ''
        };
    }
};

// 视图渲染器
const ViewRenderer = {
    selectedTagPath: null, // 当前选中的标签路径
    expandedNodes: new Set(), // 保存展开的节点路径
    currentView: 'list', // 当前视图类型：'list' 或 'cards'
    
    // 构建标签树形结构
    buildTagsTree(books) {
        // 初始化根节点
        const tagsTree = {
            name: '全部书籍',
            path: null,
            children: {}
        };
        
        // 遍历所有书籍，构建标签树
        books.forEach(book => {
            if (book.from && book.from.trim() !== '') {
                const pathParts = book.from.split('/').filter(part => part.trim() !== '');
                if (pathParts.length > 0) {
                    let currentNode = tagsTree;
                    let currentPath = null;
                    
                    pathParts.forEach((tag, index) => {
                        if (index === 0) {
                            currentPath = tag;
                        } else {
                            currentPath += `/${tag}`;
                        }
                        
                        if (!currentNode.children[tag]) {
                            currentNode.children[tag] = {
                                name: tag,
                                path: currentPath,
                                children: {}
                            };
                        }
                        
                        currentNode = currentNode.children[tag];
                    });
                }
            }
        });
        
        return tagsTree;
    },
    
    // 创建标签节点元素
    createTagNode(node, books, selectedTagPath, expandedNodes) {
        const tagNode = document.createElement('div');
        tagNode.className = 'tag-node';
        
        const tagHeader = document.createElement('div');
        tagHeader.className = `tag-node-header ${selectedTagPath === node.path ? 'active' : ''}`;
        
        // 创建切换按钮
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'tag-toggle';
        
        // 创建标签名称
        const tagName = document.createElement('span');
        tagName.className = 'tag-name';
        tagName.textContent = node.name;
        
        // 组装标签头部
        tagHeader.appendChild(toggleBtn);
        tagHeader.appendChild(tagName);
        
        // 先将标签头部添加到节点
        tagNode.appendChild(tagHeader);
        
        // 渲染子节点
        const children = Object.values(node.children);
        if (children.length > 0) {
            const isExpanded = expandedNodes.has(node.path);
            toggleBtn.textContent = isExpanded ? '▼' : '►';
            
            const childrenContainer = document.createElement('div');
            childrenContainer.className = `tag-children ${isExpanded ? 'open' : ''}`;
            
            children.forEach(child => {
                childrenContainer.appendChild(this.createTagNode(child, books, selectedTagPath, expandedNodes));
            });
            
            // 将子节点容器添加到节点
            tagNode.appendChild(childrenContainer);
            
            // 点击tag-node-header时，同时执行筛选和展开/收缩操作
            tagHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 1. 先处理展开/收缩逻辑
                childrenContainer.classList.toggle('open');
                toggleBtn.textContent = childrenContainer.classList.contains('open') ? '▼' : '►';
                
                // 2. 保存展开状态
                if (childrenContainer.classList.contains('open')) {
                    expandedNodes.add(node.path);
                } else {
                    expandedNodes.delete(node.path);
                }
                
                // 3. 执行筛选图书操作
                this.filterBooksByTagPath(node.path, books);
            });
        } else {
            toggleBtn.textContent = ' ';
            
            // 没有子节点的节点，点击只筛选图书
            tagHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                this.filterBooksByTagPath(node.path, books);
            });
        }
        
        return tagNode;
    },
    
    // 根据标签路径筛选书籍
    filterBooksByTagPath(tagPath, books) {
        let filteredBooks = [];
        
        if (tagPath === null) {
            // 显示全部书籍
            filteredBooks = [...books];
        } else {
            // 根据标签路径筛选书籍
            filteredBooks = books.filter(book => {
                if (book.from && book.from.trim() !== '') {
                    const bookPathParts = book.from.split('/').filter(part => part.trim() !== '');
                    for (let i = 0; i < bookPathParts.length; i++) {
                        const bookTagPath = bookPathParts.slice(0, i + 1).join('/');
                        if (bookTagPath === tagPath) {
                            return true;
                        }
                    }
                }
                return false;
            });
        }
        
        // 根据当前视图类型渲染书籍
        if (this.currentView === 'list') {
            this.renderBooksList(filteredBooks);
        } else {
            this.renderBooksCards(filteredBooks);
        }
    },
    
    // 切换视图类型
    toggleView() {
        this.currentView = this.currentView === 'list' ? 'cards' : 'list';
        this.updateViewButtons();
        // 重新渲染当前筛选的书籍
        this.filterBooksByTagPath(this.selectedTagPath, this.currentBooks);
    },
    
    // 更新视图切换按钮状态
    updateViewButtons() {
        const listBtn = document.getElementById('viewListBtn');
        const cardsBtn = document.getElementById('viewCardsBtn');
        
        if (listBtn && cardsBtn) {
            if (this.currentView === 'list') {
                listBtn.classList.add('active');
                cardsBtn.classList.remove('active');
            } else {
                cardsBtn.classList.add('active');
                listBtn.classList.remove('active');
            }
        }
    },
    
    // 渲染标签树形结构
    renderTagsTree(books, selectedTagPath, expandedNodes) {
        const tagsTreeContainer = document.getElementById('tagsTree');
        if (tagsTreeContainer) {
            tagsTreeContainer.innerHTML = '';
            
            // 创建标签树形结构
            const tree = this.buildTagsTree(books);
            
            // 创建根节点
            const rootNode = this.createTagNode(tree, books, selectedTagPath, expandedNodes);
            tagsTreeContainer.appendChild(rootNode);
        }
    },
    
    // 渲染书籍列表（表格形式）
    renderBooksList(books) {
        const booksListContainer = document.getElementById('booksList');
        if (booksListContainer) {
            booksListContainer.innerHTML = '';
            
            if (books.length === 0) {
                booksListContainer.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">暂无书籍</div>';
                return;
            }
            
            // 创建卡片容器
            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'books-cards-container';
            
            // 添加列表头部
            const listHeader = document.createElement('div');
            listHeader.className = 'books-list-header';
            listHeader.innerHTML = `
                <div>书名</div>
                <div>作者</div>
                <div>出版社</div>
                <div>状态</div>
            `;
            cardsContainer.appendChild(listHeader);
            
            books.forEach(book => {
                // 创建卡片元素
                const card = document.createElement('div');
                card.className = 'book-card';
                card.dataset.bookId = book.book_id;
                
                const statusInfo = BookManager.getStatusInfo(book.read_status);
            
            // 创建卡片内容
            card.innerHTML = `
                <div class="book-card-content">
                    <h3 class="book-card-title">${book.name}</h3>
                </div>
                <div class="book-card-author">${book.author.replace(/\n/g, '<br>')}</div>
                <div class="book-card-publisher">${book.publisher}</div>
                <div class="book-card-status">
                    <span class="status-badge status-${this.getStatusClass(statusInfo)}">
                        ${statusInfo.text}
                    </span>
                </div>
            `;
                
                cardsContainer.appendChild(card);
            });
            
            booksListContainer.appendChild(cardsContainer);
        }
    },
    
    // 渲染书籍卡片（网格形式）
    renderBooksCards(books) {
        const booksListContainer = document.getElementById('booksList');
        if (booksListContainer) {
            booksListContainer.innerHTML = '';
            
            if (books.length === 0) {
                booksListContainer.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">暂无书籍</div>';
                return;
            }
            
            // 创建卡片容器
            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'books-grid-container';
            
            books.forEach(book => {
                // 创建卡片元素
                const card = document.createElement('div');
                card.className = 'book-card-grid';
                card.dataset.bookId = book.book_id;
                
                const statusInfo = BookManager.getStatusInfo(book.read_status);
            
            // 创建卡片内容
            card.innerHTML = `
                <div class="book-card-grid-content">
                    <h3 class="book-card-grid-title">${book.name}</h3>
                    <div class="book-card-grid-author">${book.author.replace(/\n/g, '<br>')}</div>
                    <div class="book-card-grid-publisher">${book.publisher}</div>
                    <div class="book-card-grid-status">
                        <span class="status-badge status-${this.getStatusClass(statusInfo)}">
                            ${statusInfo.text}
                        </span>
                    </div>
                </div>
            `;
                
                cardsContainer.appendChild(card);
            });
            
            booksListContainer.appendChild(cardsContainer);
        }
    },
    
    // 获取状态对应的CSS类
    getStatusClass(statusInfo) {
        // 封存状态下所有标签使用统一的浅灰色样式
        if (statusInfo.activeStatus === '封存') {
            return 'archived';
        } else {
            // 阅读中状态下根据阅读状态返回不同样式
            switch (statusInfo.readingStatus) {
                case '已读':
                    return 'active';
                case '在读':
                    return 'warning';
                case '待读':
                    return 'inactive';
                default:
                    return '';
            }
        }
    },
    
    // 渲染文件夹视图 - 采用左右分栏布局
    renderFolderView(books) {
        this.currentBooks = books; // 存储当前书籍数据
        
        const bookshelf = document.getElementById('bookshelf');
        bookshelf.className = 'bookshelf folder-view';
        bookshelf.innerHTML = '';
        
        // 隐藏搜索栏
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.style.display = 'none';
        }
        
        // 创建左右分栏布局
        bookshelf.innerHTML = `
            <div class="books-container">
                <!-- 标签树形结构 -->
                <div class="tags-tree-container">
                    <h4>标签分类</h4>
                    <div id="tagsTree" class="tags-tree"></div>
                </div>
                
                <!-- 书籍列表 -->
                <div class="books-list-container">
                    <div class="books-list-header-row">
                        <h4>书籍列表</h4>
                        <div class="view-toggle-buttons">
                            <button id="viewListBtn" class="view-toggle-btn active" title="列表视图">
                                <i class="fas fa-list"></i>
                            </button>
                            <button id="viewCardsBtn" class="view-toggle-btn" title="卡片视图">
                                <i class="fas fa-th-large"></i>
                            </button>
                        </div>
                    </div>
                    <div id="booksList" class="books-list"></div>
                </div>
            </div>
        `;
        
        // 添加视图切换事件监听器
        const listBtn = document.getElementById('viewListBtn');
        const cardsBtn = document.getElementById('viewCardsBtn');
        
        if (listBtn && cardsBtn) {
            listBtn.addEventListener('click', () => {
                this.currentView = 'list';
                this.updateViewButtons();
                this.filterBooksByTagPath(this.selectedTagPath, books);
            });
            
            cardsBtn.addEventListener('click', () => {
                this.currentView = 'cards';
                this.updateViewButtons();
                this.filterBooksByTagPath(this.selectedTagPath, books);
            });
        }
        
        // 渲染标签树形结构
        this.renderTagsTree(books, this.selectedTagPath, this.expandedNodes);
        
        // 初始渲染全部书籍
        this.filterBooksByTagPath(null, books);
    }
};

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    BookManager.loadBookData().then(data => {
        // 直接渲染文件夹视图
        ViewRenderer.renderFolderView(data.books);
    });
});