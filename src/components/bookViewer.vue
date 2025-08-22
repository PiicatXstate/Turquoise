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
        <!-- 删除按钮 - 悬停时显示 -->
        <button 
            v-if="showDeleteBtn" 
            class="delete-btn" 
            @click.stop="handleDelete"
            aria-label="删除书籍"
        >
            ✖
        </button>
    </div>
</template>

<script lang="ts">
    export default {
        name: 'bookViewer',
    }
</script>

<script lang="ts" setup>
import { defineProps, computed, ref, defineEmits } from 'vue'; // 添加 defineEmits
import { ElMessage, ElMessageBox } from 'element-plus'
import epubStorage from '../utils/epubStorage.ts';

// 👇 定义 emit 事件
const emit = defineEmits(['delete']);

const props = defineProps(['bookid']);

const bookInfo = await epubStorage.getBookInfo(props.bookid || 'mdgxkpvxr9a850k1vsd');
const title = bookInfo.title;
const coverUrl = ref('');
const isHovered = ref(false);
const scale = ref(0.9);
const showDeleteBtn = ref(false);

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
    transition: 'all 0.3s ease',
    position: 'relative'
}));

const handleMouseEnter = () => {
    isHovered.value = true;
    scale.value = 0.85;
    showDeleteBtn.value = true;
};

const handleMouseLeave = () => {
    isHovered.value = false;
    scale.value = 0.9;
    showDeleteBtn.value = false;
};

const handleClick = () => {
    // 书本点击事件由父组件处理
};

// 删除按钮点击处理
const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation(); // 防止触发 click 事件进入阅读器

    ElMessageBox.confirm(
    `确定要删除《${title}》吗？`,
    '提示',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
        await epubStorage.deleteBook(props.bookid);
        emit('delete', props.bookid);
      ElMessage({
        type: 'success',
        message: `《${title}》已被删除。`,
      })
    })
    .catch(() => {
    })
    // const confirmed = window.confirm(`确定要删除《${title}》吗？`);
    // if (!confirmed) return;

    // try {
    //     await epubStorage.deleteBook(props.bookid);
    //     alert(`《${title}》已被删除。`);
    //     // 👇 通知父组件：我删了，把我干掉！
    //     emit('delete', props.bookid);
    // } catch (error) {
    //     console.error('删除书籍失败:', error);
    //     alert(`删除《${title}》时发生错误，请稍后再试。`);
    // }
};
</script>

<style scoped>
    .bookFrame {
        width: 154px;
        height: 219px;
        cursor: pointer;
        border-radius: 4px;
        position: relative; /* 为删除按钮提供定位上下文 */
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
        border-radius: 2px;
        overflow: hidden;
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
        height: 24px;
        line-height: 24px;
    }
    
    /* 删除按钮样式 */
    .delete-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: rgba(255, 69, 58, 0.9);
        color: white;
        border: none;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        opacity: 0.9;
    }
    
    .delete-btn:hover {
        background-color: #ff453a;
        transform: scale(1.1);
        opacity: 1;
    }
    
    .delete-btn:active {
        transform: scale(0.95);
    }
</style>