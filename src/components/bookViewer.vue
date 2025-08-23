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
    name: 'BookViewer',
};
</script>

<script lang="ts" setup>
import { ref, onMounted, computed, defineProps, defineEmits } from 'vue';
import type { CSSProperties } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import epubStorage from '../utils/epubStorage.ts';

// 👇 定义 emit 事件
const emit = defineEmits(['delete']);

// 👇 定义 props
const props = defineProps<{
    bookid: string;
}>();

// 👇 书籍信息接口
interface BookInfo {
    title: string;
    cover?: Blob | null;
    [key: string]: any; // 其他可选字段
}

// 👇 响应式数据
const bookInfo = ref<BookInfo | null>(null);
const title = ref<string>('');
const coverUrl = ref<string>('');
const isHovered = ref(false);
const scale = ref(0.9);
const showDeleteBtn = ref(false);

// 封面样式
const coverStyle = computed<CSSProperties>(() => {
    return coverUrl.value
        ? {
              backgroundImage: `url(${coverUrl.value})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
          }
        : {};
});

// 书框样式
const frameStyle = computed<CSSProperties>(() => ({
    transform: `scale(${scale.value})`,
    backgroundColor: isHovered.value ? '#f0f0f0' : 'transparent',
    transition: 'all 0.3s ease',
    position: 'relative',
}));

// 鼠标进入
const handleMouseEnter = () => {
    isHovered.value = true;
    scale.value = 0.85;
    showDeleteBtn.value = true;
};

// 鼠标离开
const handleMouseLeave = () => {
    isHovered.value = false;
    scale.value = 0.9;
    showDeleteBtn.value = false;
};

// 点击书本
const handleClick = () => {
    // 由父组件处理
};

// 删除书籍
const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation();

    if (!bookInfo.value) return;

    try {
        await ElMessageBox.confirm(
            `确定要删除《${bookInfo.value.title}》吗？`,
            '提示',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        await epubStorage.deleteBook(props.bookid);
        emit('delete', props.bookid);
        ElMessage.success(`《${bookInfo.value.title}》已被删除。`);
    } catch (error) {
        // 用户取消或出错，静默处理
    }
};

// ✅ 在 onMounted 中加载数据
onMounted(async () => {
    try {
        const info = await epubStorage.getBookInfo(props.bookid || 'mdgxkpvxr9a850k1vsd');
        if (!info) return;

        bookInfo.value = info;
        title.value = info.title;

        if (info.cover) {
            coverUrl.value = URL.createObjectURL(info.cover);
        }
    } catch (error) {
        console.error('加载书籍信息失败:', error);
    }
});
</script>

<style scoped>
.bookFrame {
    width: 154px;
    height: 219px;
    cursor: pointer;
    border-radius: 4px;
    position: relative;
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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