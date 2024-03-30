<template>
  <div>
    <div class="top">
      <!--操作-->
      <div class="top-op">
        <div class="btn">
          <el-upload :show-file-list="false" :with-credentials="true" :mutiple="true" :http-request="addFile"
                     :accept="fileAccept">
            <el-button type="primary">
              <span class="iconfont icon-upload"></span>
              上传
            </el-button>
          </el-upload>
        </div>
        <el-button type="success" @click="newFolder">
          <span class="iconfont icon-folder-add"></span>
          新建文件夹
        </el-button>
        <el-button type="danger" :disabled="selectFileIdList.length === 0" @click="delFileBatch">
          <span class="iconfont icon-del"></span>
          批量删除
        </el-button>
        <el-button type="warning" :disabled="selectFileIdList.length === 0" @click="moveFolderBatch">
          <span class="iconfont icon-move"></span>
          批量移动
        </el-button>
        <div class="search-panel">
          <el-input clearable placeholder="请输入文件名搜索" v-model="fileNameFuzzy" @keyup.enter="search">
            <template #suffix>
              <i class="iconfont icon-search" @click="search"></i>
            </template>
          </el-input>
        </div>
        <div class="iconfont icon-refresh" @click="loadDataList"></div>
      </div>
      <!--导航-->
      <Navigation ref="navigationRef" @navChange="navChange"/>
    </div>
    <!--文件列表-->
    <div class="file-list" v-if="tableData.list && tableData.list.length > 0">
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
            <span v-if="row.status === 0" class="transfer-status">转码中</span>
            <span v-if="row.status === 1" class="transfer-status transfer-fail">转码失败</span>
          </span>
            <!--编辑、新建文件夹-->
            <div class="edit-panel" v-if="row.showEdit">
              <el-input v-model.trim="row.fileNameReal" ref="editNameRef" :maxLength="190"
                        @keyup.enter="saveNameEdit(index)">
                <template #suffix>{{ row.fileSuffix }}</template>
              </el-input>
              <span :class="['iconfont icon-right1', row.fileNameReal ? '' : 'not-allow']"
                    @click="saveNameEdit(index)">
            </span>
              <span class="iconfont icon-error" @click="cancelNameEdit(index)"></span>
            </div>
            <span class="op">
            <template v-if="row.showOp && row.fileId && row.status === 2">
              <span class="iconfont icon-share1" @click="share(row)">分享</span>
              <span class="iconfont icon-download" v-if="row.folderType === 0" @click="download(row)">下载</span>
              <span class="iconfont icon-del" @click="delFile(row)">删除</span>
              <span class="iconfont icon-edit" @click="editFileName(index)">重命名</span>
              <span class="iconfont icon-move" @click="moveSingleFolder(row)">移动</span>
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
    <!--列表为空-->
    <div class="no-data" v-else>
      <div class="no-data-inner">
        <Icon iconName="no_data" :width="120" fit="fill"></Icon>
        <div class="tips">当前目录为空，上传你的第一个文件吧</div>
        <div class="op-list">
          <el-upload :show-file-list="false" :with-credentials="true" :mutiple="true" :http-request="addFile"
                     :accept="fileAccept">
            <div class="op-item">
              <Icon iconName="file" :width="60"></Icon>
              <div>上传文件</div>
            </div>
          </el-upload>
          <div class="op-item" @click="newFolder" v-if="category==='all'">
            <Icon iconName="folder" :width="60"></Icon>
            <div>新建文件夹</div>
          </div>
        </div>
      </div>
    </div>
    <FolderSelect ref="folderSelectRef" @move="moveFolderDone"></FolderSelect>
    <Preview ref="previewRef"></Preview>
    <ShareFile ref="shareRef"></ShareFile>
  </div>
</template>

<script setup>
import {ref, reactive, getCurrentInstance, nextTick, computed} from "vue"
import CategoryInfo from "@/js/CategoryInfo.js";
import ShareFile from "@/views/main/ShareFile.vue";

const {proxy} = getCurrentInstance();

const emit = defineEmits(["addFile"])
const addFile = (fileData) => {
  emit("addFile", {file: fileData.file, filePid: currentFolder.value.fileId}) //
}

// 添加文件回调
const reload = () => {
  showLoading.value = false
  loadDataList()
}
defineExpose({
  reload
})


const currentFolder = ref({fileId: "0"})

const api = {
  loadDataList: "/file/loadDataList",
  rename: "/file/rename",
  newFolder: "/file/newFolder",
  getFolderInfo: "/file/getFolderInfo",
  deleteFile: "/file/delFile",
  changeFileFolder: "/file/changeFileFolder",
  createDownloadUrl: "/file/createDownloadUrl",
  download: "/api/file/download",
}

const fileAccept = computed(() => {
  const categoryItem = CategoryInfo[category.value]
  return categoryItem ? categoryItem.accept : "*"
})

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

// 搜索
const search = () => {
  loadDataList()
}
const tableData = ref({
  pageNo: 1,
  pageSize: 15,
  totalCount: 0,
  list: [],
})
const fileNameFuzzy = ref("")
const showLoading = ref(true)
const category = ref()

const loadDataList = async () => {
  let params = {
    pageNo: tableData.value.pageNo,
    pageSize: tableData.value.pageSize,
    fileNameFuzzy: fileNameFuzzy.value,
    filePid: currentFolder.value.fileId,
    category: category.value
  }
  if (fileNameFuzzy.value !== "") {
    delete params.filePid;
  }
  if (params.category !== "all") {
    delete params.filePid;
  }
  let result = await proxy.Request({
    url: api.loadDataList,
    showLoading: showLoading.value,
    params: params
  })
  if (!result) {
    return
  }
  tableData.value = result.data
  showLoading.value = false
}

