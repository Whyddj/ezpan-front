<template>
  <div>
    <Dialog :show="dialogConfig.show" :title="dialogConfig.title" :buttons="dialogConfig.buttons"
    width="600px" :showCancel="false" @close="dialogConfig.show = false">
      <div class="navigation-panel">
        <Navigation ref="navigationRef" @navChange="navChange" :watchPath="false"></Navigation>
      </div>
      <div class="folder-list" v-if="folderList.length > 0">
        <div class="folder-item" v-for="folder in folderList"
        @click="folderSelect(folder)">
          <Icon :fileType="0"></Icon>
          <span class="file-name">{{ folder.fileName }}</span>
        </div>
      </div>
      <div v-else class="tips">
        移动到此处？
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import {getCurrentInstance, ref} from "vue";
const { proxy } = getCurrentInstance();
import Dialog from "@/components/Dialog.vue";


const api = {
  loadAllFolder: "/file/loadAllFolder",
}

const dialogConfig = ref({
  show: false,
  title: "移动到",
  buttons: [
    {
      text: "移动到此",
      type: "primary",
      click: (e) => {
        moveToHere();
      },
    }
  ]
})
// 父级id
const filePid = ref("0")
const folderList = ref([])
const currentFolder = ref({})


const loadAllFolder = async () => {
  let result = await proxy.Request({
    url: api.loadAllFolder,
    params: {
      filePid: filePid.value,
    }
  })
  if (!result) {
    return
  }
  folderList.value = result.data
}

const showFolderDialog = () => {
  dialogConfig.value.show = true
  loadAllFolder()
}
const closeDialog = () => {
  dialogConfig.value.show = false
}
defineExpose({
  showFolderDialog,
  closeDialog
})

// 选择目录
const navigationRef = ref()
const folderSelect = (folder) => {
  navigationRef.value.openFolder(folder)
}

// 导航
const navChange = (data) => {
  const {curFolder} = data
  currentFolder.value = curFolder
  filePid.value = curFolder.fileId
  loadAllFolder()
}

// 移动
const emit = defineEmits(["move"])
const moveToHere = () => {
  emit("move", filePid.value)
  filePid.value = "0"
}
</script>

<style scoped lang="scss">
.navigation-panel {
  padding-left: 10px;
  background: #f1f1f1;
}

.folder-list {
  .folder-item {
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 10px;
    .file-name {
      display: inline-block;
      margin-left: 10px;
    }
    &:hover {
      background: #f8f8f8;
    }
  }
  max-height: calc(100vh - 200px);
  min-height: 200px;
}

.tips {
  text-align: center;
  line-height: 200px;
  span {
    color: #06a7ff;
  }
}
</style>