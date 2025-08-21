// src/stores/chatStore.ts
import { defineStore } from 'pinia';

export interface Message {
  id: number;
  from: 'user' | 'model';
  content: string;
  reasoningContent?: string;
  showThink?: boolean;
  thinkTime?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [] as ChatSession[],
    currentSessionId: null as string | null,
  }),

  getters: {
    currentSession(state): ChatSession | null {
      return state.sessions.find(s => s.id === state.currentSessionId) || null;
    },
    allSessions(state): ChatSession[] {
      return state.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    },
    // 判断是否显示启动页
    showStartPage(state): boolean {
      const session = state.sessions.find(s => s.id === state.currentSessionId);
      return !session || session.messages.length === 0;
    }
  },

  actions: {
    // 初始化：从 localStorage 加载
    loadFromStorage() {
      try {
        const saved = localStorage.getItem('turquoise-ai-chats');
        if (saved) {
          const data = JSON.parse(saved);
          this.sessions = data.sessions;
          this.currentSessionId = data.currentSessionId || this.sessions[0]?.id || null;
        }

        // 如果没有会话，创建一个默认的
        if (this.sessions.length === 0) {
          this.createNewSession();
        } else if (!this.currentSessionId) {
          this.currentSessionId = this.sessions[0].id;
        }
      } catch (e) {
        console.error('Failed to load chat history:', e);
        this.sessions = [];
        this.createNewSession();
      }
    },

    // 保存到 localStorage
    saveToStorage() {
      try {
        localStorage.setItem('turquoise-ai-chats', JSON.stringify({
          sessions: this.sessions,
          currentSessionId: this.currentSessionId
        }));
      } catch (e) {
        console.error('Failed to save chat history:', e);
      }
    },

    // 创建新对话
    createNewSession(title = '新对话') {
      const id = Date.now().toString();
      const newSession: ChatSession = {
        id,
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.sessions.unshift(newSession);
      this.currentSessionId = id;
      this.saveToStorage();
      return id;
    },

    // 切换当前对话
    switchSession(id: string) {
      const session = this.sessions.find(s => s.id === id);
      if (session) {
        this.currentSessionId = id;
        this.saveToStorage();
      }
    },

    // 更新当前会话标题
    updateTitle(title: string) {
      if (this.currentSessionId) {
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (session && session.title === '新对话') {
          session.title = title.slice(0, 20) + (title.length > 20 ? '...' : '');
          session.updatedAt = Date.now();
          this.saveToStorage();
        }
      }
    },

    // 添加消息
    addMessage(message: Message) {
      if (this.currentSessionId) {
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (session) {
          session.messages.push(message);
          session.updatedAt = Date.now();
          this.saveToStorage();
        }
      }
    },

    // 更新消息内容（用于流式响应）
    updateMessageContent(messageId: number, content: string, reasoningContent?: string) {
      if (this.currentSessionId) {
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (session) {
          const message = session.messages.find(m => m.id === messageId);
          if (message) {
            message.content = content;
            if (reasoningContent !== undefined) {
              message.reasoningContent = reasoningContent;
            }
            
            // 如果有思考内容但没有回答内容，显示"思考中..."
            if (reasoningContent && !content) {
              message.content = '思考中...';
            }
            
            session.updatedAt = Date.now();
            this.saveToStorage();
          }
        }
      }
    },

    // 更新思考状态
    toggleThink(messageId: number) {
      if (this.currentSessionId) {
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (session) {
          const message = session.messages.find(m => m.id === messageId);
          if (message) {
            message.showThink = !message.showThink;
            this.saveToStorage();
          }
        }
      }
    },

    // 设置思考时间
    setThinkTime(messageId: number, thinkTime: number) {
      if (this.currentSessionId) {
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (session) {
          const message = session.messages.find(m => m.id === messageId);
          if (message) {
            message.thinkTime = thinkTime;
            this.saveToStorage();
          }
        }
      }
    },

    // 清除当前对话内容
    clearCurrentSession() {
      if (this.currentSessionId) {
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (session) {
          session.messages = [];
          session.updatedAt = Date.now();
          this.saveToStorage();
        }
      }
    },

    // 重命名会话
    renameSession(id: string, newName: string) {
      const session = this.sessions.find(s => s.id === id);
      if (session) {
        session.title = newName;
        session.updatedAt = Date.now();
        this.saveToStorage();
      }
    },

    // 删除会话
    deleteSession(id: string) {
      this.sessions = this.sessions.filter(s => s.id !== id);
      
      // 如果删除的是当前会话，切换到第一个会话
      if (this.currentSessionId === id) {
        if (this.sessions.length > 0) {
          this.currentSessionId = this.sessions[0].id;
        } else {
          this.createNewSession();
        }
      }
      
      this.saveToStorage();
    }
  }
});