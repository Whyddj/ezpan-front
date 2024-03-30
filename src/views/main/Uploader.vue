<template>
  <div class="uploader-panel">
    <div class="uploader-title">
      <span>上传任务</span>
      <span class="tips">(仅展示本次上传任务)</span>
    </div>
    <div class="file-list">
      <div v-for="(item, index) in fileList" class="file-item">
        <div class="uploader-panel">
          <div class="file-name">
            {{ item.fileName }}
          </div>
          <div class="progress">
            <el-progress :percentage="item.uploadProgress"
                         v-if="item.status === STATUS.uploading.value
                          || item.status === STATUS.upload_seconds.value
                           || item.status === STATUS.upload_finish.value">
            </el-progress>
          </div>
          <div class="upload-status">
            <!--图标-->
            <span :class="['iconfont', 'icon-' + STATUS[item.status].icon]"
                  :style="{color: STATUS[item.status].color}">
            </span>
            <!--状态-->
            <span class="status" :style="{color: STATUS[item.status].color}">
              {{ item.status === STATUS.fail.value ? item.errorMsg : STATUS[item.status].desc }}
            </span>
            <!--上传大小-->
            <span class="upload-info" v-if="item.status === STATUS.uploading.value">
              {{ proxy.Utils.size2Str(item.uploadSize) }} / {{ proxy.Utils.size2Str(item.totalSize) }}
            </span>
          </div>
        </div>
        <div class="op">
          <el-progress type="circle" :width="50" :percentage="item.md5Progress"
                       v-if="item.status===STATUS.init.value"></el-progress>
          <div class="op-btn">
            <span class="btn-item" v-if="item.status === STATUS.uploading.value">
              <Icon :width="28" class="btn-item" iconName="upload" v-if="item.pause" title="上传"
                    @click="startUpload(item.uid)"></Icon>
              <Icon :width="28" class="btn-item" iconName="pause" v-else title="暂停"
                    @click="pauseUpload(item.uid)"></Icon>
            </span>
            <Icon :width="28" class="btn-item del" iconName="del" title="删除"
                  v-if="item.status !== STATUS.init.value
                  && item.status !== STATUS.upload_seconds.value
                  && item.status !== STATUS.upload_finish.value"
                  @click="delUpload(item.uid)"></Icon>
            <Icon :width="28" class="btn-item clean" iconName="clean" title="清除"
                  v-if="item.status === STATUS.upload_finish.value
                  || item.status === STATUS.upload_seconds.value"
                  @click="cleanUpload(item.uid)"></Icon>
          </div>
        </div>
      </div>
      <div v-if="fileList.length === 0">
        <NoData msg="暂无上传任务"></NoData>
      </div>
    </div>
  </div>
</template>

<script setup>
import {getCurrentInstance, ref} from "vue";
import SparkMD5 from "spark-md5"

const {proxy} = getCurrentInstance();
const chuckSize = 1024 * 1024 * 10; // 10M
const api = {
  upload: "/file/uploadFile",
  checkBeforeUpload: "/file/checkBeforeUpload"
}

const STATUS = {
  emptyfile: {
    value: "emptyfile",
    desc: "文件为空",
    color: "#F75000",
    icon: "close"
  },
  fail: {
    value: "fail",
    desc: "上传失败",
    color: "#F75000",
    icon: "close"
  },
  init: {
    value: "init",
    desc: "解析中",
    color: "#e6a23c",
    icon: "clock"
  },
  uploading: {
    value: "uploading",
    desc: "上传中",
    color: "#409eff",
    icon: "upload"
  },
  upload_finish: {
    value: "upload_finish",
    desc: "上传完成",
    color: "#67c23a",
    icon: "ok"
  },
  upload_seconds: {
    value: "upload_seconds",
    desc: "秒传",
    color: "#67c23a",
    icon: "ok"
  },
}

const fileList = ref([])
const delList = ref([])
const addFile = async (file, filePid) => {
  const fileItem = {
    file: file, // 文件对象
    uid: file.uid, // 文件唯一标识
    md5Progress: 0, // 文件md5计算进度
    md5: null, // 文件md5
    fileName: file.name, // 文件名
    status: STATUS.init.value, // 上传状态
    uploadSize: 0, // 已上传大小
    totalSize: file.size, // 文件总大小
    uploadProgress: 0, // 上传进度
    pause: false, // 是否暂停
    chuckIndex: 0, // 当前上传的分片索引
    filePid: filePid, // 文件夹id
    errorMsg: null, // 错误信息
  }
  fileList.value.unshift(fileItem)
  if (fileItem.totalSize === 0) {
    fileItem.status = STATUS.emptyfile.value
    return
  }
  let md5FileUid = await computeMd5(fileItem) // await后面的代码会等待computeMd5执行完毕
  if (md5FileUid == null) {
    return
  }
  let hasUpload = await checkBeforeUpload(md5FileUid) // 检查是否秒传
  if (hasUpload) {
    return
  }
  uploadFile(md5FileUid)
}

defineExpose({addFile})

