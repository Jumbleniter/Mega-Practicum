'use strict';

const Logs = {
    // Load all logs for the current user
    loadLogs: async function(courseId = null) {
        if (window.DEBUG) console.log('Loading logs for tenant:', window.currentTenant);
        try {
            const url = courseId 
                ? `/${window.currentTenant}/admin/api/courses/${courseId}/logs`
                : `/${window.currentTenant}/admin/api/logs`;
            
            const response = await $.ajax({
                url: url,
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                }
            });
            
            if (response.success) {
                this.displayLogs(response.data);
            } else {
                console.error('Error loading logs:', response.error);
                UI.showError('Failed to load logs. Please try again.');
            }
        } catch (error) {
            console.error('Error loading logs:', error);
            UI.showError('Failed to load logs. Please try again.');
        }
    },

    displayLogs: function(logs) {
        const logList = $('#logList');
        logList.empty();
        
        if (logs.length === 0) {
            logList.append('<div class="alert alert-info">No logs found.</div>');
            return;
        }

        logs.forEach(log => {
            logList.append(`
                <div class="log-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5>${log.studentId}</h5>
                        <small class="text-muted">${new Date(log.createdAt).toLocaleString()}</small>
                    </div>
                    <p class="mb-1">${log.content}</p>
                    <small class="text-muted">Created by: ${log.createdBy?.username || 'Unknown'}</small>
                </div>
            `);
        });
    },

    // Add new log
    addLog: async function(courseId, logData) {
        if (window.DEBUG) console.log('Adding log for course:', courseId);
        try {
            const response = await $.ajax({
                url: `/${window.currentTenant}/admin/api/courses/${courseId}/logs`,
                method: 'POST',
                data: logData,
                xhrFields: {
                    withCredentials: true
                }
            });
            
            if (response.success) {
                this.loadLogs(courseId);
                UI.showSuccess('Log added successfully!');
                return true;
            } else {
                console.error('Error adding log:', response.error);
                UI.showError(response.error || 'Failed to add log.');
                return false;
            }
        } catch (error) {
            console.error('Error adding log:', error);
            UI.showError('Failed to add log. Please try again.');
            return false;
        }
    },

    // Delete log
    deleteLog: async function(logId, courseId) {
        if (window.DEBUG) console.log('Deleting log:', logId);
        try {
            const response = await $.ajax({
                url: `/${window.currentTenant}/admin/api/logs/${logId}`,
                method: 'DELETE',
                xhrFields: {
                    withCredentials: true
                }
            });
            
            if (response.success) {
                this.loadLogs(courseId);
                UI.showSuccess('Log deleted successfully!');
                return true;
            } else {
                console.error('Error deleting log:', response.error);
                UI.showError(response.error || 'Failed to delete log.');
                return false;
            }
        } catch (error) {
            console.error('Error deleting log:', error);
            UI.showError('Failed to delete log. Please try again.');
            return false;
        }
    },

    initializeLogHandlers: function() {
        if (window.DEBUG) console.log('Initializing log handlers');
        
        // Handle log form submission
        $('#addLogForm').on('submit', async (e) => {
            e.preventDefault();
            const courseId = $('#courseId').val();
            const logData = {
                studentId: $('#studentId').val(),
                content: $('#logContent').val()
            };
            
            if (await this.addLog(courseId, logData)) {
                $('#addLogForm')[0].reset();
                $('#addLogModal').modal('hide');
            }
        });
    }
};

// Make Logs globally available
window.Logs = Logs; 