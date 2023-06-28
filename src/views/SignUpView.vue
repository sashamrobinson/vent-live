<template>
  <div class="background"> 
      <TabIntroWindow @close="this.$router.push(`/`)" :pageDisplay="'signup'"/>
  </div>
</template>
<script>
import TabIntroWindow from '../components/TabIntroWindow.vue'

export default {
    components: {
      TabIntroWindow,
    },
    data() {
      return {
          email: '',
          username: '',
          password: ''
      }
    },
    methods: {
      async register() {
          const { email, password, username } = this
          await this.$store.dispatch('register', { email, password, username })
      },
      async addUserToDatabase(username) {
        const { user } = this.$store.state
        if (user) {
          const { uid, email } = user
          const userData = { username, email, uid }
          console.log("Now moving to Firebase operations with: ", userData)
        }
      }
    },
}
</script>

<style>

</style>