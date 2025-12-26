<template>
  <div id="app">
    <router-view />
    <BottomNav v-if="showBottomNav" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from './store/user'
import BottomNav from './components/BottomNav.vue'

const route = useRoute()
const userStore = useUserStore()

// 显示底部导航的页面
const showBottomNav = computed(() => {
  // 隐藏底部导航的页面：首页、登录页、投屏页
  const hideNavRoutes = ['/', '/login', '/display']
  return !hideNavRoutes.includes(route.path) && userStore.isLoggedIn
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  background: #f8fafc;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

