<!-- <template>
    <div id="AsideFrame" class="AsideFrame">
        <el-radio-group v-model="tabPosition" style="margin-bottom: 30px">
            <el-radio-button value="top">top</el-radio-button>
            <el-radio-button value="right">right</el-radio-button>
            <el-radio-button value="bottom">bottom</el-radio-button>
            <el-radio-button value="left">left</el-radio-button>
        </el-radio-group>

        <el-tabs :tab-position="tabPosition" style="height: 200px" class="demo-tabs">
            <el-tab-pane label="User">User</el-tab-pane>
            <el-tab-pane label="Config">Config</el-tab-pane>
            <el-tab-pane label="Role">Role</el-tab-pane>
            <el-tab-pane label="Task">Task</el-tab-pane>
        </el-tabs>
    </div>
</template>

<script lang="ts">
    export default {
        name:'Aside'
    }
</script>

<script lang="ts" setup>
    import { ref } from 'vue'
    import type { TabsInstance } from 'element-plus'

    const tabPosition = ref<TabsInstance['tabPosition']>('left')
</script>

<style>
    .AsideFrame{
        height: 100%;
        width: 50px;
        color: white;
        border-right: 1.5px solid rgb(243, 237, 237)
    }
    .demo-tabs > .el-tabs__content {
        padding: 32px;
        color: #6b778c;
        font-size: 32px;
        font-weight: 600;
    }
    .el-tabs--right .el-tabs__content,
    .el-tabs--left .el-tabs__content {
        height: 100%;
    }
</style> -->



<template>
    <el-menu
        default-active="1"
        class="el-menu-vertical-custom"
        :collapse="isCollapse"
        :collapse-transition="false"
    >
        <el-menu-item index="1" @click="read('bookCatalog')">
            <el-icon><Reading class="custom-icon" /></el-icon>
            <template #title>目录</template>
        </el-menu-item>

        <el-menu-item index="2" @click="read('chatHis')">
            <el-icon><ChatLineSquare class="custom-icon" /></el-icon>
            <template #title>对话记录</template>
        </el-menu-item>

        <el-menu-item index="3" disabled>
            <el-icon><Document class="custom-icon" /></el-icon>
            <template #title>Navigator Three</template>
        </el-menu-item>

        <el-menu-item index="4">
            <el-icon><Setting class="custom-icon" /></el-icon>
            <template #title>Navigator Four</template>
        </el-menu-item>

    </el-menu>
</template>

<script lang="ts">
    export default {
        name:'asideFrame'
    }
</script>

<script lang="ts" setup>
    import { ref } from 'vue'
    import {
        Document,
        Menu as IconMenu,
        Location,
        Reading,
        Search,
        Setting,
        ChatLineSquare,
    } from '@element-plus/icons-vue'

    const isCollapse = ref(true);

    const emit = defineEmits(['onclick'])
    function read(type: string){
        emit('onclick', type)
    }
</script>

<style scoped>
    .el-menu-vertical-custom {
        height: 100%;
        --el-menu-bg-color: #ffffff;
    }

    .el-menu-vertical-custom:not(.el-menu--collapse) {
        width: 220px;
    }

    .el-menu--collapse {
        width: 64px;
    }

    .el-menu-vertical-custom {
        border-right: 1.5px solid rgb(228, 231, 237)
    }

    .custom-icon {
        line-height: 1px;
    }

    .el-menu-item {
        transition: all 0.3s ease;
        color: #565656 !important;
    }

    .el-menu-item.is-active {
        color: #13c2c2 !important;
        background-color: rgba(19, 194, 194, 0.1) !important;
    }

    .el-menu-item:not(.is-disabled):hover {
        color: #13c2c2 !important; /* 悬停青色 */
        background-color: rgba(19, 194, 194, 0.05) !important;
    }

    .el-menu-item.is-disabled {
        opacity: 0.5;
    }

    .el-menu-item.is-active::after {
        content: "";
        position: absolute;
        left: -1px;
        top: 2px;
        bottom: 2px;
        width: 4px;
        background: #13c2c2;
        border-radius: 0 3px 3px 0;
    }

    .el-menu--collapse .el-menu-item.is-active::after {
        width: 3px;
        top: 0;
        bottom: 0;
    }
</style>
