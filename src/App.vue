<template>
    <AsideFrame class="aside" @onclick="handleClick" />
    <div
        style="height: 100%; box-shadow: var(--el-border-color-light) 0px 0px 10px;overflow: hidden;"
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

            <el-splitter-panel v-model:size="panelSize">
                <el-splitter layout="vertical" style="overflow: hidden;">
                    <el-splitter-panel v-if="true">
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
</template>


<script lang="ts" setup>
    import { collapsePart } from '@/stores/collapsePart'
    import { queryContents } from '@/stores/queryContents';
    import { bookOBJ } from './stores/bookOBJ';
    import { ref , watch } from 'vue';

    const size = ref(window.innerHeight)
    const panelSize = ref(0)

    const book = bookOBJ()


    let foldState = ref(true)

    const user = queryContents();
    // watch(() => user.content, (newContent) => {
    //     if(user.show == true){
    //         size.value = 0
    //     if(panelSize.value == 0){
    //         panelSize.value = 350
    //     }}
    //     user.show = false
    // });

    watch(() => book.filled, () => {
        if(book.filled == true){
            size.value = window.innerHeight
        }
        if(panelSize.value == 0){
            panelSize.value = 350
        }
    });
    watch(() => user.show, (newShow) => {
        if(newShow == true){
            size.value = 0
        if(panelSize.value == 0){
            panelSize.value = 350
        }}
        user.show = false
    });
    
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
    import queryFrame from './components/queryFrame.vue';


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
            chatHis,
            queryFrame
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
