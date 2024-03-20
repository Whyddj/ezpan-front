<template>
  <div class="login-body">
    <div class="bg"></div>
    <div class="login-panel">
      <el-form class="login-register" ref="formDataRef" :model="formData" :rules="rules" @submit.prevent>
        <div class="login-title">EzPan</div>
        <!-- 邮箱 -->
        <el-form-item prop="email">
          <el-input size="large" clearable placeholder="请输入邮箱" v-model.trim="formData.email" maxLength="150">
            <template #prefix>
              <span class="iconfont icon-account"></span>
            </template>
          </el-input>
        </el-form-item>
        <!-- 密码 -->
        <el-form-item prop="password" v-if="opType == 0">
          <el-input size="large" placeholder="请输入密码" v-model.trim="formData.password" type="password" show-password>
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <!-- 注册 -->
        <div v-if="opType == 1 || opType == 2">
          <el-form-item prop="emailCode">
            <div class="send-email-panel">
              <el-input size="large" placeholder="请输入邮箱验证码" v-model.trim="formData.emailCode">
                <template #prefix>
                  <span class="iconfont icon-checkcode"></span>
                </template>
              </el-input>
              <el-button size="large" type="primary" class="send-email-btn" @click="getMailCode">发送验证码</el-button>
            </div>
            <el-popover placement="left" width="500" trigger="click">
              <div>
                <p>1. 请确保邮箱地址正确，点击发送验证码</p>
                <p>2. 请在5分钟内输入验证码</p>
                <p>3. 如果没有收到验证码，请检查邮箱垃圾箱</p>
              </div>
              <template #reference>
                <span class="a-link">收不到验证码？</span>
              </template>
            </el-popover>
          </el-form-item>
          <!-- 昵称 -->
          <el-form-item prop="nickName" v-if="opType == 1">
            <el-input size="large" clearable placeholder="请输入昵称" v-model.trim="formData.nickName" maxLength="20">
              <template #prefix>
                <span class="iconfont icon-account"></span>
              </template>
            </el-input>
          </el-form-item>
          <!--注册密码，找回密码-->
          <el-form-item prop="registerPassword">
            <el-input size="large" placeholder="请输入密码" v-model.trim="formData.registerPassword" type="password">
              <template #prefix>
                <span class="iconfont icon-password"></span>
              </template>
            </el-input>
          </el-form-item>
          <!--重复密码-->
          <el-form-item prop="repeatPassword">
            <el-input size="large" placeholder="请再次输入密码" v-model.trim="formData.repeatPassword" type="password"
              show-password>
              <template #prefix>
                <span class="iconfont icon-password"></span>
              </template>
            </el-input>
          </el-form-item>
        </div>
        <!--验证码-->
        <el-form-item prop="checkCode">
          <div class="check-code-panel">
            <el-input size="large" placeholder="请输入验证码" v-model.trim="formData.checkCode" @keyup.enter="submit">
              <template #prefix>
                <span class="iconfont icon-checkcode"></span>
              </template>
            </el-input>
            <img :src="checkCodeUrl" class="check-code" @click="changeCheckCode(0)" />
          </div>
        </el-form-item>
        <!-- 登录 -->
        <el-form-item v-if="opType == 0">
          <div class="rememberme-panel">
            <el-checkbox v-model="formData.rememberMe">记住我</el-checkbox>
          </div>
          <div class="no-account">
            <a href="javascript:void(0)" @click="showPanel(1)" class="a-link">没有账号？立即注册</a>
            <a href="javascript:void(0)" @click="showPanel(2)" class="a-link">忘记密码？</a>
          </div>
          <el-button type="primary" class="op-btn" size="large" @click="loginSubmit">登录</el-button>
        </el-form-item>
        <!-- 注册 -->
        <el-form-item v-if="opType == 1">
          <div class="no-account">
            <a href="javascript:void(0)" @click="showPanel(0)" class="a-link">已有账号？立即登录</a>
          </div>
          <el-button type="primary" class="op-btn" size="large" @click="registerSubmit">注册</el-button>
        </el-form-item>
        <!-- 找回密码-->
        <el-form-item v-if="opType == 2">
          <div class="no-account">
            <a href="javascript:void(0)" @click="showPanel(0)" class="a-link">返回登录</a>
          </div>
          <el-button type="primary" class="op-btn" size="large" @click="forgetSubmit">重置密码</el-button>
        </el-form-item>
      </el-form>
    </div>
    <Dialog :show="dialogConfig4SendMailCode.show" :title="dialogConfig4SendMailCode.title" width="500px"
      :showCancel="false" :buttons="dialogConfig4SendMailCode.buttons" @close="dialogConfig4SendMailCode.show = false">
      <el-form ref="formData4SendMailCodeRef" :model="formData4SendMailCode" :rules="rules" @submit.prevent>
        <el-form-item prop="email" label="邮箱">
          {{ formData.email }}
        </el-form-item>

        <el-form-item label="验证码" prop="checkCode">
          <div class="check-code-panel">
            <el-input size="large" placeholder="请输入验证码" v-model.trim="formData4SendMailCode.checkCode">
              <template #prefix>
                <span class="iconfont icon-checkcode"></span>
              </template>
            </el-input>
            <img :src="checkCodeUrl4Mail" class="check-code" @click="changeCheckCode(1)" />
          </div>
        </el-form-item>
      </el-form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import md5 from "js-md5";

