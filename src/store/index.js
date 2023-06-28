import { createStore } from 'vuex'
import router from '../router'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth' 
import { doc, setDoc, getDoc } from "firebase/firestore"

export default createStore({
  state: {
    user: null,
  },
  getters: {
    getCurrentUser: (state) => {
      return state.user
    },
    getUsername: (state) => {
      return state.user ? state.user.username : null
    },
    getUid: (state) => {
      return state.user ? state.user.uid : null
    },
    getEmail: (state) => {
      return state.user ? state.user.email : null
    }
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
    },
    CLEAR_USER(state) {
      state.user = null
    }
  },
  actions: {
    // Log in user method
    async login({ commit }, details) {
      const { email, password } = details

      try {
        await signInWithEmailAndPassword(auth, email, password)
      }
      catch (error) {
        switch(error.code) {
          // TODO: Change alerts 
          case 'auth/user-not-found':
            alert("User not found")
            break
          case 'auth/wrong-password':
            alert("Wrong password")
            break
          default:
            alert("Something went wrong. Try again")
        }

        return
      }

      commit('SET_USER', auth.currentUser)
      router.push('/main')
    },

    // Register user for authentication method
    async register({ commit, dispatch }, details) {
      const { email, password, username } = details

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        commit('SET_USER', user)
        await dispatch('addUserToDatabase', { username, email, uid: user.uid, profilePicture: "https://firebasestorage.googleapis.com/v0/b/fir-vent-a9a02.appspot.com/o/images%2Fdefault-profile-icon-24.jpg?alt=media&token=6b25c846-e004-46af-b9cf-aadfb702aae4" })
        router.push('/main')
      }
      catch (error) {
        switch(error.code) {
          // TODO: Change alerts 
          // TODO: add username overlap alert
          case 'auth/email-already-in-use':
            alert("Email already in use")
            break
          case 'auth/invalid-email':
            alert("Invalid email")
            break
          case 'auth/operation-not-allowed':
            alert("Operation not allowed")
            break
          case 'auth/weak-password':
            alert("Weak password")
            break
          default:
            alert("Something went wrong. Try again.")
        }

        return
      }
    },

    // Add user to database method
    async addUserToDatabase(_, userData) {
      try {
        const docRef = doc(db, 'users', userData.uid)

        // Add empty conversations array to user data
        const userObject = { ...userData, conversations: [] }
        await setDoc(docRef, userObject)

      }
      catch (error) {
        console.error("Error adding user to Firebase: ", error)
      }
    },

    // Logout method
    async logout({ commit}) {
      await signOut(auth)
      commit('CLEAR_USER')
      router.push('/')
    },

    fetchUser({commit}) {
      auth.onAuthStateChanged(async user => {
        if (user === null) {
          commit('CLEAR_USER')
        }
        else {
          const docRef = doc(db, 'users', user.uid)
          const docSnap = await getDoc(docRef)
          const userData = docSnap.data()

          const userWithDetails = {
            uid: user.uid,
            email: user.email,
            username: userData ? userData.username : null,
            
          }

          commit('SET_USER', userWithDetails)

          if (router.isReady() && router.currentRoute.value.path === '/login') {
            router.push('/')
          }
        }
      })
    }
    
  },
  modules: {
  }
})
