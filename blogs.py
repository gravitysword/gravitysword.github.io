import os
import json


def cmp(x,y):
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
    
def sort_blog(blogs):
    for i in range(len(blogs)-1):
        for j in range(i+1,len(blogs)-1):
            if cmp(blogs[i],blogs[j]):
                blogs[i],blogs[j] = blogs[j],blogs[i]
    
def list_files(directory):
    file_paths = []
    # 递归遍历目录
    for entry in os.listdir(directory):
        full_path = os.path.join(directory, entry).replace("\\", "/")  # 使用斜杠作为分隔符
        if os.path.isdir(full_path):
            file_paths.extend(list_files(full_path))  # 递归调用
        else:
            file_paths.append(full_path)
    return file_paths

if __name__ == "__main__":
    directory = os.getcwd().replace("\\", "/")+"/blog/"
    files = list_files(directory)
    for i in range(len(files)):
        files[i] = files[i].replace(directory,"")
    sort_blog(files)
    json.dump({"blogs":files},open("config/blogs.json","w"),indent=4)