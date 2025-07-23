<template>
    <div class="bookFrame">
    </div>
</template>

<script lang="ts">
    export default {
        name:'bookViewer'
    }
</script>

<script lang="ts" setup>
    import { defineProps } from 'vue';
    import { ref } from 'vue';
    import Epub from 'epubjs';

    
    defineProps(['bookid'])
</script>


<style scoped>
    .bookFrame{
        width: 100px;
    }
</style>