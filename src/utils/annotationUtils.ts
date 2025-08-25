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
    type: "highlight" | "underline" | "bold" | "italic" | "note";
    color?: string;
    createdAt: string;
    lastModified?: string;
}

/**
 * 获取DOM中的所有文本节点
 */
export function getTextNodes(node: Node): Text[] {
    // // console.log(`getTextNodes: starting from node`, node);
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);

    let currentNode;
    while ((currentNode = walker.nextNode())) {
        // // console.log(
        //     `getTextNodes: found text node with length ${currentNode.nodeValue?.length}`,
        //     currentNode,
        // );
        textNodes.push(currentNode as Text);
    }

    // // console.log(`getTextNodes: total nodes found: ${textNodes.length}`);
    return textNodes;
}

/**
 * 获取范围内的所有文本节点
 */
export function getTextNodesInRange(range: Range): Text[] {
    // // console.log(
    //     `getTextNodesInRange: range from ${range.startOffset} to ${range.endOffset} in container`,
    //     range.startContainer,
    // );
    const textNodes: Text[] = [];

    // 如果范围在一个文本节点内，直接返回该节点
    if (
        range.startContainer === range.endContainer &&
        range.startContainer.nodeType === Node.TEXT_NODE
    ) {
        // // console.log(`getTextNodesInRange: range is within a single text node`);
        textNodes.push(range.startContainer as Text);
        return textNodes;
    }

    const treeWalker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // 检查节点是否在范围内
                const rangeStartCompare = range.comparePoint(node, 0);
                const rangeEndCompare = range.comparePoint(
                    node,
                    node.nodeValue?.length || 0,
                );

                // console.log(
                //     `getTextNodesInRange: node at position ${rangeStartCompare}, ${rangeEndCompare}`,
                //     node,
                // );

                // 节点在范围内或部分在范围内
                if (rangeStartCompare <= 0 && rangeEndCompare >= 0) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            },
        },
    );

    let currentNode;
    while ((currentNode = treeWalker.nextNode())) {
        // console.log(
        //     `getTextNodesInRange: accepted node with text "${currentNode.nodeValue?.substring(
        //         0,
        //         50,
        //     )}..."`,
        // );
        textNodes.push(currentNode as Text);
    }

    // console.log(
    //     `getTextNodesInRange: found ${textNodes.length} nodes in range`,
    // );
    return textNodes;
}

/**
 * 将DOM Range转换为文本偏移量
 */
export function getTextOffsets(
    range: Range,
    rootNode: Node,
): { start: number; end: number } {
    // // console.log(
    //     `getTextOffsets: starting with range`,
    //     range,
    //     `and rootNode`,
    //     rootNode,
    // );

    // 检查 Range 是否在 rootNode 内
    if (!rootNode.contains(range.commonAncestorContainer)) {
        console.error("getTextOffsets: Range is not within the rootNode");
        throw new Error("Range is not within the rootNode");
    }

    const textNodes = getTextNodes(rootNode);
    let totalLength = 0;
    let startOffset = -1;
    let endOffset = -1;

    // console.log(`getTextOffsets: processing ${textNodes.length} text nodes`);

    for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        const nodeLength = node.nodeValue?.length || 0;

        // console.log(
        //     `getTextOffsets: node ${i} has length ${nodeLength}, total so far: ${totalLength}`,
        // );

        // 处理 startContainer
        if (startOffset === -1 && node === range.startContainer) {
            startOffset = totalLength + range.startOffset;
            // console.log(`getTextOffsets: found start offset at ${startOffset}`);
        } else if (startOffset === -1 && node.contains(range.startContainer)) {
            // 处理 startContainer 是当前文本节点的子节点的情况
            if (range.startContainer.nodeType === Node.TEXT_NODE) {
                startOffset = totalLength;
                // console.log(
                //     `getTextOffsets: found start offset at ${startOffset} (nested text node)`,
                // );
            }
        }

        // 处理 endContainer
        if (endOffset === -1 && node === range.endContainer) {
            endOffset = totalLength + range.endOffset;
            // console.log(`getTextOffsets: found end offset at ${endOffset}`);
            break; // 找到 end 后无需继续
        } else if (endOffset === -1 && node.contains(range.endContainer)) {
            // 处理 endContainer 是当前文本节点的子节点的情况
            if (range.endContainer.nodeType === Node.TEXT_NODE) {
                endOffset =
                    totalLength + (range.endContainer.nodeValue?.length || 0);
                // console.log(
                //     `getTextOffsets: found end offset at ${endOffset} (nested text node)`,
                // );
                break;
            }
        }

        totalLength += nodeLength;
    }

    // 如果还没有找到结束偏移量，继续搜索直到找到
    if (startOffset !== -1 && endOffset === -1) {
        for (let i = 0; i < textNodes.length; i++) {
            const node = textNodes[i];
            const nodeLength = node.nodeValue?.length || 0;

            if (endOffset === -1 && node === range.endContainer) {
                endOffset = totalLength + range.endOffset;
                // console.log(
                //     `getTextOffsets: found end offset at ${endOffset} (in second pass)`,
                // );
                break;
            }
            totalLength += nodeLength;
        }
    }

    // 验证是否找到有效偏移
    if (startOffset === -1 || endOffset === -1) {
        console.error(
            `getTextOffsets: failed to find offsets. start: ${startOffset}, end: ${endOffset}`,
        );
        console.error(`getTextOffsets: startContainer:`, range.startContainer);
        console.error(`getTextOffsets: endContainer:`, range.endContainer);
        console.error(`getTextOffsets: textNodes:`, textNodes);

        // 尝试使用备用方法计算偏移量
        const backupOffsets = getTextOffsetsBackup(range, rootNode);
        if (backupOffsets) {
            // console.log(
            //     `getTextOffsets: using backup method results`,
            //     backupOffsets,
            // );
            return backupOffsets;
        }

        throw new Error(
            "Range boundaries are not in text nodes within rootNode",
        );
    }

    // console.log(
    //     `getTextOffsets: returning start: ${startOffset}, end: ${endOffset}`,
    // );
    return { start: startOffset, end: endOffset };
}

