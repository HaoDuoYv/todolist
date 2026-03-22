<template>
  <div class="app-wrapper">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <!-- 主应用容器 -->
    <div class="todo-app">
      <!-- 头部 -->
      <header class="app-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
        </div>
        <h1>待办事项</h1>
        <p class="subtitle">高效管理你的每一天</p>
      </header>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ tasks.length }}</span>
          <span class="stat-label">总任务</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ activeCount }}</span>
          <span class="stat-label">待完成</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ completedCount }}</span>
          <span class="stat-label">已完成</span>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-wrapper">
          <input
            type="text"
            v-model="newTask"
            placeholder="添加新任务..."
            @keyup.enter="addTask"
          />
          <button class="add-btn" @click="addTask" :disabled="!newTask.trim()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 筛选器 -->
      <div class="filters">
        <button
          class="filter-btn"
          :class="{ active: filter === 'all' }"
          @click="filter = 'all'"
        >
          全部
        </button>
        <button
          class="filter-btn"
          :class="{ active: filter === 'active' }"
          @click="filter = 'active'"
        >
          待办
        </button>
        <button
          class="filter-btn"
          :class="{ active: filter === 'completed' }"
          @click="filter = 'completed'"
        >
          已完成
        </button>
      </div>

      <!-- 任务列表 -->
      <div class="tasks-container">
        <TransitionGroup name="task" tag="div" class="tasks-list">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-item"
            :class="{ completed: task.completed }"
          >
            <button
              class="task-checkbox"
              :class="{ checked: task.completed }"
              @click="toggleTask(task.id)"
              aria-label="切换完成状态"
            >
              <svg v-if="task.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <span class="task-text">{{ task.text }}</span>
            <button
              class="delete-btn"
              @click="removeTask(task.id)"
              aria-label="删除任务"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </TransitionGroup>

        <!-- 空状态 -->
        <div v-if="filteredTasks.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <h3>{{ emptyStateTitle }}</h3>
          <p>{{ emptyStateSubtitle }}</p>
        </div>
      </div>
    </div>

    <!-- PWA 安装横幅 -->
    <Transition name="slide-up">
      <div v-if="showInstallBanner" class="install-banner">
        <div class="install-content">
          <div class="install-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div class="install-text">
            <div class="title">安装到主屏幕</div>
            <div class="subtitle">离线使用，快速访问</div>
          </div>
          <div class="install-actions">
            <button class="install-btn" @click="triggerInstall">安装</button>
            <button class="dismiss-btn" @click="dismissInstall">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'

interface Task {
  id: number
  text: string
  completed: boolean
}

const newTask = ref('')
const tasks = ref<Task[]>([])
const filter = ref<'all' | 'active' | 'completed'>('all')
const deferredPrompt = ref<any>(null)
const showInstallBanner = ref(false)

// 从本地存储加载任务
onMounted(() => {
  const savedTasks = localStorage.getItem('vue-todo-tasks')
  if (savedTasks) {
    try {
      tasks.value = JSON.parse(savedTasks)
    } catch (e) {
      console.error('Failed to parse tasks from localStorage', e)
    }
  }

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
})

// 保存任务到本地存储
watch(
  tasks,
  (newTasks) => {
    localStorage.setItem('vue-todo-tasks', JSON.stringify(newTasks))
  },
  { deep: true }
)

// 添加新任务
const addTask = () => {
  if (newTask.value.trim() === '') return

  tasks.value.unshift({
    id: Date.now(),
    text: newTask.value.trim(),
    completed: false
  })

  newTask.value = ''
}

// 切换任务完成状态
const toggleTask = (id: number) => {
  const task = tasks.value.find((task) => task.id === id)
  if (task) {
    task.completed = !task.completed
  }
}

// 删除任务
const removeTask = (id: number) => {
  tasks.value = tasks.value.filter((task) => task.id !== id)
}

// 计算属性：已过滤的任务列表
const filteredTasks = computed(() => {
  switch (filter.value) {
    case 'active':
      return tasks.value.filter((task) => !task.completed)
    case 'completed':
      return tasks.value.filter((task) => task.completed)
    default:
      return tasks.value
  }
})

// 计算属性：已完成任务数量
const completedCount = computed(() => {
  return tasks.value.filter((task) => task.completed).length
})

// 计算属性：待完成任务数量
const activeCount = computed(() => {
  return tasks.value.filter((task) => !task.completed).length
})

// 空状态文案
const emptyStateTitle = computed(() => {
  if (filter.value === 'all') return '暂无任务'
  if (filter.value === 'active') return '没有待办任务'
  return '还没有完成的任务'
})

const emptyStateSubtitle = computed(() => {
  if (filter.value === 'all') return '添加你的第一个任务，开始高效的一天'
  if (filter.value === 'active') return '太棒了！所有任务都已完成'
  return '完成任务后会显示在这里'
})

// PWA 安装相关
const onBeforeInstallPrompt = (e: Event) => {
  const ev = e as any
  if (ev && typeof ev.preventDefault === 'function') {
    ev.preventDefault()
    deferredPrompt.value = ev
    showInstallBanner.value = true
  }
}

const onAppInstalled = () => {
  deferredPrompt.value = null
  showInstallBanner.value = false
}

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
})

const triggerInstall = async () => {
  if (!deferredPrompt.value) return
  try {
    await deferredPrompt.value.prompt()
    await deferredPrompt.value.userChoice
  } catch (err) {
    // ignore
  } finally {
    deferredPrompt.value = null
    showInstallBanner.value = false
  }
}

