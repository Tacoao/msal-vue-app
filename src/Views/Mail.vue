<template>
  <div class="mail-container">
    <header class="mail-header">
      <h2>📬 Mes Emails</h2>
      <div class="mail-actions">
        <button @click="refreshEmails" :disabled="isLoading" class="btn btn-refresh">
          {{ isLoading ? '🔄 Chargement...' : '🔄 Actualiser' }}
        </button>
        <select v-model="selectedFolder" @change="loadEmails" class="folder-select">
          <option value="inbox">📥 Boîte de réception</option>
          <option value="sentitems">📤 Éléments envoyés</option>
          <option value="drafts">📝 Brouillons</option>
        </select>
      </div>
    </header>

    <!-- Affichage des erreurs -->
    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
      <button @click="clearError" class="btn-close">×</button>
    </div>

    <!-- Statistiques -->
    <div v-if="emails.length > 0" class="stats">
      <div class="stat-item">
        <span class="stat-number">{{ emails.length }}</span>
        <span class="stat-label">emails chargés</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ unreadCount }}</span>
        <span class="stat-label">non lus</span>
      </div>
    </div>

    <!-- Liste des emails -->
    <div class="emails-list">
      <div v-if="isLoading && emails.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement de vos emails...</p>
      </div>

      <div v-else-if="emails.length === 0 && !isLoading" class="empty-state">
        <h3>📭 Aucun email trouvé</h3>
        <p>Votre boîte {{ selectedFolder === 'inbox' ? 'de réception' : 'sélectionnée' }} est vide.</p>
      </div>

      <div v-else class="email-items">
        <div 
          v-for="email in emails" 
          :key="email.id"
          class="email-item"
          :class="{ 'unread': !email.isRead, 'important': email.importance === 'high' }"
          @click="selectEmail(email)"
        >
          <div class="email-header-info">
            <div class="sender">
              <span class="sender-name">{{ getSenderName(email) }}</span>
              <span class="sender-email">{{ getSenderEmail(email) }}</span>
            </div>
            <div class="email-meta">
              <span class="email-date">{{ formatDate(email.receivedDateTime) }}</span>
              <div class="email-flags">
                <span v-if="!email.isRead" class="flag unread-flag">•</span>
                <span v-if="email.importance === 'high'" class="flag important-flag">❗</span>
                <span v-if="email.hasAttachments" class="flag attachment-flag">📎</span>
              </div>
            </div>
          </div>
          
          <div class="email-content">
            <h4 class="email-subject">{{ email.subject || '(sans objet)' }}</h4>
            <p class="email-preview">{{ getEmailPreview(email) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de détail d'email -->
    <div v-if="selectedEmail" class="email-modal-overlay" @click="closeEmailModal">
      <div class="email-modal" @click.stop>
        <header class="modal-header">
          <h3>{{ selectedEmail.subject || '(sans objet)' }}</h3>
          <button @click="closeEmailModal" class="btn-close-modal">×</button>
        </header>
        
        <div class="modal-content">
          <div class="email-details">
            <div class="detail-row">
              <strong>De :</strong> {{ getSenderName(selectedEmail) }} &lt;{{ getSenderEmail(selectedEmail) }}&gt;
            </div>
            <div class="detail-row">
              <strong>À :</strong> {{ getRecipients(selectedEmail) }}
            </div>
            <div class="detail-row">
              <strong>Date :</strong> {{ formatFullDate(selectedEmail.receivedDateTime) }}
            </div>
            <div v-if="selectedEmail.hasAttachments" class="detail-row">
              <strong>Pièces jointes :</strong> 📎 {{ selectedEmail.attachments?.length || 'Oui' }}
            </div>
          </div>
          
          <div class="email-body" v-html="getEmailBody(selectedEmail)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../stores/user.js';

const userStore = useUserStore();

// État réactif
const emails = ref([]);
const isLoading = ref(false);
const error = ref(null);
const selectedEmail = ref(null);
const selectedFolder = ref('inbox');

// Computed
const unreadCount = computed(() => {
  return emails.value.filter(email => !email.isRead).length;
});

// Méthodes pour récupérer les données des emails
const getSenderName = (email) => {
  return email.sender?.emailAddress?.name || email.from?.emailAddress?.name || 'Expéditeur inconnu';
};

const getSenderEmail = (email) => {
  return email.sender?.emailAddress?.address || email.from?.emailAddress?.address || '';
};

const getRecipients = (email) => {
  if (email.toRecipients && email.toRecipients.length > 0) {
    return email.toRecipients.map(r => r.emailAddress.name || r.emailAddress.address).join(', ');
  }
  return 'Non spécifié';
};

const getEmailPreview = (email) => {
  if (email.bodyPreview) {
    return email.bodyPreview.substring(0, 120) + (email.bodyPreview.length > 120 ? '...' : '');
  }
  return 'Aucun aperçu disponible';
};

const getEmailBody = (email) => {
  if (email.body?.content) {
    if (email.body.contentType === 'html') {
      // Nettoyer le HTML pour la sécurité (basique)
      return email.body.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return `<pre>${email.body.content}</pre>`;
  }
  return '<p>Contenu non disponible</p>';
};

// Formatage des dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }
};

const formatFullDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR');
};

// Chargement des emails
const loadEmails = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const token = await userStore.getToken();
    
    let endpoint = 'https://graph.microsoft.com/v1.0/me/messages';
    if (selectedFolder.value !== 'inbox') {
      endpoint = `https://graph.microsoft.com/v1.0/me/mailFolders/${selectedFolder.value}/messages`;
    }
    
    const response = await fetch(`${endpoint}?$top=50&$orderby=receivedDateTime desc`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    emails.value = data.value || [];
    
  } catch (err) {
    console.error('Erreur lors du chargement des emails:', err);
    error.value = err.message || 'Erreur lors du chargement des emails';
  } finally {
    isLoading.value = false;
  }
};

