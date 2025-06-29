// stores/user.js
import { defineStore } from 'pinia';
import { login, logout, getCurrentAccount, getAccessToken } from '../auth.js';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),

  getters: {
    userName: (state) => state.user?.name || state.user?.displayName || 'Utilisateur',
    userEmail: (state) => state.user?.username || state.user?.mail || '',
  },

  actions: {
    // Initialisation - vérifier si un utilisateur est déjà connecté
    async initialize() {
      this.isLoading = true;
      try {
        const account = getCurrentAccount();
        if (account) {
          this.user = account;
          this.isAuthenticated = true;
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    // Connexion
    async signIn() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const response = await login();
        this.user = response.account;
        this.isAuthenticated = true;
        return response;
      } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Déconnexion
    async signOut() {
      this.isLoading = true;
      this.error = null;
      
      try {
        await logout();
        this.user = null;
        this.isAuthenticated = false;
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Récupération du token d'accès
    async getToken() {
      try {
        return await getAccessToken();
      } catch (error) {
        console.error('Erreur lors de la récupération du token:', error);
        this.error = error.message;
        throw error;
      }
    },

    // Effacer les erreurs
    clearError() {
      this.error = null;
    },
  },
});