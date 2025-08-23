<template>
    <McLayout class="container">
        <!-- 启动页 - 当没有消息时显示 -->
        <McLayoutContent
            v-if="showStartPage"
            class="content-main start-page-content">
            <McIntroduction
                :title="'Turquoise AI'"
                :subTitle="'说文解字，一语道破'"
                :description="description">
            </McIntroduction>

            <McPrompt
                :list="introPrompt.list"
                :direction="introPrompt.direction"
                class="intro-prompt"
                @itemClick="onSubmit($event.label)">
            </McPrompt>
        </McLayoutContent>

        <!-- 聊天内容 -->
        <McLayoutContent class="content-main" v-else>
            <div class="message-container">
                <template v-for="(msg, idx) in currentMessages" :key="idx">
                    <McBubble
                        v-if="msg.from === 'user'"
                        :content="msg.content"
                        :align="'right'">
                    </McBubble>

                    <!-- AI回复消息 -->
                    <McBubble v-else>
                        <div
                            v-if="msg.reasoningContent"
                            class="think-toggle-btn"
                            @click="toggleThink(msg.id)">
                            <i class="icon-point"></i>
                            <span>{{ thinkBtnText(msg) }}</span>
                            <i :class="btnIcon(msg)"></i>
                        </div>

                        <!-- 显示思考内容 -->
                        <div
                            v-if="msg.showThink && msg.reasoningContent"
                            class="think-content">
                            {{ msg.reasoningContent }}
                        </div>

                        <!-- 显示正常内容 - 支持流式输出 -->
                        <McMarkdownCard :content="msg.content" />
                    </McBubble>
                </template>

                <!-- 加载指示器 -->
                <div v-if="isLoading" class="loading-indicator">
                    <div class="loader"></div>
                    <span>思考中...</span>
                    <d-button
                        variant="solid"
                        @click="stopGeneration"
                        size="sm"
                        style="margin-left: 10px;"
                        >停止</d-button
                    >
                </div>
            </div>
        </McLayoutContent>

        <div
            class="shortcut"
            style="display: flex; align-items: center; gap: 8px">
            <McPrompt
                v-if="!showStartPage && !isLoading"
                :list="simplePrompt"
                :direction="'horizontal'"
                style="flex: 1"
                @itemClick="onSubmit($event.label)"></McPrompt>
        </div>

        <McLayoutSender>
            <McInput
                :value="inputValue"
                :maxLength="2000"
                :disabled="isLoading"
                @change="(e:any) => (inputValue = e)"
                @submit="onSubmit">
                <template #extra>
                    <div class="input-foot-wrapper"></div>
                </template>
            </McInput>
        </McLayoutSender>
    </McLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useChatStore } from '@/stores/chatStore';
import { bookOBJ } from '@/stores/bookOBJ';

const bookStore = bookOBJ();

watch(
  () => bookStore.filled,
  (fillType) => {
    if (fillType) {
      const bdata = bookStore.bookData;
      inputValue.value = bdata
      // @ts-ignore
        ? ` ‘${bdata.selectedText}’这一句在 \n ‘${bdata.contextBefore + bdata.selectedText + bdata.contextAfter}’\n 中是什么意思`
        : '';
      bookStore.filled = false;
    }
  }
);

watch(
  () => bookStore.bookData,
  (newData) => {
    prompt = `请基于以下书本内容，回答用户的问题。如果无法从书本内容中找到答案，请礼貌地告知用户无法回答。\n\n书本内容：\n${JSON.stringify(
      bookStore.bookData
    )}\n\n用户问题：`;
  }
);

let prompt = '';

const chatStore = useChatStore();
chatStore.loadFromStorage();

const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const API_KEY = 'sk-lbtjhwrjebrwhwttikwrkasfwcbsijbuojzlizzihmoksyca';
const MODEL = 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';

