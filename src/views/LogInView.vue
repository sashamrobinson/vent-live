<template>
  <div class="background">
      <TabIntroWindow @close="this.$router.push(`/`)" :pageDisplay="'login'"/>
  </div>
</template>

<script>
import TabIntroWindow from '../components/TabIntroWindow.vue'

export default {
    components: {
      TabIntroWindow
    },
}
</script>

<style>
</style>