// Actions
const refreshEmails = () => {
  loadEmails();
};

const selectEmail = (email) => {
  selectedEmail.value = email;
  
  // Marquer comme lu si non lu
  if (!email.isRead) {
    markAsRead(email);
  }
};

const closeEmailModal = () => {
  selectedEmail.value = null;
};

const clearError = () => {
  error.value = null;
};

// Marquer un email comme lu
const markAsRead = async (email) => {
  try {
    const token = await userStore.getToken();
    
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${email.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isRead: true }),
    });
    
    // Mettre à jour localement
    email.isRead = true;
    
  } catch (err) {
    console.error('Erreur lors du marquage comme lu:', err);
  }
};

// Initialisation
onMounted(() => {
  if (userStore.isAuthenticated) {
    loadEmails();
  }
});
</script>

<style scoped>
.mail-container {
  max-width: 1000px;
  margin: 0 auto;
}

.mail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.mail-header h2 {
  margin: 0;
  color: #0078d4;
}

.mail-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-refresh {
  background: #0078d4;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background: #106ebe;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.folder-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
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

.stats {
  display: flex;
  gap: 30px;
  margin-bottom: 25px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.8em;
  font-weight: bold;
  color: #0078d4;
}

.stat-label {
  font-size: 0.9em;
  color: #666;
}

.loading-state {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0078d4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.email-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.email-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.email-item:hover {
  border-color: #0078d4;
  box-shadow: 0 2px 8px rgba(0, 120, 212, 0.1);
}

.email-item.unread {
  border-left: 4px solid #0078d4;
  background: #f8f9ff;
}

.email-item.important {
  border-left-color: #ff6b35;
}

.email-header-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.sender {
  display: flex;
  flex-direction: column;
}

.sender-name {
  font-weight: 600;
  color: #333;
}

.sender-email {
  font-size: 0.9em;
  color: #666;
}

.email-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.email-date {
  color: #666;
  font-size: 0.9em;
}

.email-flags {
  display: flex;
  gap: 5px;
}

.flag {
  font-size: 0.9em;
}

.unread-flag {
  color: #0078d4;
  font-size: 1.5em;
}

.important-flag {
  color: #ff6b35;
}

.attachment-flag {
  color: #666;
}

.email-content {
  margin-top: 10px;
}

.email-subject {
  margin: 0 0 8px 0;
  font-size: 1.1em;
  color: #333;
}

.email-preview {
  margin: 0;
  color: #666;
  line-height: 1.4;
}

/* Modal */
.email-modal-overlay {
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

.email-modal {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  max-height: 80vh;
  width: 90%;
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
  font-size: 1.3em;
}

.btn-close-modal {
  background: none;
  border: none;
  color: white;
  font-size: 2em;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-modal:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.modal-content {
  padding: 20px;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.email-details {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.detail-row {
  margin-bottom: 10px;
  line-height: 1.5;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row strong {
  color: #0078d4;
  margin-right: 10px;
  min-width: 80px;
  display: inline-block;
}

.email-body {
  line-height: 1.6;
  color: #333;
}

.email-body pre {
  white-space: pre-wrap;
  font-family: inherit;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .mail-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .mail-actions {
    justify-content: space-between;
  }

  .stats {
    justify-content: center;
  }

  .email-header-info {
    flex-direction: column;
    gap: 10px;
  }

  .email-meta {
    justify-content: space-between;
  }

  .email-modal {
    width: 95%;
    max-height: 90vh;
  }

  .modal-header {
    padding: 15px;
  }

  .modal-content {
    padding: 15px;
  }
}
</style>