const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();

const api = {
  checkCode: "/api/checkCode",
  sendMailCode: "/sendCode",
  login: "/login",
  register: "/register",
  resetPwd: "/resetPwd",
};

// operation type 0: login, 1: register, 2: forget
const opType = ref(0);

const showPanel = (type) => {
  opType.value = type;
  resetForm();
};

const resetForm = () => {
  formDataRef.value.resetFields();
  formData4SendMailCodeRef.value &&
    formData4SendMailCodeRef.value.resetFields();
  changeCheckCode(0);
  if (opType.value == 0) {
  }
};

const checkRepeatPassword = (rule, value, callback) => {
  if (value !== formData.value.registerPassword) {
    callback(new Error("两次输入密码不一致"));
  } else {
    callback();
  }
};

const formData = ref({});
const formDataRef = ref();
const rules = {
  email: [
    { required: true, message: "请输入正确的邮箱" },
    { validator: proxy.Verify.email, message: "请输入正确的邮箱" },
  ],
  password: [{ required: true, message: "请输入密码" }],
  emailCode: [{ required: true, message: "请输入邮箱验证码" }],
  nickName: [{ required: true, message: "请输入昵称" }],
  registerPassword: [
    { required: true, message: "请输入密码" },
    {
      validator: proxy.Verify.password,
      message: "密码只能由8-20位字母、数字、特殊字符组成，且必须包含其中三种",
    },
  ],
  repeatPassword: [
    { required: true, message: "请再次输入密码" },
    { validator: checkRepeatPassword },
  ],
  checkCode: [{ required: true, message: "请输入验证码" }],
};

const checkCodeUrl = ref(api.checkCode);
const checkCodeUrl4Mail = ref(api.checkCode);
const changeCheckCode = (type) => {
  if (type == 0) {
    checkCodeUrl.value =
      api.checkCode + "?type=" + type + "&time=" + new Date().getTime();
  } else {
    checkCodeUrl4Mail.value =
      api.checkCode + "?type=" + type + "&time=" + new Date().getTime();
  }
};

// send email code
const formData4SendMailCode = ref({});
const formData4SendMailCodeRef = ref();

// 在加载页面时加载cookie中的登录信息
const loginInfo = proxy.VueCookies.get("loginInfo");
if (loginInfo) {
  formData.value.email = loginInfo.email;
  formData.value.password = loginInfo.password;
}

const dialogConfig4SendMailCode = reactive({
  show: false,
  title: "发送邮箱验证码",
  buttons: [
    {
      text: "发送",
      type: "primary",
      click: () => {
        sendMailCode();
      },
    },
  ],
});