const description = [
  'Turquoise AI 可帮助您分析书本相关内容，提供精准的解释',
  '基于 DeepSeek-R1-0528-Qwen3-8B 模型生成，请注意辨别',
];

const introPrompt = {
  direction: 'horizontal',
  list: [
    {
      value: 'quickSort',
      label: '请总结一下这本书的内容',
      iconConfig: { name: 'icon-info-o', color: '#5e7ce0' },
      desc: '纵览全局，探查根本',
    },
    {
      value: 'helpMd',
      label: '这句话在文中有什么含义',
      iconConfig: { name: 'icon-star', color: 'rgb(255, 215, 0)' },
      desc: '深入分析，解读深意',
    },
    {
      value: 'bindProjectSpace',
      label: '这个文言文词汇该如何翻译',
      iconConfig: { name: 'icon-priority', color: '#3ac295' },
      desc: '说文解字，一语道破',
    },
  ],
};

const simplePrompt = [
  {
    value: 'quickSort',
    iconConfig: { name: 'icon-info-o', color: '#5e7ce0' },
    label: '请总结一下这本书的内容',
  },
];

const showStartPage = computed(() => chatStore.showStartPage);
const currentMessages = computed(() => chatStore.currentSession?.messages || []);
const isLoading = ref(false);
const inputValue = ref('');

let abortController: AbortController | null = null;
let startTime: number = 0;
let currentAiMessageId: number | null = null;

const toggleThink = (id: number) => {
  chatStore.toggleThink(id);
};

const thinkBtnText = (msg: any) => {
  if (!msg.reasoningContent) return '无思考过程';
  return msg.showThink ? '收起思考过程' : `已深度思考 (用时${msg.thinkTime || 0}秒)`;
};

const btnIcon = (msg: any) => {
  if (!msg.reasoningContent) return '';
  return msg.showThink ? 'icon-chevron-up-2' : 'icon-chevron-down-2';
};

const stopGeneration = () => {
  if (abortController) {
    abortController.abort();
    isLoading.value = false;
    abortController = null;
  }
};

const processStreamResponse = async (reader: ReadableStreamDefaultReader) => {
  const decoder = new TextDecoder();
  let fullContent = '';
  let fullReasoning = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data: ') || line === '[DONE]');

      for (const line of lines) {
        if (line === '[DONE]' || line === 'data: [DONE]') break;

        try {
          const jsonStr = line.replace('data: ', '').trim();
          const data = JSON.parse(jsonStr);
          const contentDelta = data.choices?.[0]?.delta?.content || '';
          const reasoningDelta = data.choices?.[0]?.delta?.reasoning_content || '';

          if (contentDelta) {
            fullContent += contentDelta;
          }
          if (reasoningDelta) {
            fullReasoning += reasoningDelta;
          }

          if (currentAiMessageId !== null) {
            chatStore.updateMessageContent(currentAiMessageId, fullContent, fullReasoning);
          }
        } catch (e) {
          continue;
        }
      }
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      if (currentAiMessageId !== null) {
        chatStore.updateMessageContent(
          currentAiMessageId,
          '抱歉，处理您的请求时出错。请稍后再试。',
          fullReasoning
        );
      }
    }
  } finally {
    const endTime = Date.now();
    const thinkTime = ((endTime - startTime) / 1000).toFixed(1);

    if (currentAiMessageId !== null) {
      chatStore.setThinkTime(currentAiMessageId, parseFloat(thinkTime));
    }

    isLoading.value = false;
    abortController = null;
    currentAiMessageId = null;
  }
};

