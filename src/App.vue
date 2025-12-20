<template>
  <div class="todo-app">
    <div class="header">
      <h1><i class="fas fa-tasks"></i> 待办事项管理</h1>
      <p>记录你的任务，提升工作效率</p>
    </div>
    
    <div class="input-section">
      <input 
        type="text" 
        v-model="newTask" 
        placeholder="添加新任务..." 
        @keyup.enter="addTask"
      >
      <button class="add-btn" @click="addTask">
        <i class="fas fa-plus"></i> 添加
      </button>
    </div>
    
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
    
    <div class="tasks-container">
      <div class="task-stats">
        <span>总任务: {{ tasks.length }}</span>
        <span>已完成: {{ completedCount }}</span>
        <span>待完成: {{ activeCount }}</span>
      </div>
      
      <div class="tasks-list">
        <transition-group name="fade">
          <div 
            class="task-item" 
            v-for="task in filteredTasks" 
            :key="task.id"
          >
            <div 
              class="task-checkbox" 
              :class="{ checked: task.completed }"
              @click="toggleTask(task.id)"
            >
              <i class="fas fa-check" v-if="task.completed"></i>
            </div>
            <div 
              class="task-text" 
              :class="{ completed: task.completed }"
            >
              {{ task.text }}
            </div>
            <button 
              class="delete-btn" 
              @click="removeTask(task.id)"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </transition-group>
        
        <div class="empty-state" v-if="filteredTasks.length === 0">
          <i class="fas fa-clipboard-list"></i>
          <h3>暂无任务</h3>
          <p v-if="filter === 'all'">开始添加你的第一个任务吧</p>
          <p v-else-if="filter === 'active'">没有待办任务，太棒了！</p>
          <p v-else>还没有完成的任务</p>
        </div>
      </div>
    </div>

    <!-- 新增：PWA 安装横幅 -->
    <div v-if="showInstallBanner" class="install-banner">
      <div class="install-content">
        <div class="install-text">
          <i class="fas fa-download"></i>
          <div>
            <div class="title">将此应用安装到主屏幕</div>
            <div class="subtitle">离线使用、更快访问</div>
          </div>
        </div>
        <div class="install-actions">
          <button class="install-btn" @click="triggerInstall">安装</button>
          <button class="dismiss-btn" @click="dismissInstall">暂不</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'

