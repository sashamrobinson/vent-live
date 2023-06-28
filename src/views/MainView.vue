<template>
    <div class="background">
        <div class="wave" :style="{ opacity: beginWave ? 1 : 0 }"></div>
        <div id="mySidenav" class="sidenav">
            <div class="logo-container">
                <button class="logo" @click="openNav"></button>
            </div>
            <div class="active-conversations" v-for="(cid, index) in activeConversations" :key="index">
                <ActiveConversation @generateExistingConversation="recieveExistingConversation" :cid="cid"/>
            </div>
            <button @click="showSettings = !showSettings" class="settings-button"></button>
        </div>
        <div class="temporary">
            <button class="start-conversation-button" @click="startConversation"></button>
            <button @click="clearConversations">Clear Conversations</button>
        </div>
        <div v-for="(ChatWindow, index) in chatWindows" :key="index">
            <ChatWindow @close="closeTab(index)" @sendActiveConversations="recieveConversations" :preexistingCid="ChatWindow.props.preexistingCid" :key="index"/>
        </div>
        <div v-if="showSettings">
            <SettingsWindow @close="showSettings = !showSettings" />
        </div>
    </div>
</template>

<script>
/* eslint-disable */
import ChatWindow from '../components/ChatWindow.vue'
import ActiveConversation from '../components/ActiveConversation.vue'
import AuthButton from '../components/AuthButton.vue'
import SettingsWindow from '../components/SettingsWindow.vue'
import { db } from '../firebase/index.js'
import { collection, getDocs, getDoc, deleteDoc, doc } from "firebase/firestore";

export default {
    name: 'HomeView',
    components: {
        ChatWindow,
        ActiveConversation,
        AuthButton,
        SettingsWindow
    },
    data() {
        return {
            chatWindows: [],
            activeConversations: [],
            showSettings: false,
            beginWave: false,
        }
    },
    methods: {
        closeTab(index) {
            this.chatWindows.splice(index, 1)
        },

        // Method for generating windows
        startConversation() {
            this.chatWindows.push(ChatWindow);
        },

        // TODO: Remove function PURELY FOR DEBUGGING
        async clearConversations() {
            try {
                // Get a reference to the 'conversations' collection
                const conversationsRef = collection(db, 'conversations');

                // Get all documents in the 'conversations' collection
                const querySnapshot = await getDocs(conversationsRef);

                // Delete each document in the collection
                querySnapshot.forEach(async (conversationDoc) => {
                await deleteDoc(doc(conversationsRef, conversationDoc.id));
                });

            }   
            catch (error) {
                console.error('Error clearing "conversations" collection:', error);
            }
        },

        // Method for recieving active conversations from child component
        recieveConversations(conversations) {
            this.activeConversations = conversations
        },

        // Method for recieving an existing conversation and displaying it as a chat window
        recieveExistingConversation(existingConversation) {
            
            // If window already exists, dont display another
            const isExisting = this.chatWindows.some(chatWindow => {
                return chatWindow.props.preexistingCid === existingConversation
            })

            if(isExisting) {
                return
            }   

            // Add window to chatWindows
            this.chatWindows.push({
                component: ChatWindow,
                props: {
                    preexistingCid: existingConversation
                }
            })
        },

        // Method for listening and reacting to new messages
        listenForConversations() {
            const conversationRef = doc(db, 'conversations', this.$store.getters.getUid);

            // Snapshot listener for when a new messsage comes in
            this.unsubscribe = onSnapshot(conversationRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const conversationData = docSnapshot.data();
                    const messages = conversationData.messages || [];

                    // Update the messages array
                    this.messages = messages;

                    // Scroll to bottom
                    const messagesDiv = document.getElementById("messages")
                    messagesDiv.scrollTop = messagesDiv.scrollHeight
                }
            })
        },

        // Method for getting active conversations to display
        async getActiveConversations() {
            
            const userRef = doc(db, 'users', this.$store.getters.getUid)
            const userConversationsSnapshot = await getDoc(userRef)
            let existingConversations = []
            
            // Grab conversations
            if (userConversationsSnapshot.exists()) {
                existingConversations = userConversationsSnapshot.data().conversations || []
            }

            this.activeConversations = existingConversations
        }
    },
    
    mounted() {

        // Populate active conversations
        this.getActiveConversations()

        // Begin wave animation
        setTimeout(() => {
        this.beginWave = true;
        }, 100);
    },

    // Before closing view unsubscribe from listener and leave queue
    beforeUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe()
        }
    },

}
</script>

<style>
.logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
}

.logo {
    display: inline-block;
    width: 17em; 
    height: 14em; 
    background-image: url("../assets/images/vent_logo.svg");
    background-repeat: no-repeat;
    background-size: cover; 
    background-color: rgba(0,0,0,0);
    border: none;
    padding: 0;
    margin: 3em 1em 1em 1em;
    cursor: pointer;
}
.sidenav {
    position: relative;
    height: 100%;
    width: 1em;
    position: fixed;
    z-index: 100;
    top: 0;
    left: 0;
    background-color: #3D3A3A;
    overflow-x: hidden;
    transition: width 0.5s, background-color 0.5s;
    box-shadow: 4px 8px 4px rgba(0, 0, 0, 0.25);
}

.sidenav:hover {
    width: 20em;
    background-color: #D9D9D9
}

.sidenav:hover .settings-button {
    /*TODO: Needs slight tuning */
    opacity: 1;
}

.temporary {
    position: absolute;
    right: 0;
}

.settings-button {
    opacity: 0;
    position: absolute;
    left: 50%;
    bottom: 1em;
    transform: translate(-50%, 0%);
    height: 6em;
    width: 17.25em;
    background-image: url("../assets/images/settings_button.svg");
    background-size: cover; 
    background-repeat: no-repeat;
    background-color: transparent;
    padding: 0;
    margin: 0;
    cursor: pointer;
    border: none;
}

.active-conversations {
    overflow: scroll;
    max-height: 33em;
    /* TODO: Add max height for scrollability */
}

.active-conversations::-webkit-scrollbar {
    display: none;
}

.start-conversation-button {
    position: absolute;
    right: 1em;
    top: 1em;
    height: 6em;
    width: 17.25em;
    background-image: url("../assets/images/start_conversation_button.svg");
    background-size: cover; 
    background-repeat: no-repeat;
    background-color: transparent;
    padding: 0;
    margin: 0;
    cursor: pointer;
    border: none;
}

/* Wave Animation: modified from https://codepen.io/joshbader/pen/BzVmVw */
.wave,
.wave::before,
.wave::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 250vw;
    height: 250vw;
    margin-left: -125vw;
    transform-origin: 50% 50%;
    border-radius: 38% 42%;
    animation: spin 16s infinite linear;
    transition: opacity 2s ease-in-out;
}

.wave::after {
    width: 102%;
    height: 98%;
    margin-top: -125vw;
    transform-origin: 51% 49%;
    border-radius: 48% 42%;
    box-shadow: inset 0 0 10vw #8BB8FF;
    animation: spin 10s infinite linear;
}

@keyframes spin {
    100% { transform: rotate(360deg); }
}
</style>