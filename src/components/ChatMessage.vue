<template>
  <div :class="messageSenderOrReceiver" class="message">
    <h4 class="message-text">{{message}}</h4>
  </div>
</template>

<script>
export default {
    name: 'ChatMessage',
    props: {
      message: String,
      sender: Boolean,
      uid: String,

    },
    computed: {
        // Changes ChatMessage returned depending on if the user or recipient sent it
        messageSenderOrReceiver() {
            if (this.sender) {
              // Make message appear on right, blue
              return "sentMessage"
            }

            else {
              // Make message appear white, left
              return "receivedMessage"
            }
        }
    },
}
</script>

<style>
.message-profile-picture {
  margin-top: 1em;
  margin-left: 1em;
  width: 5em;
  height: 5em;
  border-radius: 50%;
  background-color: white;
  z-index: 9999;
}

.message {
  margin: 0.5em;
  text-align: left;
  border-radius: 0.2em;
  max-width: 19em;
  word-wrap: break-word;
}

.message-text {
  padding: 0.5em;
  font-family: "CourierPrime-Regular";
  font-style: normal;
  font-weight: 550;
  font-size: 0.75em;
}

.sentMessage {
  position: relative;
  background-color: #5796FA;
  margin-left: auto;
  color: white;
}

.sentMessage .message-profile-picture {
  right: 0;
}

.receivedMessage {
  position: relative;
  background-color: #FFFFFF;
}

.receivedMessage .message-profile-picture {
  left: 0;
}

</style>