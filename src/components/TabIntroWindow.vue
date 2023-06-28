<template>
    <div class="tab">
        <div v-if="loadElements">
            <div class="control-bar">
                <WindowControls @close="closeTab"/>
            </div>
            <h1 v-if="pageDisplay !== 'signup'" class="title-background" style="font-size: 10em; left: 1.1em; top: 0.8em">VENT</h1>
            <h1 v-if="pageDisplay !== 'signup'" class="title" style="font-size: 10em; left: 1.2em; top: 0.7em">VENT</h1>
            <div v-if="pageDisplay === 'home'">
                <div class="grid">
                <div class="auth-button-positioning">
                    <AuthButton :auth="'login'" :backgroundImage="'login_button.svg'"/>
                    <AuthButton :auth="'signup'" :backgroundImage="'signup_button.svg'"/>
                </div>
                <h2 class="caption">Everyone has something to say.</h2>
                <h3 class="credits">Made with Vue and Firebase.</h3>
                </div>
            </div>
            <div v-if="pageDisplay === 'login'" class="login-positioning">
                <form class="login" @submit.prevent="login">
                    <input 
                        type="email" 
                        placeholder="email@email.com"
                        v-model="loginForm.email"
                        class="text-field text-field-email"
                        style="background-color: #D9D9D9; margin-bottom: 1em"
                        @focus="addFocusClass" />
                    <input 
                        type="password" 
                        placeholder="password"
                        v-model="loginForm.password"
                        class="text-field text-field-password"
                        style="background-color: #A3A3A3"
                        @focus="addFocusClass" />
                    <input class="login-or-create login-button" type="submit">
                    <h1 @click="this.$router.push(`/signup`)" class="re-signup-text">Don't have an account? Sign up</h1>
                </form>
            </div>
            <div v-if="pageDisplay === 'signup'">
                <h1 class="title-background" style="font-size: 10em; left: 1.1em; top: 0.8em">VENT</h1>
                <h1 class="title" style="font-size: 10em; left: 1.2em; top: 0.7em">VENT</h1>
                <div class="signup-positioning">
                    <form class="login" autocomplete="off" @submit.prevent="register">
                        <input 
                            type="text" 
                            placeholder="username"
                            v-model="username"
                            autocomplete="off"
                            class="text-field text-field-email"
                            style="background-color: #D9D9D9; margin-bottom: 1em" />
                        <input 
                            type="email" 
                            placeholder="email@email.com"
                            v-model="email"
                            autocomplete="off"
                            class="text-field text-field-email"
                            style="background-color: #D9D9D9; margin-bottom: 1em" />
                        <input 
                            type="password" 
                            placeholder="password"
                            v-model="password"
                            autocomplete="off"
                            class="text-field text-field-password"
                            style="background-color: #A3A3A3" />
                        <input class="login-or-create signup-button" type="submit">
                        <h1 @click="this.$router.push(`/login`)" class="re-signup-text">Already have an account? Log in</h1>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'
import AuthButton from '../components/AuthButton.vue'
import WindowControls from '../components/WindowControls.vue'
export default {
    name: 'TabWindow',
    components: {
        AuthButton,
        WindowControls,
    },
    props: {
        pageDisplay: String,
    },
    data() {
        return {
            loadElements: true,
            email: '',
            password: '',
            username: ''
        }
    },
    methods: {
        closeTab() {
            this.$emit('close')
        },

        addFocusClass(event) {
            event.target.classList.add("focused")
        },

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
    mounted() {
        const inputFields = document.querySelectorAll(".text-field")
        inputFields.forEach((field) => {
            field.classList.add("focused")
        }) 
    },
    setup() { 
        const loginForm = ref({});
        const store = useStore();

        const login = () => {
            store.dispatch('login', loginForm.value);
        }

        return {
            loginForm,
            login
        }
    }
}
</script>

<style>
@font-face {
    font-family: "Neo-Syber-Italic";
    src: url('../assets/fonts/Neo-Syber-Italic.ttf') format("truetype")
}
@font-face {
    font-family: "Neo-Syber-ItalicOutline";
    src: url('../assets/fonts/Neo-Syber-ItalicOutline.ttf') format("truetype")
}
@font-face {
    font-family: "CourierPrime-Regular";
    src: url('../assets/fonts/CourierPrime-Regular.ttf') format("truetype")
}
.tab {
    position: relative;
    width: 75em;
    height: 42em;
    top: 5em;
    bottom: 5em;
    margin: auto;
    background: #D9D9D9;
    box-shadow: 4px 8px 4px rgba(0, 0, 0, 0.25);
}

.control-bar {
    background-color: #3D3A3A;
    height: 5em;
}
.spacing {
  margin: 5em 6em 3.5em 6em;  
}
.title {
    font-family: "Neo-Syber-Italic";
    font-size: 12em;
    color: #3D3A3A;
    letter-spacing: 0.15em;
    margin: 0;
    padding: 0;
    position: absolute;
    top: 1em;
    left: 0.5em;
}
.title-background {
    font-family: "Neo-Syber-ItalicOutline";
    font-size: 12em;
    font-weight: 300;
    color: #A3A3A3;
    letter-spacing: 0.15em;
    margin: 0;
    padding: 0;
    position: absolute;
    top: 1.05em;
    left: 0.45em;
}

.auth-button-positioning {
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 6em;
    bottom: 3em;
}
.grid {
    display: flex;
}
.caption {
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 2em;
    letter-spacing: 0.08em;
    bottom: 1em;
    right: 4em;
    width: 13em;
    text-align: right;
    position: absolute;
}
.credits {
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 1em;
    bottom: 1em;
    right: 8em;
    position: absolute;
}
.login-positioning {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    left: 50%;
    transform: translateX(-50%);
    bottom: 2em;
}
.login {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.text-field {
    width: 35em;
    height: 3em;
    font-family: "CourierPrime-Regular";
    font-size: 1em;
    outline: none;
}
.login-or-create {
    color: transparent;
    margin-top: 2em;
    margin-bottom: 1em;
    height: 6em;
    width: 15.5em;
    background-size: cover; 
    background-repeat: no-repeat;
    background-color: transparent;
    cursor: pointer;
    border: none;
}
.signup-positioning {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    left: 50%;
    transform: translateX(-50%);
    bottom: 2em;
}
.re-signup-text {
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 1em;
    text-align: center;
    cursor: pointer;
    margin: 0;
    padding: 0;
}
.login-button {
    background-image: url('../assets/images/login_button.svg')
}
.signup-button {
    background-image: url('../assets/images/signup_button.svg')
}
.text-field.focused:-webkit-autofill {
    font-family: "CourierPrime-Regular"; 
    font-size: 1em; 
    outline: none;
}
.text-field-email.focused:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 5em #D9D9D9 inset;
    -webkit-text-fill-color: #000000;
    outline: none;
}
.text-field-password.focused:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 5em #A3A3A3 inset;
    -webkit-text-fill-color: #000000;
    outline: none;
}
</style>   