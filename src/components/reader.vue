<template>
    <div id="viewer" ref="viewer"></div>
</template>

<script setup lang="ts">
    import { defineProps, ref, onMounted , watch} from 'vue';
    import epubStorage from '../epubStorage.ts';
    import Epub from 'epubjs';
    import { bookOBJ } from '@/stores/bookOBJ.ts';

    const props = defineProps(['bookid']);
    const viewer = ref<HTMLElement | null>(null);

    onMounted(async () => {
        const arrayBuffer: ArrayBuffer = (await epubStorage.loadBook(props.bookid) as ArrayBuffer);
        const book = Epub(arrayBuffer);

        const rendition = book.renderTo(viewer.value as HTMLElement, {
            width: '100%',
            height: window.innerHeight + 'px',
            view: 'iframe',
            allowScriptedContent: true
        });
        rendition.display(undefined);



        book.ready.then(function(){
            let keyListener = function(e: KeyboardEvent) {
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'l') {
                    rendition.next()
                } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'h') {
                    rendition.prev();
                } else if (e.key === 'Escape') {
                    console.log('Exit reading mode');
                }
            };
            rendition.on("keyup", keyListener);
            document.addEventListener("keyup", keyListener, false);
        })

        // @ts-ignore
        rendition.on('rendered', (section) => {
            // 咳咳，等会在写
        });

        book.loaded.navigation.then(function(toc){
            const user = bookOBJ() 
            user.book = book; 
        });
        const user = bookOBJ() 
        watch(() => user.changeMenu, (Book) => {
            if(Book){
                rendition.display(Book);
            }
        });


    });

</script>

<script lang="ts">
    export default {
        name:'reader'
    }
</script>

<style scoped>

</style>