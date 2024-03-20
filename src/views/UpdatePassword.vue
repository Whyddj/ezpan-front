<template>
  <div>
    <Dialog :show="dialogConfig.show" :title="dialogConfig.title" :buttons="dialogConfig.buttons" width="500px"
      :showCancel="false" @close="dialogConfig.show = false">
      <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="80px" @submit.prevent>
        <!--input输入-->
        <el-form-item label="原密码" prop="oldPassword">
          <el-input type="oldPassword" size="large" placeholder="请输入原密码" v-model.trim="formData.oldPassword"
            show-password></el-input>
          <template #prefix>
            <span class="iconfont icon-password"></span>
          </template>
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input type="password" size="large" placeholder="请输入密码" v-model.trim="formData.password"
            show-password></el-input>
          <template #prefix>
            <span class="iconfont icon-password"></span>
          </template>
        </el-form-item>
        <el-form-item label="确认密码" prop="rePassword">
          <el-input type="rePassword" size="large" placeholder="请再次输入密码" v-model.trim="formData.rePassword"
            show-password></el-input>
          <template #prefix>
            <span class="iconfont icon-reRassword"></span>
          </template>
        </el-form-item>
      </el-form>
    </Dialog>
  </div>
</template>

<script setup>
import { md5 } from "js-md5";
import { ref, reactive, getCurrentInstance, nextTick } from "vue"
const { proxy } = getCurrentInstance();

const api = {
  updatePwd: "updatePwd"
}


const checkRepeatPassword = (rule, value, callback) => {
  if (value !== formData.value.rePassword) {
    callback(new Error("两次输入密码不一致"));
  } else {
    callback();
  }
};

const formData = ref({});
const formDataRef = ref();
const rules = {
  oldPassword: [
    { required: true, message: "请输入原密码" },
  ],
  password: [
    { required: true, message: "请输入密码" },
    {
      validator: proxy.Verify.password,
      message: "密码只能由8-20位字母、数字、特殊字符组成，且必须包含其中三种",
    },
  ],
  repassword: [
    { required: true, message: "请再次输入密码" },
    { validator: checkRepeatPassword },
  ],
};

const show = (data) => {
  dialogConfig.value.show = true;
  nextTick(() => {
    // formData.value.resetFields();
    formData.value = {};
  });
};

defineExpose({
  show,
});

const dialogConfig = ref({
  show: false,
  title: "标题",
  buttons: [
    {
      type: "danger",
      text: "确定",
      click: (e) => {
        submitForm();
      },
    },
  ],
});

const submitForm = async () => {
  formDataRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    let result = await proxy.Request({
      url: api.updatePwd,
      params: {
        oldPwd: md5(formData.value.oldPassword),
        newPwd: formData.value.password,
      }
    })
    if (!result) {
      return;
    }
    dialogConfig.value.show = false;
    proxy.Message.success("修改成功");
  });
};
</script>

<style lang="scss" scoped></style>
