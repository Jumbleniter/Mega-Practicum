'use strict';

// Set debug mode
window.DEBUG = true;

// Define tenants configuration
window.TENANTS = {
  uvu: {
    name: 'UVU',
    theme: {
      primaryColor: '#0056b3',
      secondaryColor: '#e31837',
      accentColor: '#000000',
      textColor: '#333333',
      backgroundColor: '#ffffff',
      buttonColor: '#0056b3',
      buttonTextColor: '#ffffff',
      headerColor: '#0056b3',
      headerTextColor: '#ffffff'
    }
  },
  uofu: {
    name: 'UofU',
    theme: {
      primaryColor: '#CC0000',
      secondaryColor: '#000000',
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
  }
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

  // Initialize UI handlers if we're on the login page
  if (window.location.pathname.includes('/uvu') || window.location.pathname.includes('/uofu')) {
    UI.initializeUIHandlers();
  }
});

// Helper function to get current tenant
function getCurrentTenant() {
    return TenantClient.getCurrentTenant();
}
