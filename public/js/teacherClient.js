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

        // Initialize logout button
        $('#logoutButton').on('click', function() {
            Auth.logout();
        });
    },

    loadDashboard: function() {
        $.ajax({
            url: `/${window.currentTenant}/teacher`,
            method: 'GET',
            success: function(response) {
                Teacher.displayCourses(response.courses || []);
            },
            error: function(xhr) {
                UI.showError(xhr.responseJSON?.error || 'Failed to load dashboard');
            }
        });
    },

    displayCourses: function(courses) {
        const coursesList = $('#coursesList');
        coursesList.empty();

        if (courses.length === 0) {
            coursesList.html('<p>No courses found</p>');
            return;
        }

        courses.forEach(course => {
            coursesList.append(`
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${course.display} (${course.courseId})</h5>
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
            Logs.loadCourseLogs(courseId);
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