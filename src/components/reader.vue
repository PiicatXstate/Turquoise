<template>
    <div id="readerFrame">
        
        <div id="informt">
                <p id="chapter">{{ currentChapter }}&nbsp;&nbsp;&nbsp;{{ currentPage }} / {{ totalPages }}</p>
                <p id="href">{{ currentHref }}</p>
                <el-icon id="pages">
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

            <BoldOutlined id="bold"/>
            <p id="boldText">加粗</p>

            <ItalicOutlined id="italic"/>
            <p id="italicText">斜体</p>

            <UnderlineOutlined id="underline" @click="underlineDoc"/> 
            <p id="underlineText">划线</p>

            <EditOutlined id="edit"/> 
            <p id="editText">注释</p>

            <ProjectOutlined id="project"/> 
            <p id="projectText">查词</p>

            <OneToOneOutlined id="onetoone"/> 
            <p id="onetooneText">AI答</p>

            <TagOutlined id="tag"/> 
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
        
        
        
    </div>
</template>

<script setup lang="ts">
    import { defineProps, ref, onMounted, onUnmounted, watch } from 'vue';
    import epubStorage from '../epubStorage.ts';
    import Epub from 'epubjs';
    import { bookOBJ } from '@/stores/bookOBJ.ts';
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
        TagOutlined
    } from '@ant-design/icons-vue';
    import { fa } from 'element-plus/es/locales.mjs';

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
            'font-size': '18px',
        },
        '::selection': {
            'background-color': 'rgba(3, 102, 214, 0.2)',
        },
    }

     // 保存注释到localStorage
    // const saveAnnotations = () => {
    //     localStorage.setItem('epubAnnotations', JSON.stringify(annotationsMap.value));
    // };

    // 添加新注释
    // const addAnnotation = (cfiRange: string, content: string) => {
    //     if (!annotationsMap.value[props.bookid]) {
    //         annotationsMap.value[props.bookid] = [];
    //     }
        
    //     const newAnnotation = {
    //         cfiRange,
    //         content,
    //         styles: {
    //             'fill': 'yellow',
    //             'fill-opacity': '0.3',
    //             'mix-blend-mode': 'multiply'
    //         }
    //     };
        
    //     annotationsMap.value[props.bookid].push(newAnnotation);
    //     saveAnnotations();
    //     return newAnnotation;
    // };

    // 恢复所有注释
    // const restoreAnnotations = () => {
    //     const annotations = loadAnnotations();
    //     annotations.forEach((ann: any) => {
    //         rendition.value.annotations.add(
    //             'highlight',
    //             ann.cfiRange,
    //             {},
    //             null,
    //             'custom-highlight',
    //             ann.styles
    //         );
    //     });
    // };

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
    const annotationsMap = ref<{[key: string]: any[]}>({});
    const select = ref<HTMLElement | null>(null);
    const launch = ref<HTMLElement | null>(null);
    // 初始化章节、页数和HTML文件路径
    const currentChapter = ref('加载中...');
    const currentPage = ref(0);
    const totalPages = ref(0);
    const currentHref = ref('');


    let selectShowJudge = ref(false);
    let launchShowJudge = ref(false);
    let canNavigate = ref(true);    // 控制是否允许翻页的标志

    // 处理窗口大小变化
    const handleResize = () => {
        if (rendition.value) {
            rendition.value.resize(
                viewer.value?.clientWidth + 'px',
                viewer.value?.clientHeight + 'px'
            );
        }
    };

    // 设置ResizeObserver
    const setupResizeObserver = () => {
        if (viewer.value && rendition.value) {
            resizeObserver.value = new ResizeObserver(handleResize);
            resizeObserver.value.observe(viewer.value);
        }
    };

    // // 从localStorage加载注释
    // const loadAnnotations = () => {
    //     const savedAnnotations = localStorage.getItem('epubAnnotations');
    //     if (savedAnnotations) {
    //         annotationsMap.value = JSON.parse(savedAnnotations);
    //     }
    //     return annotationsMap.value[props.bookid] || [];
    // };

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
            
            // iframeDoc.addEventListener('mouseup', function(e: MouseEvent) {
            //     const selection = iframeDoc.getSelection();
            //     if (selection && !selection.isCollapsed) {
            //         // const range = selection.getRangeAt(0);
            //         // const contents = rendition.value.getContents()[0];
                    
            //         // if (contents) {
            //         //     const cfiRange = contents.cfiFromRange(range);
            //         //     const selectedText = selection.toString();
                    
            //         //     if (cfiRange && selectedText) {
            //         //         const newAnnotation = addAnnotation(cfiRange, selectedText);
                            
            //         //         rendition.value.annotations.add(
            //         //             'highlight', 
            //         //             cfiRange, 
            //         //             {}, 
            //         //             null, 
            //         //             'custom-highlight', 
            //         //             newAnnotation.styles
            //         //         );
            //         //     }
            //         // }


            //         // 修正首次未移动到鼠标处的问题
            //         // selectShowJudge.value = false; // 先隐藏，强制触发DOM刷新
            //         // setTimeout(() => {
            //         //     // 获取选区的边界矩形
            //         //     const range = selection.getRangeAt(0);
            //         //     const rect = range.getBoundingClientRect();
            //         //     // rect.left 是选区最左侧的屏幕坐标
            //         //     select.value?.style.setProperty('top', `${rect.bottom + 10}px`);
            //         //     select.value?.style.setProperty('left', `${rect.left}px`);
            //         //     // 监听 selectionchange 事件，取消选中时隐藏 select
            //         //     const hideSelect = () => {
            //         //         if (iframeDoc.getSelection()?.isCollapsed) {
            //         //             selectShowJudge.value = false;
            //         //             iframeDoc.removeEventListener('selectionchange', hideSelect);
            //         //         }
            //         //     };
            //         //     iframeDoc.addEventListener('selectionchange', hideSelect);
            //         //     selectShowJudge.value = true;
            //         // }, 0);

            //         // selectShowJudge.value = true;
            //         // contextmenu 事件监听已移至外部，避免重复绑定
            //     }
            // });




            // 触发编辑
            iframeDoc.addEventListener('contextmenu', function(event: MouseEvent) {
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

                    
                    if (select.value) {

                        selectShowJudge.value = true;

                        // @ts-ignore
                        if(viewer.value?.clientWidth < 800){
                            // @ts-ignore
                            select.value.style.left = `${viewer.value?.clientWidth / 2 - 152 }px`;
                            // @ts-ignore
                            launch.value.style.left = `${viewer.value?.clientWidth / 2 - 152 }px`;
                        }else{
                            // @ts-ignore
                            if(textRects[Object.entries(textRects).length - 1].left > viewer.value?.clientWidth / 2){
                                // @ts-ignore
                                select.value.style.left = `${viewer.value?.clientWidth / 4 * 3  - 152}px`;
                                // @ts-ignore
                                launch.value.style.left = `${viewer.value?.clientWidth / 4 * 3  - 152}px`;
                            }else{
                                // @ts-ignore
                                select.value.style.left = `${viewer.value?.clientWidth / 4 * 1  - 152}px`;        
                                // @ts-ignore
                                launch.value.style.left = `${viewer.value?.clientWidth / 4 * 1  - 152}px`;                          
                            }
                        }
                        select.value.style.top = `${textRects[Object.entries(textRects).length - 1].bottom + 40}px`;
                        // @ts-ignore
                        launch.value.style.top = `${textRects[Object.entries(textRects).length - 1].bottom + 90}px`;
                        
                        
                        
                        // 添加点击事件监听器来关闭选择框
                        const closeSelect = (e: MouseEvent) => {
                            const clickedElement = e.target as Node;
                            if (select.value && !select.value.contains(clickedElement)) {
                                selectShowJudge.value = false;
                                launchShowJudge.value = false; 
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

                    }

                }

            });




        });
        

        // 监听键盘事件
        book.value.ready.then(() => {
            const keyListener = (e: KeyboardEvent) => {
                // 如果当前不允许导航，直接返回
                if (!canNavigate.value) return;
                
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'l') {
                    canNavigate.value = false; // 禁止导航直到新页面渲染完成
                    rendition.value?.next();
                } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'h') {
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
            }
        });
    });



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
            }).catch(err => {
                ElMessage.error('复制失败，请重试');
                selectShowJudge.value = false;
            });
        }
    }


    // 高亮
    function highLightDoc(){
        launchShowJudge.value = ! launchShowJudge.value;
        
    }
    
    function highLightColor(color: string): void {
        const iframe = rendition.value.manager.container.querySelector('iframe');
        if (!iframe) return;
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
        
        const selection = iframeDoc.getSelection();
        if (selection && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const rgbaColor = hexToRgba(color, 0.1);
            
            // 获取选区内的所有文本节点
            const textNodes = getTextNodesInRange(range);
            
            // 用于存储高亮元素
            const highlightElements: HTMLElement[] = [];
            
            // 处理每个文本节点
            textNodes.forEach((node, index) => {
                const text = node.nodeValue || '';
                const isFirst = index === 0;
                const isLast = index === textNodes.length - 1;
                
                // 确定起始和结束偏移量
                const startOffset = isFirst ? range.startOffset : 0;
                const endOffset = isLast ? range.endOffset : text.length;
                
                // 创建高亮元素
                const highlightSpan = iframeDoc.createElement('span');
                highlightSpan.style.backgroundColor = rgbaColor;
                highlightSpan.style.mixBlendMode = 'multiply';
                highlightSpan.className = 'direct-highlight';
                highlightSpan.style.display = 'inline';
                highlightSpan.style.lineHeight = 'inherit';
                
                // 提取需要高亮的文本部分
                const selectedText = text.substring(startOffset, endOffset);
                
                // 创建文本节点替换原始节点
                const beforeText = iframeDoc.createTextNode(text.substring(0, startOffset));
                const afterText = iframeDoc.createTextNode(text.substring(endOffset));
                
                // 创建高亮部分的文本节点
                const highlightText = iframeDoc.createTextNode(selectedText);
                highlightSpan.appendChild(highlightText);
                
                // 替换原始文本节点
                const parent = node.parentNode;
                if (parent) {
                    // 插入高亮前的文本
                    if (beforeText.length > 0) {
                        parent.insertBefore(beforeText, node);
                    }
                    
                    // 插入高亮元素
                    parent.insertBefore(highlightSpan, node);
                    
                    // 插入高亮后的文本
                    if (afterText.length > 0) {
                        parent.insertBefore(afterText, node);
                    }
                    
                    // 移除原始节点
                    parent.removeChild(node);
                }
                
                highlightElements.push(highlightSpan);
            });
            
            // 清除选区
            selection.removeAllRanges();
        }
        launchShowJudge.value = false;
    }

    // 获取选区内的所有文本节点
    function getTextNodesInRange(range: Range): Text[] {
        const textNodes: Text[] = [];
        const startNode = range.startContainer;
        const endNode = range.endContainer;
        
        // 遍历从起始节点到结束节点
        let currentNode = startNode;
        
        while (currentNode) {
            if (currentNode.nodeType === Node.TEXT_NODE) {
                textNodes.push(currentNode as Text);
            }
            
            // 如果到达结束节点，停止遍历
            if (currentNode === endNode) break;
            
            // 获取下一个节点
            // @ts-ignore
            currentNode = getNextNode(currentNode, endNode);
        }
        
        return textNodes;
    }

    // 获取下一个节点
    function getNextNode(node: Node, endNode: Node): Node | null {
        // 1. 如果有子节点，返回第一个子节点
        if (node.firstChild) return node.firstChild;
        
        // 2. 如果有兄弟节点，返回下一个兄弟节点
        if (node.nextSibling) return node.nextSibling;
        
        // 3. 向上查找直到找到有兄弟节点的祖先
        let parent = node.parentNode;
        while (parent && parent !== endNode) {
            if (parent.nextSibling) {
                return parent.nextSibling;
            }
            parent = parent.parentNode;
        }
        
        return null;
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

    // 移除高亮
    function removeDirectHighlights(iframeDoc: Document) {
        const highlights = iframeDoc.querySelectorAll('.direct-highlight');
        highlights.forEach(hl => {
            const parent = hl.parentNode;
            if (parent) {
                // 将高亮内的文本移回父节点
                while (hl.firstChild) {
                    parent.insertBefore(hl.firstChild, hl);
                }
                parent.removeChild(hl);
            }
        });
    }

    function underlineDoc():void{
        
        const iframe = rendition.value.manager.container.querySelector('iframe');
        if (!iframe) return;
            
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
            
            const selection = iframeDoc.getSelection();
            if (selection && !selection.isCollapsed) {
                const range = selection.getRangeAt(0);
                const contents = rendition.value.getContents()[0];
                    
                if (contents) {
                    const cfiRange = contents.cfiFromRange(range);
                    const selectedText = selection.toString();
                
                    if (cfiRange && selectedText) {
                        
                        rendition.value.annotations.add(
                            'underline', 
                            cfiRange, 
                            {}, 
                            null, 
                            '', 
                            {
                                "border-bottom": "1px solid #FF0000", 
                                "border-top": "none",
                                "border-left": "none",
                                "border-right": "none",
                                "background-color": "transparent"
                            }
                        );
                    }
                }
            }
        launchShowJudge.value = false; 
        selectShowJudge.value = false; 
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



</script>

<script lang="ts">
    export default {
        name: 'reader'
    }
</script>

<style scoped>
    #readerFrame {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
    }
    #viewer {
        width: 100%;
        height: 92%;
        position: absolute;
        top: 4%;
        left: 0;
        overflow: hidden;
        user-select: none;   
    }
    
    :deep(.custom-highlight) {
        fill: yellow;
        fill-opacity: 0.3;
        mix-blend-mode: multiply;
    }


    #chapter {
        position: absolute;
        top: -4px;
        left: 13px;
        width: 100%;
        font-size: 14px;
        color: rgb(198, 183, 183);
    }

    #pages {
        position: absolute;
        top: 12px;
        right: 12px;
        text-align: right;
        color: gray;
    }

    #href {
        position: absolute;
        top: calc(100% - 40px);
        left: 13px;
        width: 100%;
        font-size: 14px;
        color: gray;
        color: rgb(198, 183, 183);
    }

    
    .select{ 
        position: absolute;
        width: 304px;
        height: 50px;
        background-color: rgba(255,255,255,1);
        box-shadow: 0 0 4px rgba(0,0,0,0.3);
        border-radius: 10px;
        backdrop-filter: blur(10px);
        z-index: 1000;
    }
    #launch {
        position: absolute;
        width: 304px;
        height: 40px;
        background-color: rgba(224, 241, 240, 0);
        box-shadow: 0 0 0px rgba(0,0,0,1);
        border-radius: 5px;
        backdrop-filter: blur(0px);
        z-index: 500;
        display: flex;
    }

    /* 居中 */
    #color{
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .colors{
        width: 23px;
        height: 23px;
        border-radius: 10px;
        border: 1.7px solid white;
        box-shadow: 0 0 5px rgba(0,0,0,1);
        margin-left: 6px;
        margin-right: 6px;
    }










    /* 石山代码 */
    /* 32px */
    #copyDoc {
        font-size: 16px;
        position: absolute;
        top: 10px;
        left: 15.5px;
        cursor: pointer;
        color: #0f9494;
        display: flex;
    }
    #copyDocText {
        position: absolute;
        top: 17.2px;
        left: 12.60px;
        font-size: 10.5px;
        color: #0f9494;
    }
    #copyDoc:hover {
        color: #1890ff;
        transition: color 0.3s ease, transform 0.3s ease;
        transform: scale(0.8);
    }

    #highLight {
        font-size: 18px;
        position: absolute;
        top: 8.8px;
        left: 46.5px;
        cursor: pointer;
        color: #0f9494;
    }
    #HighLightText {
        position: absolute;
        top: 17.2px;
        left: 44.60px;
        font-size: 10.5px;
        color: #0f9494;
    }
    #highLight:hover {
        color: #1890ff;
        transition: color 0.3s ease, transform 0.3s ease;
        transform: scale(0.8);
    }

    #bold{
        font-size: 16px;
        position: absolute;
        top: 9.9px;
        left: 79.5px;
        cursor: pointer;
        color: #0f9494;
    }
    #boldText {
        position: absolute;
        top: 17.2px;
        left: 76.60px;
        font-size: 10.5px;
        color: #0f9494;
    }
    #bold:hover {
        color: #1890ff;
        transition: color 0.3s ease, transform 0.3s ease;
        transform: scale(0.8);
    }

    #italic {
        font-size: 16px;
        position: absolute;
        top: 9.9px;
        left: 111px;
        cursor: pointer;
        color: #0f9494;
    }
    #italicText {
        position: absolute;
        top: 17.2px;
        left: 108.60px;
        font-size: 10.5px;
        color: #0f9494;
    }
    #italic:hover {
        color: #1890ff;
        transition: color 0.3s ease, transform 0.3s ease;
        transform: scale(0.8);
    }

    #underline {
        font-size: 16px;
        position: absolute;
        top: 9.9px;
        left: 143px;
        cursor: pointer;
        color: #0f9494;
    }
    #underlineText {
        position: absolute;
        top: 17.2px;
        left: 140.60px;
        font-size: 10.5px;
        color: #0f9494;
    }
    #underline:hover {
        color: #1890ff;
        transition: color 0.3s ease, transform 0.3s ease;
        transform: scale(0.8);
    }

    #edit {
        font-size: 16px;
        position: absolute;
        top: 9.9px;
        left: 175px;
        cursor: pointer;
        color: #0f9494;
    }
    #editText {
        position: absolute;
        top: 17.2px;
        left: 172.60px;
        font-size: 10.5px;
        color: #0f9494;
    }
    #edit:hover {
        color: #1890ff;
        transition: color 0.3s ease, transform 0.3s ease;
        transform: scale(0.8);
    }

    #project {
        font-size: 16px;
        position: absolute;
        top: 9.9px;
        left: 207px;
        cursor: pointer;
        color: #0f9494;
    }
    #projectText {
        position: absolute;
        top: 17.2px;
        left: 204.60px;
        font-size: 10.5px;
        color: #0f9494;
    }
    #project:hover {
        color: #1890ff;
        transition: color 0.3s ease, transform 0.3s ease;
        transform: scale(0.8);
    }

    #onetoone {
        font-size: 16px;
        position: absolute;
        top: 9.9px;
        left: 239px;
        cursor: pointer;
        color: #0f9494;
    }
    #onetooneText {
        position: absolute;
        top: 17.2px;
        left: 236.60px;
        font-size: 10.5px;
        color: #0f9494;
    }
    #onetoone:hover {
        color: #1890ff;
        transition: color 0.3s ease, transform 0.3s ease;
        transform: scale(0.8);
    }

    #tag {
        font-size: 16px;
        position: absolute;
        top: 9.9px;
        left: 271px;
        cursor: pointer;
        color: #0f9494;
    }
    #tagText {
        position: absolute;
        top: 17.2px;
        left: 268.60px;
        font-size: 10.5px;
        color: #0f9494;
    }
    #tag:hover {
        color: #1890ff;
        transition: color 0.3s ease, transform 0.3s ease;
        transform: scale(0.8);
    }
</style>