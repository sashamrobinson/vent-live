import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase'
import HomeView from '../views/HomeView.vue'
import SignUpView from '../views/SignUpView.vue'
import LogInView from '../views/LogInView.vue'
import MainView from '../views/MainView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      // Cannot access this page without auth
      requiresAuth: true
    }
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignUpView,
  },
  {
    path: '/login',
    name: 'login',
    component: LogInView
  },
  {
    path: '/main',
    name: 'main',
    component: MainView,
    meta: {
      // Cannot access this page without auth
      requiresAuth: true
    }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {

  // Cannot access log in page while logged in
  if (to.path === '/login' && auth.currentUser) {
    next('/main')
    return
  }

  // Cannot access sign up page while logged in
  if (to.path === '/signup' && auth.currentUser) {
    next('/main')
    return
  }

  // Cannot access main page while not logged in
  if (to.path === '/main' && !auth.currentUser) {
    next('/')
    return
  }

  next();
})

export default router

