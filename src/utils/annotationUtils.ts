// src/utils/annotationUtils.ts
export interface Annotation {
  id: string;
  bookId: string;
  chapterHref: string;
  startOffset: number;
  endOffset: number;
  text: string;
  contextBefore: string;
  contextAfter: string;
  type: 'highlight' | 'underline' | 'bold' | 'italic' | 'note';
  color?: string;
  createdAt: string;
  lastModified?: string;
}

/**
 * 获取DOM中的所有文本节点
 */
export function getTextNodes(node: Node): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let currentNode;
  while (currentNode = walker.nextNode()) {
    textNodes.push(currentNode as Text);
  }
  
  return textNodes;
}

/**
 * 获取范围内的所有文本节点
 */
export function getTextNodesInRange(range: Range): Text[] {
  const textNodes: Text[] = [];
  const treeWalker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // 检查节点是否在范围内
        const rangeStartCompare = range.comparePoint(node, 0);
        const rangeEndCompare = range.comparePoint(node, node.nodeValue?.length || 0);
        
        // 节点在范围内或部分在范围内
        if (rangeStartCompare <= 0 && rangeEndCompare >= 0) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let currentNode;
  while (currentNode = treeWalker.nextNode()) {
    textNodes.push(currentNode as Text);
  }
  
  return textNodes;
}

/**
 * 将DOM Range转换为文本偏移量
 */
export function getTextOffsets(range: Range, rootNode: Node): { start: number, end: number } {
  const textNodes = getTextNodes(rootNode);
  let totalLength = 0;
  let startOffset = -1;
  let endOffset = -1;
  
  // 找到起始节点
  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    if (node === range.startContainer) {
      startOffset = totalLength + range.startOffset;
    }
    totalLength += (node.nodeValue || '').length;
  }
  
  // 重置并找到结束节点
  totalLength = 0;
  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    if (node === range.endContainer) {
      endOffset = totalLength + range.endOffset;
      break;
    }
    totalLength += (node.nodeValue || '').length;
  }
  
  // 处理单节点选择的情况
  if (startOffset === -1 && range.startContainer.nodeType === Node.TEXT_NODE) {
    const node = range.startContainer as Text;
    const nodeValue = node.nodeValue || '';
    const nodeIndex = textNodes.indexOf(node);
    
    let offset = 0;
    for (let i = 0; i < nodeIndex; i++) {
      offset += (textNodes[i].nodeValue || '').length;
    }
    
    startOffset = offset + range.startOffset;
    endOffset = startOffset + (range.toString().length || 0);
  }
  
  return { start: startOffset, end: endOffset };
}

/**
 * 从文本偏移量创建DOM Range
 */
export function createRangeFromOffsets(
  rootNode: Node,
  startOffset: number,
  endOffset: number
): Range | null {
  const textNodes = getTextNodes(rootNode);
  let currentOffset = 0;
  
  let startNode: Text | null = null;
  let startNodeOffset = 0;
  let endNode: Text | null = null;
  let endNodeOffset = 0;
  
  // 查找起始节点和偏移量
  for (const node of textNodes) {
    const nodeLength = (node.nodeValue || '').length;
    if (startOffset >= currentOffset && startOffset <= currentOffset + nodeLength) {
      startNode = node;
      startNodeOffset = startOffset - currentOffset;
      break;
    }
    currentOffset += nodeLength;
  }
  
  // 查找结束节点和偏移量
  currentOffset = 0;
  for (const node of textNodes) {
    const nodeLength = (node.nodeValue || '').length;
    if (endOffset >= currentOffset && endOffset <= currentOffset + nodeLength) {
      endNode = node;
      endNodeOffset = endOffset - currentOffset;
      break;
    }
    currentOffset += nodeLength;
  }
  
  if (!startNode || !endNode) {
    return null;
  }
  
  // 创建Range
  const range = document.createRange();
  range.setStart(startNode, startNodeOffset);
  range.setEnd(endNode, endNodeOffset);
  return range;
}

/**
 * 获取清理后的文本（移除多余空格和换行）
 */
export function getCleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * 获取文本上下文用于精确匹配
 */
export function getContext(text: string, position: number, length: number, contextLength: number = 30): { 
  before: string, 
  after: string 
} {
  const cleanText = getCleanText(text);
  const startPosition = Math.max(0, position);
  const endPosition = Math.min(cleanText.length, position + length);
  
  const start = Math.max(0, startPosition - contextLength);
  const end = Math.min(cleanText.length, endPosition + contextLength);
  
  return {
    before: getCleanText(cleanText.substring(start, startPosition)),
    after: getCleanText(cleanText.substring(endPosition, end))
  };
}

/**
 * 使用上下文精确匹配文本位置
 */
