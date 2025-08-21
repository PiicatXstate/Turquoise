<template>
  <div class="chat-history-container" ref="containerRef">
    <h1 class="title">对话记录</h1>
    <div class="frame">
      <div
        v-for="(session, index) in allSessions"
        :key="session.id"
        class="his-frame"
      >
        <!-- 聊天项 -->
        <div 
          class="chat-item" 
          :class="{ active: currentSessionId === session.id }"
          @click="selectChat(session.id)"
        >
          <span class="chat-name">{{ session.title }}</span>
          <el-icon class="more-icon" @click.stop="toggleMenu(session.id)">
            <MoreFilled />
          </el-icon>
        </div>

        <transition name="fade">
          <div
            v-if="activeSessionId === session.id"
            class="action-menu"
            @click.stop
          >
            <div class="menu-item rename" @click="renameChat(session.id)">
              <el-icon><Edit /></el-icon>
              <span>重命名</span>
            </div>
            <div class="menu-item delete" @click="deleteChat(session.id)">
              <el-icon><Delete /></el-icon>
              <span>删除</span>
            </div>
          </div>
        </transition>
      </div>
      
      <!-- 创建新对话按钮 -->
      <div class="new-chat-btn" @click="createNewSession">
        <el-icon><Plus /></el-icon>
        <span>新建对话</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { MoreFilled, Edit, Delete, Plus } from '@element-plus/icons-vue';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chatStore';

const chatStore = useChatStore();
const activeSessionId = ref<string | null>(null);
const containerRef = ref<HTMLElement | null>(null);

// 从Store获取状态
const allSessions = computed(() => chatStore.allSessions);
const currentSessionId = computed(() => chatStore.currentSessionId);

// 切换菜单
const toggleMenu = (sessionId: string) => {
  activeSessionId.value = activeSessionId.value === sessionId ? null : sessionId;
};

// 重命名
const renameChat = (sessionId: string) => {
  const session = chatStore.sessions.find(s => s.id === sessionId);
  const newName = prompt('请输入新的聊天名称', session?.title || '新对话');
  if (newName && newName.trim()) {
    chatStore.renameSession(sessionId, newName.trim());
  }
  activeSessionId.value = null;
};

// 删除
const deleteChat = (sessionId: string) => {
  if (confirm('确定要删除这个聊天记录吗？')) {
    chatStore.deleteSession(sessionId);
  }
  activeSessionId.value = null;
};

const selectChat = (sessionId: string) => {
  chatStore.switchSession(sessionId);
  activeSessionId.value = null;
};

const createNewSession = () => {
  chatStore.createNewSession();
  activeSessionId.value = null;
};

// 点击外部关闭菜单
const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    activeSessionId.value = null;
  }
};

onMounted(() => {
  // 确保加载历史记录
  if (chatStore.sessions.length === 0) {
    chatStore.loadFromStorage();
  }
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.chat-history-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  padding-left: 14px;
  padding-top: 11px;
  padding-bottom: 0px;
  margin: 0;
  background: #ffffff;
  flex-shrink: 0;
}

.frame {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  background: rgba(0, 0, 0, 0);
  scrollbar-width: thin;
  scrollbar-color: #c1c9d2 #f1f5f9;
}

.frame::-webkit-scrollbar {
  width: 6px;
}
.frame::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}
.frame::-webkit-scrollbar-thumb {
  background: #c1c9d2;
  border-radius: 10px;
}
.frame::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* 每个聊天项容器：相对定位，用于菜单定位 */
.his-frame {
  position: relative;
  margin: 4px 12px;
}

.chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s ease;
  user-select: none;
  background: #f8fafc;
}

.chat-item.active {
  background: #e0f2fe;
  color: #0ea5e9;
  font-weight: 500;
}

.chat-item:hover {
  background: #edf2f7;
  color: #1a202c;
}

.chat-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.more-icon {
  color: #94a3b8;
  font-size: 18px;
  opacity: 0;
  transition: all 0.2s ease;
}

.chat-item:hover .more-icon {
  opacity: 1;
}

/* 操作菜单 */
.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 120px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 10;
  border: 1px solid #e2e8f0;
  backdrop-filter: blur(8px);
  font-size: 13px;
  margin-top: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.menu-item .el-icon {
  margin-right: 8px;
  font-size: 14px;
}

.menu-item.rename .el-icon {
  color: #059669;
}

.menu-item.delete .el-icon {
  color: #dc2626;
}

/* 新建对话按钮 */
.new-chat-btn {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  margin: 4px 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s ease;
  user-select: none;
}

.new-chat-btn:hover {
  background: #edf2f7;
  color: #1a202c;
}

.new-chat-btn .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>