import os
import json
import sys
from datetime import datetime

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
        "date": datetime.now().isoformat(),
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
        date = datetime.fromisoformat(item["date"]).strftime("%Y-%m-%d %H:%M")
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
            date = datetime.fromisoformat(deleted["date"]).strftime("%Y-%m-%d %H:%M")
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
        print("1. 更新博客和动态列表")
        print("0. 返回主菜单")
        
        choice = input("请选择操作: ")
        
        if choice == "1":
            update_blogs()
        elif choice == "0":
            break
        else:
            print("无效的选择，请重试")

def main():
    """主函数"""
    while True:
        print("\n=== 博客站点管理系统 ===")
        print("1. 博客管理")
        print("2. 动态管理")
        print("0. 退出")
        
        choice = input("请选择操作: ")
        
        if choice == "1":
            blog_menu()
        elif choice == "2":
            daily_menu()
        elif choice == "0":
            print("感谢使用，再见！")
            break
        else:
            print("无效的选择，请重试")

if __name__ == "__main__":
    main()