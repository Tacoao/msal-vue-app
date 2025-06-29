<template>
  <div class="conversation-container">
    <!-- Bouton de retour -->
    <div class="navigation-bar">
      <button @click="goBack" class="btn btn-back">
        ← Retour aux emails
      </button>
    </div>

    <!-- État de chargement -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement de l'email...</p>
    </div>

    <!-- Erreur -->
    <div v-else-if="error" class="error-message">
      ⚠️ {{ error }}
      <button @click="loadEmail" class="btn btn-retry">Réessayer</button>
    </div>

    <!-- Contenu de l'email -->
    <div v-else-if="email" class="email-detail">
      <!-- En-tête de l'email -->
      <header class="email-header">
        <h1 class="email-subject">{{ email.subject || '(sans objet)' }}</h1>
        
        <div class="email-meta-info">
          <div class="sender-info">
            <div class="sender-avatar">
              {{ getSenderInitials(email) }}
            </div>
            <div class="sender-details">
              <div class="sender-name">{{ getSenderName(email) }}</div>
              <div class="sender-email">{{ getSenderEmail(email) }}</div>
            </div>
          </div>
          
          <div class="email-timestamp">
            <div class="date">{{ formatDate(email.receivedDateTime) }}</div>
            <div class="time">{{ formatTime(email.receivedDateTime) }}</div>
          </div>
        </div>

        <!-- Informations supplémentaires -->
        <div class="email-info-grid">
          <div class="info-item">
            <strong>À :</strong> {{ getRecipients(email) }}
          </div>
          <div v-if="email.ccRecipients && email.ccRecipients.length > 0" class="info-item">
            <strong>Cc :</strong> {{ getCcRecipients(email) }}
          </div>
          <div v-if="email.importance !== 'normal'" class="info-item">
            <strong>Importance :</strong> 
            <span :class="'importance-' + email.importance">
              {{ getImportanceLabel(email.importance) }}
            </span>
          </div>
          <div v-if="email.hasAttachments" class="info-item">
            <strong>Pièces jointes :</strong> 
            <span class="attachments-count">📎 {{ attachments.length || 'Oui' }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="email-actions">
          <button @click="markAsRead" v-if="!email.isRead" class="btn btn-action">
            ✓ Marquer comme lu
          </button>
          <button @click="markAsUnread" v-else class="btn btn-action">
            ● Marquer comme non lu
          </button>
          <button @click="toggleImportant" class="btn btn-action">
            {{ email.flag?.flagStatus === 'flagged' ? '★ Retirer des favoris' : '☆ Ajouter aux favoris' }}
          </button>
          <button v-if="email.hasAttachments" @click="loadAttachments" class="btn btn-action">
            📎 Voir les pièces jointes
          </button>
        </div>
      </header>

      <!-- Corps de l'email -->
      <main class="email-body-container">
        <div class="email-body" v-html="getEmailBody(email)"></div>
      </main>

      <!-- Pièces jointes -->
      <section v-if="attachments.length > 0" class="attachments-section">
        <h3>📎 Pièces jointes ({{ attachments.length }})</h3>
        <div class="attachments-list">
          <div 
            v-for="attachment in attachments" 
            :key="attachment.id"
            class="attachment-item"
          >
            <div class="attachment-icon">
              {{ getAttachmentIcon(attachment) }}
            </div>
            <div class="attachment-info">
              <div class="attachment-name">{{ attachment.name }}</div>
              <div class="attachment-size">{{ formatFileSize(attachment.size) }}</div>
            </div>
            <button @click="downloadAttachment(attachment)" class="btn btn-download">
              ⬇️ Télécharger
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Email non trouvé -->
    <div v-else class="not-found">
      <h2>📭 Email non trouvé</h2>
      <p>L'email demandé n'existe pas ou n'est plus accessible.</p>
      <button @click="goBack" class="btn btn-primary">Retour aux emails</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/user.js';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// État réactif
const email = ref(null);
const attachments = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Méthodes utilitaires
const getSenderName = (email) => {
  return email.sender?.emailAddress?.name || email.from?.emailAddress?.name || 'Expéditeur inconnu';
};

const getSenderEmail = (email) => {
  return email.sender?.emailAddress?.address || email.from?.emailAddress?.address || '';
};

const getSenderInitials = (email) => {
  const name = getSenderName(email);
  return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
};

const getRecipients = (email) => {
  if (email.toRecipients && email.toRecipients.length > 0) {
    return email.toRecipients.map(r => r.emailAddress.name || r.emailAddress.address).join(', ');
  }
  return 'Non spécifié';
};

const getCcRecipients = (email) => {
  if (email.ccRecipients && email.ccRecipients.length > 0) {
    return email.ccRecipients.map(r => r.emailAddress.name || r.emailAddress.address).join(', ');
  }
  return '';
};

const getImportanceLabel = (importance) => {
  const labels = {
    'high': '🔴 Élevée',
    'low': '🔵 Faible',
    'normal': 'Normale'
  };
  return labels[importance] || 'Normale';
};

const getEmailBody = (email) => {
  if (email.body?.content) {
    if (email.body.contentType === 'html') {
      // Nettoyer le HTML basiquement
      return email.body.content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    }
    return `<pre class="text-content">${email.body.content}</pre>`;
  }
  return '<p class="no-content">Contenu non disponible</p>';
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getAttachmentIcon = (attachment) => {
  const extension = attachment.name.split('.').pop().toLowerCase();
  const icons = {
    'pdf': '📄',
    'doc': '📝', 'docx': '📝',
    'xls': '📊', 'xlsx': '📊',
    'ppt': '📺', 'pptx': '📺',
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
    'zip': '🗜️', 'rar': '🗜️',
    'txt': '📄',
    'default': '📎'
  };
  return icons[extension] || icons.default;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Actions
const loadEmail = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const token = await userStore.getToken();
    const emailId = route.params.id;
    
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    email.value = await response.json();
    
    // Charger les pièces jointes si nécessaire
    if (email.value.hasAttachments) {
      await loadAttachments();
    }
    
  } catch (err) {
    console.error('Erreur lors du chargement de l\'email:', err);
    error.value = err.message || 'Erreur lors du chargement de l\'email';
  } finally {
    isLoading.value = false;
  }
};

const loadAttachments = async () => {
  try {
    const token = await userStore.getToken();
    const emailId = route.params.id;
    
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/attachments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      attachments.value = data.value || [];
    }
  } catch (err) {
    console.error('Erreur lors du chargement des pièces jointes:', err);
  }
};

