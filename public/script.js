'use strict';

$(document).ready(function () {
  // Get the current path to determine tenant
  const currentPath = window.location.pathname;
  const tenant = currentPath.startsWith('/uvu') ? 'uvu' : 'uofu';
  const BASE_URL = `http://localhost:3000`;

  let currentTenant = tenant;

  // Apply tenant-specific styles
  function applyTenantStyles(theme) {
    console.log('Applying theme:', theme); // Debug log
    // Update CSS variables
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
    document.documentElement.style.setProperty('--text-color', theme.textColor);
    document.documentElement.style.setProperty('--background-color', theme.backgroundColor);
    document.documentElement.style.setProperty('--button-color', theme.buttonColor);
    document.documentElement.style.setProperty('--button-text-color', theme.buttonTextColor);
    document.documentElement.style.setProperty('--header-color', theme.headerColor);
    document.documentElement.style.setProperty('--header-text-color', theme.headerTextColor);

    // Update institution name
    $('.institution-name').text(theme.institutionName);

    // Update button colors
    $('.btn-primary').css({
      'background-color': theme.buttonColor,
      'border-color': theme.buttonColor,
      'color': theme.buttonTextColor
    });

    $('.btn-outline-primary').css({
      'color': theme.buttonColor,
      'border-color': theme.buttonColor
    });

    // Update card headers
    $('.card-header').css({
      'background-color': theme.headerColor,
      'color': theme.headerTextColor
    });

    // Update page background
    $('body').css('background-color', theme.backgroundColor);
  }

  // Check if user is already logged in
  function checkLoginStatus() {
    $.ajax({
      url: `${BASE_URL}/auth/status`,
      method: "GET",
      headers: {
        'X-Tenant': currentTenant
      },
      xhrFields: {
        withCredentials: true
      },
      success: function(response) {
        if (response.authenticated) {
          showMainApp();
          applyTenantStyles(response.theme);
        } else {
          showLoginForm();
        }
      },
      error: function() {
        showLoginForm();
      }
    });
  }

  // Show login form and hide main app
  function showLoginForm() {
    $('#loginForm').show();
    $('#mainApp').hide();
    $('.tenant-switcher').show();
  }

  // Show main app and hide login form
  function showMainApp() {
    $('#loginForm').hide();
    $('#mainApp').show();
    $('.tenant-switcher').hide();
    
    // Check user role and show appropriate sections
    $.ajax({
        url: `${BASE_URL}/auth/status`,
        method: "GET",
        headers: {
            'X-Tenant': currentTenant
        },
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            if (response.authenticated) {
                applyTenantStyles(response.theme);
                
                // Show role-specific sections
                if (response.role === 'admin') {
                    $('#adminSection').show();
                    $('#teacherSection').hide();
                    $('#taSection').hide();
                } else if (response.role === 'teacher') {
                    $('#adminSection').hide();
                    $('#teacherSection').show();
                    $('#taSection').hide();
                    loadTeacherCourses();
                } else if (response.role === 'ta') {
                    $('#adminSection').hide();
                    $('#teacherSection').hide();
                    $('#taSection').show();
                    loadTACourses();
                } else {
                    $('#adminSection').hide();
                    $('#teacherSection').hide();
                    $('#taSection').hide();
                }
            }
        }
    });

    loadCourses();
  }

  // Load teacher's courses
  function loadTeacherCourses() {
    $.ajax({
        url: `${BASE_URL}/${currentTenant}/teacher/courses`,
        method: "GET",
        headers: {
            'X-Tenant': currentTenant
        },
        xhrFields: {
            withCredentials: true
        },
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
            showError("Failed to load courses. Please try again.");
        }
    });
  }

  // Load TA's courses
  function loadTACourses() {
    $.ajax({
        url: `${BASE_URL}/${currentTenant}/ta/courses`,
        method: "GET",
        headers: {
            'X-Tenant': currentTenant
        },
        xhrFields: {
            withCredentials: true
        },
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
            showError("Failed to load courses. Please try again.");
        }
    });
  }

  // Load course logs for TA
  function loadTACourseLogs(courseId) {
    if (!courseId) {
        $('#taLogs').empty();
        return;
    }

    $.ajax({
        url: `${BASE_URL}/${currentTenant}/ta/courses/${courseId}/logs`,
        method: "GET",
        headers: {
            'X-Tenant': currentTenant
        },
        xhrFields: {
            withCredentials: true
        },
        success: function(logs) {
            const logsList = $('#taLogs');
            logsList.empty();
            
            if (logs.length === 0) {
                logsList.append('<div class="list-group-item">No logs found for this course</div>');
                return;
            }

            logs.forEach(log => {
                logsList.append(`
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-1">Student ID: ${log.uvuId}</h6>
                            <small>${new Date(log.date).toLocaleString()}</small>
                        </div>
                        <p class="mb-1">${log.text}</p>
                    </div>
                `);
            });
        },
        error: function(xhr) {
            console.error('Error loading course logs:', xhr);
            showError("Failed to load logs. Please try again.");
        }
    });
  }

  // Handle login form submission
  $('#loginFormElement').on('submit', function(e) {
    e.preventDefault();
    
    const username = $('#username').val();
    const password = $('#password').val();

    $.ajax({
      url: `${BASE_URL}/auth/login`,
      method: "POST",
      headers: {
        'X-Tenant': currentTenant,
        'Content-Type': 'application/json'
      },
      xhrFields: {
        withCredentials: true
      },
      data: JSON.stringify({ username, password }),
      success: function(response) {
        // Get theme after successful login
        $.ajax({
          url: `${BASE_URL}/auth/status`,
          method: "GET",
          headers: {
            'X-Tenant': currentTenant
          },
          xhrFields: {
            withCredentials: true
          },
          success: function(response) {
            showMainApp();
            applyTenantStyles(response.theme);
          }
        });
      },
      error: function(xhr) {
        showError(xhr.responseJSON?.error || "Login failed. Please try again.");
      }
    });
  });

  // Handle logout
  function logout() {
    $.ajax({
      url: `${BASE_URL}/auth/logout`,
      method: "POST",
      headers: {
        'X-Tenant': currentTenant
      },
      xhrFields: {
        withCredentials: true
      },
      success: function() {
        showLoginForm();
      },
      error: function() {
        showLoginForm();
      }
    });
  }

  // Add logout button
  function setupLogoutButton() {
    const logoutBtn = $('<button class="btn btn-outline-danger">Logout</button>');
    logoutBtn.on('click', logout);
    $('.container').prepend(logoutBtn);
  }

  // Add tenant switcher functionality
  function setupTenantSwitcher() {
    const tenantLinks = {
      'uvu': 'UVU',
      'uofu': 'UofU'
    };

    const switcher = $('<div class="tenant-switcher mb-3">');
    Object.entries(tenantLinks).forEach(([key, label]) => {
      const link = $(`<a href="/${key}" class="btn ${key === currentTenant ? 'btn-primary' : 'btn-outline-primary'} me-2">${label}</a>`);
      link.on('click', function(e) {
        e.preventDefault();
        selectTenant(key);
      });
      switcher.append(link);
    });
    $('.container').prepend(switcher);
    return switcher;
  }

  /** Load Courses into Dropdown **/
  function loadCourses() {
    $.ajax({
      url: `${BASE_URL}/${currentTenant}/courses`,
      method: "GET",
      dataType: "json",
      headers: {
        'X-Tenant': currentTenant
      },
      xhrFields: {
        withCredentials: true
      },
      success: function (courses) {
        $("#course").empty().append('<option selected value="">Choose Course</option>');
        $.each(courses, function (_, course) {
          $("#course").append(`<option value="${course.id}">${course.display}</option>`);
        });
      },
      error: function (xhr) {
        if (xhr.status === 401) {
          showLoginForm();
        } else {
          console.error("Failed to fetch courses:", xhr.responseJSON?.error || xhr.statusText);
          showError("Failed to load courses. Please try again.");
        }
      }
    });
  }

  /** Add New Course **/
  function addNewCourse(courseData) {
    $.ajax({
      url: `${BASE_URL}/${currentTenant}/courses`,
      method: "POST",
      contentType: "application/json",
      headers: {
        'X-Tenant': currentTenant
      },
      xhrFields: {
        withCredentials: true
      },
      data: JSON.stringify(courseData),
      success: function (newCourse) {
        // Add new course to dropdown
        $("#course").append(`<option value="${newCourse.id}">${newCourse.display}</option>`);
        
        // Show success message
        showSuccess("Course added successfully!");
        
        // Select the new course
        $("#course").val(newCourse.id).trigger('change');
      },
      error: function (xhr) {
        console.error("Failed to add course:", xhr.responseJSON?.error || xhr.statusText);
        showError(xhr.responseJSON?.error || "Failed to add course. Please try again.");
      }
    });
  }

  /** Show Success Message **/
  function showSuccess(message) {
    const successMsg = $('<div class="alert alert-success alert-dismissible fade show" role="alert">')
      .text(message)
      .append($('<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'));
    
    $(".container").prepend(successMsg);
    setTimeout(() => successMsg.alert('close'), 3000);
  }

  /** Show Error Message **/
  function showError(message) {
    const errorMsg = $('<div class="alert alert-danger alert-dismissible fade show" role="alert">')
      .text(message)
      .append($('<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'));
    
    $(".container").prepend(errorMsg);
    setTimeout(() => errorMsg.alert('close'), 5000);
  }

  /** Load Logs for Selected Course & UVU ID **/
  function loadLogs(courseId, uvuId) {
    $.ajax({
      url: `${BASE_URL}/logs`,
      method: "GET",
      data: { courseId, uvuId },
      dataType: "json",
      success: function (logs) {
        $("#uvuIdDisplay").text(`Student Logs for ${uvuId}`);
        const logList = $("ul[data-cy='logs']").empty();
        $.each(logs, function (_, log) {
          logList.append(`
            <li class="list-group-item">
              <div><small>${new Date(log.date).toLocaleString()}</small></div>
              <pre class="d-none"><p>${log.text}</p></pre>
            </li>
          `);
        });
      },
      error: function () {
        $("ul[data-cy='logs']").html('<li class="text-danger">Error fetching logs.</li>');
      }
    });
  }

  /** Course Selection Event **/
  $("#course").on("change", function () {
    const courseSelected = $(this).val() !== "";
    $("#uvuId").prop("disabled", !courseSelected);
  });

  /** UVU ID Input Event **/
  $("#uvuId").on("input", function () {
    let inputVal = $(this).val().replace(/\D/g, "").slice(0, 8);
    $(this).val(inputVal);

    if (inputVal.length === 8) {
      loadLogs($("#course").val(), inputVal);
    } else {
      $("ul[data-cy='logs']").empty();
    }
  });

  /** Log Entry Click (Toggle Visibility) **/
  $("ul[data-cy='logs']").on("click", "li", function () {
    $(this).find("pre").toggleClass("d-none");
  });

  /** Enable/Disable Add Log Button **/
  $("textarea[data-cy='log_textarea']").on("input", function () {
    $("#add_log_btn").prop("disabled", $(this).val().trim() === "");
  });

  /** Submit New Log **/
  $("#add_log_btn").on("click", function (event) {
    event.preventDefault();
    if ($(this).prop("disabled")) return;

    const newLog = {
      courseId: $("#course").val(),
      uvuId: $("#uvuId").val(),
      text: $("textarea[data-cy='log_textarea']").val().trim()
    };

    // Disable the button while submitting
    $("#add_log_btn").prop("disabled", true);

    $.ajax({
      url: `${BASE_URL}/logs`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(newLog),
      success: function (response) {
        // Clear the textarea
        $("textarea[data-cy='log_textarea']").val("");
        
        // Show success message
        showSuccess("Log added successfully!");
        
        // Reload logs to show the new entry
        loadLogs(newLog.courseId, newLog.uvuId);
      },
      error: function (xhr) {
        showError(xhr.responseJSON?.error || "Error adding log. Please try again.");
        console.error("Error adding log:", xhr.responseJSON?.error || xhr.statusText);
      },
      complete: function() {
        // Re-enable the button
        $("#add_log_btn").prop("disabled", false);
      }
    });
  });

  /** Bootstrap Dark Mode (No Custom CSS) **/
  const themeToggle = $("#themeSwitch");
  themeToggle.on("change", function () {
    $("body").toggleClass("bg-dark text-light", $(this).prop("checked"));
    $(".form-control, .list-group-item").toggleClass("bg-dark text-light border-secondary", $(this).prop("checked"));
    localStorage.setItem("theme", $(this).prop("checked") ? "dark" : "light");
  });

  if (localStorage.getItem("theme") === "dark") {
    themeToggle.prop("checked", true).trigger("change");
  }

  /** Handle New Course Form Submission **/
  $("#newCourseForm").on("submit", function(event) {
    event.preventDefault();
    
    const courseData = {
      id: $("#courseId").val().trim(),
      display: $("#courseDisplay").val().trim()
    };

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseData.id)) {
      showError("Invalid course ID format. Must be a valid UUID.");
      return;
    }

    // Add new course
    addNewCourse(courseData);

    // Clear form
    this.reset();
  });

  // Handle teacher creation form submission
  $('#createTeacherForm').on('submit', function(e) {
    e.preventDefault();
    
    const username = $('#teacherUsername').val();
    const password = $('#teacherPassword').val();

    $.ajax({
        url: `${BASE_URL}/${currentTenant}/teachers`,
        method: "POST",
        headers: {
            'X-Tenant': currentTenant,
            'Content-Type': 'application/json'
        },
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify({ username, password }),
        success: function(response) {
            showSuccess("Teacher created successfully!");
            $('#createTeacherForm')[0].reset();
        },
        error: function(xhr) {
            console.error('Teacher creation error:', xhr);
            if (xhr.status === 401) {
                showError("You are not authorized to create teachers. Please log in as an admin.");
                showLoginForm();
            } else if (xhr.status === 403) {
                showError("Access denied. Only admins can create teachers.");
                showLoginForm();
            } else {
                showError(xhr.responseJSON?.error || "Failed to create teacher. Please try again.");
            }
        }
    });
  });

  // Handle TA creation form submission
  $('#createTAForm').on('submit', function(e) {
    e.preventDefault();
    
    const username = $('#taUsername').val();
    const password = $('#taPassword').val();

    $.ajax({
        url: `${BASE_URL}/${currentTenant}/tas`,
        method: "POST",
        headers: {
            'X-Tenant': currentTenant,
            'Content-Type': 'application/json'
        },
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify({ username, password }),
        success: function(response) {
            showSuccess("TA created successfully!");
            $('#createTAForm')[0].reset();
        },
        error: function(xhr) {
            console.error('TA creation error:', xhr);
            if (xhr.status === 401) {
                showError("You are not authorized to create TAs. Please log in as a teacher.");
                showLoginForm();
            } else if (xhr.status === 403) {
                showError("Access denied. Only teachers can create TAs.");
                showLoginForm();
            } else {
                showError(xhr.responseJSON?.error || "Failed to create TA. Please try again.");
            }
        }
    });
  });

  // Handle student creation form submission
  $('#addStudentForm').on('submit', function(e) {
    e.preventDefault();
    
    const username = $('#studentUsername').val();
    const password = $('#studentPassword').val();
    const uvuId = $('#studentUVUId').val();

    $.ajax({
        url: `${BASE_URL}/${currentTenant}/students`,
        method: "POST",
        headers: {
            'X-Tenant': currentTenant,
            'Content-Type': 'application/json'
        },
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify({ username, password, uvuId }),
        success: function(response) {
            showSuccess("Student added successfully!");
            $('#addStudentForm')[0].reset();
        },
        error: function(xhr) {
            console.error('Student creation error:', xhr);
            if (xhr.status === 401) {
                showError("You are not authorized to add students. Please log in as a teacher.");
                showLoginForm();
            } else if (xhr.status === 403) {
                showError("Access denied. Only teachers can add students.");
                showLoginForm();
            } else {
                showError(xhr.responseJSON?.error || "Failed to add student. Please try again.");
            }
        }
    });
  });

  // Handle TA student creation form submission
  $('#taAddStudentForm').on('submit', function(e) {
    e.preventDefault();
    
    const username = $('#taStudentUsername').val();
    const password = $('#taStudentPassword').val();
    const uvuId = $('#taStudentUVUId').val();

    $.ajax({
        url: `${BASE_URL}/${currentTenant}/ta/students`,
        method: "POST",
        headers: {
            'X-Tenant': currentTenant,
            'Content-Type': 'application/json'
        },
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify({ username, password, uvuId }),
        success: function(response) {
            showSuccess("Student added successfully!");
            $('#taAddStudentForm')[0].reset();
        },
        error: function(xhr) {
            console.error('Student creation error:', xhr);
            if (xhr.status === 401) {
                showError("You are not authorized to add students. Please log in as a TA.");
                showLoginForm();
            } else if (xhr.status === 403) {
                showError("Access denied. Only TAs can add students.");
                showLoginForm();
            } else {
                showError(xhr.responseJSON?.error || "Failed to add student. Please try again.");
            }
        }
    });
  });

  // Handle course selection for logs
  $('#taCourseSelect').on('change', function() {
    loadTACourseLogs($(this).val());
  });

  // Initialize
  const tenantSwitcher = setupTenantSwitcher();
  setupLogoutButton();
  checkLoginStatus();

  loadCourses(); // Load courses on page load

  // Function to handle student enrollment
  async function enrollInCourse(courseId) {
    try {
        const response = await fetch(`/${currentTenant}/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to enroll in course');
        }

        const result = await response.json();
        alert(result.message);
        // Refresh the course list
        loadCourses();
    } catch (error) {
        console.error('Error enrolling in course:', error);
        alert(error.message);
    }
  }

  // Function to add student to course (for admins/teachers/TAs)
  async function addStudentToCourse(courseId, studentId) {
    try {
        const response = await fetch(`/${currentTenant}/courses/${courseId}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add student to course');
        }

        const result = await response.json();
        alert(result.message);
        // Refresh the course list
        loadCourses();
    } catch (error) {
        console.error('Error adding student to course:', error);
        alert(error.message);
    }
  }

  // Function to assign TA to course (for teachers)
  async function assignTAToCourse(courseId, taId) {
    try {
        const response = await fetch(`/${currentTenant}/courses/${courseId}/tas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ taId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to assign TA to course');
        }

        const result = await response.json();
        alert(result.message);
        // Refresh the course list
        loadCourses();
    } catch (error) {
        console.error('Error assigning TA to course:', error);
        alert(error.message);
    }
  }

  // Function to display course students
  async function displayCourseStudents(courseId) {
    try {
        const response = await fetch(`/${currentTenant}/courses/${courseId}/students`);
        if (!response.ok) {
            throw new Error('Failed to fetch course students');
        }

        const students = await response.json();
        const studentsList = document.getElementById('studentsList');
        studentsList.innerHTML = '';

        students.forEach(student => {
            const studentElement = document.createElement('div');
            studentElement.className = 'student-item';
            studentElement.innerHTML = `
                <span>${student.username}</span>
                <span>${student.uvuId}</span>
            `;
            studentsList.appendChild(studentElement);
        });
    } catch (error) {
        console.error('Error displaying course students:', error);
        alert('Failed to load course students');
    }
  }

  // Function to show add student modal
  function showAddStudentModal(courseId) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'addStudentModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Add Student to Course</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="addStudentToCourseForm">
                        <div class="mb-3">
                            <label for="studentId" class="form-label">Student ID</label>
                            <input type="text" class="form-control" id="studentId" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Add Student</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    $('#addStudentToCourseForm').on('submit', function(e) {
        e.preventDefault();
        const studentId = $('#studentId').val();
        addStudentToCourse(courseId, studentId);
        modalInstance.hide();
        modal.remove();
    });
  }

  // Function to show assign TA modal
  function showAssignTAModal(courseId) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'assignTAModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Assign TA to Course</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="assignTAToCourseForm">
                        <div class="mb-3">
                            <label for="taId" class="form-label">TA ID</label>
                            <input type="text" class="form-control" id="taId" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Assign TA</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    $('#assignTAToCourseForm').on('submit', function(e) {
        e.preventDefault();
        const taId = $('#taId').val();
        assignTAToCourse(courseId, taId);
        modalInstance.hide();
        modal.remove();
    });
  }

  // Update the course card display to include enrollment options
  function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    
    const isEnrolled = course.students.includes(currentUser._id);
    const isTeacher = course.teacher === currentUser._id;
    const isTA = course.tas.includes(currentUser._id);
    const isAdmin = currentUser.role === 'admin';
    
    let enrollmentButton = '';
    if (currentUser.role === 'student' && !isEnrolled) {
        enrollmentButton = `<button onclick="enrollInCourse('${course._id}')" class="enroll-button">Enroll</button>`;
    }
    
    let managementButtons = '';
    if (isAdmin || isTeacher || isTA) {
        managementButtons = `
            <button onclick="displayCourseStudents('${course._id}')" class="view-students-button">View Students</button>
            <button onclick="showAddStudentModal('${course._id}')" class="add-student-button">Add Student</button>
        `;
    }
    
    if (isTeacher || isAdmin) {
        managementButtons += `
            <button onclick="showAssignTAModal('${course._id}')" class="assign-ta-button">Assign TA</button>
        `;
    }
    
    card.innerHTML = `
        <h3>${course.name}</h3>
        <p>${course.description}</p>
        <p>Teacher: ${course.teacherName}</p>
        ${enrollmentButton}
        <div class="management-buttons">
            ${managementButtons}
        </div>
    `;
    
    return card;
  }

  function selectTenant(tenant) {
    currentTenant = tenant;
    document.querySelectorAll('.tenant-selector .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.btn[onclick="selectTenant('${tenant}')"]`).classList.add('active');
    applyTenantStyles(tenant);
  }

  function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
  }

  function showLogin() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
  }

  document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`/${currentTenant}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            // Apply tenant styles based on login
            applyTenantStyles(currentTenant);
            
            // Show admin section if user is admin
            if (data.user.role === 'admin') {
                document.getElementById('adminSection').classList.remove('hidden');
            } else {
                document.getElementById('adminSection').classList.add('hidden');
            }
            
            // Redirect to appropriate dashboard based on role
            window.location.href = `/${currentTenant}/dashboard`;
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
  });

  document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch(`/${currentTenant}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Signup successful! Please login.');
            showLogin();
        } else {
            alert(data.message || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred during signup');
    }
  });
});
