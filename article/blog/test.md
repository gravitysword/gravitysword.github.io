<div style="display:none;" class="author">
{
    "title": "测试",
    "date" : "2025-02-23",
    "weather" : "sunny",
    "description": "欢迎来到 泛舟游客 的博客",
    "tag" : ["测试"]
}
</div>

# 测试
## 测试

### 测试文本
本文用于测试博客页面的各类功能是否完善，包括：图片托管，视频托管，文件托管，latex公式，跳转按钮。

### 测试图片
![测试](https://sns-na-i2.xhscdn.com/spectrum/1040g34o31h6jan57424g5pgi0nb1om97r2bn41g)

### 测试视频

<video src="https://sns-video-default.xhscdn.com/stream/79/110/258/01e7fe53860d57424f037001963977f94f_258.mp4" controls="controls" preload="metadata" video-id="0" ></video>

### 测试跳转按钮
<span class="video-time-jump" bind-id="0">08:00</span>

### 测试文件
<files file-id="1">测试文件大</files>(40GB)
<files file-id="2">测试文件小</files>(70KB)

### 测试latex公式
$$ \left\\{\begin{matrix} 1 &2   & 3\\\\ 1 & 2 &3\end{matrix}\right. $$

### 测试代码
`123`
```python

import os
import time
from concurrent.futures import ProcessPoolExecutor
import fitz  # PyMuPDF
from functools import lru_cache

@lru_cache(maxsize=1)
def get_doc(pdf_path):
    return fitz.open(pdf_path)

def process_page(args):
    pdf_path, page_num, output_folder, dpi = args
    """处理单个页面并保存为图像"""
    doc = get_doc(pdf_path)
    page = doc.load_page(page_num)
    pix = page.get_pixmap(dpi=dpi)
    output_file = os.path.join(output_folder, f"{page_num + 1}.png")
    pix.save(output_file)
    return "1"

def pdf2images(pdf_path, output_folder, dpi, workers):
    """使用多进程并行转换PDF页面为图像"""
    start_time = time.time()
    os.makedirs(output_folder, exist_ok=True)

    total_pages = len(fitz.open(pdf_path))

    tasks = [(pdf_path,page_num, output_folder, dpi) for page_num in range(total_pages)]

    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(process_page, task) for task in tasks]
        for i, future in enumerate(futures):
            result = future.result()
            if result:
                print(f"Processed page {i + 1}/{total_pages}: {os.path.basename(result)}")

    print(f"Conversion completed in {time.time() - start_time:.2f} seconds")


if __name__ == "__main__":
    # 配置参数
    pdf_path = r"高等数学-第八版下.pdf"
    output_dir = r"下"
    dpi = 400  # 根据实际需要调整
    workers = 20

    pdf2images(pdf_path, output_dir, dpi, workers)


```


     
