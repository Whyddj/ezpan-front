<template>
  <div class="window" v-if="show">
    <div class="window-mask" @click="close" v-if="show"></div>
    <div class="close" @click="close">
      <span class="iconfont icon-close2"></span>
    </div>
    <div class="window-content"
         :style="{top:'0', left: windowContentLeft + 'px', width: windowContentWidth + 'px'}">
      <div class="title">{{ title }}</div>
      <div class="content-body" :style="{'align-items':'align'}">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>


import {computed, onMounted, onUnmounted, ref} from "vue";

const props = defineProps({
  title: {
    type: String,
    default: "窗口",
  },
  show: {
    type: Boolean,
    default: false,
  },
  width: {
    type: Number,
    default: 1000,
  },
  align: {
    type: String,
    default: "top",
  },
})

const windowWidth = ref(window.innerWidth)
const windowContentWidth = computed(() => {
  return props.width > windowWidth.value ? windowWidth.value : props.width
})
const windowContentLeft = computed(() => {
  return (windowWidth.value - windowContentWidth.value) / 2
})

const emit = defineEmits(["close"])
const close = () => {
  emit("close")
}

// 监听窗口大小变化
const resizeWindow = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener("resize", resizeWindow)
})

onUnmounted(() => {
  window.removeEventListener("resize", resizeWindow)
})
</script>

<style scoped lang="scss">
.window {
  .window-mask {
    top: 0;
    left: 0;
    width: 100%;
    height: calc(100vh);
    z-index: 200;
    opacity: 0.5;
    background: #000;
    position: fixed;
  }

  .close {
    z-index: 202;
    cursor: pointer;
    position: absolute;
    top: 40px;
    right: 30px;
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background: #606266;
    display: flex;
    justify-content: center;
    align-items: center;

    .iconfont {
      font-size: 20px;
      color: #fff;
      z-index: 100000;
    }
  }

  .window-content {
    top: 0;
    z-index: 201;
    position: absolute;
    background: #fff;

    .title {
      text-align: center;
      line-height: 40px;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
    }

    .content-body {
      height: calc(100vh - 41px);
      display: flex;
      overflow: auto;
    }
  }
}
</style>