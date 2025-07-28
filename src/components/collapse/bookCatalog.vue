<template>
    <h1 class="title"> 目录</h1>
        <el-tree 
            class="tree"
            :data="data"
            :props="defaultProps"
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
        />
</template>

<script lang="ts" setup>
    import { bookOBJ } from '@/stores/bookOBJ.ts';
    import { ref, watch } from 'vue'; // 引入 ref


    /**
     * 将对象中的所有 'subitems' 属性名改为 'children'
     */
    function renameSubitemsToChildren<T>(obj: T): T {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => renameSubitemsToChildren(item)) as unknown as T;
        }

        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const newKey = key === 'subitems' ? 'children' : key;
                newObj[newKey] = renameSubitemsToChildren((obj as any)[key]);
            }
        }

        return newObj;
    }

    interface Tree {
        label: string
        subitems?: Tree[]
        href?: string
    }
    const data = ref<Tree[]>([]);


    const user = bookOBJ() 
    if(user.book){
            // @ts-ignore
            let book = user.book.loaded.navigation;
            // @ts-ignore
            book.then(function(toc){
                data.value = [];
                // @ts-ignore
                toc.forEach(function(chapter) {  
                    data.value.push(renameSubitemsToChildren(chapter))
                })
            });
    }

    watch(() => user.book, (Book) => {
        if(Book){
            // @ts-ignore
            let book = Book.loaded.navigation;
            // @ts-ignore
            book.then(function(toc){
                data.value = [];
                // @ts-ignore
                toc.forEach(function(chapter) {  
                    data.value.push(renameSubitemsToChildren(chapter))
                })
            });
        }
    });

    const handleNodeClick = (data: Tree) => {
        const user = bookOBJ() 
        user.changeMenu = data.href; 
    }

    const defaultProps = {
        subitems: 'subitems',
        label: 'label',
    }
</script>

<script lang="ts">
    export default {
        name: 'bookFrame'
    };
</script>

<style scoped>
    .title{
        font-size: 19px;
        position: absolute;
        left: 21px;
        top: 0px;
        color: rgb(2, 52, 72);
    }
    .tree {
        position: absolute;
        top: 10px;
        left: -5%;
        width: 111%;
        height: calc(100% - 30px);
        overflow: auto;
        background-color: rgba(0, 0, 0, 0);
        scale: 0.9;
    }
    .tree::-webkit-scrollbar {
        width: 2px;
    }
    .tree::-webkit-scrollbar-track {
        background: rgb(239, 239, 239);
        border-radius: 2px;
    }
    .tree::-webkit-scrollbar-thumb {
        background: rgb(157, 220, 227);
        border-radius: 10px;
    }
    .tree::-webkit-scrollbar-thumb:hover {
        background: rgb(13, 151, 205);
    }
</style>

<style>
</style>