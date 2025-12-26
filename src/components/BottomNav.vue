<template>
  <van-tabbar v-model="active" @change="onChange" fixed placeholder>
    <van-tabbar-item icon="home-o" to="/tournaments">比赛</van-tabbar-item>
    <van-tabbar-item icon="calendar-o" to="/schedule">赛程</van-tabbar-item>
    <van-tabbar-item icon="medal-o" to="/ranking">排名</van-tabbar-item>
    <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(0)

// 监听路由变化，更新active
watch(() => route.path, (path) => {
  if (path === '/tournaments') {
    active.value = 0
  } else if (path === '/schedule') {
    active.value = 1
  } else if (path === '/ranking') {
    active.value = 2
  } else if (path === '/profile') {
    active.value = 3
  }
}, { immediate: true })

function onChange(index) {
  // 导航切换由路由处理
}
</script>

<style scoped>
:deep(.van-tabbar-item--active) {
  color: #6366f1;
}
</style>

