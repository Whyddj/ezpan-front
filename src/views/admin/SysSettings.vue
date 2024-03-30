<template>
  <div>
    <div class="sys-setting-panel">
      <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="180px"
               @submit.prevent>
        <el-form-item label="注册邮箱标题" prop="registerEmailTitle">
          <el-input v-model.trim="formData.registerEmailTitle" clearable placeholder="请输入验证码邮件标题"></el-input>
        </el-form-item>
        <el-form-item label="注册邮箱内容" prop="registerEmailContent">
          <el-input v-model.trim="formData.registerEmailContent" clearable placeholder="请输入验证码邮件内容"></el-input>
        </el-form-item>
        <el-form-item label="初始空间大小" prop="userInitUseSpace">
          <el-input v-model.trim="formData.userInitUseSpace" clearable placeholder="请输入新用户初始空间大小"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>

import {getCurrentInstance, ref} from "vue";
const {proxy} = getCurrentInstance()

const api = {
  getSysSettings: "/admin/getSysSetting",
  saveSysSettings: "/admin/setSysSetting",
}

const formData = ref({
  registerEmailTitle: "",
  registerEmailContent: "",
  userInitUseSpace: "",
})
const formDataRef = ref()
const rules = {
  registerEmailTitle: [
    {required: true, message: "请输入验证码邮件标题", trigger: "blur"},
  ],
  registerEmailContent: [
    {required: true, message: "请输入验证码邮件内容", trigger: "blur"},
  ],
  userInitUseSpace: [
    {required: true, message: "请输入新用户初始空间大小", trigger: "blur"},
    {type: "number", message: "请输入数字", trigger: "blur"},
  ],
}

const getSysSettings = async () => {
  let result = await proxy.Request({
    url: api.getSysSettings,
  })
  if (!result) {
    return
  }
  formData.value = result.data
}
getSysSettings()

const saveSettings = async () => {
  formDataRef.value.validate(async valid => {
    if (!valid) {
      return
    }
    let params = {}
    Object.assign(params, formData.value)
    let result = await proxy.Request({
      url: api.saveSysSettings,
      params: params,
    })
    if (!result) {
      return
    }
    proxy.Message.success("保存成功")
  })
}
</script>

<style lang="scss" scoped>
.sys-setting-panel {
  margin-top: 20px;
  width: 600px;
}
</style>