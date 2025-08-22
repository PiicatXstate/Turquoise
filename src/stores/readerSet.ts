import { defineStore } from 'pinia'

export const readerSet = defineStore('readerSet',{
    state: () => ({
        'font' : 'HarmonyOS Sans SC',
        'fontSize' : 20
    })
})