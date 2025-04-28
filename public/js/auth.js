'use strict';

const Auth = {
    setupLogoutButton: function() {
        if (window.DEBUG) {
            console.log('Setting up logout button');
        }

        $('#logoutButton').on('click', function(e) {
            e.preventDefault();
            Auth.handleLogout();
        });
    },

    checkLoginStatus: async () => {
        try {
            const response = await fetch(`/${window.currentTenant}/auth/status`, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error checking login status:', error);
            return { authenticated: false };
        }
    },

    handleLogin: async function(e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();
        
        if (window.DEBUG) console.log('Attempting login for:', username);
        
        try {
            const response = await this.login(username, password);
            if (response.success) {
                window.currentUser = response.user;
                // Redirect to appropriate page based on role
                if (response.user.role === 'admin') {
                    window.location.href = `/${window.currentTenant}/admin`;
                } else if (response.user.role === 'teacher') {
                    window.location.href = `/${window.currentTenant}/teacher`;
                } else if (response.user.role === 'ta') {
                    window.location.href = `/${window.currentTenant}/ta`;
                } else if (response.user.role === 'student') {
                    window.location.href = `/${window.currentTenant}/student`;
                }
            } else {
                if (window.UI) {
                    window.UI.showError(response.message || 'Login failed');
                } else {
                    $('#errorMessage .message').text(response.message || 'Login failed');
                    $('#errorMessage').show();
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            if (window.UI) {
                window.UI.showError('Login failed. Please try again.');
            } else {
                $('#errorMessage .message').text('Login failed. Please try again.');
                $('#errorMessage').show();
            }
        }
    },

    handleLogout: function() {
        if (window.DEBUG) console.log('Logging out');
        
        $.ajax({
            url: `/${window.currentTenant}/auth/logout`,
            method: 'POST',
            xhrFields: {
                withCredentials: true
            },
            success: function() {
                if (window.DEBUG) console.log('Logout successful');
                window.currentUser = null;
                window.location.href = `/${window.currentTenant}`;
            },
            error: function(xhr, status, error) {
                console.error('Logout error:', xhr);
                if (window.UI) {
                    window.UI.showError('Logout failed. Please try again.');
                } else {
                    $('#errorMessage .message').text('Logout failed. Please try again.');
                    $('#errorMessage').show();
                }
            }
        });
    },

    createTeacher: function(username, password) {
        if (window.DEBUG && window.DEBUG.USER_MANAGEMENT) {
            console.log('Creating teacher:', username);
        }

        TenantClient.makeRequest({
            url: `/${window.currentTenant}/auth/create-teacher`,
            method: 'POST',
            data: { username, password },
            success: function(response) {
                if (response.success) {
                    alert('Teacher created successfully');
                } else {
                    alert('Failed to create teacher: ' + response.message);
                }
            },
            error: function(error) {
                console.error('Create teacher error:', error);
                alert('Failed to create teacher. Please try again.');
            }
        });
    },

    createTA: function(username, password) {
        if (window.DEBUG && window.DEBUG.USER_MANAGEMENT) {
            console.log('Creating TA:', username);
        }

        TenantClient.makeRequest({
            url: `/${window.currentTenant}/auth/create-ta`,
            method: 'POST',
            data: { username, password },
            success: function(response) {
                if (response.success) {
                    alert('TA created successfully');
                } else {
                    alert('Failed to create TA: ' + response.message);
                }
            },
            error: function(error) {
                console.error('Create TA error:', error);
                alert('Failed to create TA. Please try again.');
            }
        });
    },

    createStudent: function(username, password, uvuId) {
        if (window.DEBUG && window.DEBUG.USER_MANAGEMENT) {
            console.log('Creating student:', username);
        }

        TenantClient.makeRequest({
            url: `/${window.currentTenant}/auth/create-student`,
            method: 'POST',
            data: { username, password, uvuId },
            success: function(response) {
                if (response.success) {
                    alert('Student created successfully');
                } else {
                    alert('Failed to create student: ' + response.message);
                }
            },
            error: function(error) {
                console.error('Create student error:', error);
                alert('Failed to create student. Please try again.');
            }
        });
    },

    initializeAuthHandlers: function() {
        if (window.DEBUG) console.log('Initializing auth handlers');
        
        // Check initial login status
        this.checkLoginStatus().then(data => {
            if (data.authenticated) {
                if (window.DEBUG) console.log('User is authenticated:', data.user);
                window.currentUser = data.user;
                
                // Get current path
                const currentPath = window.location.pathname;
                const expectedPath = `/${window.currentTenant}/${data.user.role}`;
                
                // Only redirect if we're not already on the correct page
                if (!currentPath.startsWith(expectedPath)) {
                    // Redirect to appropriate page based on role
                    if (data.user.role === 'admin') {
                        window.location.href = `/${window.currentTenant}/admin`;
                    } else if (data.user.role === 'teacher') {
                        window.location.href = `/${window.currentTenant}/teacher`;
                    } else if (data.user.role === 'ta') {
                        window.location.href = `/${window.currentTenant}/ta`;
                    } else if (data.user.role === 'student') {
                        window.location.href = `/${window.currentTenant}/student`;
                    }
                }
            } else {
                if (window.DEBUG) console.log('User is not authenticated');
                if (window.UI) {
                    window.UI.showLogin();
                } else {
                    $('#loginForm').show();
                    $('#signupForm').hide();
                }
            }
        }).catch(error => {
            console.error('Error checking login status:', error);
            if (window.UI) {
                window.UI.showLogin();
            } else {
                $('#loginForm').show();
                $('#signupForm').hide();
            }
        });

        // Login form handler
        $('#loginFormElement').off('submit').on('submit', (e) => this.handleLogin(e));

        // Logout handler
        $('#logoutButton').off('click').on('click', async () => {
            try {
                await this.logout();
                window.currentUser = null;
                window.location.href = `/${window.currentTenant}`;
            } catch (error) {
                console.error('Logout error:', error);
                if (window.UI) {
                    window.UI.showError('Logout failed. Please try again.');
                } else {
                    $('#errorMessage .message').text('Logout failed. Please try again.');
                    $('#errorMessage').show();
                }
            }
        });
    },

    login: async (username, password) => {
        try {
            const response = await fetch(`/${window.currentTenant}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            const response = await fetch(`/${window.currentTenant}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }
};

// Make Auth globally available
window.Auth = Auth;

// Initialize auth handlers when the page loads
$(document).ready(function() {
    // Get tenant from URL
    const pathParts = window.location.pathname.split('/');
    window.currentTenant = pathParts[1];
    
    // Initialize auth handlers
    Auth.initializeAuthHandlers();
}); 