/**
 * 备用方法：将DOM Range转换为文本偏移量
 */
function getTextOffsetsBackup(
    range: Range,
    rootNode: Node,
): { start: number; end: number } | null {
    // console.log(`getTextOffsetsBackup: using backup method`);

    try {
        // 克隆范围以免影响原始范围
        const clonedRange = range.cloneRange();

        // 创建一个临时范围，从rootNode开始到范围开始
        const startRange = document.createRange();
        startRange.selectNodeContents(rootNode);
        startRange.setEnd(clonedRange.startContainer, clonedRange.startOffset);

        // 创建一个临时范围，从rootNode开始到范围结束
        const endRange = document.createRange();
        endRange.selectNodeContents(rootNode);
        endRange.setEnd(clonedRange.endContainer, clonedRange.endOffset);

        // 计算文本长度
        const startOffset = startRange.toString().length;
        const endOffset = endRange.toString().length;

        // console.log(
        //     `getTextOffsetsBackup: backup offsets start: ${startOffset}, end: ${endOffset}`,
        // );

        return { start: startOffset, end: endOffset };
    } catch (error) {
        console.error("getTextOffsetsBackup: error using backup method", error);
        return null;
    }
}

/**
 * 从文本偏移量创建DOM Range
 */
export function createRangeFromOffsets(
    rootNode: Node,
    startOffset: number,
    endOffset: number,
): Range | null {
    // console.log(
    //     `createRangeFromOffsets: rootNode`,
    //     rootNode,
    //     `start: ${startOffset}, end: ${endOffset}`,
    // );

    const textNodes = getTextNodes(rootNode);
    let currentOffset = 0;

    let startNode: Text | null = null;
    let startNodeOffset = 0;
    let endNode: Text | null = null;
    let endNodeOffset = 0;

    // console.log(`createRangeFromOffsets: found ${textNodes.length} text nodes`);

    // 查找起始节点和偏移量
    for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        const nodeLength = (node.nodeValue || "").length;

        // console.log(
        //     `createRangeFromOffsets: node ${i} length ${nodeLength}, currentOffset: ${currentOffset}`,
        // );

        if (
            startOffset >= currentOffset &&
            startOffset < currentOffset + nodeLength
        ) {
            startNode = node;
            startNodeOffset = startOffset - currentOffset;
            // console.log(
            //     `createRangeFromOffsets: found start node at index ${i}, offset ${startNodeOffset}`,
            // );
            break;
        }
        currentOffset += nodeLength;
    }

    // 查找结束节点和偏移量
    currentOffset = 0;
    for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        const nodeLength = (node.nodeValue || "").length;

        // console.log(
        //     `createRangeFromOffsets: node ${i} length ${nodeLength}, currentOffset: ${currentOffset}`,
        // );

        if (
            endOffset >= currentOffset &&
            endOffset <= currentOffset + nodeLength
        ) {
            endNode = node;
            endNodeOffset = endOffset - currentOffset;
            // console.log(
            //     `createRangeFromOffsets: found end node at index ${i}, offset ${endNodeOffset}`,
            // );
            break;
        }
        currentOffset += nodeLength;
    }

    if (!startNode || !endNode) {
        console.error(
            `createRangeFromOffsets: failed to find nodes. startNode: ${startNode}, endNode: ${endNode}`,
        );
        console.error(`createRangeFromOffsets: textNodes:`, textNodes);

        // 尝试使用备用方法创建范围
        return createRangeFromOffsetsBackup(rootNode, startOffset, endOffset);
    }

    // 创建Range
    try {
        const range = document.createRange();
        range.setStart(startNode, startNodeOffset);
        range.setEnd(endNode, endNodeOffset);

        // console.log(
        //     `createRangeFromOffsets: created range from ${range.startOffset} to ${range.endOffset}`,
        // );
        return range;
    } catch (error) {
        console.error("createRangeFromOffsets: error creating range", error);
        return createRangeFromOffsetsBackup(rootNode, startOffset, endOffset);
    }
}

