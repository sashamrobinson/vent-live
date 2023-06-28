<template>
    <div class="moveable" ref="moveable">
        <div class="header" @mousedown="dragMouseDown">
            <img v-if="!displayArea" class="message-profile-picture" :src="downloadUrl" alt="">
            <h1 class="conversation-topic" v-if="!displayArea">{{selectedTopic + " - " + otherUser}}</h1>
            <h1 class="conversation-topic" v-if="displayArea">Start a conversation</h1>
            <WindowControls @close="closeTab" />
        </div>
        <div class="search-topic-area" v-if="displayArea">
            <div :class="{ uninteractable: isUninteractable }">
                <div>
                    <h1 style="font-size: 0.8em; margin: 5em 1em 0em 1em">Select a statement and you will be matched with someone of the opposite opinion. Discuss your opinion and try to convince them!</h1>
                    <input v-model="selectedTopic" class="search-topic-input" type="text" list="topics" placeholder="Select a statement">
                    <datalist id="topics">
                        <option value="Money can't buy happiness">Money can't buy happiness</option>
                        <option value="A woman's place is in the home">A woman's place is in the home</option>
                        <option value="Climate change is the world's biggest problem">Climate change is the world's biggest problem</option>
                        <option value="Participation awards are toxic for children">Participation awards are toxic for children</option>
                        <option value="The world was a better place before the internet">The world was a better place before the internet</option>
                        <option value="There are crimes that are deserving of the death penalty">There are crimes that are deserving of the death penalty</option>
                        <option value="Voting should be mandatory, not an option">Voting should be mandatory, not an option</option>
                        <option value="Democracy is the best structure for government">Democracy is the best structure for government</option>
                        <option value="It is impossible to be racist towards white people">It is impossible to be racist towards white people</option>
                        <option value="World peace will never happen">World peace will never happen</option>
                        <option value="Every qualified person should be allowed to own a gun">Every qualified person should be allowed to own a gun</option>
                        <option value="Abortion is a right">Abortion is a right</option>
                        <option value="Animal testing is unethical and should be banned">Animal testing is unethical and should be banned</option>
                    </datalist>
                </div>
                <div class="queue-buttons">
                    <button class="queue-button" style="background-color: #69F066" @click="joinQueue(1, selectedTopic)">Agree</button>
                    <button class="queue-button" style="background-color: #FE7070" @click="joinQueue(0, selectedTopic)">Disagree</button>
                </div>
                <h1 v-if="displayError" class="error-message">{{errorMessage}}</h1>
            </div>
            <div class="search-area" v-if="displaySearch">
                <h2>{{searchMessage}}
                    <span class="ellipsis-animation-1">.</span>
                    <span class="ellipsis-animation-2">.</span>
                    <span class="ellipsis-animation-3">.</span>
                </h2>
                <button @click="leaveQueue()">Cancel Search</button>
            </div>
        </div>
        <div v-if="!displayArea">
            <div class="messages" id="messages">
                <ChatMessage
                    :message="`You are now speaking with ${otherUser}. You are discussing the prompt ${selectedTopic}. Introduce yourself and please be kind, respectful and keep an open mind.`"
                    :sender="true"
                />
                <ChatMessage 
                    v-for="(message, index) in messages" 
                    :key="index" 
                    :message="message.messageContent" 
                    :sender="message.senderUid === this.$store.getters.getUid ? true : false" 
                    :index="index"
                    :uid="message.senderUid"
                />
            </div>
            <div class="footer">
                <textarea placeholder="Type your message..." v-model="messageToSendContent" @keydown.enter="sendMessage" @input="playTypingSound" class="message-input" type="text" spellcheck="false"> </textarea>
            </div>
        </div>
    </div>
</template>

<script>
/* eslint-disable */
import ChatMessage from './ChatMessage.vue';
import WindowControls from './WindowControls.vue'
import { db, storage } from '../firebase/index.js'
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage"
import typingSound from '../assets/sounds/typing-sound.mp3'
import { updateProfile } from 'firebase/auth';

