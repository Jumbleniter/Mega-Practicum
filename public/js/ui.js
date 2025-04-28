'use strict';

const UI = {
    // Show login form and hide main app
    showLoginForm: function() {
        $('#loginForm').show();
        $('#mainApp').hide();
        $('.tenant-switcher').show();
        
        // Hide all role-specific sections
        $('#adminSection').hide();
        $('#teacherSection').hide();
        $('#taSection').hide();
        $('#studentSection').hide();
        
        // Clear any existing error/success messages
        $('#errorMessage').hide();
        $('#successMessage').hide();
        
        // Reset form fields
        $('#username').val('');
        $('#password').val('');
    },

    // Show main app and hide login form
    showMainApp: function() {
        $('#loginForm').hide();
        $('#mainApp').show();
        $('.tenant-switcher').hide();
        
        // Apply tenant theme
        TenantClient.applyTheme(window.currentTenant);
        
        // Show role-specific sections based on current user
        if (window.currentUser) {
            if (window.currentUser.role === 'admin') {
                $('#adminSection').show();
                $('#teacherSection').hide();
                $('#taSection').hide();
                $('#studentSection').hide();
            } else if (window.currentUser.role === 'teacher') {
                $('#adminSection').hide();
                $('#teacherSection').show();
                $('#taSection').hide();
                $('#studentSection').hide();
                Courses.loadTeacherCourses();
            } else if (window.currentUser.role === 'ta') {
                $('#adminSection').hide();
                $('#teacherSection').hide();
                $('#taSection').show();
                $('#studentSection').hide();
                Courses.loadTACourses();
            } else {
                $('#adminSection').hide();
                $('#teacherSection').hide();
                $('#taSection').hide();
                $('#studentSection').show();
            }
        }
    },

    // Show success message
    showSuccess: function(message) {
        const successDiv = $('#successMessage');
        successDiv.text(message).show();
        setTimeout(() => successDiv.fadeOut(), 5000);
    },

    // Show error message
    showError: function(message) {
        const errorDiv = $('#errorMessage');
        errorDiv.text(message).show();
        setTimeout(() => errorDiv.fadeOut(), 5000);
    },

    // Show signup form
    showSignup: function() {
        $('#loginForm').hide();
        $('#signupForm').show();
        $('#mainApp').hide();
        $('.tenant-switcher').show();
        
        // Hide all role-specific sections
        $('#adminSection').hide();
        $('#teacherSection').hide();
        $('#taSection').hide();
        $('#studentSection').hide();
        
        // Clear any existing error/success messages
        $('#errorMessage').hide();
        $('#successMessage').hide();
        
        // Reset form fields
        $('#signupUsername').val('');
        $('#signupPassword').val('');
        $('#signupConfirmPassword').val('');
    },

    // Show login form
    showLogin: function() {
        $('#signupForm').hide();
        $('#loginForm').show();
        $('#mainApp').hide();
        $('.tenant-switcher').show();
        
        // Hide all role-specific sections
        $('#adminSection').hide();
        $('#teacherSection').hide();
        $('#taSection').hide();
        $('#studentSection').hide();
        
        // Clear any existing error/success messages
        $('#errorMessage').hide();
        $('#successMessage').hide();
        
        // Reset form fields
        $('#username').val('');
        $('#password').val('');
    },

    // Update UI based on user role
    updateUIForRole: function(role) {
        // Hide all role-specific sections first
        $('.role-section').hide();
        
        // Show appropriate sections based on role
        switch (role) {
            case 'admin':
                $('#adminSection').show();
                break;
            case 'teacher':
                $('#teacherSection').show();
                break;
            case 'ta':
                $('#taSection').show();
                break;
            case 'student':
                $('#studentSection').show();
                break;
        }
    },

    // Initialize all UI handlers
    initializeUIHandlers: function() {
        if (window.DEBUG) console.log('Initializing UI handlers');

        // Handle modal dismissals
        $('.modal').on('hidden.bs.modal', function() {
            $(this).find('form')[0].reset();
        });

        // Handle error message close button
        $('#errorMessage .close').on('click', function() {
            $('#errorMessage').fadeOut();
        });

        // Handle success message close button
        $('#successMessage .close').on('click', function() {
            $('#successMessage').fadeOut();
        });

        // Handle tenant switcher
        $('.tenant-switcher').on('click', '.tenant-option', function() {
            const tenant = $(this).data('tenant');
            TenantClient.selectTenant(tenant);
        });

        // Handle responsive menu toggle
        $('#menuToggle').on('click', function() {
            $('#sidebar').toggleClass('active');
        });

        // Show signup form when link is clicked
        $('#showSignup').on('click', function(e) {
            e.preventDefault();
            UI.showSignup();
        });

        // Show login form when link is clicked
        $('#showLogin').on('click', function(e) {
            e.preventDefault();
            UI.showLogin();
        });
    }
};

// Make UI globally available
window.UI = UI; 