export function findTextWithContext(
  text: string, 
  searchText: string, 
  contextBefore: string, 
  contextAfter: string
): number {
  if (!searchText) return -1;
  
  const cleanText = getCleanText(text);
  const cleanSearchText = getCleanText(searchText);
  const cleanContextBefore = getCleanText(contextBefore);
  const cleanContextAfter = getCleanText(contextAfter);
  
  if (!cleanSearchText) return -1;
  
  const searchLength = cleanSearchText.length;
  let bestMatchPosition = -1;
  let bestMatchScore = 0;
  
  // 搜索所有可能的匹配位置
  let position = 0;
  while (position < cleanText.length) {
    position = cleanText.indexOf(cleanSearchText, position);
    if (position === -1) break;
    
    // 计算实际可获取的上下文
    const beforeStart = Math.max(0, position - cleanContextBefore.length);
    const beforeEnd = position;
    const afterStart = position + searchLength;
    const afterEnd = Math.min(cleanText.length, position + searchLength + cleanContextAfter.length);
    
    const before = cleanText.substring(beforeStart, beforeEnd);
    const after = cleanText.substring(afterStart, afterEnd);
    
    // 计算上下文匹配度
    const beforeMatchScore = calculateMatchScore(before, cleanContextBefore);
    const afterMatchScore = calculateMatchScore(after, cleanContextAfter);
    
    // 综合评分
    const matchScore = (beforeMatchScore + afterMatchScore) / 2;
    
    // 如果找到完美匹配，立即返回
    if (matchScore > 0.9) {
      return position;
    }
    
    // 保存最佳匹配
    if (matchScore > bestMatchScore) {
      bestMatchScore = matchScore;
      bestMatchPosition = position;
    }
    
    position++;
  }
  
  // 如果最佳匹配的评分足够高，返回它
  if (bestMatchScore > 0.7) {
    return bestMatchPosition;
  }
  
  return -1;
}

/**
 * 计算两个字符串的匹配度（0-1）
 */
function calculateMatchScore(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  // 如果其中一个字符串是空的，匹配度为0
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // 计算编辑距离
  const editDistance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  // 匹配度 = 1 - (编辑距离/最大长度)
  return 1 - (editDistance / maxLength);
}

/**
 * 计算两个字符串的Levenshtein距离
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  
  // 初始化矩阵
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // 填充矩阵
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,      // 插入
          matrix[i - 1][j] + 1       // 删除
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * 获取章节的纯文本内容
 */
export function getChapterText(rootNode: Node): string {
  return rootNode.textContent || '';
}

/**
 * 保存注释到本地存储
 */
export function saveAnnotation(annotation: Annotation): void {
  const key = `epub-annotations-${annotation.bookId}`;
  let annotations = JSON.parse(localStorage.getItem(key) || '[]');
  
  // 检查是否是更新现有注释
  const existingIndex = annotations.findIndex((ann: Annotation) => ann.id === annotation.id);
  if (existingIndex !== -1) {
    annotation.lastModified = new Date().toISOString();
    annotations[existingIndex] = annotation;
  } else {
    // 确保新注释有唯一ID
    if (!annotation.id) {
      annotation.id = `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    annotation.createdAt = new Date().toISOString();
    annotations.push(annotation);
  }
  
  localStorage.setItem(key, JSON.stringify(annotations));
}

/**
 * 删除注释
 */
export function deleteAnnotation(bookId: string, annotationId: string): void {
  const key = `epub-annotations-${bookId}`;
  let annotations = JSON.parse(localStorage.getItem(key) || '[]');
  annotations = annotations.filter((ann: Annotation) => ann.id !== annotationId);
  localStorage.setItem(key, JSON.stringify(annotations));
}

/**
 * 加载特定书籍的注释
 */
export function loadAnnotations(bookId: string): Annotation[] {
  const key = `epub-annotations-${bookId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

/**
 * 获取特定章节的注释
 */
export function getAnnotationsForChapter(bookId: string, chapterHref: string): Annotation[] {
  const annotations = loadAnnotations(bookId);
  return annotations.filter(ann => ann.chapterHref === chapterHref);
}

/**
 * 清理过期注释（当文本内容变化太大时）
 */
export function cleanupStaleAnnotations(bookId: string, chapterHref: string, chapterText: string): void {
  const annotations = getAnnotationsForChapter(bookId, chapterHref);
  
  annotations.forEach(annotation => {
    const position = findTextWithContext(
      chapterText,
      annotation.text,
      annotation.contextBefore,
      annotation.contextAfter
    );
    
    // 如果匹配度太低，删除这个注释
    if (position === -1) {
      deleteAnnotation(bookId, annotation.id);
    }
  });
}