const tableOptions = reactive({
  extHeight: 50,
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

const delFile = (row) => {
  proxy.Confirm(`确定删除【${row.fileName}】吗？删除的文件将保存在回收站10天`, async () => {
    let result = await proxy.Request({
      url: api.deleteFile,
      params: {
        fileIds: row.fileId
      }
    })
    if (!result) {
      return
    }
    loadDataList()
  })
}

const delFileBatch = () => {
  if (selectFileIdList.value.length === 0) {
    return
  }
  proxy.Confirm("确定删除选中的文件吗？删除的文件将保存在回收站10天", async () => {
    let result = await proxy.Request({
      url: api.deleteFile,
      params: {
        fileIds: selectFileIdList.value.join(",")
      }
    })
    if (!result) {
      return
    }
    loadDataList()
  })
}


const folderSelectRef = ref({})
const currentMoveFile = ref({})

const moveSingleFolder = (row) => {
  currentMoveFile.value = row
  folderSelectRef.value.showFolderDialog();
}
const moveFolderBatch = () => {
  currentMoveFile.value = {}
  folderSelectRef.value.showFolderDialog();
}
const moveFolderDone = async (folderId) => {
  if (folderId === currentFolder.value.fileId) {
    proxy.Message.warning("文件已经在当前文件夹下，无需移动")
    return
  }
  let fileIdsArray = []
  if (currentMoveFile.value.fileId) {
    fileIdsArray.push(currentMoveFile.value.fileId)
  } else {
    fileIdsArray = fileIdsArray.concat(selectFileIdList.value)
  }
  let result = await proxy.Request({
    url: api.changeFileFolder,
    params: {
      fileIds: fileIdsArray.join(","),
      filePid: folderId
    }
  })
  if (!result) {
    return
  }
  folderSelectRef.value.closeDialog()
  loadDataList()
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

// 编辑行
const editing = ref(false)
const editNameRef = ref("")

// 新建文件夹
const newFolder = () => {
  if (editing.value) {
    return
  }
  tableData.value.list.forEach(item => { // 隐藏所有的编辑框
    item.showEdit = false;
  })
  editing.value = true;
  tableData.value.list.unshift({ // 在数组的开头添加一个元素
    showEdit: true,
    fileType: 0,
    fileId: "",
    filePid: currentFolder.value.fileId,
    fileNameReal: "",
  })
  nextTick(() => { // 等待dom渲染完成
    // 定位到输入框
    editNameRef.value.focus()
  })
}
// 取消新建文件夹
const cancelNameEdit = (index) => {
  const fileData = tableData.value.list[index];
  if (fileData.fileId) { // 如果有fileId，说明是对已有文件的编辑
    fileData.showEdit = false;
  } else {
    tableData.value.list.shift(); // 删除数组的第一个元素
  }
  editing.value = false;
}

const saveNameEdit = async (index) => {
  const {fileId, filePid, fileNameReal} = tableData.value.list[index]
  if (fileNameReal === "" || fileNameReal.indexOf("/") !== -1) {
    proxy.Message.warning("文件名不能为空且不能含有斜杠")
    return
  }
  let url = api.rename
  if (fileId === "") {
    url = api.newFolder
  }
  let result = await proxy.Request({
    url: url,
    params: {
      fileId: fileId,
      filePid: filePid,
      folderName: fileNameReal,
      fileNewName: fileNameReal
    }
  })
  if (!result) {
    return;
  }
  tableData.value.list[index] = result.data;
  editing.value = false;
}

// 
const editFileName = (index) => {
  if (tableData.value.list[0].fileId === "") {
    tableData.value.list.splice(0, 1);
    index = index - 1
  }
  tableData.value.list.forEach(element => {
    element.showEdit = false
  })
  let currentData = tableData.value.list[index]
  currentData.showEdit = true
  // 编辑文件
  if (currentData.folderType === 0) {
    currentData.fileNameReal = currentData.fileName.substring(0, currentData.fileName.lastIndexOf("."))
    currentData.fileSuffix = currentData.fileName.substring(currentData.fileName.lastIndexOf("."))
  } else {
    currentData.fileNameReal = currentData.fileName
    currentData.fileSuffix = ""
  }
  editing.value = true
  nextTick(() => {
    editNameRef.value.focus()
  })
}

// 预览
const navigationRef = ref()
const previewRef = ref()
const preview = (data) => {
  // 目录
  if (data.folderType === 1) {
    fileNameFuzzy.value = ""
    navigationRef.value.openFolder(data)
    return
  }
  // 文件
  if (data.status !== 2) {
    proxy.Message.warning("文件转码未完成，无法预览")
    return
  }
  previewRef.value.showPreview(data, 0)
}

const navChange = (data) => {
  const {categoryId, curFolder} = data
  currentFolder.value = curFolder
  category.value = categoryId

  loadDataList()
}

// 下载
const download = async (row) => {
  let result = await proxy.Request({
    url: api.createDownloadUrl + "/" + row.fileId
  })
  if (!result) {
    return
  }
  window.location.href = api.download + "/" + result.data
}

// 分享
const shareRef = ref()
const share = (row) => {
  shareRef.value.show(row)
}
</script>

<style lang="scss" scoped>
@import "@/assets/file.list";
</style>