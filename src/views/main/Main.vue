<template>
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
      <el-button class="success" @click="newFolder">
        <span class="iconfont icon-folder-add"></span>
        新建文件夹
      </el-button>
      <el-button class="danger">
        <span class="iconfont icon-del"></span>
        批量删除
      </el-button>
      <el-button class="warning">
        <span class="iconfont icon-move"></span>
        批量移动
      </el-button>
      <div class="search-panel">
        <el-input clearable placeholder="请输入文件名搜索">
          <template #suffix>
            <i class="iconfont icon-search"></i>
          </template>
        </el-input>
      </div>
      <div class="iconfont icon-refresh"></div>
    </div>
    <!--导航-->
    <div>全部文件</div>
  </div>
  <div class="file-list">
    <Table ref="dataTableRef" :columns="columns" :dataSource="tableData" :fetch="loadDataList" :initFetch="false"
           :options="tableOptions" @rowSelected="rowSelected">
      <template #fileName="{ index, row }">
        <div class="file-item" @mouseenter="showOp(row)" @mouseleave="cancelShowOp(row)">
          <template v-if="row.fileType == 3 || row.fileType == 1 && row.status == 2">
            <Icon :width="32" :cover="row.fileCover"/>
          </template>
          <template v-else>
            <Icon v-if="row.fileType == 0" :fileType="row.fileType"/>
            <Icon v-if="row.fileType == 1" :fileType="0"/>
          </template>
          <span class="file-name" v-if="!row.showEdit" :tile="row.fileName">
            <span>{{ row.fileName }}</span>
            <span v-if="row.status == 0" class="transfer-stasus">转码中</span>
            <span v-if="row.status == 1" class="transfer-stasus transfer-fail">转码失败</span>
          </span>
          <!--编辑、新建文件夹-->
          <div class="edit-panel" v-if="row.showEdit">
            <el-input v-model="row.fileNameReal" ref="editNameRef" :maxLength="190"
                      @keyup.enter="saveNameEdit(index)">
              <template #suffix>{{ row.fileSuffix }}</template>
            </el-input>
            <el-button :class="['iconfont icon-right1', row.fileNameReal ? '' : 'not-allow']"
                       @click="saveNameEdit(index)">确定
            </el-button>
            <el-button class="iconfont icon-error" @click="cancelNameEdit(index)">取消</el-button>
          </div>
          <span class="op">
            <template v-if="row.showOp && row.fileId && row.status == 2">
              <span class="iconfont icon-share1">分享</span>
              <span class="iconfont icon-download" v-if="row.folderType == 0">下载</span>
              <span class="iconfont icon-del">删除</span>
              <span class="iconfont icon-edit" @click="editFileName(index)">重命名</span>
              <span class="iconfont icon-move">移动</span>
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

<script setup>
import {ref, reactive, getCurrentInstance, nextTick} from "vue"

const {proxy} = getCurrentInstance();

const emit = defineEmits(["addFile"])
const addFile = (fileData) => {
  emit("addFile", {file: fileData.file, filePid: currentFolder.value.fileId}) //
}

const currentFolder = ref({fileId: 0})

const api = {
  loadDataList: "/file/loadDataList",
  rename: "/file/rename",
  newFolder: "/file/newFolder",
  getFolderInfo: "/file/getFolderInfo",
  deleteFile: "/file/deleteFile",
  changeFileFolder: "/file/changeFileFolder",
  createDownloadUrl: "/file/createDownloadUrl",
  download: "/file/download",
}

const columns = [
  {
    label: "文件名",
    prop: "fileName",
    scopedSlot: "fileName"
  },
  {
    label: "修改时间",
    prop: "lastUpdateTime",
    width: 200,
  },
  {
    label: "大小",
    prop: "fileSize",
    scopedSlot: "fileSize",
    width: 200,
  },

]

const tableData = ref({})

const fileNameFuzzy = ref()

const loadDataList = async () => {
  let params = {
    page: tableData.value.pageNo,
    pageSize: tableData.value.pageSize,
    fileNameFuzzy: fileNameFuzzy.value,
    filePid: 0,
  }
  if (params.categroy != "all") {
    delete params.filePid;
  }
  let result = await proxy.Request({
    url: api.loadDataList,
    params: params
  })
  if (!result) {
    return
  }
  tableData.value = result
}

const tableOptions = reactive({
  extHeight: 50,
  selectType: "checkbox",
})

const rowSelected = () => {
}

// 展示操作
const showOp = (row) => {
  tableData.value.data.forEach(item => {
    item.showOp = false;
  });
  row.showOp = true;
}
const cancelShowOp = (row) => {
  row.showOp = false;
}

// 编辑行
const editing = ref(false)
const editNameRef = ref()

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
    filePid: 0,
  })
  nextTick(() => { // 等待dom渲染完成
    editNameRef.value.focus() // 定位到输入框
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
  if (fileNameReal == "" || fileNameReal.indexOf("/") != -1) {
    proxy.Message.warning("文件名不能为空且不能含有斜杠")
    return
  }
  let url = api.rename
  if (fileId == "") {
    url = api.newFolder
  }
  let result = await proxy.Request({
    url: url,
    params: {
      fileId: fileId,
      filePid: filePid,
      fileName: fileNameReal
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
  if (tableData.value.list[0].fileId == "") {
    tableData.value.list.splice(0, 1);
    index = index - 1
  }
  tableData.value.list.forEach(element => {
    element.showEdit = false
  })
  let currentData = tableData.value.list[index]
  currentData.showEdit = true
  // 编辑文件
  if (currentData.folderType == 0) {
    currentData.fileNameReal = currentData.fileName.substring(0, currentData.fileName.indexOf("."))
    currentData.fileSuffix = currentData.fileName.substring(currentData.fileName.indexOf("."))
  } else {
    currentData.fileNameReal = currentData.fileName
    currentData.fileSuffix = ""
  }
  editing.value = true
  nextTick(() => {
    editNameRef.value.focus()
  })
}
</script>

<style lang="scss" scoped>
@import "@/assets/file.list";
</style>