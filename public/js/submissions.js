// Get current tenant
const currentTenant = TenantClient.getCurrentTenant();

// Make tenant-aware request
TenantClient.makeRequest({
    url: '/api/submissions',
    method: 'GET',
    data: { tenantId: currentTenant.id },
    success: function(response) {
        // Handle success
    },
    error: function(error) {
        // Handle error
    }
});

// Make tenant-aware request
TenantClient.makeRequest({
    url: '/api/submissions',
    method: 'POST',
    data: { tenantId: currentTenant.id },
    success: function(response) {
        // Handle success
    },
    error: function(error) {
        // Handle error
    }
});

// Make tenant-aware request
TenantClient.makeRequest({
    url: '/api/submissions',
    method: 'PUT',
    data: { tenantId: currentTenant.id },
    success: function(response) {
        // Handle success
    },
    error: function(error) {
        // Handle error
    }
});

// Make tenant-aware request
TenantClient.makeRequest({
    url: '/api/submissions',
    method: 'DELETE',
    data: { tenantId: currentTenant.id },
    success: function(response) {
        // Handle success
    },
    error: function(error) {
        // Handle error
    }
}); 