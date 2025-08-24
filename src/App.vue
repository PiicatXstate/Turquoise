<template>
    <AsideFrame class="aside" :class="{ 'mobile-hidden': isMobile && !showMobileAside }" @onclick="handleClick" />
    <div class="main-container">
        <el-splitter 
            class="main-splitter"
            :style="splitterStyle"
        >
            <!-- 左侧折叠面板 -->
            <el-splitter-panel 
                :size="250" 
                min="200" 
                max="350" 
                v-if="showLeftPanel"
            >
                <div class="demo-panel">
                    <collapse/>
                </div>
            </el-splitter-panel>

            <!-- 主内容区 -->
            <el-splitter-panel>
                <div class="demo-panel">
                    <Suspense>
                        <mainInterface/>
                    </Suspense>
                </div>
            </el-splitter-panel>

            <!-- 右侧查询面板 -->
            <el-splitter-panel 
                v-if="showRightPanel"
                v-model:size="panelSize"
                :min="0"
                :max="maxRightPanelSize"
            >
                <el-splitter layout="vertical" style="overflow: hidden;">
                    <el-splitter-panel v-if="user.show">
                        <div class="demo-panel">
                            <queryFrame/>
                        </div>
                    </el-splitter-panel>
                    <el-splitter-panel v-model:size="size">
                        <div class="demo-panel">
                            <aitrans/>
                        </div>
                    </el-splitter-panel>
                </el-splitter>
            </el-splitter-panel>
        </el-splitter>
    </div>

    <!-- 移动端菜单按钮 -->
    <div v-if="isMobile" class="mobile-controls">
        <el-button 
            type="primary" 
            circle
            class="mobile-menu-btn"
            @click="toggleMobileAside"
        >
            <el-icon><Menu /></el-icon>
        </el-button>
        
        <el-button 
            v-if="user.show" 
            type="success" 
            circle
            class="mobile-query-btn"
            @click="toggleRightPanel"
        >
            <el-icon><Search /></el-icon>
        </el-button>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { Menu, Search } from '@element-plus/icons-vue';
import { collapsePart } from '@/stores/collapsePart';
import { queryContents } from '@/stores/queryContents';
import { bookOBJ } from './stores/bookOBJ';

// 响应式变量
const size = ref(window.innerHeight);
const panelSize = ref(0);
const isMobile = ref(false);
const isTablet = ref(false); // 新增平板识别
const showMobileAside = ref(false);
const user = queryContents();
const book = bookOBJ();
const foldState = ref(true);

// 新增：响应式窗口尺寸
const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);

// 计算属性
const splitterStyle = computed(() => {
    if (isMobile.value) {
        return {
            width: '100%',
            left: '0'
        };
    }
    return {
        width: 'calc(100% - 64px)',
        left: '64px'
    };
});

const showLeftPanel = computed(() => {
    if (isMobile.value) {
        return showMobileAside.value;
    }
    return foldState.value;
});

const showRightPanel = computed(() => {
    if (isMobile.value) {
        return panelSize.value > 0;
    }
    // 平板端默认关闭右侧面板
    if (isTablet.value) {
        return panelSize.value > 0;
    }
    return true;
});

// 新增：动态计算最大面板尺寸
const maxLeftPanelSize = computed(() => {
    if (isMobile.value) return windowWidth.value * 0.8;
    if (isTablet.value) return windowWidth.value * 0.25; // 平板左侧最大25%
    return 350; // 桌面端
});

const maxRightPanelSize = computed(() => {
    if (isMobile.value) return windowWidth.value * 0.8;
    if (isTablet.value) return windowWidth.value * 0.35; // 平板右侧最大35%
    return 350; // 桌面端
});

// 设备检测
const checkDevice = () => {
    const width = window.innerWidth;
    isMobile.value = width < 768;
    isTablet.value = width >= 768 && width < 1024; // 新增平板检测
    windowWidth.value = width;
    windowHeight.value = window.innerHeight;
};

// 事件处理
const toggleMobileAside = () => {
    showMobileAside.value = !showMobileAside.value;
    if (showMobileAside.value && isTablet.value) {
        panelSize.value = 0; // 平板端同时关闭右侧
    }
};

const toggleRightPanel = () => {
    if (isTablet.value) {
        panelSize.value = panelSize.value > 0 ? 0 : Math.min(300, windowWidth.value * 0.35);
    } else {
        panelSize.value = panelSize.value > 0 ? 0 : 350;
    }
};

const handleClick = (payload: any) => {
    if (isMobile.value || isTablet.value) {
        showMobileAside.value = !showMobileAside.value;
        return;
    }

    const part = collapsePart();
    if (payload === part.part && foldState.value) {
        foldState.value = !foldState.value;
        part.part = '';
    } else if (payload !== part.part && !foldState.value) {
        foldState.value = !foldState.value;
        part.part = payload;
    } else {
        part.part = payload;
    }
};

// 监听器
watch(() => user.show, (newShow) => {
    if (newShow && (isMobile.value || isTablet.value)) {
        panelSize.value = Math.min(300, windowWidth.value * 0.35);
    } else if (newShow && !isMobile.value && !isTablet.value) {
        panelSize.value = 350;
    }
    user.show = false;
});

watch(() => book.filled, () => {
    if (book.filled) {
        size.value = windowHeight.value;
    }
    if (panelSize.value === 0 && !isMobile.value && !isTablet.value) {
        panelSize.value = 350;
    }
});

// 生命周期
onMounted(() => {
    checkDevice();
    window.addEventListener('resize', checkDevice);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkDevice);
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';
import AsideFrame from './components/asideFrame.vue';
import collapse from './components/collapse.vue';
import mainInterface from './components/mainIntfc.vue';
import queryFrame from './components/queryFrame.vue';
import aitrans from './components/aitrans.vue';

export default defineComponent({
    name: 'App',
    components: {
        AsideFrame,
        collapse,
        mainInterface,
        queryFrame,
        aitrans,
    },
});
</script>

<style scoped>
.aside {
    position: absolute;
    z-index: 1000;
}

.mobile-hidden {
    display: none;
}

.main-container {
    height: 100%;
    width: 100%;
    box-shadow: var(--el-border-color-light) 0px 0px 10px;
    overflow: hidden;
}

.main-splitter {
    position: absolute;
    height: 100%;
    transition: all 0.3s ease;
}

.demo-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    overflow: auto;
}

/* 移动端控制按钮 */
.mobile-controls {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 1000;
}

.mobile-menu-btn {
    display: none;
}

.mobile-query-btn {
    display: none;
}

/* 响应式样式 */
@media (max-width: 767px) {
    .mobile-menu-btn,
    .mobile-query-btn {
        display: flex;
    }
    
    .aside {
        width: 100% !important;
        height: 100% !important;
        top: 0 !important;
        left: 0 !important;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }
    
    .aside.mobile-hidden {
        transform: translateX(-100%);
    }
    
    .aside:not(.mobile-hidden) {
        transform: translateX(0);
    }
    
    /* 隐藏分割线 */
    .el-splitter-bar {
        display: none !important;
    }
}
</style>

<style>
/* 保持原有分割线样式 */
.el-splitter-bar__dragger-horizontal::before {
    width: 1px !important;
    background-color: var(--el-border-color) !important;
}

.el-splitter-bar__dragger-vertical::before {
    height: 1px !important;
    background-color: var(--el-border-color) !important;
}

.el-splitter-bar__dragger:hover::before {
    background-color: var(--el-color-primary) !important;
    opacity: 1 !important;
}
</style>