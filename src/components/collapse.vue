<template>
    <div class="frame">
        <BookFrame/>
    </div>
</template>

<script lang="ts">
    export default {
        name: 'collapse'
    };
</script>

<script lang="ts" setup>
    import { ref } from 'vue';
    import BookFrame from './collapse/bookFrame.vue';
</script>

<style scoped>
    .frame{
        position: relative;
        height: 100%;
        width: 100%;
        overflow: hidden;
    }
</style>