import { fa } from 'element-plus/es/locales.mjs'
import { defineStore } from 'pinia'

export const bookOBJ = defineStore('bookOBJ', {
    state: () => ({
        book: undefined as any,
        changeMenu: undefined as any,
        Showtype: 'MAIN',
        bookData: {},
        filled: false
    })
})