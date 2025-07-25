<template>
    <div class="frame">
        <h1 class="title">藏书楼阁</h1>
        <button class="upload" @click="handleUploadClick">导入</button>
        <input 
            type="file" 
            id="fileInput"
            ref="fileInput" 
            style="display: none" 
            accept=".epub" 
            @change="handleFileChange"
        >
        <el-space wrap class="space">
            <BookViewer 
                v-for="book in booksList" 
                :key="book.bookid" 
                :bookid="book.bookid"
            />
        </el-space>
        
    </div>
</template>


<script lang="ts">
    export default {
        name:'mainInterface'
    }
</script>


<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import Epub from 'epubjs';
    import epubStorage from '../epubStorage.ts';

    const fileInput = ref<HTMLInputElement | null>(null);
    const book = ref<any>(null);
    const booksList = ref<any[]>([]); // 使用ref创建响应式书籍列表

    const handleUploadClick = () => {
        fileInput.value?.click();
    };

    // 加载书籍列表的函数
    const loadBooks = async () => {
        booksList.value = await epubStorage.getAllBookIds();
    };

    // 组件挂载时加载书籍
    onMounted(async () => {
        await loadBooks();
    });

    const handleFileChange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) return;
        
        try {
            const epub = new epubStorage();
            const arrayBuffer = await epub.parseEpub(file);
            await epub.storageData(arrayBuffer);
            
            const bookId = epub.getBookId();
            console.log('EPUB 存储成功，ID:', bookId);
            book.value = Epub(arrayBuffer);
            
            // 重新加载书籍列表以更新视图
            await loadBooks();
        } catch (error) {
            console.error('处理 EPUB 失败:', error);
        }
    };
</script>

<style scoped>
    .frame{
        position: relative;
        height: 100%;
        width: 100%;
    }
    .title{
        font-family: 'Source Han Serif SC Heavy';
        font-size: 19px;
        position: absolute;
        left: 20px;
        top: 0px;
        color: rgb(4, 68, 93);
    }
    .upload{
        width: 38px;
        height: 17px;
        position: absolute;
        left: 104px;
        font-size: 11px;
        top: 19.5px;
        font-weight: 700;
        font-family: '黑体';
        color: rgb(10, 124, 169);
        border: none;
        background-color: rgb(198, 225, 236);
    }
    .upload:hover{
        background-color: rgb(163, 204, 220);
    }
    .space {
        position: absolute;
        top: 40px;
        left: 5px;
        right: 5px; /* 添加右侧间距 */
        bottom: 5px; /* 添加底部间距 */
        padding: 0;
        margin: 0;
        overflow-y: auto; /* 如果内容超出高度则允许滚动 */
        display: flex;
        flex-wrap: wrap;
        gap: 10px; /* 设置书籍之间的间距 */
        align-content: flex-start; /* 顶部对齐 */
    }
</style>