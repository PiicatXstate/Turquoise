import { defineStore } from 'pinia'

export const collapsePart = defineStore('collapsePart', {
    state: () => ({
        part: 'bookCatalog' as string
    })
})