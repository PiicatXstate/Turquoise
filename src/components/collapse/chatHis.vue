<template>
  <h1 class="title">对话记录</h1>
  <div class="frame">
    <div 
        v-for="(name, index) in chatNameList" 
        :key="index" 
        class="hisFrame"
        @mouseleave="closeMenu(index)"
    >
        <p class="chatName">{{ name }}</p>
        <el-icon class="icon" @click.stop="toggleMenu(index)">
        <MoreFilled />
        </el-icon>
        
        <div 
        v-if="activeIndex === index" 
        class="select"
        @click.stop
        >
        <p class="rename" @click="renameChat(index)">重命名</p>
        <p class="delete" @click="deleteChat(index)">删除</p>
        </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { MoreFilled } from '@element-plus/icons-vue';
import { ref } from 'vue';

// 保持原始数据结构不变
let chatNameList = ref([
  '新的聊天1',
  '新的聊天2'
]);

const activeIndex = ref(-1);

// 切换菜单显示状态
const toggleMenu = (index: number) => {
  activeIndex.value = activeIndex.value === index ? -1 : index;
};

// 关闭指定菜单
const closeMenu = (index: number) => {
  if (activeIndex.value === index) {
    activeIndex.value = -1;
  }
};

// 重命名聊天
const renameChat = (index: number) => {
  const newName = prompt('请输入新的聊天名称', chatNameList.value[index]);
  if (newName) {
    chatNameList.value[index] = newName;
  }
  activeIndex.value = -1;
};

// 删除聊天
const deleteChat = (index: number) => {
  if (confirm('确定要删除这个聊天记录吗？')) {
    chatNameList.value.splice(index, 1);
  }
  activeIndex.value = -1;
};
</script>

<script lang="ts">
export default {
  name: 'chatHis'
}
</script>

<style scoped>
.title {
  font-size: 16px;
  position: absolute;
  left: 15px;
  top: 0px;
  color: rgb(2, 52, 72);
}

.frame{
    position: absolute;
    top: 30px;
    height: 100%;
    width: 100%;
}
/* 聊天项容器 */
.hisFrame {
  position: relative;
  margin: 8px 0;
  margin-left: 3%;
  width: 94%;
  height: 33px;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.02);
}

.hisFrame:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.chatName {
  position: absolute;
  font-size: 15px;
  top: 8px;
  left: 10px;
  margin: 0;
  width: calc(100% - 40px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon {
  position: absolute;
  top: 8px;
  right: 10px;
  color: rgba(0, 0, 0, 0.2);
  font-size: 17px;
  cursor: pointer;
}

.icon:hover {
  color: rgba(0, 0, 0, 0.5);
}

/* 操作菜单 */
.select {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.95);
  width: 80px;
  height: 62px;
  border-radius: 6px;
  right: 10px;
  top: 35px;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #ebeef5;
}

.rename, .delete {
  position: absolute;
  font-size: 14px;
  left: 0;
  width: 100%;
  text-align: center;
  color: #606266;
  cursor: pointer;
  margin: 0;
  padding: 6px 0;
  transition: background-color 0.2s;
}

.rename {
  top: 6px;
}

.delete {
  top: 30px;
}

.rename:hover, .delete:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

</style>