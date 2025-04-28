'use strict';

const Courses = {
    // Load courses for the current user
    loadCourses: async function() {
        if (window.DEBUG) console.log('Loading courses for tenant:', window.currentTenant);
        try {
            const response = await $.ajax({
                url: `/${window.currentTenant}/admin/api/courses`,
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                }
            });
            
            if (response.success) {
                this.displayCourses(response.data);
            } else {
                console.error('Error loading courses:', response.error);
                UI.showError('Failed to load courses. Please try again.');
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            UI.showError('Failed to load courses. Please try again.');
        }
    },

    displayCourses: function(courses) {
        const courseList = $('#courseList');
        courseList.empty();
        
        if (courses.length === 0) {
            courseList.append('<div class="alert alert-info">No courses found.</div>');
            return;
        }
        
        courses.forEach(course => {
            courseList.append(`
                <div class="course-item">
                    <h4>${course.display}</h4>
                    <p><strong>Course ID:</strong> ${course.courseId}</p>
                    <p><strong>Description:</strong> ${course.description}</p>
                    <p><strong>Teacher:</strong> ${course.teacher?.username || 'Not assigned'}</p>
                    <p><strong>Students:</strong> ${course.students?.length || 0}</p>
                    <p><strong>TAs:</strong> ${course.tas?.length || 0}</p>
                    <button class="btn btn-primary view-logs" data-course-id="${course._id}">View Logs</button>
                </div>
            `);
        });
    },

    // Load teacher's courses
    loadTeacherCourses: function() {
        TenantClient.makeRequest({
            url: `${BASE_URL}/${currentTenant}/teacher/courses`,
            method: "GET",
            success: function(courses) {
                const coursesList = $('#teacherCourses');
                coursesList.empty();
                
                if (courses.length === 0) {
                    coursesList.append('<div class="list-group-item">No courses found</div>');
                    return;
                }

                courses.forEach(course => {
                    coursesList.append(`
                        <div class="list-group-item">
                            <h5>${course.display}</h5>
                            <small>Course ID: ${course.id}</small>
                        </div>
                    `);
                });
            },
            error: function(xhr) {
                console.error('Error loading teacher courses:', xhr);
                UI.showError("Failed to load courses. Please try again.");
            }
        });
    },

    // Load TA's courses
    loadTACourses: function() {
        TenantClient.makeRequest({
            url: `${BASE_URL}/${currentTenant}/ta/courses`,
            method: "GET",
            success: function(courses) {
                const coursesList = $('#taCourses');
                const courseSelect = $('#taCourseSelect');
                
                coursesList.empty();
                courseSelect.empty().append('<option value="">Choose Course</option>');
                
                if (courses.length === 0) {
                    coursesList.append('<div class="list-group-item">No courses found</div>');
                    return;
                }

                courses.forEach(course => {
                    // Add to courses list
                    coursesList.append(`
                        <div class="list-group-item">
                            <h5>${course.display}</h5>
                            <small>Course ID: ${course.id}</small>
                        </div>
                    `);

                    // Add to course select dropdown
                    courseSelect.append(`<option value="${course.id}">${course.display}</option>`);
                });
            },
            error: function(xhr) {
                console.error('Error loading TA courses:', xhr);
                UI.showError("Failed to load courses. Please try again.");
            }
        });
    },

    // Add new course
    addNewCourse: async function(courseData) {
        if (window.DEBUG) console.log('Adding new course:', courseData);
        try {
            const response = await $.ajax({
                url: `/${window.currentTenant}/admin/api/courses`,
                method: 'POST',
                data: courseData,
                xhrFields: {
                    withCredentials: true
                }
            });
            
            if (response.success) {
                this.loadCourses();
                UI.showSuccess('Course created successfully!');
                return true;
            } else {
                console.error('Error adding course:', response.error);
                UI.showError(response.error || 'Failed to create course.');
                return false;
            }
        } catch (error) {
            console.error('Error adding course:', error);
            UI.showError('Failed to create course. Please try again.');
            return false;
        }
    },

    loadTACourseLogs: async function(courseId) {
        if (window.DEBUG) console.log('Loading logs for course:', courseId);
        try {
            const response = await TenantClient.makeRequest(`/${window.currentTenant}/courses/${courseId}/logs`, 'GET');
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
        
        logs.forEach(log => {
            logList.append(`
                <div class="log-item">
                    <p>${log.message}</p>
                    <small>${new Date(log.timestamp).toLocaleString()}</small>
                </div>
            `);
        });
    },

    // Load available courses for student
    loadAvailableCourses: async function() {
        try {
            const response = await $.ajax({
                url: `/${window.currentTenant}/student/courses/available`,
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                }
            });
            
            if (response.success) {
                this.displayAvailableCourses(response.data);
            } else {
                console.error('Error loading available courses:', response.error);
                UI.showError('Failed to load available courses. Please try again.');
            }
        } catch (error) {
            console.error('Error loading available courses:', error);
            UI.showError('Failed to load available courses. Please try again.');
        }
    },

    // Display available courses
    displayAvailableCourses: function(courses) {
        const availableCoursesList = $('#availableCoursesList');
        availableCoursesList.empty();
        
        if (!courses || courses.length === 0) {
            availableCoursesList.append('<div class="alert alert-info">No available courses found.</div>');
            return;
        }
        
        courses.forEach(course => {
            availableCoursesList.append(`
                <div class="course-item mb-3">
                    <h4>${course.display}</h4>
                    <p><strong>Course ID:</strong> ${course.courseId}</p>
                    <p><strong>Description:</strong> ${course.description}</p>
                    <p><strong>Teacher:</strong> ${course.teacher?.username || 'Not assigned'}</p>
                    <button class="btn btn-primary enroll-course" data-course-id="${course._id}">Enroll</button>
                </div>
            `);
        });
    },

    // Load enrolled courses for student
    loadEnrolledCourses: async function() {
        try {
            const response = await $.ajax({
                url: `/${window.currentTenant}/student/courses`,
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                }
            });
            
            if (response.success) {
                this.displayEnrolledCourses(response.data);
            } else {
                console.error('Error loading enrolled courses:', response.error);
                UI.showError('Failed to load enrolled courses. Please try again.');
            }
        } catch (error) {
            console.error('Error loading enrolled courses:', error);
            UI.showError('Failed to load enrolled courses. Please try again.');
        }
    },

    // Display enrolled courses
    displayEnrolledCourses: function(courses) {
        const enrolledCoursesList = $('#enrolledCoursesList');
        const courseSelect = $('#courseSelect');
        enrolledCoursesList.empty();
        courseSelect.empty().append('<option value="">Choose a course</option>');
        
        if (!courses || courses.length === 0) {
            enrolledCoursesList.append('<div class="alert alert-info">You are not enrolled in any courses.</div>');
            return;
        }
        
        courses.forEach(course => {
            enrolledCoursesList.append(`
                <div class="course-item mb-3">
                    <h4>${course.display}</h4>
                    <p><strong>Course ID:</strong> ${course.courseId}</p>
                    <p><strong>Description:</strong> ${course.description}</p>
                    <p><strong>Teacher:</strong> ${course.teacher?.username || 'Not assigned'}</p>
                    <button class="btn btn-danger unenroll-course" data-course-id="${course._id}">Unenroll</button>
                </div>
            `);

            // Add to course select dropdown for log form
            courseSelect.append(`
                <option value="${course._id}">${course.display} (${course.courseId})</option>
            `);
        });
    },

    // Add log entry
    addLogEntry: async function(courseId, content) {
        try {
            const response = await $.ajax({
                url: `/${window.currentTenant}/student/courses/${courseId}/logs`,
                method: 'POST',
                data: JSON.stringify({ content }),
                contentType: 'application/json',
                xhrFields: {
                    withCredentials: true
                }
            });
            
            if (response.success) {
                UI.showSuccess('Log entry added successfully');
                Logs.loadLogs(); // Refresh logs display
                $('#logContent').val(''); // Clear the form
            } else {
                console.error('Error adding log entry:', response.error);
                UI.showError(response.error || 'Failed to add log entry');
            }
        } catch (error) {
            console.error('Error adding log entry:', error);
            UI.showError('Failed to add log entry. Please try again.');
        }
    },

    // Initialize course handlers
    initializeCourseHandlers: function() {
        if (window.DEBUG) console.log('Initializing course handlers');
        
        // Handle view logs button clicks
        $(document).on('click', '.view-logs', (e) => {
            const courseId = $(e.target).data('course-id');
            Logs.loadLogs(courseId);
        });

        // Handle enroll button clicks
        $(document).on('click', '.enroll-course', async (e) => {
            const courseId = $(e.target).data('course-id');
            try {
                const response = await $.ajax({
                    url: `/${window.currentTenant}/student/courses/${courseId}/enroll`,
                    method: 'POST',
                    xhrFields: {
                        withCredentials: true
                    }
                });
                
                if (response.success) {
                    UI.showSuccess('Successfully enrolled in course');
                    this.loadAvailableCourses();
                    this.loadEnrolledCourses();
                } else {
                    UI.showError(response.error || 'Failed to enroll in course');
                }
            } catch (error) {
                console.error('Error enrolling in course:', error);
                UI.showError('Failed to enroll in course. Please try again.');
            }
        });

        // Handle unenroll button clicks
        $(document).on('click', '.unenroll-course', async (e) => {
            const courseId = $(e.target).data('course-id');
            try {
                const response = await $.ajax({
                    url: `/${window.currentTenant}/student/courses/${courseId}/unenroll`,
                    method: 'POST',
                    xhrFields: {
                        withCredentials: true
                    }
                });
                
                if (response.success) {
                    UI.showSuccess('Successfully unenrolled from course');
                    this.loadAvailableCourses();
                    this.loadEnrolledCourses();
                } else {
                    UI.showError(response.error || 'Failed to unenroll from course');
                }
            } catch (error) {
                console.error('Error unenrolling from course:', error);
                UI.showError('Failed to unenroll from course. Please try again.');
            }
        });

        // Handle add log form submission
        $('#addLogForm').on('submit', async (e) => {
            e.preventDefault();
            const courseId = $('#courseSelect').val();
            const content = $('#logContent').val();
            
            if (!courseId || !content) {
                UI.showError('Please select a course and enter log content');
                return;
            }
            
            await this.addLogEntry(courseId, content);
        });
    }
};

// Make Courses globally available
window.Courses = Courses; 