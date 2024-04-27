<template>
  <div>
    <div class="header">
      <div class='header-content'>
        <div class="logo" @click="jump">
          <span class="iconfont icon-pan"></span>
          <span class="name">EzPan</span>
        </div>
      </div>
    </div>
  </div>
  <div class="share-body">
    <template v-if="Object.keys(shareInfo).length===0">
      <div class="loading" v-loading="Object.keys(shareInfo).length===0"></div>
    </template>
    <template v-else>
      <div class="share-panel">
        <div class="share-user-info">
          <div class="avatar">
            <Avatar :userId="shareInfo.userId" :avatar="shareInfo.avatar"></Avatar>
          </div>
          <div class="share-info">
            <div class="user-info">
              <span class="nick-name">{{ shareInfo.nickName }}</span>
              <span class="share-time">分享于 {{ shareInfo.shareTime }}</span>
            </div>
            <div class="file-name">分享文件 {{ shareInfo.fileName }}</div>
          </div>
        </div>
        <div class="share-op-btn">
          <el-button type="primary" @click="cancelShare" v-if="shareInfo.currentUser">
            <span class="iconfont icon-cancel"></span>
            取消分享
          </el-button>
          <el-button type="primary" @click="saveShare" v-else :disabled="selectFileIdList.length===0">
            <span class="iconfont icon-import"></span>
            保存到我的网盘
          </el-button>
        </div>
      </div>
      <Navigation ref="navigationRef" @navChange="navChange" :shareId="shareId"></Navigation>
      <div class="file-list">
        <Table ref="dataTableRef" :columns="columns" :dataSource="tableData" :fetch="loadDataList" :initFetch="false"
               :options="tableOptions" @rowSelected="rowSelected">
          <template #fileName="{ index, row }">
            <div class="file-item" @mouseenter="showOp(row)" @mouseleave="cancelShowOp(row)">
              <template v-if="(row.fileType === 3 || row.fileType === 1) && row.status === 2">
                <Icon :width="32" :cover="row.fileCover"/>
              </template>
              <template v-else>
                <Icon v-if="row.folderType === 0" :fileType="row.fileType"/>
                <Icon v-if="row.folderType === 1" :fileType="0"/>
              </template>
              <span class="file-name" v-if="!row.showEdit" :title="row.fileName">
                  <span @click="preview(row)">{{ row.fileName }}</span>
                </span>
              <!--编辑、新建文件夹-->
              <span class="op">
                  <template v-if="row.showOp && row.fileId && row.status === 2">
                    <span class="iconfont icon-download" v-if="row.folderType === 0" @click="download(row)">下载</span>
                    <span class="iconfont icon-del" @click="saveOneShare(row)" v-if="row.showOp&&!shareInfo.currentUser">保存到我的网盘</span>
                  </template>
                </span>
            </div>
          </template>
          <!--文件大小-->
          <template #fileSize="{ index, row }">
            <span v-if="row.fileSize">{{ proxy.Utils.size2Str(row.fileSize) }}</span>
          </template>
        </Table>

      </div>
    </template>
    <!--目录选择-->
    <FolderSelect ref="folderSelectRef" @move="saveShareDone"></FolderSelect>
    <Preview ref="previewRef"></Preview>
  </div>
</template>

<script setup>
import {getCurrentInstance, nextTick, reactive, ref} from "vue";
import {useRouter, useRoute} from "vue-router";
import FolderSelect from "@/components/FolderSelect.vue";
const {proxy} = getCurrentInstance()

const router = useRouter()
const route = useRoute()

const api = {
  getShareLoginInfo: "/showShare/getShareLoginInfo",
  loadFilelist: "/showShare/loadFileList",
  createDownloadUrl: "/showShare/createDownloadUrl",
  download: "/api/showShare/download",
  cancelShare: "/share/cancelShare",
  saveShare: "/showShare/saveShare",
}

const shareId = route.params.shareId
const shareInfo = ref({})
const getShareInfo = async () => {
  let result = await proxy.Request({
    url: api.getShareLoginInfo,
    params: {
      shareId
    }
  })
  if (!result) {
    return
  }
  if (result.data == null) {
    await router.push("/shareCheck/" + shareId)
    return
  }
  shareInfo.value = result.data
}

getShareInfo()

const columns = [
  {
    label: "文件名",
    prop: "fileName",
    scopedSlots: "fileName"
  },
  {
    label: "修改时间",
    prop: "lastUpdateTime",
    width: 200,
  },
  {
    label: "大小",
    prop: "fileSize",
    scopedSlots: "fileSize",
    width: 200,
  },
]

