<template>
    <div class="frame" v-show="part === 'bookCatalog'">
        <BookFrame />
    </div>
    <div class="frame" v-show="part === 'chatHis'">
        <chatHis />
    </div>
    <div class="frame" v-show="part === 'readerSet'">
        <readerSet />
    </div>
</template>

<script lang="ts">
    export default {
        name: 'collapse'
    };
</script>

<script lang="ts" setup>
    import { ref , watch} from 'vue';
    import BookFrame from './collapse/bookCatalog.vue';
    import chatHis from './collapse/chatHis.vue';
    import readerSet from './collapse/readerSet.vue';
    
    import {collapsePart} from '@/stores/collapsePart'
    const clp = collapsePart()
    let part = ref(clp.part)
    watch(
        () => clp.part,
        (newPart) => {
            part.value = newPart;
        }
    )
    
</script>

<style scoped>
    .frame{
        position: relative;
        height: 100%;
        width: 100%;
        overflow: hidden;
    }
</style>