const markAsRead = async () => {
  try {
    const token = await userStore.getToken();
    const emailId = route.params.id;
    
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isRead: true }),
    });
    
    email.value.isRead = true;
  } catch (err) {
    console.error('Erreur lors du marquage comme lu:', err);
  }
};

const markAsUnread = async () => {
  try {
    const token = await userStore.getToken();
    const emailId = route.params.id;
    
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isRead: false }),
    });
    
    email.value.isRead = false;
  } catch (err) {
    console.error('Erreur lors du marquage comme non lu:', err);
  }
};

const toggleImportant = async () => {
  try {
    const token = await userStore.getToken();
    const emailId = route.params.id;
    
    const newStatus = email.value.flag?.flagStatus === 'flagged' ? 'notFlagged' : 'flagged';
    
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        flag: { flagStatus: newStatus }
      }),
    });
    
    if (!email.value.flag) email.value.flag = {};
    email.value.flag.flagStatus = newStatus;
  } catch (err) {
    console.error('Erreur lors du marquage comme important:', err);
  }
};

const downloadAttachment = async (attachment) => {
  try {
    const token = await userStore.getToken();
    const emailId = route.params.id;
    
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/attachments/${attachment.id}/$value`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (err) {
    console.error('Erreur lors du téléchargement:', err);
  }
};

const goBack = () => {
  router.push('/mail');
};

// Initialisation
onMounted(() => {
  if (userStore.isAuthenticated) {
    loadEmail();
  }
});
</script>

<style scoped>
.conversation-container {
  max-width: 900px;
  margin: 0 auto;
}

.navigation-bar {
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-back {
  background: #f5f5f5;
  color: #333;
}

.btn-back:hover {
  background: #e0e0e0;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
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

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-retry {
  background: #c62828;
  color: white;
  margin-left: 15px;
}

.email-detail {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.email-header {
  background: linear-gradient(135deg, #0078d4, #106ebe);
  color: white;
  padding: 30px;
}

.email-subject {
  margin: 0 0 25px 0;
  font-size: 1.8em;
  line-height: 1.3;
}

.email-meta-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sender-avatar {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2em;
}

.sender-details {
  display: flex;
  flex-direction: column;
}

.sender-name {
  font-weight: 600;
  font-size: 1.1em;
}

.sender-email {
  opacity: 0.8;
  font-size: 0.9em;
}

.email-timestamp {
  text-align: right;
}

.date {
  font-weight: 500;
}

.time {
  opacity: 0.8;
  font-size: 0.9em;
}

.email-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item strong {
  min-width: 80px;
}

.importance-high {
  color: #ff6b35;
  font-weight: bold;
}

.importance-low {
  color: #4caf50;
}

.attachments-count {
  font-weight: 500;
}

.email-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-action {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.9em;
  padding: 8px 16px;
}

.btn-action:hover {
  background: rgba(255, 255, 255, 0.3);
}

.email-body-container {
  padding: 30px;
}

.email-body {
  line-height: 1.6;
  color: #333;
  font-size: 1.05em;
}

.email-body .text-content {
  white-space: pre-wrap;
  font-family: inherit;
  margin: 0;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.email-body .no-content {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px;
}

.attachments-section {
  padding: 30px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.attachments-section h3 {
  margin: 0 0 20px 0;
  color: #0078d4;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.attachment-icon {
  font-size: 1.5em;
}

.attachment-info {
  flex: 1;
}

.attachment-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.attachment-size {
  color: #666;
  font-size: 0.9em;
}

.btn-download {
  background: #0078d4;
  color: white;
  font-size: 0.9em;
}

.btn-download:hover {
  background: #106ebe;
}

.not-found {
  text-align: center;
  padding: 60px 20px;
}

.not-found h2 {
  color: #666;
  margin-bottom: 15px;
}

.btn-primary {
  background: #0078d4;
  color: white;
}

.btn-primary:hover {
  background: #106ebe;
}

/* Responsive */
@media (max-width: 768px) {
  .email-header {
    padding: 20px;
  }

  .email-subject {
    font-size: 1.4em;
  }

  .email-meta-info {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .email-info-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .email-actions {
    justify-content: center;
  }

  .email-body-container, .attachments-section {
    padding: 20px;
  }

  .attachment-item {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
}
</style>