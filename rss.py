import os
import json
import datetime
from xml.etree import ElementTree as ET
from xml.dom import minidom

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

def generate_rss():
    """生成RSS feed"""
    # 创建RSS根元素
    rss = ET.Element('rss', version='2.0')
    channel = ET.SubElement(rss, 'channel')
    
    # 设置频道基本信息
    title = ET.SubElement(channel, 'title')
    title.text = '泛舟游客的博客'
    link = ET.SubElement(channel, 'link')
    link.text = 'http://localhost:8000'  # 本地开发URL
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
        item_link.text = f'http://localhost:8000/blog/{rel_path}'  # 本地开发URL
        
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

def save_rss(rss_path='rss.xml'):
    """生成RSS feed并保存到文件"""
    try:
        # 生成RSS内容
        rss = generate_rss()
        
        # 格式化XML输出
        xml_str = minidom.parseString(ET.tostring(rss)).toprettyxml(indent='  ')
        
        # 保存到文件
        with open(rss_path, 'w', encoding='utf-8') as f:
            f.write(xml_str)
            
        print(f'RSS feed已生成: {rss_path}')
    except Exception as e:
        print(f'生成RSS feed失败: {str(e)}')

if __name__ == '__main__':
    save_rss()