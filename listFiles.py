import os

def list_files(directory):
    file_paths = []
    # 递归遍历目录
    for entry in os.listdir(directory):
        if entry == ".git":  # 忽略.git文件夹
            continue
        full_path = os.path.join(directory, entry).replace("\\", "/")  # 使用斜杠作为分隔符
        if os.path.isdir(full_path):
            file_paths.extend(list_files(full_path))  # 递归调用
        else:
            file_paths.append(full_path)
    return file_paths

if __name__ == "__main__":
    directory = os.getcwd().replace("\\", "/")
    files = list_files(directory)
    with open("all.txt", "w") as f:
        for file in files:
            f.write(file.replace(directory, "https://gravitysword.github.io") + "\n")