const tableData = ref({
  pageNo: 1,
  pageSize: 15,
  totalCount: 0,
  list: [],
})
const dataTableRef = ref()
const tableOptions = reactive({
  extHeight: 80,
  selectType: "checkbox",
})

// 多选
const selectFileIdList = ref([])
const rowSelected = (rows) => {
  selectFileIdList.value = []
  rows.forEach(row => {
    selectFileIdList.value.push(row.fileId)
  })
}

const currentFolder = ref({fileId: "0"})
const loadDataList = async () => {
  let params = {
    pageNo: tableData.value.pageNo,
    pageSize: tableData.value.pageSize,
    shareId: shareId,
    filePid: currentFolder.value.fileId
  }
  let result = await proxy.Request({
    url: api.loadFilelist,
    params: params
  })
  if (!result) {
    return
  }
  tableData.value = result.data
}

// 展示操作
const showOp = (row) => {
  tableData.value.list.forEach(item => {
    item.showOp = false;
  });
  row.showOp = true;
}
const cancelShowOp = (row) => {
  row.showOp = false;
}

// 预览
const navigationRef = ref()
const previewRef = ref()
const preview = (data) => {
  // 目录
  if (data.folderType === 1) {
    navigationRef.value.openFolder(data)
    return
  }
  data.shareId = shareId
  previewRef.value.showPreview(data, 2)
}


const navChange = (data) => {
  const {curFolder} = data
  currentFolder.value = curFolder
  loadDataList()
}

// 下载
const download = async (row) => {
  let result = await proxy.Request({
    url: api.createDownloadUrl + "/" + shareId + "/" + row.fileId
  })
  if (!result) {
    return
  }
  window.location.href = api.download + "/" + result.data
}

// 保存到我的网盘
const folderSelectRef = ref({})
const saveShareFileIdArray = []
const saveShare = () => {
  if (selectFileIdList.value.length===0) {
    return
  }
  if (!proxy.VueCookies.get("userInfo")) {
    router.push("/login?redirectUrl=" + route.fullPath)
    return
  }
  saveShareFileIdArray.value = selectFileIdList.value
  folderSelectRef.value.showFolderDialog()
}

const saveShareDone = async (folderId) => {
  let params = {
    shareId,
    saveFileIds: saveShareFileIdArray.value.join(","),
    targetPid: folderId
  }
  let result = await proxy.Request({
    url: api.saveShare,
    params: params
  })
  if (!result) {
    return
  }
  proxy.Message.success("保存成功")
  folderSelectRef.value.closeDialog()
}

const saveOneShare = (row) => {
  if (!proxy.VueCookies.get("userInfo")) {
    router.push("/login?redirectUrl=" + route.fullPath)
    return
  }
  saveShareFileIdArray.value = [row.fileId]
  folderSelectRef.value.showFolderDialog()
}

// 取消分享
const cancelShare = async () => {
  proxy.Confirm("确定取消分享吗？", async () => {
    let result = await proxy.Request({
      url: api.cancelShare,
      params: {
        shareIds: shareId
      }
    })
    if (!result) {
      return
    }
    proxy.Message.success("取消分享成功")
    await router.push("/")
  })
}

const jump = () => {
  router.push("/")
}

</script>

<style scoped lang="scss">
@import "@/assets/file.list";

.header {
  width: 100%;
  position: fixed;
  background: #0c95f7;
  height: 50px;

  .header-content {
    width: 70%;
    margin: 0 auto;
    color: #fff;
    line-height: 50px;

    .logo {
      display: flex;
      align-items: center;
      cursor: pointer;

      .icon-pan {
        font-size: 40px;
      }

      .name {
        font-weight: bold;
        margin-left: 5px;
        font-size: 25px;
      }
    }
  }
}

.share-body {
  width: 70%;
  margin: 0 auto;
  padding-top: 50px;

  .loading {
    height: calc(100vh / 2);
    width: 100%;
  }

  .share-panel {
    margin-top: 20px;
    display: flex;
    justify-content: space-around;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;

    .share-user-info {
      flex: 1;
      display: flex;
      align-items: center;

      .avatar {
        margin-right: 5px;
      }

      .share-info {
        .user-info {
          display: flex;
          align-items: center;

          .nick-name {
            font-size: 15px;
          }

          .share-time {
            margin-left: 20px;
            font-size: 12px;
          }
        }

        .file-name {
          margin-top: 10px;
          font-size: 12px;
        }
      }
    }
  }
}

.file-list {
  margin-top: 10px;

  .file-item {
    .op {
      width: 170px;
    }
  }
}
</style>