const getMailCode = () => {
  formDataRef.value.validateField("email", (valid) => {
    if (!valid) {
      return;
    }
    dialogConfig4SendMailCode.show = true;
    nextTick(() => {
      changeCheckCode(1);
      formData4SendMailCodeRef.value.resetFields();
      formData4SendMailCode.value.email = formData.value.email;
    });
  });
};

const sendMailCode = () => {
  formData4SendMailCodeRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    const params = Object.assign({}, formData4SendMailCode.value);
    params.type = opType.value == 1 ? 0 : 1;
    params.email = formData.value.email;
    // console.log(params);
    let result = await proxy.Request({
      url: api.sendMailCode,
      params: params,
      errorCallBack: () => {
        changeCheckCode(1);
      },
    });
    if (!result) {
      return;
    }
    proxy.Message.success("验证码发送成功");
    dialogConfig4SendMailCode.show = false;
  });
};

const submit = () => {
  if (opType.value == 0) {
    loginSubmit();
  } else if (opType.value == 1) {
    registerSubmit();
  } else {
    forgetSubmit();
  }
};

const loginSubmit = () => {
  formDataRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    const params = Object.assign({}, formData.value);
    if (params.password.length != 32) {
      params.password = md5(params.password);
    }

    delete params.registerPassword;
    delete params.repeatPassword;

    let result = await proxy.Request({
      url: api.login,
      params: params,
      errorCallBack: () => {
        changeCheckCode(0);
      },
    });
    if (!result) {
      return;
    }
    proxy.Message.success("登录成功");
    proxy.VueCookies.set("userInfo", result.data);
    if (formData.value.rememberMe) {
      proxy.VueCookies.set("loginInfo", params, "7d");
    } else {
      proxy.VueCookies.remove("loginInfo");
    }
    const redirect = route.query.redirectUrl;
    if (redirect) {
      router.push(redirect);
    } else {
      router.push("/");
    }
  });
};

const registerSubmit = () => {
  formDataRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    const params = Object.assign({}, formData.value);
    params.password = params.registerPassword;
    console.log(params);
    let result = await proxy.Request({
      url: api.register,
      params: params,
      errorCallBack: () => {
        changeCheckCode(0);
      },
    });
    if (!result) {
      return;
    }
    proxy.Message.success("注册成功, 请登录");
    showPanel(0);
  });
};

const forgetSubmit = () => {
  formDataRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    const params = Object.assign({}, formData.value);
    params.password = params.registerPassword;
    let result = await proxy.Request({
      url: api.resetPwd,
      params: params,
      errorCallBack: () => {
        changeCheckCode(0);
      },
    });
    if (!result) {
      return;
    }
    proxy.Message.success("重置密码成功, 请登录");
    showPanel(0);
  });
};
</script>

<style lang="scss" scoped>
.login-body {
  height: calc(100vh);
  background: url("../assets/login_bg.png");
  background-size: cover;
  display: flex;

  .bg {
    flex: 1;
    background-size: cover;
    background-position: center;
    background-size: 800px;
    background-repeat: no-repeat;
    background-image: url("../assets/login_img.png");
  }

  .login-panel {
    width: 430px;
    margin-right: 15%;
    margin-top: calc((100vh - 500px) / 2);

    .login-register {
      padding: 25px;
      background: #fff;
      border-radius: 5px;

      .login-title {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
      }

      .send-email-panel {
        display: flex;
        width: 100%;
        justify-content: space-between;

        .send-email-btn {
          margin-left: 5px;
        }
      }

      .rememberme-panel {
        width: 100%;
      }

      .no-account {
        width: 100%;
        display: flex;
        justify-content: space-between;
      }

      .op-btn {
        width: 100%;
      }
    }
  }

  .check-code-panel {
    width: 100%;
    display: flex;

    .check-code {
      margin-right: 5px;
      cursor: pointer;
    }
  }

  .login-btn-qq {
    margin-top: 20px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      cursor: pointer;
      margin-left: 10px;
      width: 20px;
    }
  }
}
</style>
