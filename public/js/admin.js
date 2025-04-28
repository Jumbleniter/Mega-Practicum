const Admin = {
    // Initialize admin functionality
    init: function() {
        // console.log('Initializing admin functionality');
        
        // Load initial data
        this.loadCourses();
        this.loadLogs();
        this.loadUsers();
        
        // Set up event handlers
        this.setupEventHandlers();
    },

    // Load all users for dropdowns
    loadUsers: function() {
        $.get(`/${window.currentTenant}/admin/users`)
            .done(function(users) {
                const teachers = users.filter(u => u.role === 'teacher');
                const tas = users.filter(u => u.role === 'ta');
                const students = users.filter(u => u.role === 'student');

                // Populate teacher dropdown
                const $teacherSelect = $('#teacherSelect');
                $teacherSelect.empty().append('<option value="">Choose Teacher</option>');
                teachers.forEach(teacher => {
                    $teacherSelect.append(`
                        <option value="${teacher._id}">
                            ${teacher.username} (${teacher.email || 'No email'})
                        </option>
                    `);
                });

                // Populate TA dropdown
                const $taSelect = $('#taSelect');
                $taSelect.empty().append('<option value="">Choose TA</option>');
                tas.forEach(ta => {
                    $taSelect.append(`
                        <option value="${ta._id}">
                            ${ta.username} (${ta.email || 'No email'})
                        </option>
                    `);
                });

                // Populate student dropdown
                const $studentSelect = $('#studentSelect');
                $studentSelect.empty().append('<option value="">Choose Student</option>');
                students.forEach(student => {
                    $studentSelect.append(`
                        <option value="${student._id}">
                            ${student.username} (UVU ID: ${student.uvuId || 'No ID'})
                        </option>
                    `);
                });
            })
            .fail(function(error) {
                console.error('Error loading users:', error);
                UI.showError('Failed to load users. Please try again.');
            });
    },

    // Load all courses
    loadCourses: function() {
        // console.log('Loading courses for tenant:', window.currentTenant);
        $.get(`/${window.currentTenant}/admin/courses`)
            .done(function(courses) {
                // console.log('Courses response:', courses);
                const $courseList = $('#courseList');
                $courseList.empty();
                
                if (!courses || !Array.isArray(courses)) {
                    console.error('Invalid courses response format:', courses);
                    $courseList.append('<div class="alert alert-danger">Error loading courses</div>');
                    return;
                }
                
                // Populate course list
                courses.forEach(function(course) {
                    $courseList.append(`
                        <div class="course-item">
                            <h4>${course.display || course.name || 'Unnamed Course'}</h4>
                            <p><strong>Course ID:</strong> ${course.courseId || 'No ID'}</p>
                            <p><strong>Description:</strong> ${course.description || 'No description'}</p>
                            <p><strong>Teacher:</strong> ${course.teacher?.username || 'Not assigned'}</p>
                            <p><strong>Students:</strong> ${course.students?.length || 0}</p>
                            <p><strong>TAs:</strong> ${course.tas?.length || 0}</p>
                            <button class="btn btn-primary view-logs" data-course-id="${course._id}">View Logs</button>
                        </div>
                    `);
                });

                // Populate course dropdowns with filtered options
                const $courseSelect = $('#courseSelect'); // For teacher assignment
                const $taCourseSelect = $('#taCourseSelect'); // For TA assignment
                const $studentCourseSelect = $('#studentCourseSelect'); // For student enrollment
                
                // Filter courses for teacher assignment (only show courses without teachers)
                const coursesWithoutTeachers = courses.filter(course => !course.teacher);
                $courseSelect.empty().append('<option value="">Choose Course</option>');
                coursesWithoutTeachers.forEach(course => {
                    $courseSelect.append(`
                        <option value="${course._id}">
                            ${course.display || course.name} (${course.courseId || 'No ID'})
                        </option>
                    `);
                });

                // Filter courses for student enrollment (only show courses where student is not enrolled)
                const $studentSelect = $('#studentSelect');
                const selectedStudentId = $studentSelect.val();
                if (selectedStudentId) {
                    const coursesWithoutStudent = courses.filter(course => 
                        !course.students.some(student => student._id === selectedStudentId)
                    );
                    $studentCourseSelect.empty().append('<option value="">Choose Course</option>');
                    coursesWithoutStudent.forEach(course => {
                        $studentCourseSelect.append(`
                            <option value="${course._id}">
                                ${course.display || course.name} (${course.courseId || 'No ID'})
                            </option>
                        `);
                    });
                } else {
                    $studentCourseSelect.empty().append('<option value="">Choose Course</option>');
                    courses.forEach(course => {
                        $studentCourseSelect.append(`
                            <option value="${course._id}">
                                ${course.display || course.name} (${course.courseId || 'No ID'})
                            </option>
                        `);
                    });
                }

                // All courses available for TA assignment
                $taCourseSelect.empty().append('<option value="">Choose Course</option>');
                courses.forEach(course => {
                    $taCourseSelect.append(`
                        <option value="${course._id}">
                            ${course.display || course.name} (${course.courseId || 'No ID'})
                        </option>
                    `);
                });
            })
            .fail(function(error) {
                console.error('Error loading courses:', error);
                const $courseList = $('#courseList');
                $courseList.empty();
                $courseList.append('<div class="alert alert-danger">Error loading courses. Please try again.</div>');
            });
    },

    // Load logs, optionally filtered by course
    loadLogs: function(courseId = null) {
        const url = courseId 
            ? `/${window.currentTenant}/admin/api/logs?course=${courseId}`
            : `/${window.currentTenant}/admin/api/logs`;
        
        $.get(url)
            .done(function(response) {
                const $logList = $('#logList');
                $logList.empty();
                
                if (!response || !response.success) {
                    console.error('Invalid logs response:', response);
                    $logList.append('<div class="alert alert-danger">Error loading logs</div>');
                    return;
                }
                
                const logs = response.data || [];
                if (logs.length === 0) {
                    $logList.append('<div class="alert alert-info">No logs found.</div>');
                    return;
                }
                
                logs.forEach(function(log) {
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
            })
            .fail(function(error) {
                console.error('Error loading logs:', error);
                const $logList = $('#logList');
                $logList.empty();
                $logList.append('<div class="alert alert-danger">Error loading logs. Please try again.</div>');
            });
    },

    // Set up event handlers
    setupEventHandlers: function() {
        // View logs button click handler
        $(document).on('click', '.view-logs', function(e) {
            e.preventDefault();
            const courseId = $(this).data('course-id');
            const courseName = $(this).closest('.course-item').find('h4').text();
            
            // console.log('=== View Logs Button Clicked ===');
            // console.log('Button Element:', this);
            // console.log('Course ID:', courseId);
            // console.log('Course Name:', courseName);
            // console.log('Button HTML:', $(this).prop('outerHTML'));
            // console.log('Parent Course Item:', $(this).closest('.course-item').prop('outerHTML'));
            
            // if (window.DEBUG) console.log('View logs clicked for course:', courseId, courseName);
            
            // Load logs for this course
            Admin.loadLogs(courseId);
            
            // Update only the logs header
            $('#logList').prev('.card-header').find('h3').text('Logs for Course: ' + courseName);
            
            // Show the back to all logs button
            $('#backToAllLogs').show();
        });
        
        // Back to all logs button
        $(document).on('click', '#backToAllLogs', function(e) {
            e.preventDefault();
            // if (window.DEBUG) console.log('Back to all logs clicked');
            
            Admin.loadLogs();
            $('#logList').prev('.card-header').find('h3').text('View All Logs');
            $('#backToAllLogs').hide();
        });

        // Create user form handlers
        $('#createTeacherForm').on('submit', (e) => {
            e.preventDefault();
            this.createUser('teacher');
        });

        $('#createTAForm').on('submit', (e) => {
            e.preventDefault();
            this.createUser('ta');
        });

        $('#createStudentForm').on('submit', (e) => {
            e.preventDefault();
            this.createUser('student');
        });

        // Update student course dropdown when student is selected
        $('#studentSelect').on('change', function() {
            Admin.loadCourses(); // This will now filter courses based on selected student
        });

        // Assign teacher form submission
        $('#assignTeacherForm').on('submit', (e) => {
            e.preventDefault();
            const courseId = $('#courseSelect').val();
            const teacherId = $('#teacherSelect').val();
            
            $.ajax({
                url: `/${window.currentTenant}/admin/courses/${courseId}/teacher`,
                method: 'POST',
                data: { teacherId },
                success: (response) => {
                    UI.showSuccess('Teacher assigned successfully!');
                    Admin.loadCourses();
                },
                error: (error) => {
                    console.error('Error assigning teacher:', error);
                    UI.showError('Failed to assign teacher. Please try again.');
                }
            });
        });

        // Assign TA form submission
        $('#assignTAForm').on('submit', (e) => {
            e.preventDefault();
            const courseId = $('#taCourseSelect').val();
            const taId = $('#taSelect').val();
            
            $.ajax({
                url: `/${window.currentTenant}/admin/courses/${courseId}/tas`,
                method: 'POST',
                data: { taId },
                success: (response) => {
                    UI.showSuccess('TA assigned successfully!');
                    Admin.loadCourses();
                },
                error: (error) => {
                    console.error('Error assigning TA:', error);
                    UI.showError('Failed to assign TA. Please try again.');
                }
            });
        });

        // Add student form submission
        $('#assignStudentForm').on('submit', (e) => {
            e.preventDefault();
            const courseId = $('#studentCourseSelect').val();
            const studentId = $('#studentSelect').val();
            
            $.ajax({
                url: `/${window.currentTenant}/admin/courses/${courseId}/students`,
                method: 'POST',
                data: { studentId },
                success: (response) => {
                    UI.showSuccess('Student added successfully!');
                    Admin.loadCourses();
                },
                error: (error) => {
                    console.error('Error adding student:', error);
                    UI.showError('Failed to add student. Please try again.');
                }
            });
        });
    },

    // Create a new user
    createUser: function(role) {
        const formId = `#create${role.charAt(0).toUpperCase() + role.slice(1)}Form`;
        const username = $(`${formId} #${role}Username`).val();
        const password = $(`${formId} #${role}Password`).val();
        const uvuId = role === 'student' ? $(`${formId} #studentUVUId`).val() : null;

        console.log('Creating user with data:', {
            username,
            password,
            role,
            uvuId,
            formId
        });

        if (!username || !password) {
            alert('Username and password are required');
            return;
        }

        $.ajax({
            url: `/${window.currentTenant}/admin/users`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                username,
                password,
                role,
                uvuId
            }),
            success: (response) => {
                console.log('Create user success:', response);
                UI.showSuccess(`${role} created successfully!`);
                $(formId)[0].reset();
                this.loadUsers(); // Reload user lists
            },
            error: (error) => {
                console.error(`Error creating ${role}:`, error);
                console.error('Error response:', error.responseJSON);
                console.error('Request data:', {
                    username,
                    password,
                    role,
                    uvuId
                });
                UI.showError(`Failed to create ${role}. Please try again.`);
            }
        });
    }
};

// Initialize admin functionality when document is ready
$(document).ready(function() {
    Admin.init();
    
    // Check authentication status
    Auth.checkLoginStatus().then(data => {
        if (data.authenticated && data.user.role === 'admin') {
            window.currentUser = data.user;
        } else {
            window.location.href = `/${window.currentTenant}`;
        }
    }).catch(error => {
        console.error('Error checking login status:', error);
        window.location.href = `/${window.currentTenant}`;
    });
}); 