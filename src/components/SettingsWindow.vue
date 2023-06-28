<template>
    <div class="moveable" ref="moveable">
        <div class="header" @mousedown="dragMouseDown">
            <h1 class="conversation-topic">Settings</h1>
            <WindowControls @close="closeTab"/>
        </div>
        <div class="profile-picture-area">
            <div @click="openFileInput" class="profile-picture" :style="{ backgroundImage: `url(${this.profilePicture})` }"></div>
            <h1 class="change-picture-text">change picture</h1>
            <input type="file" ref="fileInput" style="display: none" @change="uploadProfilePicture">
        </div>
        <div class="profile-info">
            <div class="info-field">
                <h1 style="opacity: 0.5; width: 5em; text-align: left">username</h1>
                <h1 id="username" @input="updateUsername" :contenteditable="editingProfile" :style="{ color: changeTextColor }" style="margin-left: 3em; outline: none;">{{username}}</h1>
            </div>
            <div class="thin-bar"></div>
            <div class="info-field">
                <h1 style="opacity: 0.5; width: 5em; text-align: left">email</h1>
                <h1 id="email" @input="updateEmail" :contenteditable="editingProfile" :style="{ color: changeTextColor }" style="margin-left: 3em; outline: none;">{{email}}</h1>
            </div>
            <div class="thin-bar"></div>
            <h1 @click="editProfile" class="edit-profile">{{editingText}}</h1>
        </div>
        <button @click="$store.dispatch('logout')" class="logout-button"></button>
    </div>
</template>

<script>
/* eslint-disable */
import WindowControls from './WindowControls.vue'
import { auth, db, storage } from '../firebase'
import { updateDoc, doc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { updateEmail, } from "firebase/auth";

export default {
    name: 'SettingsWindow',
    components: {
        WindowControls,
    },
    data() {
        return {
            username: this.$store.getters.getUsername,
            email: this.$store.getters.getEmail,
            editingProfile: false,
            editingText: 'edit profile',
            profilePicture: '',
        }
    },
    async mounted() {
        this.dragElement(this.$refs.moveable);
    },
    async beforeCreate() {

        // Grab profile picture and set it
        const userRef = doc(db, 'users', this.$store.getters.getUid)
        const userProfileSnapshot = await getDoc(userRef)
        if (userProfileSnapshot.exists()) {
                    
            const profile = userProfileSnapshot.data().profilePicture || ''
            if (profile.length > 0) {
                this.profilePicture = profile
            }
            else {
                this.profilePicture = require('../assets/images/test_image.webp')
            }
        }
    },
    computed: {
        
        // Changes text color when editing profile
        changeTextColor() {
            return this.editingProfile ? '#EC6A5E' : 'black'
        }
    },
    methods: {
        // Code adapted for Vue from https://www.w3schools.com/howto/howto_js_draggable.asp
        dragElement(elmnt) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            const header = elmnt.querySelector(".header");
            header.onmousedown = dragMouseDown;

            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }

            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                elmnt.style.top = elmnt.offsetTop - pos2 + "px";
                elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
                }
        },
        
        // Captures username as user changes it
        updateUsername(event) {
            this.username = event.target.textContent
        },

        // Captures email as user changes it
        updateEmail(event) {
            this.email = event.target.textContent
        },

        // Method for allowing user to edit their profile
        async editProfile() {
            
            //TODO: update store with SET_USER
            // Begin editing
            if (!this.editingProfile) {

                // Make username and email editable, display to user
                this.editingProfile = !this.editingProfile
                this.editingText = 'save changes'
            }

            // Begin saving
            else {

                // Make username and email uneditable, display to user
                this.editingProfile = !this.editingProfile
                this.editingText = 'changes saved!'

                // Save user information to firebase auth
                updateEmail(auth.currentUser, this.email)
                    .then(() => {
                        console.log("Email updated successfully")
                        this.updateDatabase()
                        
                    })
                    .catch((error) => {
                        switch(error.code) {
                            // TODO: Change alerts 
                            case 'auth/user-not-found':
                                alert("User not found")
                                break
                            case 'auth/requires-recent-login':
                                alert("Please log out and relog in")
                                break

                            default:
                                alert("Something went wrong. Try again")
                        }
                    })
            }
        },
        // Method for updating user database and conversations when username / email changed
        async updateDatabase() {
            try {
                // Save user information to firebase user
                await updateDoc(doc(db, 'users', this.$store.getters.getUid), { username: this.username, email: this.email})
            
                // Change all of users conversations
                const userRef = doc(db, 'users', this.$store.getters.getUid)
                const userConversationsSnapshot = await getDoc(userRef)
                var conversations = []

                // Grab conversations
                if (userConversationsSnapshot.exists()) {
                    
                    // Loop through conversations and update username
                    conversations = userConversationsSnapshot.data().conversations || []
                    conversations.forEach((cid) => {

                        var conversationRef = doc(db, 'conversations', cid)
                        getDoc(conversationRef)
                            .then((conversationSnapshot) => {
                                const participants = conversationSnapshot.data().participants || []
                                const oldUsername = this.$store.getters.getUsername
                                const newUsername = this.username
                                if (oldUsername === participants[0]) {
                                    updateDoc(conversationRef, { participants: [
                                        newUsername,
                                        participants[1]
                                    ]})
                                }
                                
                                else {
                                    updateDoc(conversationRef, { participants: [
                                        newUsername,
                                        participants[0]
                                    ]})
                                }
                            })
                            .catch((error) => {
                                alert("An error occured. Please refresh the page")
                                console.log(error)
                            }) 
                    })
                }

                else {
                    alert("An error occured. Please refresh the page.")
                }
            }
            catch (error) {
                alert("An error occured. Please refresh the page.")
                console.log(error)
            }
        },
        // Method for closing tab
        closeTab() {
            this.$emit('close')
        },

        openFileInput() {
            this.$refs.fileInput.click()
        },

        // Method for uploading profile pictures
        async uploadProfilePicture(event) {
            const file = event.target.files[0]
            const storageRef = ref(storage, 'images/' + file.name)

            try {
                
                // Upload picture to database
                await uploadBytes(storageRef, file)
                const downloadUrl = await getDownloadURL(storageRef)

                // Add download URL to user profile
                const userRef = doc(db, 'users', this.$store.getters.getUid)

                // Update download URL
                updateDoc(userRef, { profilePicture: downloadUrl})

                // Update profile picture in settings
                this.profilePicture = downloadUrl


            }
            catch (error) {
                alert("An error occured uploading your profile picture. Please try again later.")
                console.log(error)
            }
        }
    },
}
</script>

