<template>
  <div class="dashboard">
    <div class="welcome-section">
      <h2>🎯 Tableau de bord</h2>
      <p>Bienvenue {{ userStore.userName }} ! Voici un aperçu de vos emails.</p>
    </div>

    <!-- Statistiques rapides -->
    <div class="stats-grid">
      <div class="stat-card" :class="{ loading: isLoading }">
        <div class="stat-icon">📬</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalEmails }}</div>
          <div class="stat-label">Emails totaux</div>
        </div>
      </div>
      
      <div class="stat-card" :class="{ loading: isLoading }">
        <div class="stat-icon">📭</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.unreadEmails }}</div>
          <div class="stat-label">Non lus</div>
        </div>
      </div>
      
      <div class="stat-card" :class="{ loading: isLoading }">
        <div class="stat-icon">📤</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.todayEmails }}</div>
          <div class="stat-label">Aujourd'hui</div>
        </div>
      </div>
      
      <div class="stat-card" :class="{ loading: isLoading }">
        <div class="stat-icon">⭐</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.importantEmails }}</div>
          <div class="stat-label">Importants</div>
        </div>
      </div>
    </div>

    <!-- Emails récents -->
    <div class="recent-emails-section">
      <div class="section-header">
        <h3>📋 Emails récents</h3>
        <router-link to="/mail" class="view-all-link">Voir tous →</router-link>
      </div>
      
      <div v-if="isLoading" class="loading-state">
        <div class="skeleton-items">
          <div v-for="i in 3" :key="i" class="skeleton-item"></div>
        </div>
      </div>
      
      <div v-else-if="recentEmails.length === 0" class="empty-state">
        <p>Aucun email récent à afficher</p>
      </div>
      
      <div v-else class="recent-emails-list">
        <div 
          v-for="email in recentEmails" 
          :key="email.id"
          class="recent-email-item"
          :class="{ unread: !email.isRead }"
          @click="viewEmail(email.id)"
        >
          <div class="email-sender">
            <div class="sender-avatar">{{ getSenderInitials(email) }}</div>
            <div class="sender-info">
              <div class="sender-name">{{ getSenderName(email) }}</div>
              <div class="email-subject">{{ email.subject || '(sans objet)' }}</div>
            </div>
          </div>
          <div class="email-meta">
            <div class="email-time">{{ formatRelativeTime(email.receivedDateTime) }}</div>
            <div class="email-flags">
              <span v-if="!email.isRead" class="unread-dot">●</span>
              <span v-if="email.importance === 'high'" class="important-flag">❗</span>
              <span v-if="email.hasAttachments" class="attachment-flag">📎</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="quick-actions-section">
      <h3>⚡ Actions rapides</h3>
      <div class="actions-grid">
        <button @click="goToMail" class="action-button">
          <div class="action-icon">📬</div>
          <div class="action-text">Voir tous les emails</div>
        </button>
        
        <button @click="refreshData" class="action-button" :disabled="isLoading">
          <div class="action-icon">🔄</div>
          <div class="action-text">{{ isLoading ? 'Actualisation...' : 'Actualiser' }}</div>
        </button>
        
        <button @click="goToUnread" class="action-button">
          <div class="action-icon">📭</div>
          <div class="action-text">Emails non lus</div>
        </button>
        
        <button @click="showHelp" class="action-button">
          <div class="action-icon">❓</div>
          <div class="action-text">Aide</div>
        </button>
      </div>
    </div>

    <!-- Modal d'aide -->
    <div v-if="showHelpModal" class="modal-overlay" @click="closeHelp">
      <div class="help-modal" @click.stop>
        <header class="modal-header">
          <h3>❓ Aide - Gestionnaire d'emails</h3>
          <button @click="closeHelp" class="btn-close">×</button>
        </header>
        <div class="modal-content">
          <div class="help-section">
            <h4>🚀 Démarrage rapide</h4>
            <ul>
              <li>Cliquez sur "📬 Mes Emails" pour voir tous vos emails</li>
              <li>Cliquez sur un email pour le lire en détail</li>
              <li>Les emails non lus sont marqués d'un point bleu</li>
            </ul>
          </div>
          
          <div class="help-section">
            <h4>🔧 Fonctionnalités</h4>
            <ul>
              <li>✅ Lecture sécurisée de vos emails Outlook</li>
              <li>✅ Marquer comme lu/non lu</li>
              <li>✅ Télécharger les pièces jointes</li>
              <li>✅ Filtrer par dossier (Réception, Envoyés, etc.)</li>
            </ul>
          </div>
          
          <div class="help-section">
            <h4>🔒 Sécurité</h4>
            <p>Cette application utilise l'authentification Microsoft officielle. Vos données restent sécurisées et nous n'y avons pas accès.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user.js';

