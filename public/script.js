'use strict';

$(document).ready(function () {
  // Get the current path to determine tenant
  const currentPath = window.location.pathname;
  const tenant = currentPath.startsWith('/uvu') ? 'uvu' : 'uofu';
  const BASE_URL = `http://localhost:3000`;

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
        'X-Tenant': tenant
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
    loadCourses();
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
        'X-Tenant': tenant,
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
            'X-Tenant': tenant
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
        'X-Tenant': tenant
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
      const link = $(`<a href="/${key}" class="btn ${key === tenant ? 'btn-primary' : 'btn-outline-primary'} me-2">${label}</a>`);
      link.on('click', function(e) {
        e.preventDefault();
        window.location.href = `/${key}`;
      });
      switcher.append(link);
    });
    $('.container').prepend(switcher);
    return switcher;
  }

  /** Load Courses into Dropdown **/
  function loadCourses() {
    $.ajax({
      url: `${BASE_URL}/${tenant}/courses`,
      method: "GET",
      dataType: "json",
      headers: {
        'X-Tenant': tenant
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
      url: `${BASE_URL}/${tenant}/courses`,
      method: "POST",
      contentType: "application/json",
      headers: {
        'X-Tenant': tenant
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

  // Initialize
  const tenantSwitcher = setupTenantSwitcher();
  setupLogoutButton();
  checkLoginStatus();

  loadCourses(); // Load courses on page load
});
