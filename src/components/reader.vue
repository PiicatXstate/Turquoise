<template>
</template>

<script setup lang="ts">
    import {defineProps , ref} from 'vue'
    import epubStorage from '../epubStorage.ts';
    import Epub from 'epubjs';

    const props = defineProps(['bookid']);
    const arrayBuffer:ArrayBuffer = (await epubStorage.loadBook(props.bookid) as ArrayBuffer)
    
    const book = Epub(arrayBuffer,{})
</script>

<script lang="ts">
    export default {
        name:'reader'
    }
</script>

<style scoped>

</style>