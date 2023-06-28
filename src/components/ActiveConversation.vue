<template> 
    <div class="active-conversation-tab" @click="sendWindowToParent">
        <img src="../assets/images/file_logo.svg" alt="">
        <h1 class="active-conversation-text">{{conversationTopic + ' - @' + otherUser}}</h1>
    </div>
</template>

<script>
import { db } from '../firebase/index.js'
import { doc, getDoc } from "firebase/firestore";
export default {
    name: 'ActiveConversation',
    props: {
        cid: String,
    },
    data() {
        return {
            conversationTopic: "",
            otherUser: ""
        }
    },
    methods: {
        // Method for alerting main view that it needs to generate a window
        sendWindowToParent() {
            this.$emit('generateExistingConversation', this.cid)
        }
    },
    
    // Method for setting up fields before mounting
    async beforeMount() { 
        
        // Grab topic and other user from cid and set fields
        const conversationRef = doc(db, 'conversations', this.cid)
        const conversationSnapshot = await getDoc(conversationRef)

        if (conversationSnapshot.exists()) {
            const { participants, topic } = conversationSnapshot.data()
            this.conversationTopic = topic

            // Display participant which is not user
            const username = this.$store.getters.getUsername
            if (username === participants[0]) {
                this.otherUser = participants[1]
            }
            
            else {
                this.otherUser = participants[0]
            }
        }

        else {
            alert("An error occured. Please refresh the page.")
        }
    },
}

</script>

<style>
.active-conversation-tab {
    display: flex;
    margin-left: 1em;
    margin-right: 1em;
}
.active-conversation-tab:hover {
    cursor: pointer;
}
.active-conversation-text {
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 1em;
    margin: 1em;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
</style>