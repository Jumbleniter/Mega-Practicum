'use strict';

const AuthClient = {
    // Initialize auth state
    init: function() {
        this.checkLoginStatus();
    },

    // Check if user is logged in
    checkLoginStatus: function() {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = this.decodeToken(token);
            if (decoded && !this.isTokenExpired(decoded)) {
                this.setUser(decoded);
                return true;
            }
        }
        this.clearAuth();
        return false;
    },

    // Login user
    login: async function(username, password) {
        try {
            const response = await TenantClient.makeRequest({
                url: '/auth/login',
                method: 'POST',
                data: { username, password }
            });

            if (response.token) {
                localStorage.setItem('token', response.token);
                this.setUser(this.decodeToken(response.token));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    },

    // Logout user
    logout: function() {
        this.clearAuth();
        window.location.href = '/login';
    },

    // Clear auth data
    clearAuth: function() {
        localStorage.removeItem('token');
        this.setUser(null);
    },

    // Set current user
    setUser: function(user) {
        this.currentUser = user;
        this.updateUI();
    },

    // Update UI based on auth state
    updateUI: function() {
        if (this.currentUser) {
            $('.auth-only').show();
            $('.no-auth').hide();
            $('.user-role').text(this.currentUser.role);
            $('.username').text(this.currentUser.username);
        } else {
            $('.auth-only').hide();
            $('.no-auth').show();
            $('.user-role').text('');
            $('.username').text('');
        }
    },

    // Decode JWT token
    decodeToken: function(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (error) {
            return null;
        }
    },

    // Check if token is expired
    isTokenExpired: function(decoded) {
        return decoded.exp < Date.now() / 1000;
    },

    // Get current user
    getCurrentUser: function() {
        return this.currentUser;
    },

    // Check if user has required role
    hasRole: function(requiredRole) {
        return this.currentUser && this.currentUser.role === requiredRole;
    }
}; 