/**
 * 备用方法：从文本偏移量创建DOM Range
 */
function createRangeFromOffsetsBackup(
    rootNode: Node,
    startOffset: number,
    endOffset: number,
): Range | null {
    // console.log(`createRangeFromOffsetsBackup: using backup method`);

    try {
        // 创建一个临时范围来选择整个rootNode的内容
        const fullRange = document.createRange();
        fullRange.selectNodeContents(rootNode);

        // 获取完整的文本内容
        const fullText = fullRange.toString();

        // 如果偏移量超出文本长度，调整它们
        const adjustedStart = Math.min(startOffset, fullText.length);
        const adjustedEnd = Math.min(endOffset, fullText.length);

        // console.log(
        //     `createRangeFromOffsetsBackup: adjusted offsets start: ${adjustedStart}, end: ${adjustedEnd}`,
        // );

        // 使用字符位置方法来设置范围
        let charCount = 0;
        let startNode: Text | null = null;
        let startCharIndex = 0;
        let endNode: Text | null = null;
        let endCharIndex = 0;

        const treeWalker = document.createTreeWalker(
            rootNode,
            NodeFilter.SHOW_TEXT,
            null,
        );

        let node;
        while ((node = treeWalker.nextNode())) {
            const textNode = node as Text;
            const textLength = textNode.nodeValue?.length || 0;

            // 检查起始位置是否在这个节点中
            if (!startNode && charCount + textLength > adjustedStart) {
                startNode = textNode;
                startCharIndex = adjustedStart - charCount;
            }

            // 检查结束位置是否在这个节点中
            if (!endNode && charCount + textLength > adjustedEnd) {
                endNode = textNode;
                endCharIndex = adjustedEnd - charCount;
                break;
            }

            charCount += textLength;
        }

        if (startNode && endNode) {
            const range = document.createRange();
            range.setStart(startNode, startCharIndex);
            range.setEnd(endNode, endCharIndex);

            // console.log(
            //     `createRangeFromOffsetsBackup: created range using backup method`,
            // );
            return range;
        }
    } catch (error) {
        console.error(
            "createRangeFromOffsetsBackup: error using backup method",
            error,
        );
    }

    return null;
}

/**
 * 获取清理后的文本（移除多余空格和换行）
 */
export function getCleanText(text: string): string {
    // 注意：这里不能清理文本，否则会导致偏移量错位
    // 只有在匹配文本时才能使用清理后的文本
    return text;
}

/**
 * 获取文本上下文用于精确匹配
 */
