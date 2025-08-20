import { defineStore } from 'pinia'

export const queryContents = defineStore('queryContents', {
    state: () => ({
        content: 'No Data' as string,
        show: false
    })
})