export default {
    name: 'MoveableWindow',
    components: {
        ChatMessage,
        WindowControls,
    },
    props: {
        preexistingCid: String,
    },
    data() {
        return {
            // Arrays holding components
            messages: [],
            activeConversations: [],

            // Message in text area to send upon submit
            messageToSendContent: "",

            // Strings for containing conversation information
            otherUser: "",
            selectedTopic: "",

            // Booleans for changing which elements to show / interact with
            displaySearch: false,
            displayError: false,
            displayArea: true,
            isUninteractable: false,

            // IDs 
            cid: "",
            queueingId: "",

            // Messages to display to user
            searchMessage: "Searching",
            errorMessage: "",

            // Sound effects
            typingSound: new Audio(typingSound),

            // Profile picture
            downloadUrl: '',
        }
    },
    async mounted() {
        // Make window draggable
        this.dragElement(this.$refs.moveable);

        // If this window was generated from an already existing conversation, skip straight to conversation
        if (typeof this.preexistingCid === 'string' && this.preexistingCid.trim().length > 0) {
            this.displayArea = false
            this.cid = this.preexistingCid

            // Grab topic and other user from cid and set fields
            const conversationRef = doc(db, 'conversations', this.cid)
            const conversationSnapshot = await getDoc(conversationRef)

            if (conversationSnapshot.exists()) {
                const { participants, topic, participantsUid } = conversationSnapshot.data()
                this.selectedTopic = topic

                // Set profile picture
                const uid = this.$store.getters.getUid
                if (uid === participantsUid[0]) {
                    this.updateProfilePicture(participantsUid[1])
                }
                else {
                    this.updateProfilePicture(participantsUid[0])
                }

                // Display participant which is not user
                const username = this.$store.getters.getUsername
                if (username === participants[0]) {
                    this.otherUser = participants[1]
                }
                
                else {
                    this.otherUser = participants[0]
                }
            }
            this.listenForNewMessages()
        }

        // Listener for cid changing to find new messages
        this.$watch('cid', (newVal) => {
            if (newVal) {
                this.listenForNewMessages()
            }
        })
    },
    beforeUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe()
        }

        // User closed tab, leave queue
        if (this.queueingId.length > 0) {
            deleteDoc(doc(db, 'queue', this.queueingId))
        }
    }, 
    methods: {
        async updateProfilePicture(uid) {
            // Get database reference   
            const userRef = doc(db, 'users', uid)
            const userConversationsSnapshot = await getDoc(userRef)

            if (userConversationsSnapshot.exists()) {

                // Get image url
                const url = userConversationsSnapshot.data().profilePicture
                console.log('This is the url: ' + url)

                const storageRef = ref(storage, url)
                getDownloadURL(storageRef)
                .then((url) => {
                    this.downloadUrl = url
                })
                .catch((error) => {
                    alert("An error occured loading profile pictures. Refresh the page to fix this.")
                    console.log(error)
                })
        
            }
            else {
                alert("An error occured loading profile pictures. Refresh the page to fix this.")
            }
        },
        // Method for queueing and creating conversations with other users (0 --> Against, 1 --> Pro)
        async joinQueue(bias, topic) {
            
            // Make sure user has chosen a valid topic
            const options = document.getElementById('topics').options
            const isValid = Array.from(options).some(option => option.value === topic)

            // Topic invalid
            if (!isValid) {
                this.errorMessage = "Please choose a valid topic"
                this.displayError = true
            }

            // Topic valid, reset error
            this.errorMessage = ""
            this.displayError = false;

            // Disable selecting another option 
            this.isUninteractable = true;

            // Show searching and queue cancel to user
            this.displaySearch = true;

            try {
                // Query for bias being the opposite of what the user chose
                const userBias = bias === 0 ? 1 : 0

                const queryResults = query(collection(db, 'queue'),
                 where('bias', '==', userBias), 
                 where('topic', '==', topic))
                const querySnapshot = await getDocs(queryResults)

                // Get username from store
                const username = this.$store.getters.getUsername

                // No one else in queue for conversation --> create queue so that others can find you
                if (querySnapshot.empty) {

                    // Query snapshot is empty
                    console.log("No documents found")

                    // Creating reference
                    const queueRef = collection(db, 'queue')
                    const docRef = doc(queueRef)

                    // Creating queue for others to find you
                    await setDoc(docRef, {
                        bias: bias,
                        qid: docRef.id,
                        topic: topic,
                        username: username,
                        connectingUser: null,
                        connectingUserUid: null,
                        queueingUserUid: this.$store.getters.getUid,
                    }) 

                    // Give queue to queueingId for unqueue
                    this.queueingId = docRef.id

                    // Waiting for other user to find to us --> Set up listener to watch
                    const listener = onSnapshot(doc(queueRef, docRef.id), (docSnapshot) => {
                        const data = docSnapshot.data()

                        // If data exists and there is another user trying to connect
                        if (data && data.connectingUser !== null) {
                            console.log("User has connected to our queue --> Moving to active conversation")
                            
                            // Set profile picture
                            this.updateProfilePicture(data.connectingUserUid)

                            // Change header and display
                            this.otherUser = "@" + data.connectingUser
                            this.displayArea = !this.displayArea

                            // Return conversation id for messaging use with the same id 
                            this.cid = docRef.id

                            // Add conversation to user 
                            this.addConversationToUser(docRef.id)
                        }
                    })
                }

                // Found other person queueing with opposite bias --> create conversation
                else {
                    
                    // Tell user we are connecting
                    this.searchMessage = "Connecting with user"

                    // Choose random document from returned snapshot (so as to avoid ascending document bias)
                    const index = Math.floor(Math.random() * querySnapshot.size)
                    const document = querySnapshot.docs[index]
                    const data = document.data()
                    
                    // Now have the document we wish to connect to --> put in username and connect
                    if (document.connectingUser == null && document.username != username) {

                        // Clear to connect to document
                        await updateDoc(doc(db, 'queue', document.id), { connectingUser: username, connectingUserUid: this.$store.getters.getUid})
                        
                        // Document is now secured --> create conversation and connect
                        console.log("Successfully paired and connected to conversation with: ", data.username)

                        // Get reference to database
                        const conversationsRef = collection(db, 'conversations')
                        const newDoc = doc(conversationsRef, data.qid)
                        await setDoc(newDoc, {
                            createdAt: Date.now(),
                            participants: [
                                username,
                                data.username,
                            ],
                            topic: topic,
                            messages: [

                            ],
                            cid: data.qid,
                            participantsUid: [
                                data.queueingUserUid,
                                this.$store.getters.getUid
                            ]
                        })
                        
                        // Set profile picture
                        this.updateProfilePicture(data.queueingUserUid)

                        // Change display
                        this.otherUser = "@" + data.username
                        this.displayArea = !this.displayArea
                        
                        // Remove your queue
                        deleteDoc(doc(db, 'queue', document.id))

                        // Return conversation id for messaging use
                        this.cid = data.qid
                        
                        // Update conversation id
                        await updateDoc(newDoc, {
                            cid: data.qid
                        });

                        // Add conversation to user 
                        this.addConversationToUser(data.qid)
                        
                    }
                    else {
                        // Inbetween the snapshot, someone else has queued into this document, rejoin queue for another document
                        // Or, connecting to queue made by self
                        this.joinQueue(bias, topic)
                    }
                }
            }
            catch (error) {
                console.log(error);
                alert("An error occured. Please refresh the page.")
            }
        },
        
        // Method for adding conversations to user account
        async addConversationToUser(cid) {

            // Add conversation to active conversations on user account
            const userRef = doc(db, 'users', this.$store.getters.getUid)
            const userConversationsSnapshot = await getDoc(userRef)
            let existingConversations = []
            
            // Grab conversations
            if (userConversationsSnapshot.exists()) {
                existingConversations = userConversationsSnapshot.data().conversations || []
            }

            else {
                console.log("Could not find user conversations")
                alert("An error occured. Please refresh the page.")
            }

            // Update array and database
            existingConversations.push(cid)

            // Send existing conversations up to parent view for rendering
            this.$emit('sendActiveConversations', existingConversations)

            // Update database
            await updateDoc(userRef, { conversations: existingConversations })
        },

        // Method for leaving queue 
        async leaveQueue() {
            
            // Update interface
            this.isUninteractable = false;
            this.displaySearch = false;

            // Remove queue from database
            deleteDoc(doc(db, 'queue', this.queueingId))

            // Reset queueingId
            this.queueingId = ""

        },

        // Method responsible for sending messages to database
        async sendMessage() {

            // Check if message is empty
            if (this.messageToSendContent.trim().length === 0) {

                // Message is empty, return
                return
            } 

            try {
                // Create message to be stored
                const message = {
                    messageContent: this.messageToSendContent,
                    timeSent: Date.now(),
                    senderUid: this.$store.getters.getUid
                }

                // Clear text area
                this.messageToSendContent = ''

                // Get reference to document
                const conversationRef = doc(db, 'conversations', this.cid)
                const conversationSnapshot = await getDoc(conversationRef)

                // Make sure conversation document we are looking for exists
                if (conversationSnapshot.exists()) {
                    
                    // Grab existing messages (or empty array if null)
                    const existingMessages = conversationSnapshot.data().messages || []

                    // Add to existing messages
                    existingMessages.push(message);

                    // Update variable
                    this.messages = existingMessages

                    // Update firebase
                    await updateDoc(conversationRef, { messages: existingMessages})

                    // Scroll to bottom
                    const messagesDiv = document.getElementById("messages")
                    messagesDiv.scrollTop = messagesDiv.scrollHeight
                } 

                else {
                    console.log("Could not find conversation")
                    alert("An error occured. Please refresh the page.")
                }
            }
            catch (error) {
                console.log(error)
                alert("An error occured and the message could not be sent. Please refresh the page.")
            }

        },

        // Method for listening and reacting to new messages
        listenForNewMessages() {
            const conversationRef = doc(db, 'conversations', this.cid);

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

        playTypingSound() {
            this.typingSound.currentTime = 0
            this.typingSound.volume = 0.15
            this.typingSound.play()
        },

        // Method for closing tab
        closeTab() {
            this.$emit('close')
        },

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
    },
}
</script>