const dismissInstall = () => {
  showInstallBanner.value = false
}
</script>

<style>
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

/* CSS Variables */
:root {
  --primary: #0D9488;
  --primary-light: #14B8A6;
  --primary-dark: #0F766E;
  --cta: #F97316;
  --bg: #F0FDFA;
  --text: #134E4A;
  --text-muted: #5EEAD4;
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.5);
  --shadow: 0 8px 32px rgba(13, 148, 136, 0.15);
  --shadow-lg: 0 20px 60px rgba(13, 148, 136, 0.2);
}

/* Reset & Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #CCFBF1 0%, #99F6E4 50%, #5EEAD4 100%);
  min-height: 100vh;
  color: var(--text);
}

/* App Wrapper */
.app-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  position: relative;
  overflow-x: hidden;
}

/* Background Decorations */
.bg-decoration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: #5EEAD4;
  top: -100px;
  right: -100px;
  animation: float 20s ease-in-out infinite;
}

.blob-2 {
  width: 300px;
  height: 300px;
  background: #99F6E4;
  bottom: 10%;
  left: -50px;
  animation: float 15s ease-in-out infinite reverse;
}

.blob-3 {
  width: 250px;
  height: 250px;
  background: #14B8A6;
  top: 40%;
  right: 10%;
  animation: float 18s ease-in-out infinite;
  animation-delay: -5s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Main App Container */
.todo-app {
  width: 100%;
  max-width: 520px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* Header */
.app-header {
  padding: 32px 24px 24px;
  text-align: center;
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%);
  border-bottom: 1px solid var(--glass-border);
}

.header-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(13, 148, 136, 0.3);
}

.header-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.app-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--primary);
  font-weight: 500;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--glass-border);
}

.stat-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 16px 8px;
  text-align: center;
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.1);
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--primary-dark);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Input Section */
.input-section {
  padding: 20px 24px;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  background: white;
  border-radius: 16px;
  padding: 6px;
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: var(--primary-light);
  box-shadow: 0 4px 20px rgba(13, 148, 136, 0.2);
}

.input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 16px;
  font-size: 1rem;
  font-family: inherit;
  color: var(--text);
  outline: none;
}

.input-wrapper input::placeholder {
  color: #99A1AF;
}

.add-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}

.add-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(13, 148, 136, 0.4);
}

.add-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-btn svg {
  width: 20px;
  height: 20px;
}

/* Filters */
.filters {
  display: flex;
  gap: 8px;
  padding: 0 24px 16px;
}

.filter-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--primary-dark);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--glass-border);
}

.filter-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.8);
}

.filter-btn.active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}

/* Tasks Container */
.tasks-container {
  padding: 0 24px 24px;
  min-height: 280px;
  max-height: 400px;
  overflow-y: auto;
}

.tasks-container::-webkit-scrollbar {
  width: 6px;
}

.tasks-container::-webkit-scrollbar-track {
  background: transparent;
}

.tasks-container::-webkit-scrollbar-thumb {
  background: var(--primary-light);
  border-radius: 3px;
}

/* Task Item */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
  cursor: pointer;
}

.task-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.1);
}

.task-item.completed {
  opacity: 0.7;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: #99A1AF;
}

.task-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid var(--primary-light);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.task-checkbox:hover {
  border-color: var(--primary);
  background: rgba(13, 148, 136, 0.1);
}

.task-checkbox.checked {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  border-color: transparent;
}

.task-checkbox svg {
  width: 14px;
  height: 14px;
  color: white;
}

.task-text {
  flex: 1;
  font-size: 0.95rem;
  color: var(--text);
  font-weight: 500;
  transition: all 0.3s ease;
}

.delete-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #EF4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
}

.task-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.delete-btn svg {
  width: 18px;
  height: 18px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--primary-dark);
  min-height: 232px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--glass-border);
}

.empty-icon svg {
  width: 40px;
  height: 40px;
  color: var(--primary-light);
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text);
}

.empty-state p {
  font-size: 0.875rem;
  color: #6B7280;
}

/* Install Banner */
.install-banner {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 100;
  width: calc(100% - 48px);
  max-width: 480px;
}

.install-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--glass-border);
}

.install-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.install-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.install-text {
  flex: 1;
}

.install-text .title {
  font-weight: 600;
  color: var(--text);
  font-size: 0.95rem;
}

.install-text .subtitle {
  font-size: 0.8rem;
  color: #6B7280;
  margin-top: 2px;
}

.install-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.install-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.install-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}

.dismiss-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B7280;
  transition: all 0.3s ease;
}

.dismiss-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dismiss-btn svg {
  width: 18px;
  height: 18px;
}

/* Transitions */
.task-enter-active,
.task-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.task-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.task-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(100px);
}

/* Responsive */
@media (max-width: 640px) {
  .app-wrapper {
    padding: 20px 16px;
  }

  .todo-app {
    border-radius: 20px;
  }

  .app-header {
    padding: 24px 20px 20px;
  }

  .header-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }

  .header-icon svg {
    width: 28px;
    height: 28px;
  }

  .app-header h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    padding: 16px 20px;
    gap: 8px;
  }

  .stat-card {
    padding: 12px 4px;
    border-radius: 12px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .input-section,
  .filters,
  .tasks-container {
    padding-left: 20px;
    padding-right: 20px;
  }

  .delete-btn {
    opacity: 1;
  }

  .install-banner {
    bottom: 16px;
  }

  .install-content {
    padding: 12px 16px;
    gap: 12px;
  }

  .install-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .install-icon svg {
    width: 20px;
    height: 20px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
