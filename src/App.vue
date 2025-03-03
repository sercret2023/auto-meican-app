<template>
  <router-view></router-view>
</template>

<script>
const debounce=(fn,delay)=>{
  let timer;
  return(...args)=>{
    if(timer){
      clearTimeout(timer);
    }
    timer = setTimeout(()=>{
      fn(...args);
    },delay);
  }
}
const _resizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _resizeObserver {
  constructor(callback){
    callback=debounce(callback,200)
    super(callback)
  }
}
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
  margin-top: 60px;
}
</style>
