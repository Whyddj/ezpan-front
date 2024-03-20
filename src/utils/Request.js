import axios from "axios";

import { ElLoading } from "element-plus";
import router from "@/router";

import Message from "./Message";

const contentTypeForm = "application/x-www-form-urlencoded;charset=UTF-8";
const contentTypeJson = "application/json";

const responseTypeJson = "json";

let loading = null; 
const instance = axios.create({
    timeout: 10000,
    baseURL: '/api',
});
// 请求拦截
instance.interceptors.request.use(
    (config) => {
        if (config.showLoading) {
            loading = ElLoading.service({
                lock: true,
                text: "Loading...",
                background: "rgba(0, 0, 0, 0.7)",
            });
        }
        return config;
    },
    (error) => {
        if (config.showLoading && loading) {
            loading.close();
        }
        Message.error("请求发送失败");
        return Promise.reject("请求发送失败");
    },
);
// 请求后拦截
instance.interceptors.response.use(
    (response) => {
        const { showLoading, errorCallBack, showError = true, responseType } = response.config;
        if (showLoading && loading) {
            loading.close();
        }
        const responseData = response.data;
        if (responseType == "arraybuffer" || responseType == "blob") {
            return responseData;
        }
        // 正常请求
        if (responseData.code == 200) {
            return responseData;
        } else if (responseData.code == 901) {
            // 登录超时
            router.push("/login?redirectUrl=" + encodeURI(router.currentRoute.value.path));
            return Promise.reject({ showError : showError, msg : "登录超时" });
        } else {
            if (errorCallBack) {
                errorCallBack(responseData);
            }
            return Promise.reject({ showError : showError, msg : responseData.message });
        }
    },
    (error) => {
        if (error.config.showLoading && loading) {
            loading.close();
        }
        return Promise.reject({ showError : true, msg : "请求失败" });
    }
);

const request = (config) => {
    const { url, params, dataType, showLoading = true, responseType = responseTypeJson } = config;
    let contentType = contentTypeForm;
    let formData = new FormData();
    for (let key in params) {
        formData.append(key, params[key]);
    }
    if (dataType != null && dataType == "json") {
        contentType = contentTypeJson;
    }
    let headers = {
        "Content-Type": contentType,
        "X-Requested-With": "XMLHttpRequest",
    };

    return instance.post(url, formData, {
        onUploadProgress: (event) => {
            if (config.onUploadProgressCallback) {
                config.onUploadProgressCallback(event);
            }
        },
        responseType: responseType,
        headers: headers,
        showLoading: showLoading,
        errorCallBack: config.errorCallBack,
        showError: config.showError,
    }).catch((error) => {
        console.log(error);
        if (error.showError) {
            Message.error(error.msg);
        }
        return null;
    });
}

export default request;