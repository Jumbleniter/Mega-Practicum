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

    initializeCourseHandlers: function() {
        if (window.DEBUG) console.log('Initializing course handlers');
        
        // Handle view logs button clicks
        $(document).on('click', '.view-logs', (e) => {
            const courseId = $(e.target).data('course-id');
            Logs.loadLogs(courseId);
        });

        // Handle new course form submission
        $('#newCourseForm').on('submit', async (e) => {
            e.preventDefault();
            const courseData = {
                courseId: $('#courseId').val(),
                display: $('#courseName').val(),
                description: $('#courseDescription').val()
            };
            
            if (await this.addNewCourse(courseData)) {
                $('#newCourseForm')[0].reset();
                $('#newCourseModal').modal('hide');
            }
        });
    }
};

// Make Courses globally available
window.Courses = Courses; 