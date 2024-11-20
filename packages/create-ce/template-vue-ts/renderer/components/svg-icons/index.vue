<script setup lang="ts">
import Applet from './svg/Applet.vue'

interface SvgIconsProps {
  iconClass: string;
}
const { iconClass } = withDefaults(defineProps<SvgIconsProps>(), {});
</script>
<template>
  <Applet></Applet>
</template>
<style scoped lang="scss">
</style>