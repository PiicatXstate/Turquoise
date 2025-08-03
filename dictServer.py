from flask import Flask, jsonify, request
import requests
from bs4 import BeautifulSoup, Tag
import re
import json
from flask_cors import CORS 

app = Flask(__name__)
CORS(app)

def parse_word_html(soup):
    explanations = []
    
    # 查找所有包含义项的段落
    for p in soup.find_all('p'):
        cino_span = p.find('span', class_='cino')
        if cino_span:
            content = p.get_text(strip=True)
            match = re.search(r'\(\d+\)\s*[∶:]?\s*(.+)', content)
            if match:
                explanation = match.group(1).strip()
                explanations.append(explanation)
            continue
        
        # 检查是否包含实际释义
        if not p.find('span', class_='dicpy') and not p.find('strong') and not p.find('span', class_='diczx1'):
            content = p.get_text(strip=True)
            if content and not re.match(r'^[◎∶:]+$', content):
                explanations.append(content)
    
    # 处理列表项
    for li in soup.find_all('li'):
        cin2_span = li.find('span', class_='cin2')
        if cin2_span:
            content = cin2_span.get_text(strip=True)
            if content:
                explanations.append(content)
        else:
            content = li.get_text(strip=True)
            if content:
                explanations.append(content)
    
    return [str(exp) for exp in explanations]

def dict_query(word):
    url = f'https://www.zdic.net/hans/{word}'
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        r.raise_for_status()
    except requests.RequestException as e:
        print(f"请求失败: {e}")
        return {}
    
    soup = BeautifulSoup(r.text, 'lxml')
    result = {}
    
    # 单字情况
    if len(word) == 1:
        basic_block = soup.find('div', {'data-type-block': "基本解释"})
        if not basic_block:
            return {}
        
        py_paragraphs = basic_block.find_all('p')
        
        for p in py_paragraphs:
            py_span = p.find('span', class_='dicpy')
            if not py_span:
                continue
                
            py_text = py_span.get_text(strip=True)
            py_match = re.search(r'^([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+)', py_text)
            py_key = py_match.group(1) if py_match else py_text.split()[0]
            
            meanings = []
            next_sib = p.next_sibling
            
            while next_sib:
                if not isinstance(next_sib, Tag):
                    next_sib = next_sib.next_sibling
                    continue
                
                if next_sib.name == 'ol':
                    for li in next_sib.find_all('li'):
                        meaning_text = li.get_text(strip=True)
                        meanings.append(re.sub(r'^\s*[◎●]\s*', '', meaning_text))
                    break
                    
                elif next_sib.name == 'p':
                    if next_sib.find('span', class_='dicpy'):
                        break
                    
                    meaning_text = next_sib.get_text(strip=True).replace('　', '')
                    meaning_text = re.sub(r'^\s*[◎●]\s*', '', meaning_text)
                    
                    if meaning_text.strip():
                        meanings.append(meaning_text)
                        break
                        
                next_sib = next_sib.next_sibling
            
            if meanings:
                result.setdefault(py_key, []).extend(meanings)
        
        detailed_block = soup.find('div', {'data-type-block': "详细解释"})
        return {
            'basic': result,
            'detailed': str(basic_block) + str(detailed_block) if detailed_block else str(basic_block)
        }
    else:
        # 词语处理
        basic_block = soup.find('div', {'class': 'jnr'})
        if not basic_block:
            return {}
        
        for element in basic_block.find_all(class_="encs"):
            element.extract()
        
        entry_title = soup.find('div', {'class': 'entry_title'})
        pinyin = entry_title.find('span', {'class': 'dicpy'}).get_text() if entry_title else ""
        
        return {
            'pinyin': pinyin,
            'basic': parse_word_html(basic_block),
            'detailed': str(basic_block)
        }

print(dict_query('和'))
@app.route('/query', methods=['GET'])
def query():
    word = request.args.get('word')
    if not word:
        return jsonify({'error': '缺少查询参数 word'}), 400
    
    result = dict_query(word)
    
    if not result:
        return jsonify({'error': f'未找到"{word}"的相关解释'}), 404
    
    return jsonify({
        'word': word,
        'results': result
    })

@app.route('/', methods=['GET'])
def index():
    return """
    <h1>汉语字典API服务</h1>
    <p>使用说明：访问 /query?word=词语 查询词语释义</p>
    <p>示例：<a href="/query?word=客">/query?word=客</a></p>
    <p>示例：<a href="/query?word=人工智能">/query?word=人工智能</a></p>
    """

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)