<style>
.moveable {
    position: absolute;
    z-index: 9;
    background-color: #D9D9D9;
    width: 26.6em;
    height: 40.2em;
    border: 0;
    box-shadow: 4px 8px 4px rgba(0, 0, 0, 0.25);
}

.header {
    display: flex;
    padding: 1em;
    cursor: grab;
    z-index: 10;
    background-color: #3D3A3A;
    color: #ffffff;
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 0.5em;
    text-align: center;
    height: 6em;
}
.conversation-topic {
    margin: 1em;
}

.profile-picture-area {
    position: relative;
    display: flex;
    margin-bottom: 1em;
    align-items: center;
    justify-content: center;
}

.profile-picture {
    margin: 1em 0em 0em 1em;
    border-radius: 50%;
    height: 12em;
    width: 12em;
    background-image: url("../assets/images/Button.svg");
    background-size: cover;
    background-repeat: no-repeat; 
}

.change-picture-text {
    text-align: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 0;
    margin-left: 0.5em;
    opacity: 0;
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 1em;
    color: white;
    pointer-events: none;
}

.profile-picture:hover {
    filter: brightness(50%);
    cursor: pointer;
}

.profile-picture:hover + .change-picture-text {
    opacity: 1;
}

.profile-info {
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 0.5em;
}

.info-field {
    display: flex;
    margin-left: 1em;
    padding: 0;
}

.thin-bar {
    position: relative;
    width: 95%;
    height: 0.125em;
    background-color: #3D3A3A;
    margin-left: 1em;
    margin-right: 1em;
    margin-bottom: 2em;
}
.logout-button {
    position: absolute;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    bottom: 1em;
    height: 4.81em;
    width: 12.43em;
    background-image: url("../assets/images/logout_button.svg");
    background-size: cover; 
    background-repeat: no-repeat;
    background-color: transparent;
    padding: 0;
    cursor: pointer;
    border: none;
}
.edit-profile {
    text-align: center;
    margin-top: 2em;
    cursor: pointer;
    opacity: 0.5;
}
</style>