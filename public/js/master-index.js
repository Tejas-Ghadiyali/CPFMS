var counter = 0;

$(document).ready(function () {

    // Idle Time logout counter
    setInterval(function () {
        counter = counter + 1;
        if (counter >= 30) {
            var url = window.location.href;
            var arr = url.split("/");
            var redirect_location = arr[0] + "//" + arr[2] + "/auth/loggedouttotimeout";
            window.location.href = redirect_location;
        }
    }, 60000);

    $(this).mousemove(function (e) {
        counter = 0;
    });

    // Shortcut
    $(window).bind("keydown", function (e) {
        counter = 0;
        // Ctrl + S = Search
        if (e.ctrlKey && e.which == 83) {
            e.preventDefault();
            $("#addEmployeeModal").modal('hide');
            $("#deleteEmployeeModal").modal('hide');
            $("#editEmployeeModal").modal('hide');
            $(".table-title #search").click();
            return false;
        }
        // Ctrl + A = Add
        else if (e.ctrlKey && e.which == 65) {
            e.preventDefault();
            $("#searchEmployeeModal").modal('hide');
            $("#deleteEmployeeModal").modal('hide');
            $("#editEmployeeModal").modal('hide');
            $(".table-title #addnew").click();
            return false;
        }
        // Ctrl + D = Delete Multiple
        else if (e.ctrlKey && e.which == 68) {
            e.preventDefault();
            $("#addEmployeeModal").modal('hide');
            $("#searchEmployeeModal").modal('hide');
            $("#editEmployeeModal").modal('hide');
            $(".table-title #multipledelete").click();
            return false;
        }
        return true;
    });

    // Flash fade effect

    $(".container .alert-success, .container .alert-info").delay(1000).fadeIn(500, function (e) {
        setTimeout(function () {
            $(this).fadeOut(500);
        }, 5000);
        $(document).keydown(function (e) {
            if (e.keyCode === 27) {
                $(".container .alert").fadeOut(500);
            }
        });
    });
    $(".container .alert-danger").delay(1000).fadeIn(500, function () {
        $(document).keydown(function (e) {
            if (e.keyCode === 27) {
                $(".container .alert").fadeOut(500);
            }
        });
    });

    // Activate tooltip
    $('[data-toggle="tooltip"]').tooltip();

    // Activate Select Picker 
    $('.selectpicker').selectpicker();

    // Multiple Delete Focus to Cancel Button
    $(".table-title #multipledelete").click(function () {
        setTimeout(function () {
            $("#deleteEmployeeModal .modal-footer #cancel").focus();
        }, 500);
    });


});