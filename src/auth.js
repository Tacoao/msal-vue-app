// auth.js
import { PublicClientApplication } from '@azure/msal-browser';

// Configuration MSAL
const msalConfig = {
  auth: {
    clientId: 'e8137439-4d1d-462d-a85f-f81cfea8f0d8', // Remplacez par votre Client ID
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Scopes requis pour lire les emails
export const loginRequest = {
  scopes: ['Mail.Read', 'User.Read'],
};

// Instance MSAL
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialisation MSAL
export const initializeMsal = async () => {
  try {
    await msalInstance.initialize();
    console.log('MSAL initialisé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation MSAL:', error);
  }
};

// Connexion
export const login = async () => {
  try {
    const response = await msalInstance.loginPopup(loginRequest);
    return response;
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    throw error;
  }
};

// Déconnexion
export const logout = async () => {
  try {
    await msalInstance.logoutPopup();
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    throw error;
  }
};

// Récupération du token avec fallback
export const getAccessToken = async () => {
  const accounts = msalInstance.getAllAccounts();
  
  if (accounts.length === 0) {
    throw new Error('Aucun compte connecté');
  }

  const request = {
    ...loginRequest,
    account: accounts[0],
  };

  try {
    // Tentative de récupération silencieuse du token
    const response = await msalInstance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    console.warn('acquireTokenSilent a échoué, tentative avec popup:', error);
    
    try {
      // Fallback avec popup
      const response = await msalInstance.acquireTokenPopup(request);
      return response.accessToken;
    } catch (popupError) {
      console.error('Erreur lors de la récupération du token:', popupError);
      throw popupError;
    }
  }
};

// Récupération du compte actuel
export const getCurrentAccount = () => {
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
};