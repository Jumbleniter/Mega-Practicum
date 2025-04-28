'use strict';

// Set debug mode
window.DEBUG = true;

// Define tenants configuration
window.TENANTS = {
  uvu: {
    name: 'UVU',
    theme: {
      primaryColor: '#006633',
      secondaryColor: '#006633',
      accentColor: '#006633',
      textColor: '#333333',
      backgroundColor: '#ffffff',
      buttonColor: '#006633',
      buttonTextColor: '#ffffff',
      headerColor: '#006633',
      headerTextColor: '#ffffff'
    }
  },
  uofu: {
    name: 'UofU',
    theme: {
      primaryColor: '#CC0000',
      secondaryColor: '#CC0000',
      accentColor: '#CC0000',
      textColor: '#333333',
      backgroundColor: '#ffffff',
      buttonColor: '#CC0000',
      buttonTextColor: '#ffffff',
      headerColor: '#CC0000',
      headerTextColor: '#ffffff'
    }
  }
};

// Set base URL
window.BASE_URL = 'http://localhost:3000';

// Handle client-side routing
function handleRoute() {
  const path = window.location.pathname;
  const tenant = path.split('/')[1];
  
  if (tenant && (tenant === 'uvu' || tenant === 'uofu')) {
    window.currentTenant = tenant;
    if (window.DEBUG) console.log('Current tenant from URL:', window.currentTenant);
    applyTenantTheme(tenant);
  }
}

// Apply tenant-specific theme
function applyTenantTheme(tenant) {
  const theme = window.TENANTS[tenant].theme;
  document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
  document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
  document.documentElement.style.setProperty('--accent-color', theme.accentColor);
  document.documentElement.style.setProperty('--text-color', theme.textColor);
  document.documentElement.style.setProperty('--background-color', theme.backgroundColor);
  document.documentElement.style.setProperty('--button-color', theme.buttonColor);
  document.documentElement.style.setProperty('--button-text-color', theme.buttonTextColor);
  document.documentElement.style.setProperty('--header-color', theme.headerColor);
  document.documentElement.style.setProperty('--header-text-color', theme.headerTextColor);
}

$(document).ready(function() {
  // Set debug mode
  window.DEBUG = true;
  
  // Initialize tenant switcher
  TenantClient.setupTenantSwitcher();
  
  // Set default tenant
  window.currentTenant = 'uvu';
  if (window.DEBUG) console.log('Current tenant:', window.currentTenant);
  if (window.DEBUG) console.log('Current path:', window.location.pathname);

  // Apply initial theme
  handleRoute();
});

// Helper function to get current tenant
function getCurrentTenant() {
    return TenantClient.getCurrentTenant();
}
