<template>
    <div
        style="height: 100%; box-shadow: var(--el-border-color-light) 0px 0px 10px"
    >
        <el-splitter>

            <el-splitter-panel 
                :size="64"
                :min-size="50"
                :max-size="50"
                :resizable="false"
            >
                <div class="demo-panel">
                    <Aside/>
                </div>
            </el-splitter-panel>

            <el-splitter-panel size="250" min="200" max="350">
                <div class="demo-panel">Function</div>
            </el-splitter-panel>

            <el-splitter-panel>
                <div class="demo-panel" style="background-color: rgba(19, 194, 194, 0.050);">
                    <Suspense><mainInterface/></Suspense>
                    
                </div>
            </el-splitter-panel>

            <el-splitter-panel size="0">
                <el-splitter layout="vertical">

                    <el-splitter-panel>
                        <div class="demo-panel">Query</div>
                    </el-splitter-panel>

                    <el-splitter-panel>
                        <div class="demo-panel">Translate</div>
                    </el-splitter-panel>

                </el-splitter>
            </el-splitter-panel>

        </el-splitter>
    </div>
</template>

<script lang="ts">
    import Aside from './components/aside.vue';
    import BookViewer from './components/bookViewer.vue';
    import mainInterface from './components/mainInterface.vue';

    // Fix 'App'Div Height Data
    function refuseScreenSize(){
        (document.getElementById('app') as any).style.height = window.innerHeight + 'px';
    };
    refuseScreenSize();
    window.addEventListener('resize',refuseScreenSize)

    
    export default {
        name:'App',
        components:{
            Aside,
            BookViewer,
            mainInterface
        }
    }
</script>

<style scoped>
    .demo-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }
</style>


<style>
    .el-splitter-bar__dragger-horizontal::before {
        width: 1px !important;  /* 从2px改为1px */
        background-color: var(--el-border-color) !important;
    }

    .el-splitter-bar__dragger-vertical::before {
        height: 1px !important;  /* 从2px改为1px */
        background-color: var(--el-border-color) !important;
    }

    .el-splitter-bar__dragger:hover::before {
        width: 1px !important;
        background-color: var(--el-color-primary) !important;
        opacity: 1 !important;
    }

    .el-splitter-bar__collapse-icon {
        background: var(--el-color-primary) !important;
        border: 1px solid var(--el-color-primary) !important;
        opacity: 0.5 !important;
    }

    .el-splitter-bar__collapse-icon:hover {
        opacity: 1 !important;
    }
</style>