<template>
  <div>
    <div class="top">
      <el-button type="success" @click="revertBatch" :disabled="selectIdList.length===0">
        <span class="iconfont icon-revert"></span>
        还原
      </el-button>
      <el-button type="danger" @click="delBatch" :disabled="selectIdList.length===0">
        <span class="iconfont icon-del"></span>
        彻底删除
      </el-button>
    </div>
    <div class="file-list">
      <Table ref="dataTableRef" :columns="columns" :dataSource="tableData" :fetch="loadDataList" :initFetch="true"
             :options="tableOptions" @rowSelected="rowSelected">
        <template #fileName="{index, row}">
          <div class="file-item" @mouseenter="showOp(row)" @mouseleave="cancelShowOp(row)">
            <template v-if="(row.fileType === 3 || row.fileType === 1)&&row.status!==0">
              <Icon :cover="row.fileCover"></Icon>
            </template>
            <template v-else>
              <Icon v-if="row.folderType===0" :fileType="row.fileType"></Icon>
              <Icon v-else :fileType="0"></Icon>
            </template>
            <span class="file-name" :title="row.fileName">
              {{row.fileName}}
            </span>
            <span class="op" v-if="row.showOp">
              <span class="iconfont icon-link" @click="revert(row)">还原</span>
              <span class="iconfont icon-cancel" @click="delFile(row)">删除</span>
            </span>
          </div>
        </template>
        <template #fileSize="{index, row}">
          <span v-if="row.fileSize">{{proxy.Utils.size2Str(row.fileSize)}}</span>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup>

import {getCurrentInstance, reactive, ref} from "vue";
const {proxy} = getCurrentInstance();

const api = {
  loadDataList: "/recycle/loadRecycleList",
  recoverFile: "/recycle/recoveryFile",
  delete: "/recycle/delFile"
}

const columns = [
  {
    label: '文件名',
    prop: 'fileName',
    scopedSlots: 'fileName'
  },
  {
    label: '删除时间',
    prop: 'recoveryTime',
    width: 200
  },
  {
    label: '大小',
    prop: 'fileSize',
    scopedSlots: 'fileSize',
    width: 200
  }
]
const tableData = ref({
  pageNo: 1,
  pageSize: 15,
  totalCount: 0,
  list: [],
})
const tableOptions = reactive({
  extHeight: 50,
  selectType: "checkbox",
})
const loadDataList = async () => {
  let params = {
    pageNo: tableData.value.pageNo,
    pageSize: tableData.value.pageSize,
  }
  let result = await proxy.Request({
    url: api.loadDataList,
    params: params
  })
  if (!result) {
    return
  }
  tableData.value = result.data
}
// 多选
const selectIdList = ref([])
const rowSelected = (rows) => {
  selectIdList.value = []
  rows.forEach(row => {
    selectIdList.value.push(row.fileId)
  })
}

const showOp = (row) => {
  tableData.value.list.forEach(item=>{
    item.showOp = true
  })
  row.showOp = true
}

const cancelShowOp = (row) => {
  row.showOp = false
}

// 恢复
const revert = async (row) => {
  proxy.Confirm(`你确定要还原文件【${row.fileName}】吗？`, async () => {
    let result = await proxy.Request({
      url: api.recoverFile,
      params: {
        fileIds: row.fileId
      }
    })
    if (result) {
      proxy.Message.success("还原成功")
      loadDataList()
    }
  })
}

const revertBatch = async () => {
  proxy.Confirm(`你确定要还原选中的文件吗？`, async () => {
    let result = await proxy.Request({
      url: api.recoverFile,
      params: {
        fileIds: selectIdList.value.join(",")
      }
    })
    if (result) {
      proxy.Message.success("还原成功")
      loadDataList()
    }
  })
}

// 删除
const emit = defineEmits(["reload"])
const delFile = async (row) => {
  proxy.Confirm(`你确定要彻底删除文件【${row.fileName}】吗？`, async () => {
    let result = await proxy.Request({
      url: api.delete,
      params: {
        fileIds: row.fileId
      }
    })
    if (result) {
      proxy.Message.success("删除成功")
      loadDataList()
      emit("reload")
    }
  })
}

const delBatch = async () => {
  proxy.Confirm(`你确定要彻底删除选中的文件吗？`, async () => {
    let result = await proxy.Request({
      url: api.delete,
      params: {
        fileIds: selectIdList.value.join(",")
      }
    })
    if (result) {
      proxy.Message.success("删除成功")
      loadDataList()
      emit("reload")
    }
  })
}
</script>

<style lang="scss" scoped>
@import "@/assets/file.list";
.file-list {
  margin-top: 10px;
  .file-item {
    .op {
      width: 120px;
    }
  }
}


</style>