export function getContext(
    text: string,
    position: number,
    length: number,
    contextLength: number = 30,
): {
    before: string;
    after: string;
} {
    // console.log(
    //     `getContext: position ${position}, length ${length}, contextLength ${contextLength}`,
    // );
    const startPosition = Math.max(0, position);
    const endPosition = Math.min(text.length, position + length);

    const start = Math.max(0, startPosition - contextLength);
    const end = Math.min(text.length, endPosition + contextLength);

    const result = {
        before: text.substring(start, startPosition),
        after: text.substring(endPosition, end),
    };

    // console.log(
    //     `getContext: before: "${result.before}", after: "${result.after}"`,
    // );
    return result;
}

/**
 * 使用上下文精确匹配文本位置
 */
export function findTextWithContext(
    text: string,
    searchText: string,
    contextBefore: string,
    contextAfter: string,
): number {
    if (!searchText) {
        return -1;
    }

    // 清理搜索文本和上下文（保留原始文本不变）
    const cleanSearchText = searchText.replace(/\s+/g, " ").trim();
    const cleanContextBefore = contextBefore.replace(/\s+/g, " ").trim();
    const cleanContextAfter = contextAfter.replace(/\s+/g, " ").trim();

    if (!cleanSearchText) {
        return -1;
    }

    // 关键修复：使用原始上下文长度（非清理后长度）进行截取
    const rawContextBeforeLength = contextBefore.length;
    const rawContextAfterLength = contextAfter.length;
    
    // 设置最大上下文截取长度（避免截取过多内容）
    const MAX_CONTEXT_LENGTH = 500;

    let position = 0;
    while (position < text.length) {
        position = text.indexOf(searchText, position);
        if (position === -1) break;

        // 修复1: 使用原始上下文长度截取（保留空白字符）
        const beforeStart = Math.max(0, position - Math.min(rawContextBeforeLength, MAX_CONTEXT_LENGTH));
        const beforeEnd = position;
        const afterStart = position + searchText.length;
        const afterEnd = Math.min(
            text.length,
            position + searchText.length + Math.min(rawContextAfterLength, MAX_CONTEXT_LENGTH),
        );

        const before = text.substring(beforeStart, beforeEnd);
        const after = text.substring(afterStart, afterEnd);

        // 修复2: 清理后直接比较上下文
        const cleanBefore = before.replace(/\s+/g, " ").trim();
        const cleanAfter = after.replace(/\s+/g, " ").trim();

        // 检查上下文是否匹配
        const isBeforeMatch = cleanContextBefore === "" || 
                             cleanBefore.endsWith(cleanContextBefore);
        
        const isAfterMatch = cleanContextAfter === "" || 
                            cleanAfter.startsWith(cleanContextAfter);

        if (isBeforeMatch && isAfterMatch) {
            return position;
        }

        position++;
    }

    // 未找到匹配项时输出调试信息
    console.log(`error:Text:${text}  SearchText:${searchText} contextBefore:${contextBefore} contextAfter:${contextAfter}`);
    return -1;
}

/**
 * 计算两个字符串的匹配度（0-1）
 */
function calculateMatchScore(str1: string, str2: string): number {
    if (!str1 || !str2) {
        // console.log(
        //     `calculateMatchScore: one or both strings are empty, returning 0`,
        // );
        return 0;
    }

    // 如果其中一个字符串是空的，匹配度为0
    if (str1.length === 0 || str2.length === 0) {
        // console.log(
        //     `calculateMatchScore: one or both strings have zero length, returning 0`,
        // );
        return 0;
    }

    // 简单比较：如果字符串相等，返回1
    if (str1 === str2) {
        return 1;
    }

    // 计算编辑距离
    const editDistance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    // 匹配度 = 1 - (编辑距离/最大长度)
    const score = 1 - editDistance / maxLength;

    // console.log(
    //     `calculateMatchScore: "${str1}" vs "${str2}" -> editDistance: ${editDistance}, maxLength: ${maxLength}, score: ${score}`,
    // );

    return Math.max(0, Math.min(1, score));
}

/**
 * 计算两个字符串的Levenshtein距离
 */
function levenshteinDistance(a: string, b: string): number {
    // console.log(
    //     `levenshteinDistance: calculating distance between "${a}" and "${b}"`,
    // );

    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

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
                    matrix[i][j - 1] + 1, // 插入
                    matrix[i - 1][j] + 1, // 删除
                );
            }
        }
    }

    const result = matrix[b.length][a.length];
    // console.log(`levenshteinDistance: result = ${result}`);

    return result;
}

/**
 * 获取章节的纯文本内容
 */
