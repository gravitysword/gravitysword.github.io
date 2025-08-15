import os
import json
import sys
import datetime
from typing import List

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

# ===== 通用工具函数 =====
def list_files(directory: str) -> List[str]:
    """递归列出目录中的所有文件"""
    file_paths = []
    for entry in os.listdir(directory):
        full_path = os.path.join(directory, entry).replace("\\", "/")
        if os.path.isdir(full_path):
            file_paths.extend(list_files(full_path))
        else:
            file_paths.append(full_path)
    return file_paths

def sort_files_by_structure(file_paths: List[str]) -> List[str]:
    """按目录结构和文件名排序文件"""
    def get_sort_key(path):
        parts = path.replace("\\", "/").split("/")
        # 根目录文件排最后
        if len(parts) == 1:
            return (9999, 9999, parts[0])
        
        try:
            year = int(parts[-2])
            num = int(parts[-1].split(".")[0])
            return (year, num, "/".join(parts[:-1]))
        except (ValueError, IndexError):
            return (9998, 9999, path)
    
    return sorted(file_paths, key=get_sort_key)

def update_file_list(config_key: str, directory_path: str) -> int:
    """通用函数：更新指定类型的文件列表"""
    full_dir = os.path.join(os.getcwd(), directory_path).replace("\\", "/")
    if not os.path.exists(full_dir):
        print(f"目录不存在: {full_dir}")
        return 0
    
    files = list_files(full_dir)
    relative_files = [os.path.relpath(f, full_dir).replace("\\", "/") 
                     for f in files if f.endswith('.md')]
    
    sorted_files = sort_files_by_structure(relative_files)
    
    config = load_config()
    config[config_key] = sorted_files
    save_config(config)
    
    return len(sorted_files)

def parse_blog_metadata(content):
    """解析博客文章中的元数据"""
    try:
        start = content.find('{', content.find('<div style="display:none;" class="author"'))
        end = content.find('}', start) + 1
        return json.loads(content[start:end])
    except Exception as e:
        print(f"解析元数据失败: {str(e)}")
        return None

def update_all_file_lists():
    """一键更新所有文件列表（博客、动态、技术栈）"""
    file_types = [
        ("blogs", "article/blog", "博客"),
        ("daily", "article/daily", "动态"),
        ("tech_stack", "article/tech_stack", "技术栈")
    ]
    
    total_files = 0
    for config_key, directory, name in file_types:
        count = update_file_list(config_key, directory)
        print(f"已更新{name}列表，共 {count} 篇文章")
        total_files += count
    
    print(f"\n总计更新 {total_files} 个文件")

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
        print("1. 一键更新所有文件列表")
        print("0. 返回主菜单")
        
        choice = input("请选择操作: ")
        
        if choice == "1":
            update_all_file_lists()
        elif choice == "0":
            break
        else:
            print("无效的选择，请重试")

def main():
    """主函数"""
    while True:
        print("\n=== 博客站点管理系统 ===")
        print("1. 一键更新所有文件列表")
        print("0. 退出")
        
        choice = input("请选择操作: ")
        
        if choice == "1":
            update_all_file_lists()
        elif choice == "0":
            print("感谢使用，再见！")
            break
        else:
            print("无效的选择，请重试")

if __name__ == "__main__":
    main()