const computeMd5 = (fileItem) => {
  let file = fileItem.file;
  // blob对象切片
  let blogSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
  let chucks = Math.ceil(file.size / chuckSize)
  let currentChuck = 0;
  let spark = new SparkMD5.ArrayBuffer();
  let fileReader = new FileReader();

  // init fileItem
  fileItem.chunksMd5 = []

  let loadNext = () => {
    let start = currentChuck * chuckSize;
    let end = Math.min(start + chuckSize, file.size);
    fileReader.readAsArrayBuffer(blogSlice.call(file, start, end)); // 读取文件
  }
  loadNext()
  return new Promise((resolve, reject) => { // Promise是异步处理
    let resultFile = getFileByUid(file.uid)
    fileReader.onload = (e) => {
      spark.append(e.target.result);
      currentChuck++;

      // Save the md5 of each chunk
      let chunkMd5 = SparkMD5.ArrayBuffer.hash(e.target.result)
      resultFile.chunksMd5.push(chunkMd5)

      if (currentChuck < chucks) {
        console.log(`${file.name}第${currentChuck}个分片md5计算完成`)
        resultFile.md5Progress = Math.floor(currentChuck / chucks * 100)
        loadNext()
      } else {
        let md5 = spark.end()
        spark.destroy()
        resultFile.md5Progress = 100
        resultFile.md5 = md5
        resolve(fileItem.uid) // resolve
      }
    }
    fileReader.onerror = () => {
      resultFile.md5Progress = -1
      resultFile.status = STATUS.fail.value
      resolve(fileItem.uid)
    }
  }).catch ((error) => {
    return null
  })
}

// 获取文件
const getFileByUid = (uid) => {
  return fileList.value.find(item => item.uid === uid)
}

const checkBeforeUpload = async (uid) => {
  let currentFile = getFileByUid(uid)
  const file = currentFile.file
  let checkResult = await proxy.Request({
    url: api.checkBeforeUpload,
    params: {
      fileName: file.name,
      filePid: currentFile.filePid,
      fileMd5: currentFile.md5,
      fileSize: file.size
    },
    errorCallBack: (error) => {
      currentFile.status = STATUS.fail.value
      currentFile.errorMsg = error
    },
    showLoading: false
  })
  if (checkResult == null) {
    return null
  }

  if (checkResult.data.status === STATUS.upload_seconds.value) {
    currentFile.status = STATUS[checkResult.data.status].value
    currentFile.uploadProgress = 100
    emit("uploadCallback")
    return true
  }
  currentFile.fileId = checkResult.data.fileId
  return false
}

const emit = defineEmits(["uploadCallback"])
const uploadFile = async (uid, chunkIndex) => {
  chunkIndex = chunkIndex ? chunkIndex : 0
  // 分片
  let currentFile = getFileByUid(uid)
  currentFile.status = STATUS.uploading.value
  const file = currentFile.file
  const fileSize = currentFile.totalSize
  const chunks = Math.ceil(fileSize / chuckSize)
  for (let i = chunkIndex; i < chunks; i++) {
    let delIndex = delList.value.indexOf(uid);
    if (delIndex !== -1) { // 如果删除列表中有该文件 则不上传
      delList.value.splice(delIndex, 1)
      break
    }
    currentFile = getFileByUid(uid)
    if (currentFile.pause) {
      break
    }
    let start = i * chuckSize
    let end = Math.min(start + chuckSize, file.size);
    let chunkFile = file.slice(start, end) // 切片文件
    let uploadResult = await proxy.Request({
      url: api.upload,
      showLoading: false,
      dataType: "file",
      params: {
        file: chunkFile,
        fileName: file.name,
        fileMd5: currentFile.chunksMd5[i], // 每个分片的md5
        chunkIndex: i,
        chunks: chunks,
        fileId: currentFile.fileId,
        filePid: currentFile.filePid
      },
      showError: false,
      errorCallBack: (error) => {
        currentFile.status = STATUS.fail.value
        currentFile.errorMsg = error
      },
      onUploadProgressCallback: (progressEvent) => {
        let loaded = Math.min(progressEvent.loaded, end - start)
        currentFile.uploadSize = i * chuckSize + loaded
        currentFile.uploadProgress = Math.floor(currentFile.uploadSize / fileSize * 100)
      }
    })

    if (uploadResult == null) {
      break
    }

    currentFile.fileId = uploadResult.data.fileId
    currentFile.status = STATUS[uploadResult.data.status].value
    currentFile.chuckIndex = i
    if (uploadResult.data.status === STATUS.upload_finish.value || uploadResult.data.status === STATUS.upload_seconds.value) {
      currentFile.uploadProgress = 100
      emit("uploadCallback")
      break
    }
  }
}
</script>

<style scoped lang="scss">
.uploader-panel {
  .uploader-title {
    border-bottom: 1px solid #ddd;
    line-height: 40px;
    padding: 0 10px;
    font-size: 15px;

    .tips {
      font-size: 13px;
      color: rgb(169, 169, 169);
    }
  }

  .file-list {
    overflow: auto;
    padding: 10px 0;
    min-height: calc(100vh / 2);
    max-height: calc(100vh - 120px);

    .file-item {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3px 10px;
      background-color: #fff;
      border-bottom: 1px solid #ddd;
    }

    .file-item:nth-child(even) {
      background-color: #fcf8f4;
    }

    .uploader-panel {
      flex: 1;

      .file-name {
        color: rgb(64, 62, 62);
      }

      .upload-status {
        display: flex;
        align-items: center;
        margin-top: 5px;

        .iconfont {
          margin-right: 3px;
        }

        .status {
          color: red;
          font-size: 13px;
        }

        .upload-info {
          margin-left: 5px;
          font-size: 12px;
          color: rgb(112, 111, 111);
        }
      }

      .progress {
        height: 10px;
      }
    }

    .op {
      width: 100px;
      display: flex;
      align-items: center;
      justify-content: flex-end;

      .op-btn {
        .btn-item {
          cursor: pointer;
        }

        .del,
        .clean {
          margin-left: 5px;
        }
      }
    }
  }
}
</style>