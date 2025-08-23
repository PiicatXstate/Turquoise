<template>
    <div id="readerFrame">
        <div id="informt">
                <p id="chapter">{{ currentChapter }}&nbsp;&nbsp;&nbsp;{{ currentPage }} / {{ totalPages }}</p>
                <p id="href">{{ currentHref }}</p>
                <el-icon id="pages" @click="closeReader">
                    <Close style="stroke-width: 10; width: 1.5em; height: 1.5em;" />
                </el-icon>
        </div>
        <div id="viewer" ref="viewer">
        </div>
        <div class="select" v-show="selectShowJudge" ref="select">
            <CopyOutlined id="copyDoc" @click="copyDoc"/>
            <p id="copyDocText">复制</p>
            <HighlightOutlined id="highLight" @click="highLightDoc"/>
            <p id="HighLightText">高亮</p>
            <BoldOutlined id="bold" @click="boldDoc"/>
            <p id="boldText">加粗</p>
            <ItalicOutlined id="italic" @click="italicDoc"/>
            <p id="italicText">斜体</p>
            <UnderlineOutlined id="underline" @click="underlineDoc"/> 
            <p id="underlineText">划线</p>
            <EditOutlined id="edit" @click="addNote"/> 
            <p id="editText">注释</p>
            <ProjectOutlined id="project" @click="queryWords"/> 
            <p id="projectText">查词</p>
            <OneToOneOutlined id="onetoone" @click="aiTranslate"/> 
            <p id="onetooneText">AI答</p>
            <TagOutlined id="tag" @click="favoriteDoc"/> 
            <p id="tagText">收藏</p>
        </div>
        <div id="launch" v-show="launchShowJudge" ref="launch">
            <div id="color">
                <button 
                    v-for="color in colors" 
                    :key="color"
                    class="colors" 
                    :style="{ backgroundColor: color }" 
                    @click="highLightColor(color)"
                >
            </button>
            </div>
        </div>
        <div id="trans" ref="trans" v-show="transShowJudge && selectShowJudge">
            <p class="word">{{ word }}</p>
            <div class="zhanwei"></div>
            <div class="allFrame" v-for="(list, key) in transData" :key="key">
                <p class='pinyin'> {{ key }}</p>
                <ul class="query">
                    <li class="ans" v-for="(item, index) in list" :key="index">
                    {{ item }}
                    </li>
                </ul>
            </div>
        </div>
        <!-- 交互式注释模态框 -->
        <div v-if="noteModalVisible" class="note-modal">
            <div class="note-modal-content">
                <h3>添加注释</h3>
                <p class="selected-text">{{ selectedText }}</p>
                <div class="definition-input">
                    <label for="definition">释义内容：</label>
                    <textarea 
                        style="width: calc(100%-40);"
                        id="definition" 
                        v-model="noteContent" 
                        placeholder="输入词语/句子的释义..."
                        rows="4"
                    ></textarea>
                </div>
                <div class="note-modal-actions">
                    <button @click="cancelNote">取消</button>
                    <button @click="saveNote" class="primary">保存</button>
                </div>
            </div>
        </div>
        <!-- 释义弹窗 -->
        <div 
            v-if="definitionPopupVisible" 
            class="definition-popup"
            :style="{
                top: popupPosition.top + 'px',
                left: popupPosition.left + 'px'
            }"
        >
            <div class="popup-content">
                <div class="popup-header">
                    <span class="popup-word">{{ popupWord }}</span>
                    <button class="close-btn" @click="closeDefinitionPopup">&times;</button>
                </div>
                <div class="popup-body">
                    <p>{{ popupDefinition }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { defineProps, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
    import epubStorage from '../utils/epubStorage.ts';
    import Epub from 'epubjs';
    import { bookOBJ } from '@/stores/bookOBJ.ts';
    import { queryContents } from '@/stores/queryContents.ts';
    import { readerSet } from '@/stores/readerSet.ts';
    import { ElMessage } from 'element-plus'
    import { Close } from '@element-plus/icons-vue'
    import { 
        CopyOutlined, 
        HighlightOutlined,
        BoldOutlined,
        ItalicOutlined,
        UnderlineOutlined,
        EditOutlined,
        ProjectOutlined,
        OneToOneOutlined,
        TagOutlined,
        FacebookFilled
    } from '@ant-design/icons-vue';
    // 导入注释工具
    import {
    // @ts-ignore
      Annotation,
      getTextNodes,
      getTextNodesInRange,
      getTextOffsets,
      createRangeFromOffsets,
      getContext,
      findTextWithContext,
      getChapterText,
      saveAnnotation,
      loadAnnotations,
      getAnnotationsForChapter,
      cleanupStaleAnnotations
    } from '@/utils/annotationUtils';
    // 扩展Annotation接口，添加definition字段
    interface ExtendedAnnotation extends Annotation {
        definition?: string;
    }
    // 组件样式 来自Flow
    const defaultStyle = {
        html: {
            padding: '0 !important',
        },
        body: {
            background: 'transparent'
        },
        'a:any-link': {
            color: '#3b82f6 !important',
            'text-decoration': 'none !important',
        },
        '::selection': {
            'background-color': 'rgba(3, 102, 214, 0.2)',
        },
    }
    let color = ref('red')
    let colors = ref([
        '#FFFF00',
        '#FF0000',
        '#0000FF',
        '#00FF00',
    ]);
    const props = defineProps(['bookid']);
    const viewer = ref<HTMLElement | null>(null);
    const book = ref<any>(null);
    const rendition = ref<any>(null);
    const resizeObserver = ref<ResizeObserver | null>(null);
    const select = ref<HTMLElement | null>(null);
    const launch = ref<HTMLElement | null>(null);
    const trans = ref<HTMLElement | null>(null)
    // 初始化章节、页数和HTML文件路径
    const currentChapter = ref('加载中...');
    const currentPage = ref(0);
    const totalPages = ref(0);
    const currentHref = ref('');
    // 注释相关
    const currentSelection = ref<{ range: Range, text: string } | null>(null);
    const noteModalVisible = ref(false);
    const noteContent = ref('');
    const selectedText = ref(''); // 用于显示在模态框中的选中文本
    let selectShowJudge = ref(false);
    let transShowJudge = ref(false);
    let launchShowJudge = ref(false);
    let canNavigate = ref(true);    // 控制是否允许翻页的标志
    let word = ref('')
    let transData = ref({})
    // 触摸事件相关变量
    let touchStartX = ref(0);
    let touchStartY = ref(0);
    let touchMoveX = ref(0);
    let touchMoveY = ref(0);
    let isTouching = ref(false);
    const MIN_SWIPE_DISTANCE = 50; // 最小滑动距离，用于判断是否为有效滑动
    const MAX_VERTICAL_MOVE = 100; // 最大允许的垂直移动，超过则忽略翻页
    let touchCleanupFunctions = ref<(() => void)[]>([]); // 用于存储清理函数
    // 释义弹窗相关
    const definitionPopupVisible = ref(false);
    const popupWord = ref('');
    const popupDefinition = ref('');
    const popupPosition = ref({ top: 0, left: 0 });
    const readerSettings = readerSet();
    
    // 清理所有触摸事件监听器
    const cleanupTouchListeners = () => {
        touchCleanupFunctions.value.forEach(cleanup => cleanup());
        touchCleanupFunctions.value = [];
    };
    
    // 移动端触摸开始事件处理
    const handleTouchStart = (e: TouchEvent) => {
        // 如果当前正在显示选择框，不处理翻页
        if (selectShowJudge.value) {
            return;
        }
        
        isTouching.value = true;
        touchStartX.value = e.touches[0].clientX;
        touchStartY.value = e.touches[0].clientY;
        touchMoveX.value = 0;
        touchMoveY.value = 0;
    };
    
    // 移动端触摸移动事件处理
    const handleTouchMove = (e: TouchEvent) => {
        if (!isTouching.value) return;
        
        touchMoveX.value = e.touches[0].clientX;
        touchMoveY.value = e.touches[0].clientY;
    };
    
    // 移动端触摸结束事件处理
    const handleTouchEnd = () => {
        if (!isTouching.value) return;
        isTouching.value = false;
        
        // 计算滑动距离
        const diffX = touchMoveX.value - touchStartX.value;
        const diffY = touchMoveY.value - touchStartY.value;
        
        // 判断是否为水平滑动（排除垂直滚动）
        if (Math.abs(diffY) > Math.abs(diffX) * 1.5) {
            return; // 垂直滑动为主，不处理
        }
        
        // 检查是否达到最小滑动距离
        if (Math.abs(diffX) < MIN_SWIPE_DISTANCE) {
            return; // 滑动距离不够，不翻页
        }
        
        // 检查垂直移动是否过大
        if (Math.abs(diffY) > MAX_VERTICAL_MOVE) {
            return; // 垂直移动过大，不翻页
        }
        
        // 根据滑动方向翻页
        if (diffX > 0) {
            // 向右滑动，上一页
            prevPage();
        } else {
            // 向左滑动，下一页
            nextPage();
        }
    };
    
    // 上一页
    const prevPage = () => {
        if (canNavigate.value && rendition.value) {
            canNavigate.value = false;
            rendition.value.prev();
        }
    };
    
    // 下一页
    const nextPage = () => {
        if (canNavigate.value && rendition.value) {
            canNavigate.value = false;
            rendition.value.next();
        }
    };
    
    // 转数字为数字序号
    function toOrdinalNumber(num:number) {
        const ordinalChars = [
            '⑴', '⑵', '⑶', '⑷', '⑸', '⑹', '⑺', '⑻', '⑼', '⑽',
            '⑾', '⑿', '⒀', '⒁', '⒂', '⒃', '⒄', '⒅', '⒆', '⒇'
        ];
        if (num >= 1 && num <= 20) {
            return ordinalChars[num - 1];
        } else {
            // 对于大于20的数字，可以返回带括号的普通数字
            return `⑴${num}`;
        }
    }
    
    // 请求API
    async function queryWord(word:string) {
        try {
            const response = await fetch(`http://localhost:5000/query?word=${encodeURIComponent(word)}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('查询出错:', error);
        }
    }
    
    // 处理窗口大小变化
    const handleResize = () => {
        if (rendition.value) {
            rendition.value.resize(
                viewer.value?.clientWidth + 'px',
                viewer.value?.clientHeight + 'px'
            );
            selectShowJudge.value = false;
            transShowJudge.value = false;
        }
    };
    
    // 设置ResizeObserver
    const setupResizeObserver = () => {
        if (viewer.value && rendition.value) {
            resizeObserver.value = new ResizeObserver(handleResize);
            resizeObserver.value.observe(viewer.value);
        }
    };
    
    // 应用样式到Range，同时保持原有DOM结构
    function applyStyleToRange(
        range: Range,
        styleConfig: (element: HTMLElement) => void,
        isInteractive: boolean = false,
        annotation?: ExtendedAnnotation  // 添加注释对象参数
    ): void {
        const doc = range.startContainer.ownerDocument;
        if (!doc) return;
        // 获取范围内的所有文本节点
        const textNodes = getTextNodesInRange(range);
        if (textNodes.length === 0) return;
        // 保存原始选区位置
        const savedRange = {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset
        };
        // 为每个文本节点应用样式
        for (let i = 0; i < textNodes.length; i++) {
            const node = textNodes[i];
            const parent = node.parentNode;
            if (!parent) continue;
            const text = node.nodeValue || '';
            const isStartNode = (node === range.startContainer);
            const isEndNode = (node === range.endContainer);
            // 确定当前节点的起始偏移量
            let startOffset = 0;
            if (isStartNode && node.nodeType === Node.TEXT_NODE) {
                startOffset = range.startOffset;
            }
            // 确定当前节点的结束偏移量
            let endOffset = text.length;
            if (isEndNode && node.nodeType === Node.TEXT_NODE) {
                endOffset = range.endOffset;
            }
            // 确保偏移量有效
            startOffset = Math.max(0, Math.min(startOffset, text.length));
            endOffset = Math.max(startOffset, Math.min(endOffset, text.length));
            // 如果没有要应用样式的部分，跳过
            if (startOffset === endOffset) continue;
            // 创建样式元素
            const wrapper = doc.createElement('span');
            styleConfig(wrapper);
            // 如果是交互式注释，添加特殊类名和事件
            if (isInteractive && annotation) {
                wrapper.dataset.annotationId = annotation.id;
                wrapper.dataset.definition = annotation.definition || '';
                wrapper.dataset.text = annotation.text;
                wrapper.style.cursor = 'pointer';
                // 添加事件监听
                wrapper.addEventListener('mouseenter', () => {
                    wrapper.style.color = '#0066CC';
                    wrapper.style.textDecoration = 'underline';
                });
                wrapper.addEventListener('mouseleave', () => {
                    wrapper.style.color = '';
                    wrapper.style.textDecoration = '';
                });
                wrapper.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (annotation.definition) {
                        showDefinitionPopup(annotation.text, annotation.definition, e);
                    }
                });
            }
            // 拆分文本
            const before = text.substring(0, startOffset);
            const selected = text.substring(startOffset, endOffset);
            const after = text.substring(endOffset);
            // 创建新节点
            const beforeNode = doc.createTextNode(before);
            const selectedNode = doc.createTextNode(selected);
            const afterNode = doc.createTextNode(after);
            // 应用样式
            wrapper.appendChild(selectedNode);
            // 替换原始节点
            parent.insertBefore(beforeNode, node);
            parent.insertBefore(wrapper, node);
            parent.insertBefore(afterNode, node);
            parent.removeChild(node);
            // 更新后续操作的范围
            if (node === savedRange.startContainer) {
                if (startOffset === 0) {
                    // 如果从节点开头开始，则新的开始容器是wrapper
                    range.setStart(wrapper, 0);
                } else {
                    // 否则，开始容器是beforeNode
                    range.setStart(beforeNode, beforeNode.nodeValue?.length || 0);
                }
            }
            if (node === savedRange.endContainer) {
                if (endOffset === text.length) {
                    // 如果到节点结尾结束，则新的结束容器是afterNode
                    range.setEnd(afterNode, 0);
                } else {
                    // 否则，结束容器是wrapper
                    range.setEnd(wrapper, 1); // wrapper只有一个子节点
                }
            }
        }
        // 清理空节点，但保留文档结构
        cleanupEmptyNodes(range.commonAncestorContainer);
        // 恢复原始选区
        range.setStart(savedRange.startContainer, savedRange.startOffset);
        range.setEnd(savedRange.endContainer, savedRange.endOffset);
    }
    
    // 清理空节点，但保留文档结构
    function cleanupEmptyNodes(node: Node | null) {
        if (!node) return;
        // 递归处理子节点
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const children = Array.from(element.childNodes);
            for (const child of children) {
                cleanupEmptyNodes(child);
            }
            // 检查是否为空
            const isEmpty = !element.textContent?.trim() && 
                            element.children.length === 0;
            // 保留必要的结构元素
            const isStructuralElement = ['P', 'DIV', 'SECTION', 'ARTICLE', 'LI', 'TD', 'TH'].includes(element.tagName);
            if (isEmpty && !isStructuralElement) {
                element.parentNode?.removeChild(element);
            }
        }
        // 处理文本节点
        if (node.nodeType === Node.TEXT_NODE) {
            const textNode = node as Text;
            if (!textNode.nodeValue?.trim()) {
                textNode.parentNode?.removeChild(textNode);
            }
        }
    }
    
    // 获取样式配置
    function getStyleForType(type: string, color?: string) {
        return (element: HTMLElement) => {
            switch (type) {
                case 'highlight':
                    element.style.backgroundColor = hexToRgba(color || '#FFFF00', 0.1);
                    element.style.mixBlendMode = 'multiply';
                    element.className = 'annotation-highlight';
                    break;
                case 'underline':
                    element.style.textDecoration = 'underline';
                    element.className = 'annotation-underline';
                    break;
                case 'bold':
                    element.style.fontWeight = '700';
                    element.className = 'annotation-bold';
                    break;
                case 'italic':
                    element.style.fontStyle = 'italic';
                    element.className = 'annotation-italic';
                    break;
                case 'note':
                    element.className = 'annotation-note interactive-annotation';
                    element.style.cursor = 'pointer';
                    element.style.borderBottom = '1px dashed #0066CC';
                    break;
            }
            element.style.display = 'inline';
            element.style.lineHeight = 'inherit';
        };
    }
    
    // 渲染交互式注释
    function renderInteractiveAnnotations(rootNode: Node, annotations: ExtendedAnnotation[]) {
        console.log('Rendering interactive annotations on node:', rootNode);
        // 清除之前渲染的注释（避免重复）
        removeExistingAnnotations(rootNode);
        annotations.forEach(ann => {
            const range = createRangeFromOffsets(rootNode, ann.startOffset, ann.endOffset);
            if (!range) {
                console.warn(`Failed to create range for annotation ${ann.id}`);
                return;
            }
            // 创建注释元素
            const span = document.createElement('span');
            span.className = 'epub-annotation interactive-annotation';
            span.dataset.annotationId = ann.id;
            span.dataset.definition = ann.definition || '';
            span.dataset.text = ann.text;
            span.style.cursor = 'pointer';
            // 应用基础样式
            switch (ann.type) {
                case 'highlight':
                    span.style.backgroundColor = hexToRgba(ann.color || '#FFFF00', 0.1);
                    span.style.mixBlendMode = 'multiply';
                    break;
                case 'underline':
                    span.style.textDecoration = 'underline';
                    break;
                case 'bold':
                    span.style.fontWeight = '700';
                    break;
                case 'italic':
                    span.style.fontStyle = 'italic';
                    break;
                case 'note':
                    span.style.borderBottom = '1px dashed #0066CC';
                    break;
            }
            // 把选中内容移到 span 里
            range.surroundContents(span);
            // 添加事件监听
            span.addEventListener('mouseenter', () => {
                span.style.color = '#0066CC';
                span.style.textDecoration = 'underline';
            });
            span.addEventListener('mouseleave', () => {
                span.style.color = '';
                span.style.textDecoration = '';
            });
            span.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (ann.definition) {
                    showDefinitionPopup(ann.text, ann.definition, e);
                }
            });
        });
    }
    
    // 显示释义弹窗
    function showDefinitionPopup(word: string, definition: string, event: MouseEvent) {
        popupWord.value = word;
        popupDefinition.value = definition;
        // 计算弹窗位置（在点击位置附近，但确保在视窗内）
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const popupWidth = 300;
        const popupHeight = 150;
        let top = event.clientY + 10;
        let left = event.clientX + 10;
        // 如果弹窗会超出右边界，调整到左边
        if (left + popupWidth > viewportWidth) {
            left = event.clientX - popupWidth - 10;
        }
        // 如果弹窗会超出下边界，调整到上方
        if (top + popupHeight > viewportHeight) {
            top = event.clientY - popupHeight - 10;
        }
        // 确保弹窗不会显示在视窗外
        top = Math.max(10, top);
        left = Math.max(10, left);
        popupPosition.value = { top, left };
        definitionPopupVisible.value = true;
    }
    
    // 关闭释义弹窗
    function closeDefinitionPopup() {
        definitionPopupVisible.value = false;
    }
    
    // 清除已有注释（防止重复渲染）
    function removeExistingAnnotations(rootNode: Node) {
        // @ts-ignore
        const spans = rootNode.querySelectorAll('.epub-annotation');
        // @ts-ignore
        spans.forEach(span => {
            const parent = span.parentNode;
            while (span.firstChild) {
                parent?.insertBefore(span.firstChild, span);
            }
            span.remove();
        });
    }
    
    // 恢复章节注释
    function restoreAnnotationsForChapter(chapterHref: string) {
        if (!rendition.value) return;
        const iframe = rendition.value.manager.container.querySelector('iframe');
        if (!iframe) return;
        // 使用nextTick确保DOM完全渲染
        nextTick(() => {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) return;
            // 获取章节纯文本
            const chapterText = getChapterText(iframeDoc.body);
            if (!chapterText) return;
            // 清理过期注释
            cleanupStaleAnnotations(props.bookid, chapterHref, chapterText);
            // 获取该章节的所有注释
            const annotations = getAnnotationsForChapter(props.bookid, chapterHref) as ExtendedAnnotation[];
            if (annotations.length === 0) return;
            // 区分交互式注释和其他注释
            const interactiveAnnotations = annotations.filter(ann => 
                ann.type === 'note' && ann.definition
            );
            const otherAnnotations = annotations.filter(ann => 
                ann.type !== 'note' || !ann.definition
            );
            // 首先渲染非交互式注释
            otherAnnotations.forEach(annotation => {
                // 尝试使用上下文精确匹配
                let position = findTextWithContext(
                    chapterText,
                    annotation.text,
                    annotation.contextBefore,
                    annotation.contextAfter
                );
                // 如果找到匹配位置，创建Range
                if (position !== -1) {
                    const range = createRangeFromOffsets(
                        iframeDoc.body,
                        position,
                        position + annotation.text.length
                    );
                    if (range) {
                        applyStyleToRange(range, getStyleForType(annotation.type, annotation.color));
                    }
                }
            });
            // 然后渲染交互式注释
            renderInteractiveAnnotations(iframeDoc.body, interactiveAnnotations);
        });
    }
    
    // 保存当前选择为注释
    function saveCurrentSelection(type: string, color?: string, definition?: string) {
        const iframe = rendition.value?.manager.container.querySelector('iframe');
        if (!iframe) return;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
        const selection = iframeDoc.getSelection();
        if (!selection || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();
        if (!selectedText) return;
        // 获取当前章节信息
        const currentLocation = rendition.value?.currentLocation();
        if (!currentLocation) return;
        const spineItem = book.value.spine.get(currentLocation.start.index);
        if (!spineItem) return;
        const chapterHref = spineItem.href;
        // 获取章节纯文本
        const chapterText = getChapterText(iframeDoc.body);
        if (!chapterText) return;
        // 获取文本偏移量
        const { start: startOffset, end: endOffset } = getTextOffsets(range, iframeDoc.body);
        // 获取上下文用于精确匹配
        const context = getContext(chapterText, startOffset, selectedText.length);
        // 创建注释对象
        const annotation: ExtendedAnnotation = {
            id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            bookId: props.bookid,
            chapterHref,
            startOffset,
            endOffset,
            text: selectedText,
            contextBefore: context.before,
            contextAfter: context.after,
            type: type as any,
            color,
            createdAt: new Date().toISOString(),
            definition: definition || undefined
        };
        // 保存注释
        saveAnnotation(annotation);
        // 应用样式到当前视图
        if (type === 'note' && definition) {
            // 交互式注释 - 修复：传递注释对象以添加事件监听器
            applyStyleToRange(range, getStyleForType(type, color), true, annotation);
        } else {
            // 普通注释
            applyStyleToRange(range, getStyleForType(type, color));
        }
        // 清除选择
        selection.removeAllRanges();
        selectShowJudge.value = false;
        launchShowJudge.value = false;
        ElMessage({
            message: '注释已保存',
            type: 'success',
        });
    }
    
    // 收藏文档
    function favoriteDoc() {
        saveCurrentSelection('highlight', '#FF0000');
        ElMessage({
            message: '已收藏',
            type: 'success',
        });
    }
    
    // 十六进制转RGBA
    function hexToRgba(hex: string, alpha: number): string {
        hex = hex.replace('#', '');
        let r: number, g: number, b: number;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else {
            return `rgba(255, 0, 0, ${alpha})`;
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // 添加注释
    function addNote() {
        const iframe = rendition.value?.manager.container.querySelector('iframe');
        if (!iframe) return;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
        const selection = iframeDoc.getSelection();
        if (!selection || selection.isCollapsed) return;
        const selectedTextContent = selection.toString().trim();
        if (!selectedTextContent) return;
        currentSelection.value = {
            range: selection.getRangeAt(0),
            text: selectedTextContent
        };
        selectedText.value = selectedTextContent;
        noteContent.value = '';
        noteModalVisible.value = true;
        selectShowJudge.value = false;
    }
    
    // 保存注释
    function saveNote() {
        if (!currentSelection.value) {
            ElMessage.error('没有选择文本');
            return;
        }
        const { range, text } = currentSelection.value;
        // 获取当前章节信息
        const currentLocation = rendition.value?.currentLocation();
        if (!currentLocation) return;
        const spineItem = book.value.spine.get(currentLocation.start.index);
        if (!spineItem) return;
        const chapterHref = spineItem.href;
        // 保存注释
        saveCurrentSelection('note', undefined, noteContent.value);
        // 隐藏模态框
        noteModalVisible.value = false;
        currentSelection.value = null;
    }
    
    // 取消注释
    function cancelNote() {
        noteModalVisible.value = false;
        currentSelection.value = null;
    }
    
    // 初始化epub阅读器
    onMounted(async () => {
        const arrayBuffer: ArrayBuffer = await epubStorage.loadBook(props.bookid) as ArrayBuffer;
        book.value = Epub(arrayBuffer);
        rendition.value = book.value.renderTo(viewer.value as HTMLElement, {
            width: '100%',
            height: viewer.value?.clientHeight + 'px',
            minSpreadWidth: 800,
            flow : 'paginated',
            view: 'iframe',
            spread: true,
            allowScriptedContent: true
        });
        // 加载样式
        rendition.value.themes.default(defaultStyle)
        rendition.value.themes.font(readerSettings.font);
        rendition.value.themes.fontSize(readerSettings.fontSize + 'px');
        rendition.value.display().then(() => {
            setupResizeObserver();
        });
        // 监听渲染完成事件，允许再次导航
        rendition.value.on('relocated', () => {
            canNavigate.value = true;
        });
        rendition.value.on('relocated', (location: any) => {
            updateLocationInfo(location);
        });
        rendition.value.display().then(() => {
            setupResizeObserver();
            // 初始加载后获取位置信息
            const location = rendition.value.currentLocation();
            updateLocationInfo(location);
        });
        // 选中文本
        rendition.value.on('rendered', function(section: any) {
            const iframe = rendition.value.manager.container.querySelector('iframe');
            if (!iframe) return;
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) return;
            // 获取当前章节信息
            const currentLocation = rendition.value.currentLocation();
            const spineItem = book.value.spine.get(currentLocation.start.index);
            if (spineItem) {
                // 延迟恢复注释，确保DOM完全渲染
                setTimeout(() => {
                    restoreAnnotationsForChapter(spineItem.href);
                }, 100);
            }
            
            // 添加触摸事件监听器到iframe内部文档
            const addTouchListenersToIframe = () => {
                // 清理之前的触摸事件监听器
                cleanupTouchListeners();
                
                // 添加触摸事件监听器到iframe内部的文档
                const touchStartListener = (e: TouchEvent) => handleTouchStart(e);
                const touchMoveListener = (e: TouchEvent) => handleTouchMove(e);
                const touchEndListener = () => handleTouchEnd();
                
                iframeDoc.addEventListener('touchstart', touchStartListener, { passive: true });
                iframeDoc.addEventListener('touchmove', touchMoveListener, { passive: true });
                iframeDoc.addEventListener('touchend', touchEndListener);
                
                // 存储清理函数
                touchCleanupFunctions.value.push(() => {
                    iframeDoc.removeEventListener('touchstart', touchStartListener);
                    iframeDoc.removeEventListener('touchmove', touchMoveListener);
                    iframeDoc.removeEventListener('touchend', touchEndListener);
                });
                
                console.log('触摸事件监听器已添加到iframe内部文档');
            };
            
            // 立即尝试添加触摸事件监听器
            addTouchListenersToIframe();
            
            // 触发编辑
            iframeDoc.addEventListener('contextmenu', async function(event: MouseEvent) {
                const selection = iframeDoc.getSelection();
                const selectionText = selection ? selection.toString() : '';
                if (selectionText) {
                    event.preventDefault();
                    // 获取选区边界矩形和所有文本矩形
                    const range = selection!.getRangeAt(0);
                    const boundingRect = range.getBoundingClientRect();
                    const textRects = range.getClientRects();
                    // 获取iframe在页面中的位置
                    const iframeRect = iframe.getBoundingClientRect();
                    selectShowJudge.value = true;
                    // 设置位置
                    if (select.value && viewer.value && launch.value && trans.value) {
                        if(viewer.value?.clientWidth < 800){
                            select.value.style.left = `${viewer.value?.clientWidth / 2 - 152 }px`;
                            launch.value.style.left = `${viewer.value?.clientWidth / 2 - 152 }px`;
                            trans.value.style.left = `${viewer.value?.clientWidth / 2 - 152 }px`;
                        }else{
                            if(textRects.length > 0 && textRects[textRects.length - 1].left > viewer.value?.clientWidth / 2){
                                select.value.style.left = `${viewer.value?.clientWidth / 4 * 3  - 152}px`;
                                launch.value.style.left = `${viewer.value?.clientWidth / 4 * 3  - 152}px`;
                                trans.value.style.left = `${viewer.value?.clientWidth / 4 * 3  - 152}px`;
                            }else{
                                select.value.style.left = `${viewer.value?.clientWidth / 4 * 1  - 152}px`;    
                                launch.value.style.left = `${viewer.value?.clientWidth / 4 * 1  - 152}px`; 
                                trans.value.style.left = `${viewer.value?.clientWidth / 4 * 1  - 152}px`;                                 
                            }
                        }
                        if (textRects.length > 0) {
                            select.value.style.top = `${textRects[textRects.length - 1].bottom + 40}px`;
                            if(viewer.value?.clientHeight >= textRects[textRects.length - 1].bottom + 130){
                                launch.value.style.top = `${textRects[textRects.length - 1].bottom + 90}px`;
                            }else{
                                launch.value.style.top = `${textRects[textRects.length - 1].bottom - 6}px`;
                            }
                        }
                        // 添加点击事件监听器来关闭选择框
                        const closeSelect = (e: MouseEvent) => {
                            const clickedElement = e.target as Node;
                            if (select.value && !select.value.contains(clickedElement)) {
                                selectShowJudge.value = false;
                                launchShowJudge.value = false; 
                                transShowJudge.value = false;
                                // 清除事件监听器
                                document.removeEventListener('click', closeSelect);
                                iframe.contentDocument?.removeEventListener('click', closeSelect);
                            }
                        };
                        // 延迟添加事件监听器，避免立即触发
                        setTimeout(() => {
                            document.addEventListener('click', closeSelect);
                            iframe.contentDocument?.addEventListener('click', closeSelect);
                        }, 0);
                    };
                    // 发送查词请求
                    let qw =  await queryWord(selectionText);
                    let ans = qw?.['results']?.['basic'];
                    if(ans && trans.value){
                        word.value = selectionText;
                        if(word.value.length === 1){
                            Object.keys(ans).forEach(key => {
                                let allContent = ''
                                let num = 1
                                // @ts-ignore
                                ans[key].forEach(text => {
                                    const match = text.match(/^(.*?)(?:。|：)/);
                                    if (match) {
                                        allContent += (toOrdinalNumber(num) + ' ' + match[1] + ' ')
                                    }
                                    num ++
                                })
                                ans[key] = [allContent]
                            });
                            transData.value = ans
                            if (textRects.length > 0) {
                                trans.value.style.top = `${textRects[textRects.length - 1].bottom + 96}px`;
                            }
                            transShowJudge.value = true;
                        }else{
                            let pinyin = qw?.['results']?.['pinyin'] || '未知拼音';
                            transData.value = { [pinyin] : ans }
                            if (textRects.length > 0) {
                                trans.value.style.top = `${textRects[textRects.length - 1].bottom + 96}px`;
                            }
                            transShowJudge.value = true;
                        }
                    }
                    const user = queryContents()
                    user.content = qw['results']['detailed']
                }
            });
        });
        
        // 监听键盘事件
        book.value.ready.then(() => {
            const keyListener = (e: KeyboardEvent) => {
                // 如果当前不允许导航，直接返回
                if (!canNavigate.value) return;
                if (e.key === 'ArrowRight') {
                    canNavigate.value = false; // 禁止导航直到新页面渲染完成
                    rendition.value?.next();
                } else if (e.key === 'ArrowLeft') {
                    canNavigate.value = false; // 禁止导航直到新页面渲染完成
                    rendition.value?.prev();
                } else if (e.key === 'Escape') {
                    console.log('Exit reading mode');
                }
            };
            rendition.value?.on("keyup", keyListener);
            document.addEventListener("keyup", keyListener, false);
        });
        
        // 传出书籍对象
        book.value.loaded.navigation.then(() => {
            const user = bookOBJ();
            user.book = book.value; 
        });
        const user = bookOBJ();
        watch(() => user.changeMenu, (Book) => {
            if (Book && rendition.value) {
                rendition.value.display(Book);
                selectShowJudge.value = false;
                transShowJudge.value = false;
            }
        });
        watch(() => readerSettings.font, (newFont) => {
            if (rendition.value) {
                rendition.value.themes.font(newFont);
            }
        });
        watch(() => readerSettings.fontSize, (newSize) => {
            if (rendition.value) {
                rendition.value.themes.fontSize(newSize + 'px');
            }
        });
    });
    
    // 组件卸载时清理所有事件监听器
    onUnmounted(() => {
        cleanupTouchListeners();
    });
    
    // 关闭阅读器
    function closeReader() {
        // 可以在这里添加清理逻辑
        const bookUser = bookOBJ()
        bookUser.Showtype = 'MAIN';
        bookUser.book = undefined;
        bookUser.changeMenu = undefined;
    }
    
    // 复制
    function copyDoc() {
        const iframe = rendition.value.manager.container.querySelector('iframe');
        if (!iframe) return;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
        const selection = iframeDoc.getSelection();
        const text = selection!.toString();
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                ElMessage({
                    message: '文件已粘贴进剪贴板',
                    type: 'success',
                })
                selectShowJudge.value = false;
                transShowJudge.value = false;
            }).catch(err => {
                ElMessage.error('复制失败，请重试');
                selectShowJudge.value = false;
                transShowJudge.value = false;
            });
        }
    }
    
    // 高亮
    function highLightDoc() {
        launchShowJudge.value = !launchShowJudge.value;
    }
    
    // 高亮颜色选择
    function highLightColor(color: string): void {
        saveCurrentSelection('highlight', color);
    }
    
    // 下划线
    function underlineDoc(): void {
        saveCurrentSelection('underline');
    }
    
    // 加粗
    function boldDoc(): void {
        saveCurrentSelection('bold');
    }
    
    // 斜体
    function italicDoc(): void {
        saveCurrentSelection('italic');
    }
    
    // 弹出查词
    function queryWords(): void{
        const user = queryContents()
        user.show = true
    }
    
    // 数据查找
    const updateLocationInfo = (location: any) => {
        if (!location) return;
        // 获取当前章节的CFI
        const currentCfi = location.start.cfi;
        // 1. 首先尝试从导航项中获取章节标题
        let chapterTitle = '未知章节';
        const navItem = book.value.navigation.get(currentCfi);
        if (navItem && navItem.label) {
            chapterTitle = navItem.label;
        } else {
            // 2. 如果导航中没有，尝试从spine的toc中获取
            const spineItem = book.value.spine.get(location.start.index);
            if (spineItem) {
                const tocItem = findTocItemByHref(spineItem.href);
                if (tocItem && tocItem.label) {
                    chapterTitle = tocItem.label;
                } else if (spineItem.document) {
                    // 3. 如果还是没有，尝试从文档的title标签获取
                    const title = spineItem.document.querySelector('title');
                    if (title && title.textContent) {
                        chapterTitle = title.textContent;
                    }
                }
            }
        }
        currentChapter.value = chapterTitle;
        currentPage.value = location.start.displayed.page;
        totalPages.value = location.start.displayed.total;
        currentHref.value = book.value.spine.get(location.start.index)?.href || '';
    };
    
    const findTocItemByHref = (href: string) => {
        if (!book.value || !book.value.navigation.toc) return null;
        const findInItems = (items: any[]): any => {
            for (const item of items) {
                if (item.href === href) return item;
                if (item.subitems && item.subitems.length) {
                    const found = findInItems(item.subitems);
                    if (found) return found;
                }
            }
            return null;
        };
        return findInItems(book.value.navigation.toc);
    };
    
    // 更新书本数据
    function updateBookData() {
        const user = bookOBJ();
        // 1. 获取书本名称
        const bookName = book.value.packaging.metadata.title || '未知书名';
        // 2. 获取书本简介
        const bookDescription = book.value.packaging.metadata.description || '无简介';
        // 3. 获取当前iframe文档
        const iframe = rendition.value?.manager.container.querySelector('iframe');
        if (!iframe) {
            console.error('无法获取iframe');
            return;
        }
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
            console.error('无法获取iframe文档');
            return;
        }
        // 4. 获取当前章节文本（即当前页所在章节的全部文本）
        const chapterText = getChapterText(iframeDoc.body);
        // 5. 获取当前选择文本
        const selection = iframeDoc.getSelection();
        const selectedText = selection && !selection.isCollapsed ? selection.toString().trim() : '';
        // 6. 获取当前选择文本上下文20字符
        let contextBefore = '';
        let contextAfter = '';
        if (selectedText && chapterText) {
            const selectionStart = chapterText.indexOf(selectedText);
            if (selectionStart !== -1) {
                const selectionEnd = selectionStart + selectedText.length;
                contextBefore = chapterText.substring(Math.max(0, selectionStart - 20), selectionStart);
                contextAfter = chapterText.substring(selectionEnd, selectionEnd + 20);
            }
        }
        user.bookData = {
            title: bookName,
            description: bookDescription,
            chapterText: chapterText,
            selectedText: selectedText,
            contextBefore : contextBefore,
            contextAfter : contextAfter
        }
        return user.bookData
    }
    
    // AI翻译功能
    function aiTranslate() {
        updateBookData()
        const user = bookOBJ();
        user.filled = true;
    }
</script>
<script lang="ts">
    export default {
        name: 'reader'
    }
</script>
<style scoped>
    @import '../css/reader.css';
    /* 添加缺失的注释样式 */
    .annotation-note {
        border-bottom: 1px dashed #0066CC;
    }
    /* 注释样式 */
    .annotation-highlight {
        background-color: rgba(255, 255, 0, 0.1) !important;
        mix-blend-mode: multiply !important;
    }
    .annotation-underline {
        text-decoration: underline !important;
    }
    .annotation-bold {
        font-weight: 700 !important;
    }
    .annotation-italic {
        font-style: italic !important;
    }
    .interactive-annotation {
        position: relative;
        cursor: pointer;
        transition: color 0.2s ease;
    }
    .interactive-annotation:hover {
        color: #0066CC !important;
        text-decoration: underline !important;
    }
    /* 注释模态框 */
    .note-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }
    .note-modal-content {
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        width: 90%;
        max-width: 500px;
    }
    .note-modal-content h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
    }
    .selected-text {
        background-color: #f5f5f5;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 15px;
        font-weight: bold;
        color: #333;
    }
    .definition-input {
        margin-bottom: 15px;
    }
    .definition-input label {
        display: block;
        margin-bottom: 5px;
        color: #555;
    }
    .definition-input textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        resize: vertical;
        font-family: inherit;
        font-size: 14px;
    }
    .note-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    }
    .note-modal-actions button {
        padding: 8px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
    }
    .note-modal-actions button:first-child {
        background-color: #f0f0f0;
        color: #333;
    }
    .note-modal-actions button.primary {
        background-color: #409EFF;
        color: white;
    }
    /* 释义弹窗 */
    .definition-popup {
        position: fixed;
        width: 300px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        animation: popup-fade-in 0.2s ease;
    }
    @keyframes popup-fade-in {
        from {
            opacity: 0;
            transform: translateY(5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .popup-content {
        padding: 15px;
    }
    .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
    }
    .popup-word {
        font-weight: bold;
        font-size: 18px;
        color: #333;
    }
    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }
    .close-btn:hover {
        background-color: #f5f5f5;
        color: #333;
    }
    .popup-body {
        color: #555;
        line-height: 1.5;
    }
    .popup-body p {
        margin: 0;
    }
    /* 点击效果 */
    .interactive-annotation:active {
        opacity: 0.8;
    }
    #definition{
        width: calc(100% - 20px);
    }
</style>