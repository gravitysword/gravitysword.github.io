// 书籍管理器
const BookManager = {
    // 获取书籍数据 - 从本地 CSV 配置文件加载
    async loadBookData() {
        try {
            const response = await fetch('/config/books.csv');
            const csvText = await response.text();
            
            // 解析 CSV 数据
            const books = this.parseCSV(csvText);
            
            return { books };
        } catch (error) {
            console.error('加载书籍数据失败:', error);
            // 如果加载失败，使用默认数据
            return { books: [] };
        }
    },

    // 解析 CSV 数据
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            return [];
        }

        // 解析表头
        const headers = lines[0].split(',').map(h => h.trim());
        
        // 解析数据行
        const books = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length !== headers.length) {
                console.warn(`第 ${i + 1} 行数据格式不正确，跳过`);
                continue;
            }

            const book = {};
            headers.forEach((header, index) => {
                book[header] = values[index];
            });

            // 转换数据格式以匹配现有视图渲染逻辑
            books.push({
                book_id: book.id,
                name: book.title,
                author: this.deserializeArray(book.author),
                publisher: book.publisher,
                read_status: book.status,
                from: book.tags ? this.deserializeArray(book.tags).join('/') : '',
                created_at: book.created_at
            });
        }

        // 按照创建时间由近至远排序
        books.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });

        return books;
    },

    // 解析 CSV 行（处理包含逗号的字段）
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    },

    // 反序列化数组（使用 "||" 分隔符）
    deserializeArray(str) {
        if (!str || str.trim() === '') {
            return [];
        }
        return str.split('||').map(item => item.trim()).filter(item => item !== '');
    },

    // 获取状态文本和CSS类（简化状态系统：只支持"阅读中"和"闲置"）
    getStatusInfo(status) {
        const text = status === '阅读中' ? '阅读中' : '闲置';
        return {
            text,
            className: text === '阅读中' ? 'reading' : 'idle'
        };
    }
};

// 视图渲染器
const ViewRenderer = {
    selectedTagPath: null, // 当前选中的标签路径
    expandedNodes: new Set(), // 保存展开的节点路径
    currentView: 'cards', // 当前视图类型：'list' 或 'cards'
    
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
                <div class="book-card-author">${Array.isArray(book.author) ? book.author.join('<br>') : book.author}</div>
                <div class="book-card-publisher">${book.publisher}</div>
                <div class="book-card-status">
                    <span class="status-badge status-${statusInfo.className}">
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
            
            // 创建边框纹理元素
            const borderTexture = document.createElement('div');
            borderTexture.className = 'book-card-grid-border-texture';
            
            // 创建边缘光晕元素
            const edgeGlow = document.createElement('div');
            edgeGlow.className = 'book-card-grid-edge-glow';
            
            // 创建纸张纹理元素
            const texture = document.createElement('div');
            texture.className = 'book-card-grid-texture';
            
            // 创建书脊装订线元素
            const spine = document.createElement('div');
            spine.className = 'book-card-grid-spine';
            
            // 创建卡片内容
            const content = document.createElement('div');
            content.className = 'book-card-grid-content';
            content.innerHTML = `
                <h3 class="book-card-grid-title">${book.name}</h3>
                <div class="book-card-grid-author">${Array.isArray(book.author) ? book.author.join('<br>') : book.author}</div>
                <div class="book-card-grid-publisher">${book.publisher}</div>
            `;
            
            // 创建状态标签
            const status = document.createElement('div');
            status.className = 'book-card-grid-status';
            status.innerHTML = `
                <span class="status-badge status-${statusInfo.className}">
                    ${statusInfo.text}
                </span>
            `;
                
                // 按顺序添加元素
                card.appendChild(borderTexture);
                card.appendChild(edgeGlow);
                card.appendChild(texture);
                card.appendChild(spine);
                card.appendChild(content);
                card.appendChild(status);
                
                cardsContainer.appendChild(card);
            });
            
            booksListContainer.appendChild(cardsContainer);
        }
    },
    
    // 渲染文件夹视图 - 采用左右分栏布局
    renderFolderView(books) {
        const bookshelf = document.getElementById('bookshelf');
        bookshelf.className = 'bookshelf folder-view';
        bookshelf.innerHTML = '';
        
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
                            <button id="viewCardsBtn" class="view-toggle-btn active" title="卡片视图">
                                <svg viewBox="0 0 448 512" width="14" height="14" fill="currentColor"><path d="M0 96C0 60.7 28.7 32 64 32h96c35.3 0 64 28.7 64 64v96c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zm160 0H64v96h96V96zM288 32h96c35.3 0 64 28.7 64 64v96c0 35.3-28.7 64-64 64h-96c-35.3 0-64-28.7-64-64V96c0-35.3 28.7-64 64-64zm96 160V96h-96v96h96zM0 320c0-35.3 28.7-64 64-64h96c35.3 0 64 28.7 64 64v96c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64v-96zm160 0H64v96h96v-96zM288 256h96c35.3 0 64 28.7 64 64v96c0 35.3-28.7 64-64 64h-96c-35.3 0-64-28.7-64-64v-96c0-35.3 28.7-64 64-64zm96 160v-96h-96v96h96z"/></svg>
                            </button>
                            <button id="viewListBtn" class="view-toggle-btn" title="列表视图">
                                <svg viewBox="0 0 512 512" width="14" height="14" fill="currentColor"><path d="M40 48C17.9 48 0 65.9 0 88v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V88c0-22.1-17.9-40-40-40H40zm192 0c-13.3 0-24 10.7-24 24s10.7 24 24 24h256c13.3 0 24-10.7 24-24s-10.7-24-24-24H232zm0 160c-13.3 0-24 10.7-24 24s10.7 24 24 24h256c13.3 0 24-10.7 24-24s-10.7-24-24-24H232zm0 160c-13.3 0-24 10.7-24 24s10.7 24 24 24h256c13.3 0 24-10.7 24-24s-10.7-24-24-24H232zM16 232c0-13.3 10.7-24 24-24h48c13.3 0 24 10.7 24 24v48c0 13.3-10.7 24-24 24H40c-13.3 0-24-10.7-24-24v-48zm192 0c-13.3 0-24 10.7-24 24s10.7 24 24 24h256c13.3 0 24-10.7 24-24s-10.7-24-24-24H232z"/></svg>
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
        
        const setView = (view) => {
            this.currentView = view;
            this.updateViewButtons();
            this.filterBooksByTagPath(this.selectedTagPath, books);
        };
        
        if (listBtn && cardsBtn) {
            listBtn.addEventListener('click', () => setView('list'));
            cardsBtn.addEventListener('click', () => setView('cards'));
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