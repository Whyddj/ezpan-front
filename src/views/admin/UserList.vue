<template>
  <div>
    <div class="top-panel">
      <el-form :model="searchFormData" ref="formDataRef" label-width="80px" @submit.prevent>
        <el-row>
          <el-col :span="4">
            <el-form-item label="用户昵称">
              <el-input clearable placeholder="支持模糊搜索" v-model.trim="searchFormData.nickNameFuzzy"
                        @keyup.enter="loadDataList"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="状态">
              <el-select v-model="searchFormData.status" placeholder="请选择" clearable @change="loadDataList">
                <el-option label="启用" :value="1"></el-option>
                <el-option label="禁用" :value="0"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4" :style="{'padding-left':'10px'}">
            <el-button type="primary" @click="loadDataList">查询</el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="file-list">
      <Table ref="dataTableRef" :columns="columns" :dataSource="tableData" :fetch="loadDataList" :initFetch="true"
             :options="tableOptions" @rowSelected="rowSelected">
        <template #avatar="{ index, row }">
          <div class="avatar">
            <Avatar :userId="row.userId" :avatar="row.qqAvatar"/>
          </div>
        </template>
        <template #space="{ index, row }">
          {{ proxy.Utils.size2Str(row.useSpace) }}/{{ proxy.Utils.size2Str(row.totalSpace) }}
        </template>
        <template #status="{ index, row }">
          <span v-if="row.status === 1" style="color:#529b2e">启用</span>
          <span v-if="row.status === 0" style="color:#f56c62">禁用</span>
        </template>
        <template #op="{ index, row }">
          <span class="a-link" @click="updateSpace(row)">分配空间</span>
          <el-divider direction="vertical"></el-divider>
          <span class="a-link" @click="updateStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</span>
        </template>
      </Table>
    </div>
    <Dialog :show="dialogConfig.show" :title="dialogConfig.title" :buttons="dialogConfig.buttons"
            width="400px" :showCancel="false" @close="dialogConfig.show = false">
      <el-form :model="dialogFormData" :rules="dialogRules" ref="dialogFormRef" label-width="80px" @submit.prevent>
        <el-form-item label="用户昵称">
          {{ dialogFormData.nickName }}
        </el-form-item>
        <el-form-item label="空间大小">
          <el-input v-model.trim="dialogFormData.changeSpace" clearable placeholder="请输入空间大小">
            <template #suffix>MB</template>
          </el-input>
        </el-form-item>
      </el-form>
    </Dialog>
  </div>
</template>

<script setup>

import {getCurrentInstance, nextTick, reactive, ref} from "vue";
import Avatar from "@/components/Avatar.vue";
import Dialog from "@/components/Dialog.vue";

const {proxy} = getCurrentInstance()

const api = {
  loadDataList: "/admin/loadUserList",
  updateUserStatus: "/admin/updateUserStatus",
  updateUserSpace: "/admin/updateUserSpace",
}

const columns = [
  {
    label: "头像",
    prop: "avatar",
    width: 80,
    scopedSlots: "avatar"
  },
  {
    label: "昵称",
    prop: "nickName",
  },
  {
    label: "邮箱",
    prop: "email",
  },
  {
    label: "空间使用",
    prop: "space",
    scopedSlots: "space"
  },
  {
    label: "注册时间",
    prop: "joinTime",
  },
  {
    label: "最后登录",
    prop: "lastLoginTime",
  },
  {
    label: "状态",
    prop: "status",
    width: 80,
    scopedSlots: "status"
  },
  {
    label: "操作",
    prop: "op",
    width: 150,
    scopedSlots: "op"
  },
]

const searchFormData = ref({})

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
  Object.assign(params, searchFormData.value)
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
const selectFileIdList = ref([])
const rowSelected = (rows) => {
  selectFileIdList.value = []
  rows.forEach(row => {
    selectFileIdList.value.push(row.userId + "_" + row.fileId)
  })
}
// 修改状态
const updateStatus = (row) => {
  let status = row.status === 1 ? 0 : 1
  proxy.Confirm(`确定${status === 1 ? '启用' : '禁用'}【${row.nickName}】吗？`, async () => {
    let result = await proxy.Request({
      url: api.updateUserStatus,
      params: {
        userId: row.userId,
        status: status
      }
    })
    if (!result) {
      return
    }
    loadDataList()
  })
}

const dialogConfig = ref({
  show: false,
  title: "分配空间",
  buttons: [
    {
      text: "确定",
      type: "primary",
      click: () => {
        submitForm()
      },
    }
  ]
})

const dialogFormData = ref({
  nickName: "",
  changeSpace: ""
})

const dialogFormRef = ref(null)

const dialogRules = {
  changeSpace: [
    {required: true, message: "请输入空间大小", trigger: "blur"},
    {type: "number", message: "请输入数字", trigger: "blur"},
  ]
}

const updateSpace = (row) => {
  dialogConfig.value.show = true
  nextTick(() => {
    dialogFormRef.value.resetFields()
    dialogFormData.value.nickName = row.nickName
    dialogFormData.value.userId = row.userId
    dialogFormData.value.changeSpace = ""
  })
}

const submitForm = () => {
  dialogFormRef.value.validate((valid) => {
    if (valid) {
      updateUserSpace()
    }
  })
}

const updateUserSpace = async () => {
  let params = {}
  Object.assign(params, dialogFormData.value)
  let result = await proxy.Request({
    url: api.updateUserSpace,
    params: params
  })
  if (!result) {
    return
  }
  dialogConfig.value.show = false
  loadDataList()
}
</script>

<style lang="scss" scoped>
.top-panel {
  margin-top: 10px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
  }
}
</style>