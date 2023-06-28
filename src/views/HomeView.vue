<template>
    <body>
        <div class="background" >
            <div v-if="!showTabIntroWindow">
                <h1 class="typewriter">{{ headerText }}</h1>
                <button class="begin-button" @click="handleBegin" ref="targetButton" style="opacity: 0"></button>
            </div>
            <div v-if="showTabIntroWindow" class="intro-tab">
                <TabIntroWindow @close="showTabIntroWindow = !showTabIntroWindow" :pageDisplay="'home'"/>
            </div>
        </div>
    </body>
</template>

<script>
/* eslint-disable */
import TabIntroWindow from '../components/TabIntroWindow.vue'
import AuthButton from '../components/AuthButton.vue'
import typingSound from '../assets/sounds/typing-sound.mp3'
import openSound from '../assets/sounds/tab_sound_effect.wav'

export default {
    name: 'HomeView',
    components: {
        TabIntroWindow,
        AuthButton
    },
    data() {
        return {
            showTabIntroWindow: false,
            headerText: '',
            fullText: 'welcome to vent',
            currentIndex: 0,
            buttonCreated: false,
            openSound: new Audio(openSound),
            //typingSound: new Audio(typingSound),
        }
    },
    mounted() {
        setTimeout(() => {
            this.typewriterEffect()
        }, 500)
    },
    methods: {

        // Method for displaying typewriter effect on load
        typewriterEffect() {
            if (this.currentIndex < this.fullText.length) {
                this.headerText += this.fullText.charAt(this.currentIndex)
                this.currentIndex++

                // TODO:
                //  Play sound
                // this.typingSound.currentTime = 0
                // this.typingSound.volume = 0.15
                // this.typingSound.play()

                // Recursively call
                setTimeout(this.typewriterEffect, 100)
            } 
        
            else {
                if (!this.buttonCreated) {
                    if (this.$refs.targetButton != null) {
                        this.buttonCreated = true
                        const targetButton = this.$refs.targetButton
                        targetButton.style.transition = "opacity 0.5s ease"
                        targetButton.style.opacity = 0
                        targetButton.style.display = "inline-block";
                        setTimeout(() => {
                            targetButton.style.opacity = 1 
                        }, 500)
                    }
                }
                setTimeout(() => {
                    this.headerText = ''
                    this.currentIndex = 0
                    setTimeout(this.typewriterEffect, 100)
                }, 3000)
            }   
        },
        
        // Method for handling the begin button
        handleBegin() {
            
            // Play sound
            this.openSound.currentTime = 0
            this.openSound.volume = 0.15
            this.openSound.play()

            // Change views
            this.showTabIntroWindow = !this.showTabIntroWindow;

            this.buttonCreated = false;
        }
    }
}
</script>

<style>
.background {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    overflow-y: hidden;
    background-color: #5796FA;
}
.begin-button {
    position: absolute;
    left: 50%;
    top: 52%;
    transform: translate(-50%, -50%);
    background-image: url("../assets/images/begin_button.svg");
    background-size: cover; 
    background-repeat: no-repeat;
    padding: 0;
    margin: 0;
    width: 15.5em;
    height: 6em;
    cursor: pointer;
    border: none;
    background-color: transparent;
    z-index: 9999;
}
.fade {
    opacity: 0;
    transition: opacity 0.5s ease;
}
.typewriter {
    position: absolute;
    left: 50%;
    top: 40%;
    transform: translate(-50%, -50%);
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 2em;
    letter-spacing: 0.08em;
    overflow: hidden; 
    padding-right: 0.2em;
    border-right: 0.1em solid black; 
    animation: flash 1s step-start infinite;
}

@keyframes flash {
    50% {
        border-color: transparent;
    }
}
</style>
