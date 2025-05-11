import os
import json
import sys
import datetime
from xml.etree import ElementTree as ET
from xml.dom import minidom

# 配置文件路径
CONFIG_PATH = "config/blogs.json"

# ===== 配置文件操作函数 =====
def load_config():
    """加载配置文件"""
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
        return {"blogs": [], "daily": []}

def save_config(config):
    """保存配置文件"""
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=4)
        print("配置已保存")
    except Exception as e:
        print(f"Error saving config: {e}")

# ===== 博客文章管理函数 =====
def cmp(x, y):
    # 新增根目录判断逻辑
    x_in_root = '/' not in x
    y_in_root = '/' not in y
    
    # 根目录文件永远排最后
    if x_in_root and not y_in_root:
        return True  # 需要交换位置
    elif not x_in_root and y_in_root:
        return False  # 不需要交换
    elif x_in_root and y_in_root:
        return False  # 都根目录保持原序
    
    # 原有排序逻辑
    x_year = int(x.split("/")[-2])
    x_num = int(x.split("/")[-1].split(".")[0])
    y_year = int(y.split("/")[-2])
    y_num = int(y.split("/")[-1].split(".")[0])

    if x_year > y_year:
        return False
    elif x_year < y_year:
        return True
    else:
        return x_num < y_num  # 改为升序排列（可选）

def sort_daily(daily_files):
    """对动态文件进行排序"""
    for i in range(len(daily_files)-1):
        for j in range(i+1, len(daily_files)):
            if cmp(daily_files[i], daily_files[j]):
                daily_files[i], daily_files[j] = daily_files[j], daily_files[i]
    
def sort_blog(blogs):
    """对博客文件进行排序"""
    for i in range(len(blogs)-1):
        for j in range(i+1, len(blogs)):
            if cmp(blogs[i], blogs[j]):
                blogs[i], blogs[j] = blogs[j], blogs[i]
    
def list_files(directory):
    """递归列出目录中的所有文件"""
    file_paths = []
    # 递归遍历目录
    for entry in os.listdir(directory):
        full_path = os.path.join(directory, entry).replace("\\", "/")  # 使用斜杠作为分隔符
        if os.path.isdir(full_path):
            file_paths.extend(list_files(full_path))  # 递归调用
        else:
            file_paths.append(full_path)
    return file_paths

def update_blogs():
    """更新博客文件列表"""
    # 更新博客列表
    blog_directory = os.getcwd().replace("\\", "/")+"/blog/"
    blog_files = list_files(blog_directory)
    for i in range(len(blog_files)):
        blog_files[i] = blog_files[i].replace(blog_directory, "")
    sort_blog(blog_files)
    
    # 更新动态列表
    daily_directory = os.getcwd().replace("\\", "/")+"/daily/"
    daily_files = list_files(daily_directory)
    for i in range(len(daily_files)):
        daily_files[i] = daily_files[i].replace(daily_directory, "")
    sort_daily(daily_files)
    
    # 加载现有配置并更新
    config = load_config()
    config["blogs"] = blog_files
    config["daily"] = daily_files
    save_config(config)
    print(f"已更新博客列表，共 {len(blog_files)} 篇文章")
    print(f"已更新动态列表，共 {len(daily_files)} 条动态")

def update_tech_stack():
    """更新技术栈文件列表及元数据"""
    # 获取技术栈目录路径
    tech_stack_dir = os.path.join(os.getcwd(), 'tech_stack').replace("\\", "/")
    
    # 获取所有.md文件
    tech_stack_files = list_files(tech_stack_dir)
    for i in range(len(tech_stack_files)):
        tech_stack_files[i] = tech_stack_files[i].replace(tech_stack_dir + "/", "")
    
    # 加载现有配置
    config = load_config()
    if "tech_stack" not in config:
        config["tech_stack"] = {"tag": [], "article": []}
    
    # 清空现有列表
    config["tech_stack"]["tag"] = []
    config["tech_stack"]["article"] = tech_stack_files
    
    # 遍历每个文件解析元数据
    for file_path in tech_stack_files:
        full_path = os.path.join(tech_stack_dir, file_path)
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                metadata = parse_blog_metadata(content)
                if metadata:
                    
                    # 更新标签列表（不重复添加）
                    if "tag" in metadata:
                        for tag in metadata["tag"]:
                            if tag not in config["tech_stack"]["tag"]:
                                config["tech_stack"]["tag"].append(tag)
        except Exception as e:
            print(f"处理文件 {file_path} 时出错: {str(e)}")
    
    # 保存更新后的配置
    save_config(config)
    print(f"已更新技术栈列表，共 {len(tech_stack_files)} 篇文章")
    print(f"标签列表：{config['tech_stack']['tag']}")

