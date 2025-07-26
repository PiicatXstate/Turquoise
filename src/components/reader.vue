<template>
  <div class="epub-container">
    <select id="toc" ref="tocSelect"></select>
    <div id="viewer" class="spreads"></div>
    <a id="prev" href="#prev" class="arrow" @click.prevent="prevPage">‹</a>
    <a id="next" href="#next" class="arrow" @click.prevent="nextPage">›</a>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import ePub, { type Book, type Rendition } from 'epubjs'
import type { NavItem } from 'epubjs/types/navigation'
import epubStorage from '../epubStorage.ts'

// 类型定义扩展
declare module 'epubjs' {
  interface Book {
    package?: {
      metadata?: {
        direction?: 'rtl' | 'ltr'
      }
    }
    navigation: {
      get: (href: string) => NavItem | undefined
    }
  }
}

const props = defineProps<{
  bookid: string
}>()

const tocSelect = ref<HTMLSelectElement | null>(null)
let book: Book | null = null
let rendition: Rendition | null = null
let keyListener: ((e: KeyboardEvent) => void) | null = null

const loadBook = async () => {
  try {
    const arrayBuffer = await epubStorage.loadBook(props.bookid)
    if (!arrayBuffer) throw new Error('Failed to load book data')

    book = ePub(arrayBuffer)
    rendition = book.renderTo("viewer", {
      width: "100%",
      height: "736",
      spread: "always"
    })

    await rendition.display()

    // 初始化目录
    const navigation = await book.loaded.navigation
    if (tocSelect.value) {
      navigation.forEach((chapter: NavItem) => {
        const option = document.createElement("option")
        option.textContent = chapter.label
        option.setAttribute("ref", chapter.href)
        tocSelect.value?.appendChild(option)
      })

      tocSelect.value.onchange = () => {
        const select = tocSelect.value as HTMLSelectElement
        const url = select.options[select.selectedIndex].getAttribute("ref")
        if (url) rendition?.display(url)
      }
    }

    // 键盘事件监听
    keyListener = (e: KeyboardEvent) => {
      if (!book || !rendition) return
      
      // Left Key
      if (e.key === 'ArrowLeft') {
        book.package?.metadata?.direction === "rtl" ? rendition.next() : rendition.prev()
      }
      // Right Key
      if (e.key === 'ArrowRight') {
        book.package?.metadata?.direction === "rtl" ? rendition.prev() : rendition.next()
      }
    }

    rendition.on("keyup", keyListener)
    document.addEventListener("keyup", keyListener)

    // 渲染完成事件
    rendition.on("rendered", (section: { href: string }) => {
      if (!book || !tocSelect.value) return
      
      const current = book.navigation.get(section.href)
      if (!current) return

      const options = tocSelect.value.querySelectorAll("option")
      options.forEach(option => {
        option.removeAttribute("selected")
        if (option.getAttribute("ref") === current.href) {
          option.setAttribute("selected", "")
        }
      })
    })

    // 页面位置变化事件
    rendition.on("relocated", (location: { atStart: boolean, atEnd: boolean }) => {
      const next = document.getElementById("next")
      const prev = document.getElementById("prev")
      if (!next || !prev || !book) return

      const isRtl = book.package?.metadata?.direction === "rtl"
      next.style.visibility = location.atEnd ? "hidden" : "visible"
      prev.style.visibility = location.atStart ? "hidden" : "visible"
    })

    // 布局变化事件
    rendition.on("layout", (layout: { spread: boolean }) => {
      const viewer = document.getElementById("viewer")
      if (!viewer) return

      viewer.classList.toggle('single', !layout.spread)
    })

  } catch (error) {
    console.error("Error loading book:", error)
  }
}

const prevPage = () => {
  if (!book || !rendition) return
  book.package?.metadata?.direction === "rtl" ? rendition.next() : rendition.prev()
}

const nextPage = () => {
  if (!book || !rendition) return
  book.package?.metadata?.direction === "rtl" ? rendition.prev() : rendition.next()
}

onMounted(() => {
  loadBook()
})

onBeforeUnmount(() => {
  if (keyListener) {
    document.removeEventListener("keyup", keyListener)
  }
  if (book) {
    book.destroy()
  }
})
</script>

<script lang="ts">
export default {
  name: 'EpubReader'
}
</script>

<style scoped>
.epub-container {
  position: relative;
  width: 100%;
  height: 100%;
}

#viewer {
  margin: 0 auto;
  overflow: hidden;
  background: white;
}

#toc {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  padding: 5px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-radius: 4px;
}

.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40px;
  color: #333;
  text-decoration: none;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  z-index: 100;
}

#prev {
  left: 20px;
}

#next {
  right: 20px;
}

.spreads {
  display: flex;
  justify-content: center;
}

.single {
  justify-content: flex-start;
}
</style>