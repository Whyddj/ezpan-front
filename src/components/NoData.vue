<template>
  <div class="no-data">
    <div>
      <Icon :width="120" fit="fill" iconName="no_data"/>
    </div>
    <div class="msg">{{ msg }}</div>
  </div>
</template>

<script setup>
const props = defineProps({
  msg: {
    type: String,
  },
  iconName: {
    type: String,
  },
})
</script>

<style scoped lang="scss">
.no-data {
  text-align: center;
  padding: 10px 0;
  .msg {
    margin-top: 10px;
    color: #909399;
    font-size: 14px;
  }
}
</style>