interface Task {
  id: number;
  text: string;
  completed: boolean;
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
watch(tasks, (newTasks) => {
  localStorage.setItem('vue-todo-tasks', JSON.stringify(newTasks))
}, { deep: true })

// 添加新任务
const addTask = () => {
  if (newTask.value.trim() === '') return
  
  tasks.value.push({
    id: Date.now(),
    text: newTask.value.trim(),
    completed: false
  })
  
  newTask.value = ''
}

// 切换任务完成状态
const toggleTask = (id: number) => {
  const task = tasks.value.find(task => task.id === id)
  if (task) {
    task.completed = !task.completed
  }
}

// 删除任务
const removeTask = (id: number) => {
  tasks.value = tasks.value.filter(task => task.id !== id)
}

// 计算属性：已过滤的任务列表
const filteredTasks = computed(() => {
  switch (filter.value) {
    case 'active':
      return tasks.value.filter(task => !task.completed)
    case 'completed':
      return tasks.value.filter(task => task.completed)
    default:
      return tasks.value
  }
})

// 计算属性：已完成任务数量
const completedCount = computed(() => {
  return tasks.value.filter(task => task.completed).length
})

// 计算属性：待完成任务数量
const activeCount = computed(() => {
  return tasks.value.filter(task => !task.completed).length
})

// PWA 安装相关
const onBeforeInstallPrompt = (e: Event) => {
  const ev = e as any
  if (ev && typeof ev.preventDefault === 'function') {
    ev.preventDefault() // 阻止自动弹出，保存事件用于稍后触发
    deferredPrompt.value = ev
    // 仅在移动设备或窄屏时展示（可选判断）
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
    const choice = await deferredPrompt.value.userChoice
    // 可根据 choice.outcome 做统计或提示
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
 @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    body {
      background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .todo-app {
      width: 100%;
      max-width: 500px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      backdrop-filter: blur(10px);
    }
    
    .header {
      background: linear-gradient(90deg, #4776E6 0%, #8E54E9 100%);
      color: white;
      padding: 25px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.2rem;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    
    .header h1 i {
      font-size: 1.8rem;
    }
    
    .input-section {
      padding: 20px;
      background-color: #f0f4ff;
      display: flex;
      gap: 10px;
    }
    
    .input-section input {
      flex: 1;
      padding: 14px 20px;
      border: none;
      border-radius: 50px;
      font-size: 1rem;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
    }
    
    .input-section input:focus {
      outline: none;
      box-shadow: 0 4px 15px rgba(71, 118, 230, 0.4);
    }
    
    .add-btn {
      background: linear-gradient(90deg, #4776E6 0%, #8E54E9 100%);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 0 25px;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(71, 118, 230, 0.4);
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(71, 118, 230, 0.5);
    }
    
    .add-btn:active {
      transform: translateY(1px);
    }
    
    .filters {
      display: flex;
      padding: 15px 20px;
      background-color: #f8f9ff;
      border-bottom: 1px solid #eee;
    }
    
    .filter-btn {
      flex: 1;
      padding: 10px;
      background: none;
      border: none;
      font-size: 0.95rem;
      cursor: pointer;
      color: #666;
      transition: all 0.3s;
      border-radius: 8px;
    }
    
    .filter-btn.active {
      color: #4776E6;
      font-weight: 600;
      background: rgba(71, 118, 230, 0.1);
    }
    
    .filter-btn:hover:not(.active) {
      color: #4776E6;
      background: rgba(71, 118, 230, 0.05);
    }
    
    .tasks-container {
      padding: 0 20px;
    }
    
    .task-stats {
      padding: 15px 0;
      font-size: 0.9rem;
      color: #666;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #eee;
    }
    
    .tasks-list {
      padding: 5px 0;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .task-item {
      display: flex;
      align-items: center;
      padding: 18px 0;
      border-bottom: 1px solid #f0f0f0;
      animation: fadeIn 0.4s ease;
      transition: all 0.3s;
    }
    
    .task-item:last-child {
      border-bottom: none;
    }
    
    .task-item:hover {
      background-color: #f9fbff;
      transform: translateX(5px);
    }
    
    .task-checkbox {
      width: 24px;
      height: 24px;
      border: 2px solid #4776E6;
      border-radius: 50%;
      margin-right: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .task-checkbox.checked {
      background: linear-gradient(90deg, #4776E6 0%, #8E54E9 100%);
      border-color: transparent;
    }
    
    .task-checkbox.checked i {
      color: white;
      font-size: 0.8rem;
      display: block;
    }
    
    .task-text {
      flex: 1;
      font-size: 1.05rem;
      color: #333;
      transition: all 0.3s;
    }
    
    .task-text.completed {
      text-decoration: line-through;
      color: #999;
    }
    
    .delete-btn {
      background: none;
      border: none;
      color: #ff6b6b;
      cursor: pointer;
      font-size: 1.1rem;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }
    
    .delete-btn:hover {
      background-color: rgba(255, 107, 107, 0.1);
      transform: scale(1.1);
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #888;
    }
    
    .empty-state i {
      font-size: 4rem;
      margin-bottom: 20px;
      color: #e0e0e0;
    }
    
    .empty-state p {
      margin-top: 10px;
      font-size: 1.1rem;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .fade-move {
      transition: transform 0.5s ease;
    }

    /* 新增：安装横幅样式 */
    .install-banner {
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: 20px;
      z-index: 9999;
      display: flex;
      justify-content: center;
    }
    .install-content {
      width: 100%;
      max-width: 520px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .install-text {
      display: flex;
      gap: 12px;
      align-items: center;
      color: #333;
    }
    .install-text .title { font-weight: 600; }
    .install-text .subtitle { font-size: 0.85rem; color: #666; }
    .install-actions { display:flex; gap:8px; }
    .install-btn {
      background: linear-gradient(90deg, #4776E6 0%, #8E54E9 100%);
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
    }
    .dismiss-btn {
      background: transparent;
      border: 1px solid #ddd;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
    }

    @media (max-width: 480px) {
      .todo-app {
        max-width: 100%;
      }
      
      .header {
        padding: 20px 15px;
      }
      
      .header h1 {
        font-size: 1.8rem;
      }
      
      .input-section {
        padding: 15px;
      }
      
      .task-item {
        padding: 15px 0;
      }
    }
  </style>