<style scoped>
.moveable {
    position: absolute;
    z-index: 9;
    background-color: #D9D9D9;
    text-align: center;
    width: 26.6em;
    height: 40.2em;
    border: 0;
    box-shadow: 4px 8px 4px rgba(0, 0, 0, 0.25);
}

.footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #3D3A3A;
    height: 4em;
    align-items: center;
    vertical-align: middle;
    display: flex;
}

.message-input {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: auto;
    resize: none;
    background-color: #3D3A3A;
    color: #ffffff;

}

.header {
    display: flex;
    padding: 0;
    cursor: grab;
    z-index: 10;
    background-color: #3D3A3A;
    color: #ffffff;
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 0.5em;
    height: 8em;
}

.conversation-topic {
    margin: 1em;
    max-width: 15em;
}

.search-topic-input {
    width: 18.5em; 
    height: 4em;
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 1em;
    margin-top: 2em;
}

.search-topic-area {
    color: black;
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 1em;
}

.queue-buttons {
    margin: 1em;
}

.queue-button {
    width: 9em;
    height: 4em;
    font-family: "CourierPrime-Regular";
    font-style: normal;
    font-weight: 550;
    font-size: 1em;
    margin: 0.5em;
    border: 0.15em solid #000000;
    cursor: pointer;
    filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
}

.uninteractable {
  opacity: 0.5;
  pointer-events: none;
}

.error-message {
    color: red;
    font-size: 1em;
}

.messages {
    overflow: scroll;
    max-height: 33em;
}

.messages::-webkit-scrollbar {
    display: none;
}

@keyframes ellipsis-1 {
  0% {
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  40% {
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  80% {
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
  
}
@keyframes ellipsis-2 {
  0% {
    opacity: 0;
  }
  20% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  80% {
      opacity: 1;
  }
  100% {
      opacity: 0;
  }
}
@keyframes ellipsis-3 {
  0% {
    opacity: 0;
  }
  20% {
    opacity: 0;
  }
  40% {
    opacity: 0;
  }
  60% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}
.ellipsis-animation-1 {
  animation: ellipsis-1 1s infinite;
}
.ellipsis-animation-2 {
  animation: ellipsis-2 1s infinite;
}
.ellipsis-animation-3 {
  animation: ellipsis-3 1s infinite;
}
</style>