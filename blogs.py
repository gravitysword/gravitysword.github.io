import os
import json


def cmp(x,y):
    x_year = int(x.split("/")[-2])
    x_num = int(x.split("/")[-1].split(".")[0])
    
    y_year = int(y.split("/")[-2])
    y_num = int(y.split("/")[-1].split(".")[0])

    if x_year > y_year:
        return False
    elif x_year < y_year:
        return True
    else:
        if x_num > y_num:
            return False
        else:
            return True
    
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