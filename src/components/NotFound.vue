<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-icon">📭</div>
      <h1>404</h1>
      <h2>Page non trouvée</h2>
      <p>Désolé, la page que vous recherchez n'existe pas ou a été déplacée.</p>
      
      <div class="action-buttons">
        <button @click="goHome" class="btn btn-primary">
          🏠 Retour à l'accueil
        </button>
        <button @click="goBack" class="btn btn-secondary">
          ← Retour
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/');
};

const goBack = () => {
  router.go(-1);
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-icon {
  font-size: 4em;
  margin-bottom: 20px;
}

h1 {
  font-size: 6em;
  font-weight: bold;
  color: #0078d4;
  margin: 0;
  line-height: 1;
}

h2 {
  font-size: 2em;
  color: #333;
  margin: 20px 0;
}

p {
  color: #666;
  font-size: 1.1em;
  line-height: 1.6;
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
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

.btn-primary {
  background: #0078d4;
  color: white;
}

.btn-primary:hover {
  background: #106ebe;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

@media (max-width: 768px) {
  h1 {
    font-size: 4em;
  }
  
  h2 {
    font-size: 1.5em;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 200px;
  }
}
</style>