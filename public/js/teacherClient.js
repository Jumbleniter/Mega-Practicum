const Teacher = {
    initializeHandlers: function() {
        // Initialize course creation form
        $('#newCourseForm').on('submit', function(e) {
            e.preventDefault();
            const courseData = {
                courseId: $('#courseId').val(),
                display: $('#courseName').val(),
                description: $('#courseDescription').val()
            };
            Teacher.createCourse(courseData);
        });

        // Initialize TA creation form
        $('#createTAForm').on('submit', function(e) {
            e.preventDefault();
            const taData = {
                username: $('#taUsername').val(),
                password: $('#taPassword').val()
            };
            Teacher.createTA(taData);
        });

        // Initialize student creation form
        $('#addStudentForm').on('submit', function(e) {
            e.preventDefault();
            const studentData = {
                username: $('#studentUsername').val(),
                password: $('#studentPassword').val(),
                uvuId: $('#studentUVUId').val()
            };
            Teacher.createStudent(studentData);
        });

        // Initialize log creation form
        $('#addLogForm').on('submit', function(e) {
            e.preventDefault();
            const courseId = $('#logCourseSelect').val();
            const content = $('#logContent').val();
            
            if (!courseId || !content) {
                UI.showError('Please select a course and enter log content');
                return;
            }

            Teacher.createLog(courseId, content);
        });

        // Initialize logout button
        $('#logoutButton').on('click', function() {
            Auth.logout();
        });
    },

    loadDashboard: function() {
        console.log('Loading teacher dashboard...');
        $.ajax({
            url: `/${window.currentTenant}/teacher/courses`,
            method: 'GET',
            success: function(response) {
                console.log('Courses response:', response);
                if (Array.isArray(response)) {
                    Teacher.displayCourses(response);
                    Teacher.populateCourseDropdown(response);
                } else if (response.courses) {
                    Teacher.displayCourses(response.courses);
                    Teacher.populateCourseDropdown(response.courses);
                } else {
                    console.error('Invalid response format:', response);
                    UI.showError('Failed to load courses. Invalid response format.');
                }
            },
            error: function(xhr) {
                console.error('Error loading dashboard:', xhr);
                UI.showError(xhr.responseJSON?.error || 'Failed to load dashboard');
            }
        });
    },

    populateCourseDropdown: function(courses) {
        const $courseSelect = $('#logCourseSelect');
        $courseSelect.empty().append('<option value="">Choose a course</option>');
        
        courses.forEach(course => {
            $courseSelect.append(`
                <option value="${course._id}">
                    ${course.display || course.name} (${course.courseId})
                </option>
            `);
        });
    },

    createLog: function(courseId, content) {
        console.log('Creating log for course:', courseId);
        $.ajax({
            url: `/${window.currentTenant}/teacher/courses/${courseId}/logs`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ content }),
            success: function(response) {
                console.log('Log created:', response);
                UI.showSuccess('Log entry created successfully');
                $('#addLogForm')[0].reset();
                Teacher.loadCourseLogs(courseId);
            },
            error: function(xhr) {
                console.error('Error creating log:', xhr);
                UI.showError(xhr.responseJSON?.error || 'Failed to create log entry');
            }
        });
    },

    displayCourses: function(courses) {
        console.log('Displaying courses:', courses);
        const coursesList = $('#coursesList');
        coursesList.empty();

        if (!courses || courses.length === 0) {
            coursesList.html('<p>No courses found</p>');
            return;
        }

        courses.forEach(course => {
            coursesList.append(`
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${course.display || course.name} (${course.courseId})</h5>
                        <p class="card-text">${course.description}</p>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-primary">${course.students?.length || 0} Students</span>
                            <div>
                                <button class="btn btn-primary view-logs" data-course-id="${course._id}">View Logs</button>
                                <button class="btn btn-success add-student" data-course-id="${course._id}">Add Student</button>
                            </div>
                        </div>
                        <div class="mt-3">
                            <h6>Students</h6>
                            <ul class="list-group">
                                ${course.students?.map(student => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        ${student.username} (${student.uvuId})
                                        <button class="btn btn-danger btn-sm remove-student" 
                                                data-course-id="${course._id}" 
                                                data-student-id="${student._id}">
                                            Remove
                                        </button>
                                    </li>
                                `).join('') || '<li class="list-group-item">No students enrolled</li>'}
                            </ul>
                        </div>
                        <div class="mt-3">
                            <h6>TAs</h6>
                            <ul class="list-group">
                                ${course.tas?.map(ta => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        ${ta.username}
                                        <button class="btn btn-danger btn-sm remove-ta" 
                                                data-course-id="${course._id}" 
                                                data-ta-id="${ta._id}">
                                            Remove
                                        </button>
                                    </li>
                                `).join('') || '<li class="list-group-item">No TAs assigned</li>'}
                            </ul>
                        </div>
                    </div>
                </div>
            `);
        });

        // Add event handlers for the buttons
        $('.view-logs').on('click', function() {
            const courseId = $(this).data('course-id');
            Teacher.loadCourseLogs(courseId);
        });

        $('.add-student').on('click', function() {
            const courseId = $(this).data('course-id');
            Teacher.showAddStudentModal(courseId);
        });

        $('.remove-student').on('click', function() {
            const courseId = $(this).data('course-id');
            const studentId = $(this).data('student-id');
            Teacher.removeStudentFromCourse(courseId, studentId);
        });

        $('.remove-ta').on('click', function() {
            const courseId = $(this).data('course-id');
            const taId = $(this).data('ta-id');
            Teacher.removeTAFromCourse(courseId, taId);
        });
    },

    loadCourseLogs: function(courseId) {
        console.log('Loading logs for course:', courseId);
        $.ajax({
            url: `/${window.currentTenant}/teacher/courses/${courseId}/logs`,
            method: 'GET',
            success: function(response) {
                console.log('Logs response:', response);
                const $logList = $('#logList');
                $logList.empty();

                if (!response || !Array.isArray(response)) {
                    console.error('Invalid logs response:', response);
                    $logList.append('<div class="alert alert-danger">Error loading logs</div>');
                    return;
                }

                if (response.length === 0) {
                    $logList.append('<div class="alert alert-info">No logs found for this course.</div>');
                    return;
                }

                response.forEach(log => {
                    $logList.append(`
                        <div class="log-item mb-3">
                            <div class="card">
                                <div class="card-body">
                                    <p class="card-text">${log.content}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">
                                            ${new Date(log.createdAt).toLocaleString()}
                                        </small>
                                        <small class="text-muted">
                                            By: ${log.createdBy?.username || 'Unknown'}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `);
                });
            },
            error: function(xhr) {
                console.error('Error loading logs:', xhr);
                UI.showError(xhr.responseJSON?.error || 'Failed to load logs');
            }
        });
    },

    createCourse: function(courseData) {
        $.ajax({
            url: `/${window.currentTenant}/teacher/courses`,
            method: 'POST',
            data: JSON.stringify(courseData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    UI.showSuccess('Course created successfully');
                    $('#newCourseForm')[0].reset();
                    Teacher.loadDashboard();
                } else {
                    UI.showError(response.error || 'Failed to create course');
                }
            },
            error: function(xhr) {
                UI.showError(xhr.responseJSON?.error || 'Failed to create course');
            }
        });
    },

    createTA: function(taData) {
        $.ajax({
            url: `/${window.currentTenant}/teacher/tas`,
            method: 'POST',
            data: JSON.stringify(taData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    UI.showSuccess('TA created successfully');
                    $('#createTAForm')[0].reset();
                } else {
                    UI.showError(response.error || 'Failed to create TA');
                }
            },
            error: function(xhr) {
                UI.showError(xhr.responseJSON?.error || 'Failed to create TA');
            }
        });
    },

    createStudent: function(studentData) {
        $.ajax({
            url: `/${window.currentTenant}/teacher/students`,
            method: 'POST',
            data: JSON.stringify(studentData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    UI.showSuccess('Student created successfully');
                    $('#addStudentForm')[0].reset();
                } else {
                    UI.showError(response.error || 'Failed to create student');
                }
            },
            error: function(xhr) {
                UI.showError(xhr.responseJSON?.error || 'Failed to create student');
            }
        });
    },

    showAddStudentModal: function(courseId) {
        // First, fetch all students in the tenant
        $.ajax({
            url: `/${window.currentTenant}/teacher/students`,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    const students = response.data;
                    const modalHtml = `
                        <div class="modal fade" id="addStudentModal" tabindex="-1">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title">Add Student to Course</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                    </div>
                                    <div class="modal-body">
                                        <div class="mb-3">
                                            <label for="studentSelect" class="form-label">Select Student</label>
                                            <select class="form-select" id="studentSelect">
                                                <option value="">Choose a student</option>
                                                ${students.map(student => `
                                                    <option value="${student._id}">
                                                        ${student.username} (${student.uvuId})
                                                    </option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                        <button type="button" class="btn btn-primary" id="confirmAddStudent">Add Student</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    // Remove existing modal if any
                    $('#addStudentModal').remove();
                    
                    // Add new modal to body
                    $('body').append(modalHtml);
                    
                    // Show modal
                    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
                    modal.show();

                    // Handle confirm button click
                    $('#confirmAddStudent').on('click', function() {
                        const studentId = $('#studentSelect').val();
                        if (!studentId) {
                            UI.showError('Please select a student');
                            return;
                        }

                        $.ajax({
                            url: `/${window.currentTenant}/teacher/courses/${courseId}/students`,
                            method: 'POST',
                            data: JSON.stringify({ studentId }),
                            contentType: 'application/json',
                            success: function(response) {
                                UI.showSuccess('Student added to course');
                                modal.hide();
                                Teacher.loadDashboard();
                            },
                            error: function(xhr) {
                                UI.showError(xhr.responseJSON?.error || 'Failed to add student');
                            }
                        });
                    });
                } else {
                    UI.showError(response.error || 'Failed to load students');
                }
            },
            error: function(xhr) {
                UI.showError(xhr.responseJSON?.error || 'Failed to load students');
            }
        });
    },

    removeStudentFromCourse: function(courseId, studentId) {
        $.ajax({
            url: `/${window.currentTenant}/teacher/courses/${courseId}/students/${studentId}`,
            method: 'DELETE',
            success: function(response) {
                UI.showSuccess('Student removed from course');
                Teacher.loadDashboard();
            },
            error: function(xhr) {
                UI.showError(xhr.responseJSON?.error || 'Failed to remove student');
            }
        });
    },

    removeTAFromCourse: function(courseId, taId) {
        $.ajax({
            url: `/${window.currentTenant}/teacher/courses/${courseId}/tas/${taId}`,
            method: 'DELETE',
            success: function(response) {
                UI.showSuccess('TA removed from course');
                Teacher.loadDashboard();
            },
            error: function(xhr) {
                UI.showError(xhr.responseJSON?.error || 'Failed to remove TA');
            }
        });
    }
};

// Initialize when document is ready
$(document).ready(function() {
    Teacher.initializeHandlers();
    
    // Check authentication status and load data
    Auth.checkLoginStatus().then(data => {
        if (data.authenticated && data.user.role === 'teacher') {
            window.currentUser = data.user;
            Teacher.loadDashboard();
        } else {
            window.location.href = `/${window.currentTenant}`;
        }
    }).catch(error => {
        console.error('Error checking login status:', error);
        window.location.href = `/${window.currentTenant}`;
    });
}); 