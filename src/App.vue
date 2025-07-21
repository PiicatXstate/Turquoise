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
                <div class="demo-panel">Main Interface</div>
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

    // Fix 'App'Div Height Data
    function refuseScreenSize(){
        (document.getElementById('app') as any).style.height = window.innerHeight + 'px';
    };
    refuseScreenSize();
    window.addEventListener('resize',refuseScreenSize)

    
    export default {
        name:'App',
        components:{
            Aside
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


