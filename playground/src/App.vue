<script setup lang="ts">
const text = "小";
const name = "张" + text + "三";
const greeting = `你好，${name}！`;
const obj = {
  name: "张三",
  age: 25,
};
</script>

<template>
  <div>
    <ul>
      <li>{{ obj.name + obj.age }}</li>
      <li>{{ greeting }}</li>
    </ul>
  </div>
</template>
