<template>
  <McLayout class="container">
    <McLayoutContent
      v-if="startPage"
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

    <McLayoutContent class="content-main" v-else>
      <div class="message-container">
        <template v-for="(msg, idx) in messages" :key="idx">
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
        v-if="!startPage && !isLoading"
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
import { ref } from 'vue';
import { Button } from 'vue-devui';

// API配置
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

const startPage = ref(true);
const inputValue = ref('');
const messages = ref<any[]>([]);
const isLoading = ref(false);
let messageIdCounter = 0;
let abortController: AbortController | null = null;
let startTime: number = 0;

// 切换think部分的显示
const toggleThink = (id: number) => {
  const msg = messages.value.find(m => m.id === id);
  if (msg) {
    msg.showThink = !msg.showThink;
  }
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
    
    // 更新最后一条消息
    const aiMsg = messages.value.find(msg => msg.id === messageIdCounter);
    if (aiMsg && aiMsg.content === '思考中...') {
      aiMsg.content = '生成已停止';
    }
  }
};

// 处理流式响应
const processStreamResponse = async (reader: ReadableStreamDefaultReader, aiMsgId: number) => {
  const decoder = new TextDecoder();
  let reasoningContent = '';
  let normalContent = '';
  let isReasoningComplete = false;
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line === 'data: [DONE]') break;
        
        if (line.startsWith('data:')) {
          const jsonStr = line.replace('data: ', '');
          try {
            const data = JSON.parse(jsonStr);
            
            // 获取AI回复内容和思考内容
            const contentDelta = data.choices[0]?.delta?.content || '';
            const reasoningDelta = data.choices[0]?.delta?.reasoning_content || '';
            
            // 更新思考内容
            if (reasoningDelta) {
              reasoningContent += reasoningDelta;
              const aiMsg = messages.value.find(msg => msg.id === aiMsgId);
              if (aiMsg) {
                aiMsg.reasoningContent = reasoningContent;
              }
            }
            
            // 更新正常内容
            if (contentDelta) {
              // 当开始正常内容时，标记思考过程结束
              if (!isReasoningComplete && reasoningContent) {
                isReasoningComplete = true;
              }
              normalContent += contentDelta;
              
              const aiMsg = messages.value.find(msg => msg.id === aiMsgId);
              if (aiMsg) {
                aiMsg.content = normalContent;
              }
            }
          } catch (error) {
            console.error('解析JSON错误:', error);
          }
        }
      }
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('流读取错误:', error);
      const aiMsg = messages.value.find(msg => msg.id === aiMsgId);
      if (aiMsg) {
        aiMsg.content = '抱歉，处理您的请求时出错。请稍后再试。';
      }
    }
  } finally {
    // 计算思考时间
    const endTime = Date.now();
    const thinkTime = ((endTime - startTime) / 1000).toFixed(1);
    
    // 更新AI消息
    const aiMsg = messages.value.find(msg => msg.id === aiMsgId);
    if (aiMsg) {
      aiMsg.thinkTime = thinkTime;
      aiMsg.showThink = false;
    }
    
    isLoading.value = false;
    abortController = null;
  }
};

// 调用API获取AI回复（流式）
const fetchAIStreamResponse = async (userInput: string) => {
  try {
    isLoading.value = true;
    startTime = Date.now();
    abortController = new AbortController();
    
    // 构建对话历史
    const conversationHistory = messages.value
      .filter(msg => msg.from !== 'model' || msg.id !== messageIdCounter)
      .map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
    
    // 添加当前用户消息
    conversationHistory.push({
      role: 'user',
      content: userInput
    });
    
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
        stream: true  // 启用流式输出
      }),
      signal: abortController.signal
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    // 处理流式响应
    const reader = response.body?.getReader();
    if (reader) {
      await processStreamResponse(reader, messageIdCounter);
    }
    
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('API调用错误:', error);
      const aiMsg = messages.value.find(msg => msg.id === messageIdCounter);
      if (aiMsg) {
        aiMsg.content = '抱歉，处理您的请求时出错。请稍后再试。';
      }
      isLoading.value = false;
    }
  }
};

const onSubmit = (content: string) => {
  const userInput = content || inputValue.value;
  if (!userInput.trim()) return;
  
  inputValue.value = '';
  startPage.value = false;
  
  // 添加用户消息
  messages.value.push({
    id: messageIdCounter++,
    from: 'user',
    content: userInput,
  });
  
  // 添加AI消息占位符
  messages.value.push({
    id: messageIdCounter,
    from: 'model',
    content: '思考中...',
    reasoningContent: '',
    showThink: false,
    thinkTime: 0
  });
  
  // 调用API获取AI回复（流式）
  fetchAIStreamResponse(userInput);
};
</script>

<style>
/* 原有样式 */
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
.think-toggle-btn {
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
}

.think-toggle-btn:hover {
  background-color: #d0e8ff;
}

.think-toggle-btn i {
  font-size: 14px;
}

/* 思考内容样式 */
.think-content {
  background-color: #f9f9f9;
  border-left: 4px solid #3498db;
  padding: 12px 15px;
  margin-bottom: 15px;
  border-radius: 0 4px 4px 0;
  white-space: pre-wrap; /* 保留换行 */
  font-size: 14px;
  line-height: 1.6;
  color: #333;
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

  .think-toggle-btn {
    padding: 5px 8px;
    font-size: 12px;
  }
  
  .think-content {
    padding: 10px;
    font-size: 13px;
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
  
  .think-toggle-btn {
    width: 100%;
    justify-content: center;
  }
  
  .think-content {
    font-size: 12px;
    padding: 8px;
  }
  
  .loading-indicator {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>