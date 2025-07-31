<template>
    
    <AsideFrame class="aside" @onclick="handleClick" />
    <div
        style="height: 100%; box-shadow: var(--el-border-color-light) 0px 0px 10px"
    >
        <el-splitter style="width: calc(100% - 64px);position: absolute;left: 64px;">
            <!-- <el-splitter-panel 
                :size="64"
                :resizable='false'
            >
                <div class="demo-panel">
                    <Aside @onclick="handleClick"/>
                </div>
            </el-splitter-panel> -->

            <el-splitter-panel 
                size="250" 
                min="200" 
                max="350" 
                v-if='foldState'
            >

                <div class="demo-panel" style="background-color: rgba(19, 194, 194, 0.030);">
                    <collapse/>
                </div>

            </el-splitter-panel>

            <el-splitter-panel >
                <div class="demo-panel" style="background-color: rgba(19, 194, 194, 0.13);">
                    <Suspense>
                        <mainInterface/>
                    </Suspense>
                </div>
            </el-splitter-panel>

            <el-splitter-panel size="0">
                <el-splitter layout="vertical" style="overflow: hidden;">
                    <el-splitter-panel size="0">
                        <div class="demo-panel">Query</div>
                    </el-splitter-panel>
                    <el-splitter-panel>
                        <div class="demo-panel">
                            <aitrans/>
                        </div>
                    </el-splitter-panel>

                </el-splitter>
            </el-splitter-panel>

        </el-splitter>
    </div>
</template>


<script lang="ts" setup>
    import { ref } from 'vue';
    import {collapsePart} from '@/stores/collapsePart'

    let foldState = ref(true)

    // 显示Part逻辑
    function handleClick(payload:any){
        let part = collapsePart()
        if(payload == part.part && foldState.value){
            foldState.value = !foldState.value
            part.part = ''
        }else if(payload !== part.part && !foldState.value){
            foldState.value = !foldState.value
            part.part = payload
        }else{
            part.part = payload
        }
    }
</script>

<script lang="ts">
    import BookViewer from './components/bookViewer.vue';
    import mainInterface from './components/mainIntfc.vue';
    import AsideFrame from './components/asideFrame.vue';
    import reader from './components/reader.vue';
    import collapse from './components/collapse.vue';
    import bookFrame from './components/collapse/bookCatalog.vue';
    import chatHis from './components/collapse/chatHis.vue';
    import aitrans from './components/aitrans.vue';


    function refuseScreenSize(){
        (document.getElementById('app') as any).style.height = window.innerHeight + 'px';
    };
    refuseScreenSize();
    window.addEventListener('resize',refuseScreenSize)

    export default {
        name:'App',
        components:{
            AsideFrame,
            BookViewer,
            mainInterface,
            reader,
            bookFrame,
            collapse,
            aitrans,
            chatHis
        }
    }

</script>


<style scoped>
    .aside{
        position: absolute;
    }

    .demo-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }
</style>


<style>
    .el-splitter-bar__dragger-horizontal::before {
        width: 1px !important;
        background-color: var(--el-border-color) !important;
    }

    .el-splitter-bar__dragger-vertical::before {
        height: 1px !important;
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