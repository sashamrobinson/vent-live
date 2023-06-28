<template>
    <button class="auth-button" @click="navigate" :style="buttonImage"></button>
</template>

<script>
import openSound from '../assets/sounds/tab_sound_effect.wav'
export default {
    name: 'AuthButton',
    props: {
        text: String,
        auth: {
            type: String,
            required: true,
        },
        color: String,
        backgroundImage: {
            type: String,
            required: true,
        }
    },
    data() {
        return {
            openSound: new Audio(openSound),
        }
    },
    methods: { 
        navigate() {

            // Play sound
            this.openSound.currentTime = 0
            this.openSound.volume = 0.15
            this.openSound.play()

            // Navigate
            this.$router.push(`/${this.auth}`)
        }
    },
    computed: {
        destination() {
            return `/${this.auth}`;
        },
        buttonImage() {
            return {
                backgroundImage: `url(${require(`../assets/images/${this.backgroundImage}`)})`
            }
        }
    }
}
</script>

<style>
.auth-button {
    margin-bottom: 1em;
    height: 6em;
    width: 15.5em;
    background-size: cover; 
    background-repeat: no-repeat;
    background-color: transparent;
    cursor: pointer;
    border: none;
}
</style>