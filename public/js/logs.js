'use strict';

const Logs = {
    // Load logs for a course
    loadLogs: async function(courseId) {
        if (window.DEBUG) console.log('Loading logs for course:', courseId);
        try {
            const response = await $.ajax({
                url: `/${window.currentTenant}/courses/${courseId}/logs`,
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                }
            });
            
            if (response.success) {
                this.displayLogs(response.data);
            } else {
                console.error('Error loading logs:', response.error);
            }
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    },

    displayLogs: function(logs) {
        const logList = $('#logList');
        logList.empty();
        
        if (logs.length === 0) {
            logList.append('<div class="alert alert-info">No logs found for this course.</div>');
            return;
        }

        logs.forEach(log => {
            logList.append(`
                <div class="card mb-3">
                    <div class="card-header">
                        <h5 class="card-title">${log.studentName}</h5>
                        <small class="text-muted">${new Date(log.date).toLocaleString()}</small>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${log.content}</p>
                    </div>
                </div>
            `);
        });
    },

    // Add new log
    addLog: async function(courseId, logData) {
        if (window.DEBUG) console.log('Adding log for course:', courseId);
        try {
            const response = await $.ajax({
                url: `/${window.currentTenant}/courses/${courseId}/logs`,
                method: 'POST',
                data: logData,
                xhrFields: {
                    withCredentials: true
                }
            });
            
            if (response.success) {
                this.loadLogs(courseId);
                return true;
            } else {
                console.error('Error adding log:', response.error);
                return false;
            }
        } catch (error) {
            console.error('Error adding log:', error);
            return false;
        }
    },

    // Delete log
    deleteLog: function(logId, courseId) {
        if (DEBUG.LOG_MANAGEMENT) {
            console.log('Deleting log:', logId);
        }
        
        $.ajax({
            url: `${BASE_URL}/${currentTenant}/logs/${logId}`,
            method: "DELETE",
            headers: {
                'X-Tenant': currentTenant
            },
            xhrFields: {
                withCredentials: true
            },
            success: function() {
                if (DEBUG.LOG_MANAGEMENT) {
                    console.log('Log deleted successfully');
                }
                UI.showSuccess("Log deleted successfully!");
                Logs.loadLogs(courseId);
            },
            error: function(xhr) {
                if (DEBUG.LOG_MANAGEMENT) {
                    console.error('Failed to delete log:', xhr);
                }
                UI.showError(xhr.responseJSON?.error || "Failed to delete log. Please try again.");
            }
        });
    },

    initializeLogHandlers: function() {
        if (window.DEBUG) console.log('Initializing log handlers');
        
        // Handle log form submission
        $('#addLogForm').on('submit', async (e) => {
            e.preventDefault();
            const courseId = $('#courseId').val();
            const logData = {
                studentName: $('#studentName').val(),
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