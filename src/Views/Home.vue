<template>
  <div class="home-container">
    <header class="header">
      <h1>📧 Gestionnaire d'Emails Microsoft</h1>
      
      <!-- Zone d'authentification -->
      <div class="auth-section">
        <div v-if="userStore.isLoading" class="loading">
          Chargement...
        </div>
        
        <div v-else-if="userStore.isAuthenticated" class="user-info">
          <div class="user-details">
            <span class="user-name">👋 Bonjour, {{ userStore.userName }}</span>
            <span class="user-email">{{ userStore.userEmail }}</span>
          </div>
          <button @click="handleLogout" class="btn btn-logout">
            Se déconnecter
          </button>
        </div>
        
        <div v-else class="login-section">
          <p>Connectez-vous pour accéder à vos emails</p>
          <button @click="handleLogin" class="btn btn-login">
            Se connecter avec Microsoft
          </button>
        </div>
      </div>

      <!-- Affichage des erreurs -->
      <div v-if="userStore.error" class="error-message">
        ⚠️ {{ userStore.error }}
        <button @click="userStore.clearError" class="btn-close">×</button>
      </div>
    </header>

    <!-- Navigation -->
    <nav v-if="userStore.isAuthenticated" class="navigation">
      <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">
        🏠 Accueil
      </router-link>
      <router-link to="/mail" class="nav-link" :class="{ active: $route.path === '/mail' }">
        📬 Mes Emails
      </router-link>
    </nav>

    <!-- Contenu principal -->
    <main class="main-content">
      <div v-if="!userStore.isAuthenticated" class="welcome-message">
        <h2>Bienvenue dans votre gestionnaire d'emails</h2>
        <p>Cette application vous permet de consulter vos emails Microsoft Outlook de manière sécurisée.</p>
        <ul>
          <li>✅ Connexion sécurisée avec Microsoft</li>
          <li>✅ Lecture de vos emails</li>
          <li>✅ Interface simple et intuitive</li>
        </ul>
      </div>
      
      <div v-else class="authenticated-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '../stores/user.js';

const userStore = useUserStore();

// Initialisation au montage du composant
onMounted(async () => {
  await userStore.initialize();
});

// Gestion de la connexion
const handleLogin = async () => {
  try {
    await userStore.signIn();
  } catch (error) {
    console.error('Erreur de connexion:', error);
  }
};

// Gestion de la déconnexion
const handleLogout = async () => {
  try {
    await userStore.signOut();
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
  }
};
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  background: linear-gradient(135deg, #0078d4, #106ebe);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0 0 20px 0;
  font-size: 2.5em;
  text-align: center;
}

.auth-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px 20px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.user-name {
  font-weight: bold;
  font-size: 1.1em;
}

.user-email {
  font-size: 0.9em;
  opacity: 0.8;
}

.login-section {
  text-align: center;
}

.login-section p {
  margin-bottom: 15px;
  font-size: 1.1em;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-login {
  background: #ffffff;
  color: #0078d4;
}

.btn-login:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.btn-logout {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
}

.loading {
  padding: 15px;
  text-align: center;
  font-weight: 500;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #c62828;
}

.navigation {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 0 15px;
}

.nav-link {
  padding: 12px 20px;
  text-decoration: none;
  color: #333;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  background: #f5f5f5;
}

.nav-link.active {
  background: #0078d4;
  color: white;
}

.main-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.welcome-message {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.welcome-message h2 {
  color: #0078d4;
  margin-bottom: 20px;
}

.welcome-message ul {
  text-align: left;
  display: inline-block;
  margin-top: 30px;
}

.welcome-message li {
  margin-bottom: 10px;
  font-size: 1.1em;
}

.authenticated-content {
  min-height: 400px;
}
</style>