# ===== 动态管理函数 =====
def add_daily_item():
    """添加新的动态项目"""
    config = load_config()
    
    # 确保daily键存在
    if "daily" not in config:
        config["daily"] = []
    
    # 获取用户输入
    print("\n=== 添加新的动态 ===")
    content = input("请输入动态内容: ")
    
    # 图片链接
    images = []
    while True:
        img = input("请输入图片链接 (留空结束): ")
        if not img:
            break
        images.append(img)
    
    # 标签
    tags = []
    while True:
        tag = input("请输入标签 (留空结束): ")
        if not tag:
            break
        tags.append(tag)
    
    # 创建新项目
    new_item = {
        "date": datetime.datetime.now().isoformat(),
        "content": content,
        "images": images,
        "tags": tags
    }
    
    # 添加到配置
    config["daily"].append(new_item)
    
    # 保存配置
    save_config(config)
    print("动态已添加成功!")

def list_daily_items():
    """列出所有动态项目"""
    config = load_config()
    
    if "daily" not in config or not config["daily"]:
        print("暂无动态内容")
        return
    
    print("\n=== 动态列表 ===")
    for i, item in enumerate(config["daily"]):
        date = datetime.datetime.fromisoformat(item["date"]).strftime("%Y-%m-%d %H:%M")
        content_preview = item["content"][:30] + "..." if len(item["content"]) > 30 else item["content"]
        print(f"{i+1}. [{date}] {content_preview}")

def delete_daily_item():
    """删除动态项目"""
    config = load_config()
    
    if "daily" not in config or not config["daily"]:
        print("暂无动态内容可删除")
        return
    
    list_daily_items()
    
    try:
        index = int(input("\n请输入要删除的动态序号: ")) - 1
        if 0 <= index < len(config["daily"]):
            deleted = config["daily"].pop(index)
            date = datetime.datetime.fromisoformat(deleted["date"]).strftime("%Y-%m-%d %H:%M")
            print(f"已删除: [{date}] {deleted['content'][:30]}...")
            save_config(config)
        else:
            print("无效的序号")
    except ValueError:
        print("请输入有效的数字")

# ===== RSS生成函数 =====
def parse_blog_metadata(content):
    """解析博客文章中的元数据"""
    try:
        # 查找元数据部分（在<div class="author">标签中的JSON）
        start = content.find('{', content.find('<div style="display:none;" class="author"'))
        end = content.find('}', start) + 1
        metadata = json.loads(content[start:end])
        return metadata
    except Exception as e:
        print(f"解析元数据失败: {str(e)}")
        return None

