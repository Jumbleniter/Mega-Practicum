'use strict';

// Debug flags for functionality requirements
const DEBUG = {
    MULTI_TENANT: true,
    ROLE_RESTRICTIONS: true,
    COURSE_MANAGEMENT: true,
    LOG_MANAGEMENT: true,
    USER_MANAGEMENT: true
};

// Get the current path to determine tenant
const currentPath = window.location.pathname;
let currentTenant = currentPath.startsWith('/uvu') ? 'uvu' : 'uofu';

const TenantClient = {
    // Apply theme for a specific tenant
    applyTheme: function(tenant) {
        if (!window.TENANTS[tenant]) {
            console.error('Invalid tenant:', tenant);
            return;
        }

        const theme = window.TENANTS[tenant].theme;
        if (window.DEBUG) console.log('Applying theme:', theme);

        // Update CSS variables
        const root = document.documentElement;
        root.style.setProperty('--primary-color', theme.primaryColor);
        root.style.setProperty('--secondary-color', theme.secondaryColor);
        root.style.setProperty('--accent-color', theme.accentColor);
        root.style.setProperty('--text-color', theme.textColor);
        root.style.setProperty('--background-color', theme.backgroundColor);
        root.style.setProperty('--button-color', theme.buttonColor);
        root.style.setProperty('--header-color', theme.headerColor);
    },

    // Set up tenant switcher
    setupTenantSwitcher: function() {
        if (window.DEBUG) console.log('Setting up tenant switcher');
        
        // Handle UVU button click
        $('#uvuButton').on('click', function() {
            window.location.href = '/uvu';
        });

        // Handle UofU button click
        $('#uofuButton').on('click', function() {
            window.location.href = '/uofu';
        });
    },

    getCurrentTenant: function() {
        return window.currentTenant;
    },

    // Helper method for making AJAX requests with tenant headers
    makeRequest: function(options) {
        if (!window.currentTenant) {
            console.error('No tenant selected');
            return;
        }

        const defaultOptions = {
            url: `/${window.currentTenant}${options.url}`,
            method: options.method || 'GET',
            data: options.data || {},
            success: options.success || function() {},
            error: options.error || function() {}
        };

        $.ajax({
            ...defaultOptions,
            xhrFields: {
                withCredentials: true
            }
        });
    },

    // Apply tenant-specific styles
    applyTenantStyles: function(theme) {
        if (!theme) {
            console.error('No theme provided');
            return;
        }

        if (window.DEBUG && window.DEBUG.MULTI_TENANT) {
            console.log('Applying theme:', theme);
        }

        // Update CSS variables
        const root = document.documentElement;
        const styles = {
            '--primary-color': theme.primaryColor,
            '--secondary-color': theme.secondaryColor,
            '--accent-color': theme.accentColor,
            '--text-color': theme.textColor,
            '--background-color': theme.backgroundColor,
            '--button-color': theme.buttonColor,
            '--button-text-color': theme.buttonTextColor,
            '--header-color': theme.headerColor,
            '--header-text-color': theme.headerTextColor
        };

        Object.entries(styles).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Update UI elements
        $('.institution-name').text(theme.institutionName);
        $('.btn-primary').css({
            'background-color': theme.buttonColor,
            'border-color': theme.buttonColor,
            'color': theme.buttonTextColor
        });
        $('.btn-outline-primary').css({
            'color': theme.buttonColor,
            'border-color': theme.buttonColor
        });
        $('.card-header').css({
            'background-color': theme.headerColor,
            'color': theme.headerTextColor
        });
        $('body').css('background-color', theme.backgroundColor);
    }
};

// Initialize tenant switcher
$(document).ready(function() {
    // Set default tenant if none is selected
    if (!window.currentTenant) {
        window.currentTenant = 'uvu'; // Default to UVU
        if (window.DEBUG) console.log('Setting default tenant:', window.currentTenant);
    }

    // Initialize tenant switcher
    TenantClient.setupTenantSwitcher();
});

// Make TenantClient globally available
window.TenantClient = TenantClient; 