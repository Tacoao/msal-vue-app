// main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initializeMsal } from './auth.js';

// Styles globaux
import './assets/css/global.css';

async function startApp() {
  // Initialiser MSAL avant de démarrer l'application
  await initializeMsal();
  
  // Créer l'application Vue
  const app = createApp(App);
  
  // Configurer Pinia pour la gestion d'état
  const pinia = createPinia();
  app.use(pinia);
  
  // Configurer le router
  app.use(router);
  
  // Monter l'application
  app.mount('#app');
}

// Démarrer l'application
startApp().catch(error => {
  console.error('Erreur lors du démarrage de l\'application:', error);
});