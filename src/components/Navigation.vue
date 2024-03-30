<template>
  <div class="top-navigation">
    <template v-if="folderList.length > 0">
      <span class="back link" @click="backParent">返回上一级</span>
      <el-divider direction="vertical"></el-divider>
    </template>
    <span v-if="folderList.length === 0" class="all-file">全部文件</span>
    <span v-if="folderList.length > 0" class="link" @click="setCurrentFolder(-1)">
      全部文件
    </span>
    <template v-for="(item, index) in folderList">
      <span class="iconfont icon-right"></span>
      <span class="link" v-if="index < folderList.length - 1" @click="setCurrentFolder(index)">
        {{ item.fileName }}
      </span>
      <span v-if="index === folderList.length - 1" class="text">
        {{ item.fileName }}
      </span>
    </template>
  </div>
</template>

<script setup>

import {getCurrentInstance, ref, watch} from "vue";

const {proxy} = getCurrentInstance()
import {useRouter, useRoute} from "vue-router";

const router = useRouter()
const route = useRoute()

const props = defineProps({
  watchPath: {
    type: Boolean,
    default: true
  },
  shareId: {
    type: String,
  },
  adminShow: {
    type: Boolean,
    default: false
  }
})

const api = {
  getFolderInfo: "/file/getFolderInfo",
  getFolderInfo4Share: "/showShare/loadFolderInfo",
  getFolderInfo4Admin: "/admin/getFolderInfo",
}

// 分类
const category = ref("all")
// 目录集合
const folderList = ref([])
// 当前目录
const currentFolder = ref({fileId: "0"})

const init = () => {
  folderList.value = []
  currentFolder.value = {fileId: "0"}
  doCallback()
}

const openFolder = (data) => {
  const {fileId, fileName} = data
  const folder = {
    fileName: fileName,
    fileId: fileId
  }
  folderList.value.push(folder)
  currentFolder.value = folder
  setPath()
}
defineExpose({openFolder})

const setPath = () => {
  if (!props.watchPath) {
    doCallback()
    return
  }

  let pathArray = []
  folderList.value.forEach(item => {
    pathArray.push(item.fileId)
  })
  router.push({
    path: route.path,
    query: pathArray.length === 0 ? "" : {path: pathArray.join("/")}
  })
}

const setCurrentFolder = (index) => {
  if (index === -1) {
    currentFolder.value = {fileId: "0"}
    folderList.value = []
  } else {
    folderList.value = folderList.value.slice(0, index + 1)
    currentFolder.value = folderList.value[index]
  }
  setPath()
}

// 返回上一级
const backParent = () => {
  if (folderList.length === 0) {
    return
  }
  folderList.value.pop()
  if (folderList.value.length === 0) {
    currentFolder.value = {fileId: "0"}
  } else {
    currentFolder.value = folderList.value[folderList.value.length - 1]
  }
  setPath()
}

// 获取当前文件夹的导航
const getNavigationFolder = async (path) => {
  let url = api.getFolderInfo
  if (props.shareId) {
    url = api.getFolderInfo4Share
  } else if (props.adminShow) {
    url = api.getFolderInfo4Admin
  }
  let result = await proxy.Request({
    url: url,
    showLoading: false,
    params: {
      path: path,
      shareId: props.shareId
    }
  })
  if (!result) {
    return
  }
  folderList.value = result.data
}

//
const emit = defineEmits(["navChange"])
const doCallback = () => {
  emit("navChange", {
    categoryId: category.value,
    curFolder: currentFolder.value
  })
}

watch( // 监听路由变化
    () => route,
    (newVal, oldVal) => {
      if (!props.watchPath) {
        return
      }
      if (newVal.path.indexOf("/main") === -1
          && newVal.path.indexOf("/settings/fileList") === -1
          && newVal.path.indexOf("/share") === -1) {
        return
      }
      const path = newVal.query.path
      category.value = newVal.params.category
      if (path === undefined) { // 根目录
        init()
      } else {
        getNavigationFolder(path)
        let pathArray = path.split("/")
        currentFolder.value = {
          fileId: pathArray[pathArray.length - 1],
        }
        doCallback()
      }
    },
    {immediate: true, deep: true}
)


</script>

<style scoped lang="scss">
.top-navigation {
  font-size: 13px;
  display: flex;
  align-items: center;
  line-height: 40px;

  .all-file {
    font-weight: bold;
  }

  .link {
    color: #06a7ff;
    cursor: pointer;
  }

  .icon-right {
    color: #06a7ff;
    padding: 0 5px;
    font-size: 13px;
  }
}
</style>