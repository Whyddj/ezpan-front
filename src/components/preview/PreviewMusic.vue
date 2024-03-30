<template>
  <div class="music ">
    <div class="body-content">
      <div class="cover">
        <img src="@/assets/music_cover.png" alt="music-cover">
      </div>
      <div ref="playerRef" class="music-player"></div>
    </div>
  </div>
</template>

<script setup>
import APlayer from "APlayer"
import "APlayer/dist/APlayer.min.css"

import {getCurrentInstance, onMounted, onUnmounted, ref} from "vue";

const {proxy} = getCurrentInstance()

const props = defineProps({
  url: {
    type: String,
  },
  fileName: {
    type: String,
  }
})

const playerRef = ref()
const player = ref()
onMounted(() => {
  player.value = new APlayer({
    container: playerRef.value,
    audio: [
      {
        name: props.fileName,
        url: `/api/${props.url}`,
        cover: new URL("@assets/music_cover.png", import.meta.url).href,
        artist: "",
      }
    ]
  })
})

onUnmounted(() => {
  player.value.destroy()
})
</script>

<style scoped lang="scss">
.music {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  .body-content {
    text-align: center;
    width: 80%;
    .cover {
      margin: 0 auto;
      width: 200px;
      text-align: center;
      img {
        width: 100%;
      }
    }
    .music-player {
      margin-top: 20px;
    }
  }
}
</style>