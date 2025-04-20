<template>
  <router-view />
</template>

<style lang="scss">
#app {
  min-height:100vh;
  min-width: 100%;
  display: flex;
  flex-direction: column;
  background: #f1f2f3;
  padding-top: 60px;

  /* 全局容器样式（强制左右铺满） */
  .container {
    width: 100%;
    padding: 20px;
    box-sizing: border-box; /* 包含内边距 */
  }
}
</style>
