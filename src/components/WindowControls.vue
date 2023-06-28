<template>
  <div @mouseenter="windowControls" @mouseleave="windowControls" class="window-controls">
      <div class="green-circle" style="background-color: #61C554">

      </div>
      <div class="yellow-circle" style="background-color: #F4BF4F">

      </div>
      <div @click="closeTab" class="red-circle" style="background-color: #EC6A5E">
          <img v-if="windowControlsActive" class="close-cross" src="../assets/images/close_cross.svg" alt="">
      </div>
  </div>
</template>

<script>
export default {
    name: 'MoveableWindow',
    components: {
        
    },
    data() {
        return {
            windowControlsActive: false,
        }
    },
    methods: {
        windowControls() {
            this.windowControlsActive = !this.windowControlsActive
        },

        closeTab() {
            this.$emit('close')
        }
    }
}
</script>

<style>
.window-controls {
    display: flex;
    position: absolute;
    right: 0;
}

.green-circle,
.yellow-circle,
.red-circle {
    padding: 0;
    margin: 1em;
    height: 2em;
    width: 2em;
    border-radius: 50%;
    border: 0.15em solid white;
    cursor: pointer;
}

.close-cross {
    display: flex;
    justify-content: center;
    height: 2em;
    width: 2em;
}
</style>