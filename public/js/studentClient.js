'use strict';

const Student = {
    initializeHandlers: function() {
        if (window.DEBUG) console.log('Initializing student handlers');
        
        // Handle enroll button clicks
        $(document).on('click', '.enroll-course', async (e) => {
            const courseId = $(e.target).data('course-id');
            await this.enrollInCourse(courseId);
        });

        // Handle unenroll button clicks
        $(document).on('click', '.unenroll-course', async (e) => {
            const courseId = $(e.target).data('course-id');
            await this.unenrollFromCourse(courseId);
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
    },

    // Load available courses
    loadAvailableCourses: async function() {
        try {
            const courses = await $.ajax({
                url: `/${window.currentTenant}/courses/available`,
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                }
            });
            
            this.displayAvailableCourses(courses);
        } catch (error) {
            console.error('Error loading available courses:', error);
            UI.showError(error.responseJSON?.error || 'Failed to load available courses. Please try again.');
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

    // Load enrolled courses
    loadEnrolledCourses: async function() {
        try {
            const courses = await $.ajax({
                url: `/${window.currentTenant}/courses/enrolled`,
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                }
            });
            
            this.displayEnrolledCourses(courses);
        } catch (error) {
            console.error('Error loading enrolled courses:', error);
            UI.showError(error.responseJSON?.error || 'Failed to load enrolled courses. Please try again.');
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

        // If there's a log form, enable it
        const logForm = $('#addLogForm');
        if (logForm.length) {
            logForm.find('button[type="submit"]').prop('disabled', false);
        }
    },

    // Enroll in a course
    enrollInCourse: async function(courseId) {
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
                await this.loadAvailableCourses();
                await this.loadEnrolledCourses();
            } else {
                UI.showError(response.error || 'Failed to enroll in course');
            }
        } catch (error) {
            console.error('Error enrolling in course:', error);
            UI.showError('Failed to enroll in course. Please try again.');
        }
    },

    // Unenroll from a course
    unenrollFromCourse: async function(courseId) {
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
                await this.loadAvailableCourses();
                await this.loadEnrolledCourses();
            } else {
                UI.showError(response.error || 'Failed to unenroll from course');
            }
        } catch (error) {
            console.error('Error unenrolling from course:', error);
            UI.showError('Failed to unenroll from course. Please try again.');
        }
    },

    // Add log entry
    addLogEntry: async function(courseId, content) {
        try {
            const response = await $.ajax({
                url: `/${window.currentTenant}/student/courses/${courseId}/logs`,
                method: 'POST',
                data: JSON.stringify({ 
                    content: content,
                    courseId: courseId,
                    studentId: window.currentUser.id,
                    createdBy: window.currentUser.id,
                    tenant: window.currentTenant
                }),
                contentType: 'application/json',
                xhrFields: {
                    withCredentials: true
                }
            });
            
            UI.showSuccess('Log entry added successfully');
            // Refresh both the logs and the course list
            Logs.loadLogs(courseId);
            await this.loadEnrolledCourses();
            $('#logContent').val(''); // Clear the form
        } catch (error) {
            console.error('Error adding log entry:', error);
            UI.showError(error.responseJSON?.error || 'Failed to add log entry. Please try again.');
        }
    }
};

// Make Student globally available
window.Student = Student; 