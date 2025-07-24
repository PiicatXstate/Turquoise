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
        <div>
            <img src="" id="cover-image">
            <BookViewer bookid="mdgxkpvxr9a850k1vsd"/>
        </div>
    </div>
</template>

<script lang="ts">
    export default {
        name:'mainInterface'
    }
</script>

<script setup lang="ts">
    import { ref } from 'vue';
    import Epub from 'epubjs';
    import epubStorage from '../epubStorage.ts';

    const fileInput = ref<HTMLInputElement | null>(null);
    const book = ref<any>(null);

    const handleUploadClick = () => {
        fileInput.value?.click();
    };

    // try {
    //     const bookInfo = await epubStorage.getBookInfo('mdgxkpvxr9a850k1vsd');
    //     console.log('书名:', bookInfo.title);
        
    //     if (bookInfo.cover) {
    //         // 创建封面图片的URL
    //         const coverUrl = URL.createObjectURL(bookInfo.cover);
    //         console.log('封面URL:', coverUrl);
            
    //     }
    // } catch (error) {
    //     console.error('获取书籍信息出错:', error);
    // }

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
</style>