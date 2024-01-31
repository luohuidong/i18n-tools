<script setup lang="ts">
const text = "三";
const name = "张" + text + "丰";
const obj = {
  age: 25,
};
function a() {
  return "haha";
}
const greeting = `这位是${name}。他今年${obj.age}岁了。${a()}`;
</script>

<template>
  <div>
    <ul>
      <li>{{ name }}</li>
      <li>{{ greeting }}</li>
    </ul>
  </div>
</template>