const fetchAIStreamResponse = async (userInput: string) => {
  try {
    isLoading.value = true;
    startTime = Date.now();
    abortController = new AbortController();

    let historyMessages = currentMessages.value;
    if (
      historyMessages.length > 0 &&
      historyMessages[historyMessages.length - 1].from === 'model'
    ) {
      historyMessages = historyMessages.slice(0, -1);
    }

    const messages = [];

    if (prompt.trim() !== '') {
      messages.push({
        role: 'system',
        content: prompt,
      });
    }

    const conversationHistory = historyMessages.map((msg) => ({
      role: msg.from === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    messages.push(...conversationHistory);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: true,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (reader) {
      await processStreamResponse(reader);
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      if (currentAiMessageId !== null) {
        chatStore.updateMessageContent(
          currentAiMessageId,
          '抱歉，处理您的请求时出错。请稍后再试。',
          ''
        );
      }
      isLoading.value = false;
    }
  }
};

const onSubmit = (content: string) => {
  const userInput = content || inputValue.value;
  if (!userInput.trim() || isLoading.value) return;

  inputValue.value = '';

  chatStore.addMessage({
    id: Date.now(),
    from: 'user',
    content: userInput,
  });

  if (chatStore.currentSession?.messages.length === 1) {
    chatStore.updateTitle(userInput);
  }

  const aiMessage = {
    id: Date.now() + 1,
    from: 'model',
    content: '',
    reasoningContent: '',
    showThink: false,
    thinkTime: 0,
  };
  // @ts-ignore
  chatStore.addMessage(aiMessage);
  currentAiMessageId = aiMessage.id;

  fetchAIStreamResponse(userInput);
};

onMounted(() => {
  if (!chatStore.currentSessionId) {
    chatStore.createNewSession();
  }
});
</script> 

<style>
/* 保持原有样式不变 */
.container {
  width: 100%;
  margin: 20px auto;
  height: 100%;
  padding: 20px;
  gap: 8px;
  background: #c7e4ea9e;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.content-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  gap: 8px;
  overflow: hidden;
}
.container::-webkit-scrollbar {
  width: 0px;
}
.content-main::-webkit-scrollbar {
  width: 0px;
}
.message-container::-webkit-scrollbar {
  width: 0px;
}
.start-page-content {
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.message-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

/* think按钮样式 */
.message-container .think-toggle-btn {
  display: flex;
  gap: 8px;
  align-items: center;
  border-radius: 10px;
  padding: 7px 10px;
  margin-bottom: 12px;
  width: fit-content;
  cursor: pointer;
  background-color: #e0f0ff;
  font-size: 14px;
  color: #1e6bb8;
  transition: background-color 0.3s;
  position: relative;
  z-index: 10;
}

.message-container .think-toggle-btn:hover {
  background-color: #d0e8ff;
}

.message-container .think-toggle-btn i {
  font-size: 14px;
}

/* 修复思考内容样式 */
.message-container .think-content {
  background-color: #f9f9f9 !important;
  border-left: 4px solid #3498db !important;
  padding: 12px 15px !important;
  margin: 10px 0 !important;
  border-radius: 0 4px 4px 0 !important;
  white-space: pre-wrap !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: #333 !important;
  display: block !important;
  width: 100% !important;
  box-sizing: border-box !important;
  position: relative !important;
  z-index: 5 !important;
}

/* 确保思考内容与Markdown内容之间有足够的间距 */
.message-container .think-content + .mc-markdown-card {
  margin-top: 15px !important;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  color: #666;
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .container {
    width: 95%;
    height: calc(100vh - 20px);
    padding: 10px;
    margin: 10px auto;
    border-radius: 12px;
  }

  .start-page-content {
    padding: 10px;
    text-align: center;
  }

  .message-container .think-toggle-btn {
    padding: 5px 8px;
    font-size: 12px;
  }

  .message-container .think-content {
    padding: 10px !important;
    font-size: 13px !important;
  }
}

@media (max-width: 480px) {
  .container {
    width: 100%;
    height: 100vh;
    margin: 0;
    border-radius: 0;
    border: none;
  }

  .message-container .think-toggle-btn {
    width: 100%;
    justify-content: center;
  }

  .message-container .think-content {
    font-size: 12px !important;
    padding: 8px !important;
  }

  .loading-indicator {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