def generate_rss(is_cloud=False):
    """生成RSS feed
    
    Args:
        is_cloud (bool): 是否为云端模式，True为云端模式使用GitHub Pages链接，False为本地模式
    """
    # 创建RSS根元素
    rss = ET.Element('rss', version='2.0')
    channel = ET.SubElement(rss, 'channel')
    
    # 设置基础URL
    base_url = "https://gravitysword.github.io" if is_cloud else "http://localhost:8000"
    
    # 设置频道基本信息
    title = ET.SubElement(channel, 'title')
    title.text = '泛舟游客的博客'
    link = ET.SubElement(channel, 'link')
    link.text = base_url
    description = ET.SubElement(channel, 'description')
    description.text = '欢迎来到泛舟游客的博客'
    
    # 遍历博客文章目录
    blog_dir = os.path.join(os.path.dirname(__file__), 'blog')
    articles = []
    
    # 收集所有文章
    for root, dirs, files in os.walk(blog_dir):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    metadata = parse_blog_metadata(content)
                    if metadata:
                        articles.append((metadata, file_path))
    
    # 按日期排序文章（最新的在前）
    def get_date(article):
        date_str = article[0].get('date', '')
        try:
            return datetime.datetime.strptime(date_str, '%Y-%m-%d')
        except:
            return datetime.datetime.min
    articles.sort(key=get_date, reverse=True)
    
    # 添加文章到RSS feed
    for metadata, file_path in articles:
        item = ET.SubElement(channel, 'item')
        
        # 添加标题
        item_title = ET.SubElement(item, 'title')
        item_title.text = metadata.get('title', '')
        
        # 添加链接
        item_link = ET.SubElement(item, 'link')
        rel_path = os.path.relpath(file_path, blog_dir).replace('\\', '/')
        item_link.text = f'{base_url}/blog/{rel_path}'
        
        # 添加描述
        item_description = ET.SubElement(item, 'description')
        item_description.text = metadata.get('description', '')
        
        # 添加发布日期
        item_pubDate = ET.SubElement(item, 'pubDate')
        date_str = metadata.get('date', '')
        try:
            # 解析日期并设置默认时间为当天中午12点
            date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d')
            date_obj = date_obj.replace(hour=12, minute=0, second=0)
            item_pubDate.text = date_obj.strftime('%a, %d %b %Y %H:%M:%S +0800')
        except:
            item_pubDate.text = ''
        
        # 添加分类（标签）
        for tag in metadata.get('tag', []):
            category = ET.SubElement(item, 'category')
            category.text = tag
            
    return rss  # 返回生成的RSS元素

def save_rss(rss_path='rss.xml', is_cloud=False):
    """生成RSS feed并保存到文件
    
    Args:
        rss_path (str): RSS文件保存路径
        is_cloud (bool): 是否为云端模式，True为云端模式使用GitHub Pages链接，False为本地模式
    """
    try:
        # 生成RSS内容
        rss = generate_rss(is_cloud)
        
        # 格式化XML输出
        xml_str = minidom.parseString(ET.tostring(rss)).toprettyxml(indent='  ')
        
        # 保存到文件
        with open(rss_path, 'w', encoding='utf-8') as f:
            f.write(xml_str)
            
        mode_str = "云端" if is_cloud else "本地"
        print(f'{mode_str}模式 RSS feed已生成: {rss_path}')
    except Exception as e:
        print(f'生成RSS feed失败: {str(e)}')

# ===== 主菜单函数 =====
def daily_menu():
    """动态管理菜单"""
    while True:
        print("\n=== 动态管理 ===")
        print("1. 添加新动态")
        print("2. 查看所有动态")
        print("3. 删除动态")
        print("0. 返回主菜单")
        
        choice = input("请选择操作: ")
        
        if choice == "1":
            add_daily_item()
        elif choice == "2":
            list_daily_items()
        elif choice == "3":
            delete_daily_item()
        elif choice == "0":
            break
        else:
            print("无效的选择，请重试")

def blog_menu():
    """博客管理菜单"""
    while True:
        print("\n=== 博客管理 ===")
        print("1. 更新博客和动态列表")
        print("2. 更新技术栈列表")
        print("3. 生成本地RSS订阅文件")
        print("4. 生成云端RSS订阅文件")
        print("0. 返回主菜单")
        
        choice = input("请选择操作: ")
        
        if choice == "1":
            update_blogs()
        elif choice == "2":
            update_tech_stack()
        elif choice == "3":
            save_rss(is_cloud=False)
        elif choice == "4":
            save_rss(is_cloud=True)
        elif choice == "0":
            break
        else:
            print("无效的选择，请重试")

def main():
    """主函数"""
    while True:
        print("\n=== 博客站点管理系统 ===")
        print("1. 更新博客和动态列表")
        print("2. 更新技术栈列表")
        print("3. 生成本地RSS订阅文件")
        print("4. 生成云端RSS订阅文件")
        print("0. 退出")
        
        choice = input("请选择操作: ")
        
        if choice == "1":
            update_blogs()
        elif choice == "2":
            update_tech_stack()
        elif choice == "3":
            save_rss(is_cloud=False)
        elif choice == "4":
            save_rss(is_cloud=True)
        elif choice == "0":
            print("感谢使用，再见！")
            break
        else:
            print("无效的选择，请重试")

if __name__ == "__main__":
    main()