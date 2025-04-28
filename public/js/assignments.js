'use strict';

const Assignments = {
    // Load assignments for a course
    loadAssignments: function(courseId) {
        if (DEBUG.ASSIGNMENT_MANAGEMENT) {
            console.log('Loading assignments for course:', courseId);
        }
        
        // Get current tenant
        const currentTenant = TenantClient.getCurrentTenant();
        
        $.ajax({
            url: `${BASE_URL}/${currentTenant}/assignments/${courseId}`,
            method: "GET",
            headers: {
                'X-Tenant': currentTenant
            },
            xhrFields: {
                withCredentials: true
            },
            success: function(assignments) {
                if (DEBUG.ASSIGNMENT_MANAGEMENT) {
                    console.log('Assignments loaded:', assignments);
                }
                const assignmentsList = $('#assignmentsList');
                assignmentsList.empty();
                
                if (assignments.length === 0) {
                    assignmentsList.append('<div class="list-group-item">No assignments found</div>');
                    return;
                }

                assignments.forEach(assignment => {
                    assignmentsList.append(`
                        <div class="list-group-item">
                            <h5>${assignment.title}</h5>
                            <p>${assignment.description}</p>
                            <p>Due Date: ${new Date(assignment.dueDate).toLocaleString()}</p>
                            <p>Status: ${assignment.status}</p>
                            <button class="btn btn-primary btn-sm" onclick="Assignments.viewAssignment('${assignment._id}')">
                                View Details
                            </button>
                        </div>
                    `);
                });
            },
            error: function(xhr) {
                if (DEBUG.ASSIGNMENT_MANAGEMENT) {
                    console.error('Failed to load assignments:', xhr);
                }
                UI.showError("Failed to load assignments. Please try again.");
            }
        });
    },

    // Add new assignment
    addNewAssignment: function(assignmentData) {
        if (DEBUG.ASSIGNMENT_MANAGEMENT) {
            console.log('Adding new assignment:', assignmentData);
        }
        
        // Get current tenant
        const currentTenant = TenantClient.getCurrentTenant();
        
        $.ajax({
            url: `${BASE_URL}/${currentTenant}/assignments`,
            method: "POST",
            contentType: "application/json",
            headers: {
                'X-Tenant': currentTenant
            },
            xhrFields: {
                withCredentials: true
            },
            data: JSON.stringify(assignmentData),
            success: function(newAssignment) {
                if (DEBUG.ASSIGNMENT_MANAGEMENT) {
                    console.log('Assignment added successfully:', newAssignment);
                }
                UI.showSuccess("Assignment added successfully!");
                Assignments.loadAssignments(assignmentData.courseId);
            },
            error: function(xhr) {
                if (DEBUG.ASSIGNMENT_MANAGEMENT) {
                    console.error('Failed to add assignment:', xhr);
                }
                UI.showError(xhr.responseJSON?.error || "Failed to add assignment. Please try again.");
            }
        });
    },

    // Update assignment
    updateAssignment: function(assignmentId, assignmentData) {
        if (DEBUG.ASSIGNMENT_MANAGEMENT) {
            console.log('Updating assignment:', assignmentId, assignmentData);
        }
        
        // Get current tenant
        const currentTenant = TenantClient.getCurrentTenant();
        
        $.ajax({
            url: `${BASE_URL}/${currentTenant}/assignments/${assignmentId}`,
            method: "PUT",
            contentType: "application/json",
            headers: {
                'X-Tenant': currentTenant
            },
            xhrFields: {
                withCredentials: true
            },
            data: JSON.stringify(assignmentData),
            success: function(updatedAssignment) {
                if (DEBUG.ASSIGNMENT_MANAGEMENT) {
                    console.log('Assignment updated successfully:', updatedAssignment);
                }
                UI.showSuccess("Assignment updated successfully!");
                Assignments.loadAssignments(assignmentData.courseId);
            },
            error: function(xhr) {
                if (DEBUG.ASSIGNMENT_MANAGEMENT) {
                    console.error('Failed to update assignment:', xhr);
                }
                UI.showError(xhr.responseJSON?.error || "Failed to update assignment. Please try again.");
            }
        });
    },

    // Delete assignment
    deleteAssignment: function(assignmentId, courseId) {
        if (DEBUG.ASSIGNMENT_MANAGEMENT) {
            console.log('Deleting assignment:', assignmentId);
        }
        
        // Get current tenant
        const currentTenant = TenantClient.getCurrentTenant();
        
        $.ajax({
            url: `${BASE_URL}/${currentTenant}/assignments/${assignmentId}`,
            method: "DELETE",
            headers: {
                'X-Tenant': currentTenant
            },
            xhrFields: {
                withCredentials: true
            },
            success: function() {
                if (DEBUG.ASSIGNMENT_MANAGEMENT) {
                    console.log('Assignment deleted successfully');
                }
                UI.showSuccess("Assignment deleted successfully!");
                Assignments.loadAssignments(courseId);
            },
            error: function(xhr) {
                if (DEBUG.ASSIGNMENT_MANAGEMENT) {
                    console.error('Failed to delete assignment:', xhr);
                }
                UI.showError(xhr.responseJSON?.error || "Failed to delete assignment. Please try again.");
            }
        });
    },

    // View assignment details
    viewAssignment: function(assignmentId) {
        if (DEBUG.ASSIGNMENT_MANAGEMENT) {
            console.log('Viewing assignment:', assignmentId);
        }
        
        // Get current tenant
        const currentTenant = TenantClient.getCurrentTenant();
        
        $.ajax({
            url: `${BASE_URL}/${currentTenant}/assignments/${assignmentId}`,
            method: "GET",
            headers: {
                'X-Tenant': currentTenant
            },
            xhrFields: {
                withCredentials: true
            },
            success: function(assignment) {
                if (DEBUG.ASSIGNMENT_MANAGEMENT) {
                    console.log('Assignment details:', assignment);
                }
                // Show assignment details in a modal or dedicated view
                UI.showAssignmentDetails(assignment);
            },
            error: function(xhr) {
                if (DEBUG.ASSIGNMENT_MANAGEMENT) {
                    console.error('Failed to load assignment details:', xhr);
                }
                UI.showError(xhr.responseJSON?.error || "Failed to load assignment details. Please try again.");
            }
        });
    }
}; 