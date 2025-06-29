// router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user.js';

// Import des composants
import Home from '../views/Home.vue';
import Mail from '../views/Mail.vue';
import Conversation from '../views/Conversation.vue';

// Configuration des routes
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../components/Dashboard.vue'),
      },
    ],
  },
  {
    path: '/mail',
    name: 'Mail',
    component: Mail,
    meta: { requiresAuth: true },
  },
  {
    path: '/conversations/:id',
    name: 'Conversation',
    component: Conversation,
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../components/NotFound.vue'),
  },
];

// Création du router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard de navigation pour les routes protégées
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  // Vérifier si la route nécessite une authentification
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    // Rediriger vers la page d'accueil si non authentifié
    next('/');
  } else {
    next();
  }
});

export default router;