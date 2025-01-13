<template>
  <div class="get-cookie">
    <h1>如何获取Cookie</h1>
    <div class="content">
      <p>1. 打开浏览器开发者工具 (F12)</p>
      <p>2. 访问<a target="_blank" href="https://www.meican.com/">美餐网站</a>并登录</p>
      <p>3. 在开发者工具的Network选项卡中查找请求记录中的Request Headers </p>
      <p>4. 复制Header名称为 Cookie 的内容</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GetCookiePage'
}
</script>

<style scoped>
.get-cookie {
  max-width: 800px;
  margin: 40px auto;
  padding: 24px;
}

h1 {
  margin-bottom: 24px;
  color: #409EFF;
}

.content {
  line-height: 1.8;
  font-size: 16px;
}

@media (max-width: 768px) {
  .get-cookie {
    padding: 16px;
  }
  
  h1 {
    font-size: 24px;
  }
  
  .content {
    font-size: 14px;
  }
}
</style> 