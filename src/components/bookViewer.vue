<template>
    <div 
        class="bookFrame" 
        :style="frameStyle"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @click="handleClick"
    >
        <div class="cover" :style="coverStyle"></div>
        <p class="title">{{ title }}</p>
    </div>
</template>

<script lang="ts">
    export default {
        name:'bookViewer'
    }
</script>

<script lang="ts" setup>
    import { defineProps, computed, ref } from 'vue';
    import epubStorage from '../utils/epubStorage.ts';

    const props = defineProps(['bookid']);
    const bookInfo = await epubStorage.getBookInfo(props.bookid || 'mdgxkpvxr9a850k1vsd');
    const title = bookInfo.title;
    const coverUrl = ref('');
    const isHovered = ref(false);
    const scale = ref(0.9);
    
    if (bookInfo.cover) {
        coverUrl.value = URL.createObjectURL(bookInfo.cover);
    }

    const coverStyle = computed(() => {
        return coverUrl.value ? {
            'background-image': `url(${coverUrl.value})`,
            'background-size': 'cover',
            'background-position': 'center',
            'background-repeat': 'no-repeat'
        } : {};
    });

    const frameStyle = computed(() => ({
        transform: `scale(${scale.value})`,
        backgroundColor: isHovered.value ? '#f0f0f0' : 'transparent',
        transition: 'all 0.3s ease' 
    }));

    const handleMouseEnter = () => {
        isHovered.value = true;
        scale.value = 0.85; 
    };

    // 鼠标移出事件
    const handleMouseLeave = () => {
        isHovered.value = false;
        scale.value = 0.9;
    };

    // 点击事件（可选）
    const handleClick = () => {
        // console.log('Book clicked:', title);
    };
</script>

<style scoped>
    .bookFrame {
        width: 154px;
        height: 219px;
        cursor: pointer;
        border-radius: 4px;
    }
    .cover {
        width: 141px;
        height: 183px;
        background: white;
        position: absolute;
        left: 6.5px;
        top: 6px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .title {
        position: absolute;
        left: 0;
        right: 0;
        top: 181px;
        text-align: center;
        padding: 0 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 14px;
    }
</style>