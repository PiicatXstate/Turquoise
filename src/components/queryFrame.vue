<template>
    <div v-html="content" class="queryFrame"></div>
</template>

<script lang="ts" setup>
    import { queryContents } from '@/stores/queryContents';
    import { ref , watch } from 'vue';
    const user = queryContents();
    let content = ref(user.content);
    watch(() => user.content, (newContent) => {
        content.value = newContent
    });
</script>

<script lang="ts">
    export default {
        name: 'queryFrame'
    }
</script>

<style>
    .queryFrame {
        width: 100%;
        height: 100%;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #334155;
        overflow-y: auto; /* 添加这行使元素可滚动 */
        scrollbar-width: thin; /* 支持Firefox */
        scrollbar-color: rgb(157, 220, 227) rgb(239, 239, 239); /* 支持Firefox */
    }

    /* 确保这些样式在.queryFrame之后定义，提高特异性 */
    .queryFrame::-webkit-scrollbar {
        width: 1px !important;
    }

    .queryFrame::-webkit-scrollbar-track {
        background: rgb(239, 239, 239);
        margin: 4px 0; /* 添加上下边距 */
    }

    .queryFrame::-webkit-scrollbar-thumb {
        background: rgb(157, 220, 227);
    }

    .queryFrame::-webkit-scrollbar-thumb:hover {
        background: rgb(13, 151, 205);
    }
    /* 标题区块 - 现代卡片样式 */
    .nr-box {
        border: 1px solid #e8e8e8;
        overflow: hidden;
        background: #fff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        transition: box-shadow 0.2s ease;
    }

    .nr-box:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .nr-box-header {
        background: #f8fafc;
        padding: 14px 20px;
        border-bottom: 1px solid #f0f0f0;
    }

    /* 标签样式 */
    .zi-b-container {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
    }

    .z_zb {
        font-size: 11px;
        padding: 2px 6px;
        color: #fff;
        font-weight: 600;
        letter-spacing: 0.3px;
    }

    .cc1 { background-color: #3b82f6; } /* 常用字 */
    .tc1 { background-color: #10b981; } /* 通用字 */
    .ty  { background-color: #f59e0b; } /* 标准字体 */

    /* 主标题区域 */
    .h2_entry {
        display: flex;
        align-items: center;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        line-height: 1.4;
    }

    .orth {
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
        margin-right: 8px;
    }

    .dictname {
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
    }

    /* 内容区域 */
    .content {
        padding: 16px 20px;
        line-height: 1.6;
        font-size: 14px;
    }

    /* 拼音和发音 */
    .dicpy {
        font-size: 15px;
        color: #2563eb;
        font-weight: 500;
        letter-spacing: 0.3px;
    }

    .audio_play_button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: #f1f5f9;
        margin-left: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: none;
    }

    .audio_play_button:hover {
        background: #e2e8f0;
        transform: scale(1.05);
    }

    .audio_play_button::before {
        content: "▶";
        font-size: 10px;
        color: #475569;
    }

    /* 分隔线 */
    .dichr {
        border: 0;
        border-top: 1px solid #f1f5f9;
        margin: 14px 0;
    }

    /* ========== 关键改进：区分注释和释义 ========== */
    
    /* 定义列表 */
    .definitions ol {
        padding-left: 18px;
        margin: 14px 0;
    }

    .definitions ol li {
        margin-bottom: 8px;
        font-size: 14px;
        position: relative;
    }

    /* 释义 (主要解释) */
    .definitions ol li {
        color: #1e293b; /* 深色主文本 */
    }

    /* 注释 (补充说明) */
    .definitions ol li .note {
        color: #64748b; /* 浅灰色 */
        font-size: 13px;
        margin-top: 4px;
        display: block;
        font-style: italic;
    }

    .definitions ol li::marker {
        color: #3b82f6;
        font-weight: 600;
    }

    /* 翻译区块 */
    .enbox {
        background: #f8fafc;
        border-left: 3px solid #3b82f6;
        padding: 12px 16px;
        margin: 14px 0;
        font-size: 13px;
        display: none;
    }

    /* 翻译标题 */
    .z_ts2 {
        font-weight: 600;
        color: #1e293b;
        display: inline-block;
        min-width: 40px;
        display: none;
    }

    /* 翻译内容 */
    .enbox div {
        color: #475569; /* 中灰色翻译文本 */
    }

    /* ========== 词性和例句区域 ========== */
    
    /* 词性标签 */
    .xx_cx {
        display: inline-block;
        background: #eff6ff;
        color: #1d4ed8;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin: 6px 0;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* 例句编号 */
    .cino {
        font-weight: 600;
        color: #dc2626;
        margin-top: 8px;
        font-size: 13px;
    }

    /* 例句原文 (突出显示) */
    .diczx1 {
        color: #1e293b;
        margin: 5px 0;
        font-size: 14px;
        font-weight: 500;
    }

    /* 例句重点词 */
    .diczx2 {
        color: #2563eb;
        font-weight: 600;
    }

    /* 例句翻译 (次要文本) */
    .encs {
        font-size: 13px;
        color: #64748b;
        font-style: normal; /* 取消斜体更易读 */
        line-height: 1.5;
        margin-top: 4px;
        display: block;
        display: none;
    }

    /* 补充说明 (浅色) */
    .smcs {
        color: #64748b;
        font-size: 13px;
        line-height: 1.5;
    }

    /* 详细解释 (缩进样式) */
    .diczx3 {
        font-size: 13px;
        color: #475569;
        margin: 6px 0 6px 12px;
        padding-left: 10px;
        border-left: 2px solid #e2e8f0;
        line-height: 1.5;
    }

    /* 常用词组 */
    .cit.type-xxjs {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 12px;
    }

    .crefe a {
        text-decoration: none;
        color: #2563eb;
        font-size: 13px;
        padding: 4px 10px;
        border-radius: 6px;
        transition: all 0.2s;
        background: #f1f5f9;
        font-weight: 500;
    }

    .crefe a:hover {
        background: #3b82f6;
        color: #fff;
        transform: translateY(-1px);
    }

    /* 版权信息 */
    .copyright {
        text-align: right;
        font-size: 11px;
        color: #94a3b8;
        margin-top: 16px;
        font-style: italic;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
        .nr-box {
            border-radius: 10px;
            margin-bottom: 16px;
        }
        
        .h2_entry {
            font-size: 16px;
        }
        
        .orth {
            font-size: 20px;
        }
        
        .content {
            padding: 14px 16px;
        }
        
        .dicpy {
            font-size: 14px;
        }
        
        .definitions ol li {
            font-size: 13px;
        }
    }

    /* 动画效果 */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .nr-box {
        animation: fadeIn 0.3s ease-out forwards;
    }
    /* ========== 全局容器 ========== */

/* WebKit 滚动条样式 */
.queryFrame::-webkit-scrollbar {
    width: 6px;
}

.queryFrame::-webkit-scrollbar-track {
    background: rgb(239, 239, 239);
    border-radius: 2px;
    margin: 4px 0;
}

.queryFrame::-webkit-scrollbar-thumb {
    background: rgb(157, 220, 227);
    border-radius: 3px;
}

.queryFrame::-webkit-scrollbar-thumb:hover {
    background: rgb(13, 151, 205);
}

/* ========== 主词条容器 .jnr ========== */
.queryFrame .jnr {
    max-width: 768px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #e8e8e8;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s ease;
    padding: 20px;
    line-height: 1.6;
}

.queryFrame .jnr:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* ========== 词头：汉字 + 拼音 ========== */
.queryFrame .jnr > p:first-of-type {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 14px;
}

.queryFrame .jnr strong {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin-right: 8px;
}

.queryFrame .jnr .dicpy {
    font-size: 15px;
    color: #2563eb;
    font-weight: 500;
    letter-spacing: 0.3px;
}

/* ========== 释义条目 ========== */
.queryFrame .jnr p {
    margin: 8px 0;
    font-size: 14px;
    color: #1e293b;
}

.queryFrame .jnr p span.cino {
    display: inline-block;
    min-width: 20px;
    font-weight: 600;
    color: #dc2626;
    margin-right: 6px;
}

/* ========== 例句区块 ========== */
.queryFrame .jnr p.diczx1,
.queryFrame .jnr p .diczx1 {
    margin: 14px 0 6px 8px;
    padding-left: 12px;
    border-left: 2px solid #e2e8f0;
    color: #1e293b;
    font-weight: 500;
}

.queryFrame .jnr .diczx2 {
    color: #2563eb;
    font-weight: 600;
}

.queryFrame .jnr .smcs {
    color: #64748b;
    font-size: 13px;
    font-style: italic;
    margin-top: 4px;
    display: block;
}

/* ========== 动画 ========== */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

.queryFrame .jnr {
    animation: fadeIn 0.3s ease-out forwards;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
    .queryFrame .jnr {
        padding: 16px;
        border-radius: 10px;
        margin: 0 16px;
    }

    .queryFrame .jnr > p:first-of-type {
        font-size: 16px;
        flex-wrap: wrap;
    }

    .queryFrame .jnr strong {
        font-size: 20px;
    }

    .queryFrame .jnr .dicpy {
        font-size: 14px;
    }

    .queryFrame .jnr p {
        font-size: 13px;
    }

    .queryFrame .jnr p.diczx1,
    .queryFrame .jnr .smcs {
        font-size: 12px;
    }
}
</style>