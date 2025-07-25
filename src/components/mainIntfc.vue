<template>
    <!-- MAIN -->
    <!-- 主菜单 供选择书籍进入  -->
    <div class="frame" v-if=" (Showtype=='MAIN')?true:false">
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
                @click="handleBookClick(book.bookid)"
            />
        </el-space>
    </div>

    <!-- READER -->
    <!-- Reader 阅读器  -->
    <div class="frame" v-if=" (Showtype=='READER')?true:false">
        <reader :bookid="ShowBookID" />
    </div>
</template>


<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import Epub from 'epubjs';
    import epubStorage from '../epubStorage.ts';
    import { fa } from 'element-plus/es/locales.mjs';

    // 展示模式
    let Showtype = ref('MAIN')
    let ShowBookID = ref('')

    // 初始化元素
    const fileInput = ref<HTMLInputElement | null>(null);
    const book = ref<any>(null);
    const booksList = ref<any[]>([]);


    // 获取全部Bookid
    const loadBooks = async () => {
        booksList.value = await epubStorage.getAllBookIds();
    };

    // 点击小说事件
    const handleBookClick = (bookid: string) => {
        Showtype.value = 'READER'
        ShowBookID.value = bookid
    };


    // 此下为提交表单的逻辑

    const handleUploadClick = () => {
        fileInput.value?.click();
    };

    onMounted(async () => {
        await loadBooks();
    });

    const handleFileChange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) return;
        
        try {
            // 提交成功
            const epub = new epubStorage();
            const arrayBuffer = await epub.parseEpub(file);
            await epub.storageData(arrayBuffer);
            
            const bookId = epub.getBookId();
            console.log('EPUB 存储成功，ID:', bookId);
            book.value = Epub(arrayBuffer);
            
            await loadBooks();

        } catch (error) {
            console.error('处理 EPUB 失败:', error);
        }
    };
</script>

<script lang="ts">
    export default {
        name:'mainInterface'
    }
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
        right: 5px; 
        bottom: 5px;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-content: flex-start; 
    }
</style>