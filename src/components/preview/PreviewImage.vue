<template>
  <div class="image-viewer">
    <el-image-viewer :initial-index="previewImageIndex" hide-on-click-modal :url-list="imageList"
                     @close="closeImgViewer" v-if="previewImageIndex != null">

    </el-image-viewer>
  </div>
</template>

<script setup>
import {ref} from "vue";

const props = defineProps({
  imageList: {
    type: Array,
  }
})
const previewImageIndex = ref(null)

const show = (index) => {
  stopScroll()
  previewImageIndex.value = index
}
defineExpose({
  show,
})

const closeImgViewer = () => {
  startScroll()
  previewImageIndex.value = null
}

// 禁止外部滚动
const stopScroll = () => {
  document.body.style.overflow = "hidden"
}
// 开启外部滚动
const startScroll = () => {
  document.body.style.overflow = "auto"
}
</script>

<style scoped lang="scss">
.image-viewer {
  .el-image-viewer__mask {
    opacity: 0.7;
  }
}
</style>