<template>
  <div class="reader-set-container" :style="{ transform: scaleValue, transformOrigin: 'top center' }">
    <h1 class="title">阅读器参数</h1>

    <div class="setting-group">
      <!-- 字体选择 -->
      <div class="setting-item">
        <label class="setting-label">字体选择</label>
        <div class="setting-control">
          <select 
            v-model="font" 
            class="font-select" 
            :disabled="loadingFonts || permissionDenied"
            @focus="requestPermissionIfNeed"
          >
            <option v-for="f in displayFonts" :key="f" :value="f">{{ f }}</option>
          </select>
          <div v-if="loadingFonts" class="loading-text">加载字体...</div>
          <div v-else-if="permissionDenied" class="permission-denied">权限被拒绝</div>
        </div>
      </div>

      <!-- 字体大小 -->
      <div class="setting-item">
        <label class="setting-label">字体大小</label>
        <div class="setting-control">
          <div class="font-size-control">
            <input
              type="range"
              min="12"
              max="36"
              step="1"
              v-model.number="fontSize"
              class="font-size-slider"
              aria-label="调整字体大小"
            />
            <span class="font-size-value">{{ fontSize }}px</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 权限提示 -->
    <div v-if="permissionDenied" class="permission-tip">
      已禁用本地字体访问，请在浏览器设置中启用。
    </div>
    <div v-else-if="usingFallbackFonts && !loadingFonts" class="fallback-tip">
      使用系统默认字体，点击下拉框加载本地字体
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { readerSet } from '@/stores/readerSet';

const store = readerSet();
const { font, fontSize } = storeToRefs(store);

// 状态
const availableFonts = ref<string[]>([]);
const loadingFonts = ref(false);
const permissionDenied = ref(false);
const usingFallbackFonts = ref(false); // 标记是否使用备选字体
const supportsQueryLocalFonts = 'queryLocalFonts' in window;

// 显示用字体（去重 + 排序）
const displayFonts = computed(() => {
  return [...new Set(availableFonts.value)].sort();
});

// 自动缩放
const containerWidth = ref(window.innerWidth);
const scaleValue = computed(() => {
  const minWidth = 320;
  const maxWidth = 480;
  const current = containerWidth.value;

  if (current >= maxWidth) return 'scale(1)';
  if (current <= minWidth) return 'scale(0.85)';
  const scale = 0.85 + 0.15 * ((current - minWidth) / (maxWidth - minWidth));
  return `scale(${scale.toFixed(3)})`;
});

const handleResize = () => {
  containerWidth.value = window.innerWidth;
};

// 加载本地字体（必须在用户手势事件中调用）
const loadLocalFonts = async () => {
  if (!supportsQueryLocalFonts) {
    permissionDenied.value = true;
    return;
  }

  loadingFonts.value = true;
  permissionDenied.value = false;

  try {
    // 直接尝试获取字体（浏览器会在需要时自动请求权限）
    // @ts-ignore
    const fonts = await window.queryLocalFonts();
    
    const fontNames = fonts
    // @ts-ignore
      .map(f => f.fullName || f.postScriptName)
      // @ts-ignore
      .filter(name => typeof name === 'string' && name.trim() !== '');

    // 如果成功获取到字体，更新状态
    if (fontNames.length > 0) {
        // @ts-ignore
      availableFonts.value = [...new Set(fontNames)];
      usingFallbackFonts.value = false;
    }
  } catch (err: any) {
    console.warn('无法加载本地字体:', err.message);
    if (err.name === 'SecurityError') {
      permissionDenied.value = true;
    }
  } finally {
    loadingFonts.value = false;
  }
};

// 被拒绝或不支持时的备选字体
const fallbackToCommonFonts = () => {
  availableFonts.value = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Microsoft YaHei',
    'SimSun',
    'STKaiti',
    'PingFang SC',
    'sans-serif',
    'serif',
    'monospace'
  ];
  usingFallbackFonts.value = true;
};

// 首次聚焦时尝试请求权限（用户手势触发）
const requestPermissionIfNeed = async () => {
  // 已经加载过本地字体或正在加载，不重复请求
  if (!usingFallbackFonts.value || loadingFonts.value) return;
  
  // 如果权限已被拒绝，不再尝试
  if (permissionDenied.value) return;
  
  await loadLocalFonts();
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize();

  // 初始化字体列表
  if (!supportsQueryLocalFonts) {
    fallbackToCommonFonts();
  } else {
    // 先使用备选字体，等待用户交互
    fallbackToCommonFonts();
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<script lang="ts">
export default {
  name: 'ReaderSet'
}
</script>

<style scoped>
.reader-set-container {
  background-color: #f8fafc;
  min-height: 100vh;
  padding: 0 0.5rem;
  box-sizing: border-box;
  transition: transform 0.2s ease;
}

.title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  padding: 0.6875rem 0.875rem 0;
  margin: 0;
  flex-shrink: 0;
}

.setting-group {
  background: #ffffff;
  border-radius: 0.75rem;
  overflow: hidden;
  margin: 0.75rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0.875rem;
  border-bottom: 1px solid #f1f5f9;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 0.875rem;
  color: #334155;
  width: 6.25rem;
  flex-shrink: 0;
  text-align: left;
}

.setting-control {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}

.font-select {
  width: 100%;
  max-width: 15rem;
  min-width: 10rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: #f8fafc;
  font-size: 0.875rem;
  color: #1e293b;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2364748b' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.font-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.font-select:hover:not(:disabled),
.font-select:focus:not(:disabled) {
  border-color: #3b82f6;
  outline: none;
}

.loading-text,
.permission-denied {
  font-size: 0.75rem;
  color: #64748b;
  margin-left: 0.5rem;
}

.permission-denied {
  color: #dc2626;
}

.permission-tip {
  font-size: 0.75rem;
  color: #dc2626;
  padding: 0.5rem 1rem;
  background-color: #fee2e2;
  border-radius: 0.375rem;
  margin: 0.5rem 1rem;
}

.fallback-tip {
  font-size: 0.75rem;
  color: #64748b;
  padding: 0.5rem 1rem;
  background-color: #f0f9ff;
  border-radius: 0.375rem;
  margin: 0.5rem 1rem;
}

.font-size-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.font-size-slider {
  -webkit-appearance: none;
  width: 100%;
  max-width: 12rem;
  height: 0.25rem;
  background: #e2e8f0;
  border-radius: 0.125rem;
  outline: none;
}

.font-size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease;
}

.font-size-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.font-size-value {
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 500;
  min-width: 2.5rem;
  text-align: center;
}

@media (max-width: 480px) {
  .setting-item {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .setting-label {
    width: 100%;
    margin-bottom: 0.25rem;
  }

  .setting-control {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>