import { defineStore } from 'pinia'

export const queryContents = defineStore('queryContents', {
    state: () => ({
        content: '<p style="">什么都木有哦 ~</p>' as string,
        show: false
    })
})