export function getChapterText(rootNode: Node): string {
    
    const text = rootNode.textContent || "";
    // console.log(`getChapterText: extracted text with length ${text.length}`);
    return text;
    
}

/**
 * 保存注释到本地存储
 */
export function saveAnnotation(annotation: Annotation): void {
    // console.log(`saveAnnotation: saving annotation`, annotation);
    const key = `epub-annotations-${annotation.bookId}`;
    let annotations = JSON.parse(localStorage.getItem(key) || "[]");

    // 检查是否是更新现有注释
    const existingIndex = annotations.findIndex(
        (ann: Annotation) => ann.id === annotation.id,
    );
    if (existingIndex !== -1) {
        annotation.lastModified = new Date().toISOString();
        annotations[existingIndex] = annotation;
        // console.log(`saveAnnotation: updated existing annotation`);
    } else {
        // 确保新注释有唯一ID
        if (!annotation.id) {
            annotation.id = `ann-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`;
        }
        annotation.createdAt = new Date().toISOString();
        annotations.push(annotation);
        // console.log(
        //     `saveAnnotation: created new annotation with ID ${annotation.id}`,
        // );
    }

    localStorage.setItem(key, JSON.stringify(annotations));
    // console.log(
    //     `saveAnnotation: saved ${annotations.length} annotations total`,
    // );
}

/**
 * 删除注释
 */
export function deleteAnnotation(bookId: string, annotationId: string): void {
    // console.log(
    //     `deleteAnnotation: bookId ${bookId}, annotationId ${annotationId}`,
    // );
    const key = `epub-annotations-${bookId}`;
    let annotations = JSON.parse(localStorage.getItem(key) || "[]");
    const initialCount = annotations.length;
    annotations = annotations.filter(
        (ann: Annotation) => ann.id !== annotationId,
    );
    localStorage.setItem(key, JSON.stringify(annotations));
    // console.log(
    //     `deleteAnnotation: removed ${
    //         initialCount - annotations.length
    //     } annotation(s)`,
    // );
}

/**
 * 加载特定书籍的注释
 */
export function loadAnnotations(bookId: string): Annotation[] {
    // console.log(`loadAnnotations: loading annotations for book ${bookId}`);
    const key = `epub-annotations-${bookId}`;
    const annotations = JSON.parse(localStorage.getItem(key) || "[]");
    // console.log(`loadAnnotations: found ${annotations.length} annotations`);
    return annotations;
}

/**
 * 获取特定章节的注释
 */
export function getAnnotationsForChapter(
    bookId: string,
    chapterHref: string,
): Annotation[] {
    // console.log(
    //     `getAnnotationsForChapter: book ${bookId}, chapter ${chapterHref}`,
    // );
    const annotations = loadAnnotations(bookId);
    const chapterAnnotations = annotations.filter(
        (ann) => ann.chapterHref === chapterHref,
    );
    // console.log(
    //     `getAnnotationsForChapter: found ${chapterAnnotations.length} annotations for this chapter`,
    // );
    return chapterAnnotations;
}

/**
 * 清理过期注释（当文本内容变化太大时）
 */
export function cleanupStaleAnnotations(
    bookId: string,
    chapterHref: string,
    chapterText: string,
): void {
    // console.log(
    //     `cleanupStaleAnnotations: checking for stale annotations in book ${bookId}, chapter ${chapterHref}`,
    // );
    const annotations = getAnnotationsForChapter(bookId, chapterHref);
    let removedCount = 0;

    annotations.forEach((annotation) => {
        // console.log(
        //     `cleanupStaleAnnotations: checking annotation ${
        //         annotation.id
        //     } with text "${annotation.text.substring(0, 50)}..."`,
        // );

        const position = findTextWithContext(
            chapterText,
            annotation.text,
            annotation.contextBefore,
            annotation.contextAfter,
        );

        // 如果匹配度太低，删除这个注释
        if (position === -1) {
            // console.log(
            //     `cleanupStaleAnnotations: removing stale annotation ${annotation.id}`,
            // );
            deleteAnnotation(bookId, annotation.id);
            removedCount++;
        } else {
            // console.log(
            //     `cleanupStaleAnnotations: annotation ${annotation.id} is still valid at position ${position}`,
            // );
        }
    });

    // console.log(
    //     `cleanupStaleAnnotations: removed ${removedCount} stale annotations`,
    // );
}