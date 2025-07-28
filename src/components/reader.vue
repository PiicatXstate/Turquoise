<template style="overflow: hidden;">
    <div id="viewer" ref="viewer" style="overflow: hidden;"></div>
    <div class="select" v-if="selectShowJudge" ref="select">
        
    </div>
        
</template>

<script setup lang="ts">
    import { defineProps, ref, onMounted, onUnmounted, watch } from 'vue';
    import epubStorage from '../epubStorage.ts';
    import Epub from 'epubjs';
    import { bookOBJ } from '@/stores/bookOBJ.ts';
    import { fa } from 'element-plus/es/locales.mjs';

    // 组件样式 来自Flow
    const defaultStyle = {
        html: {
            padding: '0 !important',
        },
        body: {
            background: 'transparent',
        },
        'a:any-link': {
            color: '#3b82f6 !important',
            'text-decoration': 'none !important',
        },
        '::selection': {
            'background-color': 'rgba(3, 102, 214, 0.2)',
        },
    }


    const props = defineProps(['bookid']);
    const viewer = ref<HTMLElement | null>(null);
    const book = ref<any>(null);
    const rendition = ref<any>(null);
    const resizeObserver = ref<ResizeObserver | null>(null);
    const annotationsMap = ref<{[key: string]: any[]}>({});
    const select = ref<HTMLElement | null>(null);
    let selectShowJudge = ref(false);

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

    // 从localStorage加载注释
    const loadAnnotations = () => {
        const savedAnnotations = localStorage.getItem('epubAnnotations');
        if (savedAnnotations) {
            annotationsMap.value = JSON.parse(savedAnnotations);
        }
        return annotationsMap.value[props.bookid] || [];
    };

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

    // 初始化epub阅读器
    onMounted(async () => {
        const arrayBuffer: ArrayBuffer = await epubStorage.loadBook(props.bookid) as ArrayBuffer;
        book.value = Epub(arrayBuffer);

        rendition.value = book.value.renderTo(viewer.value as HTMLElement, {
            width: '100%',
            height: viewer.value?.clientHeight + 'px',
            view: 'iframe',
            allowScriptedContent: true
        });

        // 加载样式
        rendition.value.themes.default(defaultStyle)

        rendition.value.display().then(() => {
            setupResizeObserver();
            // restoreAnnotations(); // 恢复已保存的注释
        });

        rendition.value.on('rendered', function(section: any) {
            const iframe = rendition.value.manager.container.querySelector('iframe');
            if (!iframe) return;
            
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) return;
            
            iframeDoc.addEventListener('mouseup', function(e: MouseEvent) {
                const selection = iframeDoc.getSelection();
                if (selection && !selection.isCollapsed) {
                    // const range = selection.getRangeAt(0);
                    // const contents = rendition.value.getContents()[0];
                    
                    // if (contents) {
                    //     const cfiRange = contents.cfiFromRange(range);
                    //     const selectedText = selection.toString();
                        
                    //     if (cfiRange && selectedText) {
                    //         const newAnnotation = addAnnotation(cfiRange, selectedText);
                            
                    //         rendition.value.annotations.add(
                    //             'highlight', 
                    //             cfiRange, 
                    //             {}, 
                    //             null, 
                    //             'custom-highlight', 
                    //             newAnnotation.styles
                    //         );
                    //     }
                    // }
                    
                    
                    // 修正首次未移动到鼠标处的问题
                    // selectShowJudge.value = false; // 先隐藏，强制触发DOM刷新
                    // setTimeout(() => {
                    //     // 获取选区的边界矩形
                    //     const range = selection.getRangeAt(0);
                    //     const rect = range.getBoundingClientRect();
                    //     // rect.left 是选区最左侧的屏幕坐标
                    //     select.value?.style.setProperty('top', `${rect.bottom + 10}px`);
                    //     select.value?.style.setProperty('left', `${rect.left}px`);
                    //     // 监听 selectionchange 事件，取消选中时隐藏 select
                    //     const hideSelect = () => {
                    //         if (iframeDoc.getSelection()?.isCollapsed) {
                    //             selectShowJudge.value = false;
                    //             iframeDoc.removeEventListener('selectionchange', hideSelect);
                    //         }
                    //     };
                    //     iframeDoc.addEventListener('selectionchange', hideSelect);
                    //     selectShowJudge.value = true;
                    // }, 0);

                    // selectShowJudge.value = true;
                }
            });
        });

        // 监听键盘事件
        book.value.ready.then(() => {
            const keyListener = (e: KeyboardEvent) => {
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'l') {
                    rendition.value?.next();
                } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'h') {
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

    // 清理资源
    onUnmounted(() => {
        if (resizeObserver.value) {
            resizeObserver.value.disconnect();
        }
        if (book.value) {
            book.value.destroy();
        }
    });
</script>

<script lang="ts">
    export default {
        name: 'reader'
    }
</script>

<style scoped>
    #viewer {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
    }
    
    /* 确保高亮样式一致 */
    :deep(.custom-highlight) {
        fill: yellow;
        fill-opacity: 0.3;
        mix-blend-mode: multiply;
    }

    /* 
    .select{
        position: absolute;
        width: 300px;
        height: 50px;
        background-color: white;
        box-shadow: 0 5px 8px rgba(0,0,0,0.15);
        pointer-events: none;
        overflow: hidden;
    }
     */
</style>