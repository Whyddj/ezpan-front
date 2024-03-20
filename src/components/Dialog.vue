<template>
  <div>
    <el-dialog
      :show-close="showClose"
      :draggable="true"
      :model-value="show"
      :title="title"
      class="cust-dialog"
      :top="top + 'px'"
      :width="width"
      @close="close"
    >
      <div
        class="dialog-content"
        :style="{ 'max-height': maxHeight + 'px', padding: padding + 'px' }"
      >
        <slot></slot>
      </div>
      <template v-if="(buttons && buttons.length > 0) || showCancel">
        <div class="dialog-footer">
          <el-button link @click="close" v-if="showCancel"> 取消 </el-button>
          <el-button
            v-for="btn in buttons"
            :key="btn.id"
            :type="btn.type || 'primary'"
            @click="btn.click"
          >
            {{ btn.text }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: String,
  width: {
    type: String,
    default: "30%",
  },
  top: {
    type: Number,
    default: 50,
  },
  padding: {
    type: Number,
    default: 15,
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  buttons: {
    type: Array,
  },
  showCancel: {
    type: Boolean,
    default: true,
  },
});

import { ref, defineEmits } from "vue";

const maxHeight = ref(window.innerHeight - props.top - 100);

const emit = defineEmits();
const close = () => {
  emit("close");
};
</script>

<style lang="scss">
.cust-dialog {
  margin: 30px auto 10px !important;
  .el-dialog__body {
    padding: 0px;
  }
  .dialog-body {
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    min-height: 80px;
    overflow: auto;
  }
  .dialog-footer {
    padding: 5px 20px;
    text-align: right;
  }
}
</style>
