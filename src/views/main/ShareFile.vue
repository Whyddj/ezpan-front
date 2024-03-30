<template>
  <div>
    <Dialog :show="dialogConfig.show" :title="dialogConfig.title" :buttons="dialogConfig.buttons" width="600px"
            :showCancel="showCancel" @close="dialogConfig.show = false">
      <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="100px" @submit.prevent>
        <el-form-item label="文件" prop="">{{ formData.fileName }}</el-form-item>
        <template v-if="showType === 0">
          <el-form-item label="有效期" prop="validType">
            <el-radio-group v-model.trim="formData.validType">
              <el-radio label="0">1天</el-radio>
              <el-radio label="1">7天</el-radio>
              <el-radio label="2">30天</el-radio>
              <el-radio label="3">永久有效</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="提取码" prop="codeType">
            <el-radio-group v-model.trim="formData.codeType">
              <el-radio label="0">自定义</el-radio>
              <el-radio label="1">系统生成</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="formData.codeType == 0" prop="code">
            <el-input clearable placeholder="请输入五位提取码" v-model="formData.code" maxlength="5"
                      :style="{width:'150px'}">
            </el-input>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="分享链接">
            {{ shareUrl }}{{ resultInfo.shareId }}
          </el-form-item>
          <el-form-item label="提取码">
            {{resultInfo.shareCode}}
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="copy">复制链接和提取码</el-button>
          </el-form-item>
        </template>
      </el-form>
    </Dialog>
  </div>
</template>

<script setup>
import useClipboard from "vue-clipboard3"
const {toClipboard} = useClipboard()
import Dialog from "@/components/Dialog.vue";
import {getCurrentInstance, nextTick, ref} from "vue";

const {proxy} = getCurrentInstance()

const shareUrl = ref(document.location.origin + "/share/");
const api = {
  shareFile: "/share/shareFile",
}

const showType = ref(0)

const formData = ref({
  validType: "0",
  codeType: "0",
})
const formDataRef = ref(null)
const rules = {
  validType: [{required: true, message: "请选择有效期", trigger: "blur"}],
  codeType: [{required: true, message: "请选择提取码类型", trigger: "blur"}],
  code: [{required: true, message: "请输入提取码", trigger: "blur"},
    {validator: proxy.Verify.shareCode, message: "提取码必须由五位数字或字母组成", trigger: "blur"}],
}

const showCancel = ref(true)
const dialogConfig = ref({
  show: false,
  title: "分享文件",
  buttons: [
    {
      text: "确定",
      type: "primary",
      click: () => {
        share()
      },
    },
  ],
});

const resultInfo = ref()
const share = async () => {
  if (Object.keys(resultInfo.value).length > 0) { // 已经分享成功
    dialogConfig.value.show = false
    return
  }
  formDataRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }
    let params = {}
    Object.assign(params, formData.value)
    let result = await proxy.Request({
      url: api.shareFile,
      params: params,
    })
    if (!result) {
      return
    }
    showType.value = 1
    resultInfo.value = result.data
    dialogConfig.value.buttons[0].text = "关闭"
    showCancel.value = false
  })
}

const show = (data) => {
  showType.value = 0
  dialogConfig.value.show = true
  showCancel.value = true
  resultInfo.value = {}
  nextTick(() => {
    formData.value = Object.assign({}, data)
  })
}
defineExpose({show})

const copy = async () => {
  await toClipboard(`链接：${shareUrl.value}${resultInfo.value.shareId} 提取码：${resultInfo.value.code}`)
  proxy.Message.success("复制成功")
}

</script>

<style scoped lang="scss">

</style>