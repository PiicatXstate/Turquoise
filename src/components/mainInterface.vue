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
            <BookViewer bookid="9ll5nynny3nvvtr2hy5kcb"/>
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

    const fileInput = ref<HTMLInputElement | null>(null);
    const book = ref<any>(null); // 存储 epub 实例

    const handleUploadClick = () => {
        fileInput.value?.click();
    };

    const handleFileChange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            book.value = Epub(arrayBuffer);

            console.log('EPUB 加载成功', book.value);

            // 你可以在这里调用 book.value 的方法
            // 例如：book.value.ready.then(() => { ... })

        } catch (error) {
            console.error('加载 EPUB 失败:', error);
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