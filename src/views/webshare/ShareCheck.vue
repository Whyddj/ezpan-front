<template>
  <div class="share">
    <div class="body-content">
      <div class="logo">
        <span class="icon-pan icon-pan"></span>
        <span class="name">EzPan</span>
      </div>
      <div class="code-panel">
        <div class="file-info">
          <div class="avatar">
            <Avatar :userId="shareInfo.userId" :avatar="shareInfo.avatar" width="50"></Avatar>
          </div>
          <div class="share-info">
            <div class="user-info">
              <span class="nick-name">{{ shareInfo.nickName }}</span>
              <span class="share-time">分享于：{{ shareInfo.shareTime }}</span>
            </div>
            <div class="file-name">分享文件：{{ shareInfo.fileName }}</div>
          </div>
        </div>
        <div class="code-body">
          <div class="tips">请输入提取码</div>
          <div class="input-area">
            <el-form :model="formData" :rules="rules" ref="formDataRef" @submit.prevent>
              <el-form-item>
                <el-input v-model.trim="formData.shareCode" clearable placeholder="请输入提取码" class="input"
                          @keyup.enter="checkExtractCode"></el-input>
                <el-button type="primary" @click="checkExtractCode">提取文件</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

import {getCurrentInstance, ref} from "vue";
import {useRouter, useRoute} from "vue-router";
const {proxy} = getCurrentInstance()


const router = useRouter()
const route = useRoute()

const api = {
  getShareInfo : "/showShare/getShareInfo",
  checkExtractCode : "/showShare/checkShareCode",
}

const shareId = route.params.shareId
const shareInfo = ref()
const formData = ref({})
const formDataRef = ref()

const rules = {
  code: [
    {required: true, message: "请输入提取码", trigger: "blur"},
    {min: 5, max: 5, message: "提取码长度为5位", trigger: "blur"}
  ],
}

const getShareInfo = async () => {
  let result = await proxy.Request({
    url: api.getShareInfo,
    params: {
      shareId
    }
  })
  if (!result) {
    return
  }
  shareInfo.value = result.data
}

getShareInfo()

const checkExtractCode = async () => {
  formDataRef.value.validate(async valid => {
    if (!valid) {
      return
    }
    let params = {
      shareId,
      shareCode: formData.value.shareCode
    }
    let result = await proxy.Request({
      url: api.checkExtractCode,
      params: params
    })
    if (!result) {
      return
    }
    await router.push("/share/" + shareId)
  })
}
</script>

<style scoped lang="scss">
.share {
  height: calc(100vh);
  background: #eef2f6 url("../../assets/share_bg.png") repeat-x 0 bottom;
  display: flex;
  justify-content: center;

  .body-content {
    margin-top: calc(100vh / 5);
    width: 500px;

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;

      .icon-pan {
        font-size: 60px;
        color: #409EFF;
      }

      .name {
        font-weight: bold;
        margin-left: 5px;
        font-size: 25px;
        color: #409EFF;
      }
    }

    .code-panel {
      margin-top: 20px;
      background: #fff;
      border-radius: 5px;
      overflow: hidden;
      box-shadow: 0 0 9px 1px #5757574f;

      .file-info {
        padding: 10px 20px;
        background: #409EFF;
        color: #fff;
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

      .code-body {
        padding: 30px 20px 60px 20px;

        .tips {
          font-weight: bold;
        }

        .input-area {
          margin-top: 10px;

          .input {
            flex: 1;
            margin-right: 10px;
          }
        }
      }
    }
  }
}
</style>