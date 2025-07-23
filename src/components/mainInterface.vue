<template>
    <div class="frame">
        <h1 class="title">藏书楼阁</h1>
        <button class="upload">导入</button>
        <input 
            type="file" 
            ref="fileInput" 
            style="display: none" 
            accept=".epub" 
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

<script lang="ts" setup>
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