const router = useRouter();
const userStore = useUserStore();

// État réactif
const recentEmails = ref([]);
const isLoading = ref(false);
const showHelpModal = ref(false);

// Statistiques calculées
const stats = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return {
    totalEmails: recentEmails.value.length,
    unreadEmails: recentEmails.value.filter(email => !email.isRead).length,
    todayEmails: recentEmails.value.filter(email => {
      const emailDate = new Date(email.receivedDateTime);
      emailDate.setHours(0, 0, 0, 0);
      return emailDate.getTime() === today.getTime();
    }).length,
    importantEmails: recentEmails.value.filter(email => 
      email.importance === 'high' || email.flag?.flagStatus === 'flagged'
    ).length,
  };
});

// Méthodes utilitaires
const getSenderName = (email) => {
  return email.sender?.emailAddress?.name || email.from?.emailAddress?.name || 'Expéditeur inconnu';
};

const getSenderInitials = (email) => {
  const name = getSenderName(email);
  return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
};

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

// Actions
const loadRecentEmails = async () => {
  isLoading.value = true;
  
  try {
    const token = await userStore.getToken();
    
    const response = await fetch('https://graph.microsoft.com/v1.0/me/messages?$top=10&$orderby=receivedDateTime desc', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      recentEmails.value = data.value || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des emails récents:', error);
  } finally {
    isLoading.value = false;
  }
};

const refreshData = () => {
  loadRecentEmails();
};

const viewEmail = (emailId) => {
  router.push(`/conversations/${emailId}`);
};

const goToMail = () => {
  router.push('/mail');
};

const goToUnread = () => {
  router.push('/mail?filter=unread');
};

const showHelp = () => {
  showHelpModal.value = true;
};

const closeHelp = () => {
  showHelpModal.value = false;
};

// Initialisation
onMounted(() => {
  if (userStore.isAuthenticated) {
    loadRecentEmails();
  }
});
</script>

<style scoped>
.dashboard {
  max-width: 1000px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 30px;
}

.welcome-section h2 {
  color: #0078d4;
  margin-bottom: 10px;
}

.welcome-section p {
  color: #666;
  font-size: 1.1em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.loading {
  opacity: 0.6;
}

.stat-icon {
  font-size: 2.5em;
  opacity: 0.8;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #0078d4;
  line-height: 1;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
  margin-top: 5px;
}

.recent-emails-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #0078d4;
}

.view-all-link {
  color: #0078d4;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.view-all-link:hover {
  color: #106ebe;
}

.skeleton-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.skeleton-item {
  height: 60px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.recent-emails-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-email-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recent-email-item:hover {
  border-color: #0078d4;
  background: #f8f9ff;
}

.recent-email-item.unread {
  border-left: 4px solid #0078d4;
  background: #f8f9ff;
}

.email-sender {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.sender-avatar {
  width: 40px;
  height: 40px;
  background: #0078d4;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9em;
}

.sender-info {
  flex: 1;
  min-width: 0;
}

.sender-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.email-subject {
  color: #666;
  font-size: 0.9em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.email-time {
  color: #666;
  font-size: 0.9em;
  white-space: nowrap;
}

.email-flags {
  display: flex;
  gap: 5px;
  align-items: center;
}

.unread-dot {
  color: #0078d4;
  font-size: 1.2em;
}

.important-flag {
  color: #ff6b35;
}

.attachment-flag {
  color: #666;
}

.quick-actions-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-actions-section h3 {
  margin: 0 0 20px 0;
  color: #0078d4;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1em;
  text-align: left;
}

.action-button:hover:not(:disabled) {
  background: #0078d4;
  color: white;
  border-color: #0078d4;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-icon {
  font-size: 1.5em;
}

.action-text {
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.help-modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  background: #0078d4;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5em;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-content {
  padding: 25px;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.help-section {
  margin-bottom: 25px;
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h4 {
  color: #0078d4;
  margin-bottom: 15px;
}

.help-section ul {
  padding-left: 20px;
}

.help-section li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.help-section p {
  line-height: 1.6;
  color: #666;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .recent-email-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .email-meta {
    justify-content: space-between;
  }
  
  .help-modal {
    width: 95%;
  }
}
</style>