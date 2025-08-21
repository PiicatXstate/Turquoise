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
            <div v-if="msg.reasoningContent" class="think-toggle-btn" @click="toggleThink(msg.id)">
              <i class="icon-point"></i>
              <span>{{ thinkBtnText(msg) }}</span>
              <i :class="btnIcon(msg)"></i>
            </div>
            
            <!-- 显示思考内容 -->
            <div v-if="msg.showThink && msg.reasoningContent" class="think-content">
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
          <d-button variant="solid" @click="stopGeneration" size="sm" style="margin-left: 10px;">停止</d-button>
        </div>
      </div>
    </McLayoutContent>

    <div class="shortcut" style="display: flex; align-items: center; gap: 8px">
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
import { ref, computed, onMounted } from 'vue';
import { useChatStore } from '@/stores/chatStore';

// 初始化Pinia Store
const chatStore = useChatStore();
chatStore.loadFromStorage();

// API配置 - 修复末尾空格问题
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const API_KEY = 'sk-lbtjhwrjebrwhwttikwrkasfwcbsijbuojzlizzihmoksyca';
const MODEL = 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';

const description = [
  'Turquoise AI 可帮助您分析书本相关内容，提供精准的解释',
  '基于 DeepSeek-R1 模型生成，请注意辨别',
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
const simplePrompt = [{
  value: 'quickSort',
  iconConfig: { name: 'icon-info-o', color: '#5e7ce0' },
  label: '请总结一下这本书的内容',
}];

// 从Store获取状态
const showStartPage = computed(() => chatStore.showStartPage);
const currentMessages = computed(() => chatStore.currentSession?.messages || []);
const isLoading = ref(false);
const inputValue = ref('');

let abortController: AbortController | null = null;
let startTime: number = 0;
let currentAiMessageId: number | null = null;

// 切换think部分的显示
const toggleThink = (id: number) => {
  chatStore.toggleThink(id);
};

// 按钮文字
const thinkBtnText = (msg: any) => {
  if (!msg.reasoningContent) return '无思考过程';
  return msg.showThink ? '收起思考过程' : `已深度思考 (用时${msg.thinkTime || 0}秒)`;
};

// 按钮图标
const btnIcon = (msg: any) => {
  if (!msg.reasoningContent) return '';
  return msg.showThink ? 'icon-chevron-up-2' : 'icon-chevron-down-2';
};

// 停止生成
const stopGeneration = () => {
  if (abortController) {
    abortController.abort();
    isLoading.value = false;
    abortController = null;
  }
};

// 处理流式响应
const processStreamResponse = async (reader: ReadableStreamDefaultReader) => {
  const decoder = new TextDecoder();
  let fullContent = ''; // 用于存储完整内容
  let reasoningContent = ''; // 用于存储思考内容
  let answerContent = ''; // 用于存储最终回答
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        // 处理各种可能的[DONE]标记
        if (line.trim() === ' [DONE]' || 
            line.trim() === '[DONE]' || 
            line.trim() === '[DONE]' ||
            line.trim() === ' [DONE] ') {
          break;
        }
        
        if (line.startsWith('')) {
          const jsonStr = line.replace('data: ', '').trim();
          
          try {
            const data = JSON.parse(jsonStr);
            const contentDelta = data.choices?.[0]?.delta?.content || '';
            
            if (contentDelta) {
              fullContent += contentDelta;
              
              // 关键修复：使用</think>作为分隔符
              const separator = '</think>';
              const separatorIndex = fullContent.indexOf(separator);
              
              if (separatorIndex !== -1) {
                // 找到分隔符，已经可以分离思考内容和回答
                reasoningContent = fullContent.substring(0, separatorIndex);
                answerContent = fullContent.substring(separatorIndex + separator.length);
              } else {
                // 还没找到分隔符，全部视为思考内容
                reasoningContent = fullContent;
                answerContent = '';
              }
              
              // 更新Store
              if (currentAiMessageId !== null) {
                chatStore.updateMessageContent(
                  currentAiMessageId, 
                  answerContent, 
                  reasoningContent
                );
              }
            }
          } catch (error) {
            console.error('解析JSON错误:', error, '原始数据:', jsonStr);
          }
        }
      }
    }
  } catch (error) {
    // @ts-ignore
    if (error.name !== 'AbortError') {
      console.error('流读取错误:', error);
      if (currentAiMessageId !== null) {
        chatStore.updateMessageContent(
          currentAiMessageId, 
          '抱歉，处理您的请求时出错。请稍后再试。',
          reasoningContent
        );
      }
    }
  } finally {
    // 确保最终内容正确
    if (currentAiMessageId !== null && reasoningContent && !answerContent) {
      // 如果有思考内容但没有回答内容，可能是格式问题
      // 尝试查找其他可能的分隔符
      const alternativeSeparator = '<br><br>';
      const separatorIndex = reasoningContent.indexOf(alternativeSeparator);
      
      if (separatorIndex !== -1) {
        answerContent = reasoningContent.substring(separatorIndex + alternativeSeparator.length);
        reasoningContent = reasoningContent.substring(0, separatorIndex);
        
        chatStore.updateMessageContent(
          currentAiMessageId, 
          answerContent, 
          reasoningContent
        );
      }
    }
    
    // 计算思考时间
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

// 调用API获取AI回复（流式）
const fetchAIStreamResponse = async (userInput: string) => {
  try {
    isLoading.value = true;
    startTime = Date.now();
    abortController = new AbortController();
    
    // 构建对话历史
    const conversationHistory = currentMessages.value.map(msg => ({
      role: msg.from === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // 调用API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: conversationHistory,
        max_tokens: 2000,
        temperature: 0.7,
        stream: true
      }),
      signal: abortController.signal
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // 处理流式响应
    const reader = response.body?.getReader();
    if (reader) {
      await processStreamResponse(reader);
    }
    
  } catch (error) {
    // @ts-ignore
    if (error.name !== 'AbortError') {
      console.error('API调用错误:', error);
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
  
  // 添加用户消息
  chatStore.addMessage({
    id: Date.now(),
    from: 'user',
    content: userInput,
  });
  
  // 更新会话标题（如果是新会话）
  if (chatStore.currentSession?.messages.length === 1) {
    chatStore.updateTitle(userInput);
  }
  
  // 添加AI消息占位符
  const aiMessage = {
    id: Date.now() + 1,
    from: 'model',
    content: '思考中...',
    reasoningContent: '',
    showThink: false,
    thinkTime: 0
  };
  // @ts-ignore
  chatStore.addMessage(aiMessage);
  currentAiMessageId = aiMessage.id;
  
  // 调用API获取AI回复
  fetchAIStreamResponse(userInput);
};

// 页面加载时初始化
onMounted(() => {
  // 确保至少有一个会话
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