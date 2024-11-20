<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import SvgIcon from "@/components/svg-icons/index.vue";
import { getAppletList, openApplet, deleteApplet } from "@/utils/gnb.desktop";
import { copySync } from "cehub/fs-extra";

const appletData: any = ref([]);
const lnkItem = ref(null);
const focusInput = ref(null); //用于input聚焦
const formData = reactive({
  appletData: [],
  contextmenuFlag: false,
  contentMenuX: 50,
  contentMenuY: 50,
  contextmenuItem: {}
});

const initCreated = () => {
  try {
    getAppletList().then((res: any) => {
      appletData.value = res;
      console.log(res);
    });
  } catch (error) {}
};

/**
 * [右键]
 */
const handleContextmenu = (event: any, item: any) => {
  let target = event.target;
  formData.contextmenuItem ? (formData.contextmenuItem.editType = 0) : "";
  formData.contentMenuX = event.clientX;
  formData.contentMenuY = event.clientY;
  formData.contextmenuFlag = true;
  formData.contextmenuItem = item;
};

/**
 * [重命名]
 */
const handleRechristen = event => {
  formData.contextmenuFlag = false;
  formData.contextmenuItem.editType = 1;
  nextTick(() => {
    focusInput.value.focus();
  });
};

/**
 * [添加桌面图标]
 */
const handleAddDesktopIcon = () => {
  console.log(formData.contextmenuItem);
  ipcRenderer.send("set-desktop-icon", {
    target: formData.contextmenuItem.appid,
    type: formData.contextmenuItem.type,
    filepath: formData.contextmenuItem.filepath,
    name: formData.contextmenuItem.name,
    icon: formData.contextmenuItem.icon
  });
};

// [删除]
const handleDelete = async () => {
  try {
    console.log(formData.contextmenuItem);
    deleteApplet(formData.contextmenuItem.build.appId).then(res => {
      initCreated();
    });
  } catch (error) {
    console.log(error);
  }
};

/**
 * [打开软件]
 */
const handleStart = (row: any) => {
  console.log(row);
  openApplet(row);
};

// [window 点击事件]
const watchContextmenu = event => {
  formData.contextmenuFlag = false;
};

onMounted(async () => {
  initCreated();
  window.addEventListener("click", watchContextmenu, true);
});
</script>

<template>
  <div class="app-box no-user-select" ref="lnkItem">sssssssssssssssssssss</div>
</template>


<style lang="scss">
html,
body {
  width: 100%;
  height: 100%;
}
body {
  background: white;
}
</style>
