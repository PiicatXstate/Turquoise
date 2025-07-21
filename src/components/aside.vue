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
        default-active="2"
        class="el-menu-vertical-demo"
        :collapse="isCollapse"
        @open="handleOpen"
        @close="handleClose"
        :collapse-transition="false"
    >
        <el-menu-item index="1">
            <el-icon><location /></el-icon>
            <template #title>Navigator One</template>
        </el-menu-item>
        
        <el-menu-item index="2">
            <el-icon><icon-menu /></el-icon>
            <template #title>Navigator Two</template>
        </el-menu-item>

        <el-menu-item index="3" disabled>
            <el-icon><document /></el-icon>
            <template #title>Navigator Three</template>
        </el-menu-item>

        <el-menu-item index="4">
            <el-icon><setting /></el-icon>
            <template #title>Navigator Four</template>
        </el-menu-item>
    </el-menu>
</template>

<script lang="ts" setup>
    import { ref } from 'vue'
    import {
        Document,
        Menu as IconMenu,
        Location,
        Setting,
    } from '@element-plus/icons-vue'

    const isCollapse = ref(true)
    const handleOpen = (key: string, keyPath: string[]) => {
        console.log(key, keyPath)
    }
    const handleClose = (key: string, keyPath: string[]) => {
        console.log(key, keyPath)
    }
</script>

<style scoped>
    .el-menu-item.is-active::after {
        content: "";
        position: absolute;
        left: 0px;
        top: 2px;
        bottom: 2px;
        width: 3px;
        background: var(--el-color-primary);
    }
</style>
