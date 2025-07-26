index.js:4545  Blocked script execution in 'about:srcdoc' because the document's frame is sandboxed and the 'allow-scripts' permission is not set.

<template>
    <div id="viewer"></div>
</template>

<script setup lang="ts">
    import {defineProps , ref} from 'vue'
    import epubStorage from '../epubStorage.ts';
    import Epub from 'epubjs';

    const props = defineProps(['bookid']);
    const arrayBuffer:ArrayBuffer = (await epubStorage.loadBook(props.bookid) as ArrayBuffer)
    
    const book = Epub(arrayBuffer,{})
    const rendition = book.renderTo('viewer', {
        width: '100%',
        height: '100%'
    });
    rendition.display();
</script>

<script lang="ts">
    export default {
        name:'reader'
    }
</script>

<style scoped>

</style>