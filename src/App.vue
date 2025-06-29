<template>
  <div id="app">
    <!-- Composant principal qui gère l'affichage global -->
    <router-view />
    
    <!-- Toast notifications (optionnel) -->
    <div v-if="notifications.length > 0" class="notifications-container">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification"
        :class="notification.type"
      >
        {{ notification.message }}
        <button @click="removeNotification(notification.id)" class="notification-close">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from './stores/user.js';

// Store utilisateur
const userStore = useUserStore();

// Système de notifications simple
const notifications = ref([]);

// Méthodes pour les notifications
const addNotification = (message, type = 'info') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
  
  // Auto-suppression après 5 secondes
  setTimeout(() => {
    removeNotification(id);
  }, 5000);
};

const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
};

// Gestion des erreurs globales
const handleGlobalError = (error) => {
  console.error('Erreur globale:', error);
  addNotification('Une erreur inattendue s\'est produite', 'error');
};

// Initialisation
onMounted(() => {
  // Écouter les erreurs globales
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', (event) => {
    handleGlobalError(event.reason);
  });
  
  // Initialiser le store utilisateur
  userStore.initialize();
});
</script>

<style>
/* Styles globaux pour l'application */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f7fa;
  color: #333;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  position: relative;
}

/* Styles pour les notifications */
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

.notification {
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideIn 0.3s ease-out;
  backdrop-filter: blur(10px);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.info {
  background: rgba(33, 150, 243, 0.9);
  color: white;
}

.notification.success {
  background: rgba(76, 175, 80, 0.9);
  color: white;
}

.notification.warning {
  background: rgba(255, 152, 0, 0.9);
  color: white;
}

.notification.error {
  background: rgba(244, 67, 54, 0.9);
  color: white;
}

.notification-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2em;
  cursor: pointer;
  padding: 0;
  margin-left: 15px;
  opacity: 0.8;
}

.notification-close:hover {
  opacity: 1;
}

/* Styles utilitaires globaux */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #0078d4;
  color: white;
}

.btn:hover:not(:disabled) {
  background: #106ebe;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-outline {
  background: transparent;
  border: 1px solid #0078d4;
  color: #0078d4;
}

.btn-outline:hover:not(:disabled) {
  background: #0078d4;
  color: white;
}

/* Formulaires */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #0078d4;
  box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
}

/* Cards */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
}

.card-body {
  padding: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .notifications-container {
    left: 20px;
    right: 20px;
    max-width: none;
  }
  
  .btn {
    padding: 12px 16px;
    font-size: 16px;
  }
  
  .card-header, .card-body {
    padding: 15px;
  }
}

/* Animations globales */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

/* Scrollbars personnalisées */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Focus visible pour l'accessibilité */
*:focus-visible {
  outline: 2px solid #0078d4;
  outline-offset: 2px;
}

/* Suppression de l'outline par défaut */
*:focus {
  outline: none;
}
</style>