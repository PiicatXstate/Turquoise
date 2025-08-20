import { defineStore } from 'pinia'

export const bookOBJ = defineStore('bookOBJ', {
    state: () => ({
        book: undefined as any,
        changeMenu: undefined as any,
        Showtype: 'MAIN'
    })
})