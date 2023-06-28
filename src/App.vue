<template>
  <head>
  </head>
  <router-view />
</template>

<script>
import { onBeforeMount } from 'vue'
import { useStore} from 'vuex'

export default {
  setup() {
    
    const store = useStore()
    onBeforeMount(() => {
      store.dispatch('fetchUser')
    })
  }
}
</script>