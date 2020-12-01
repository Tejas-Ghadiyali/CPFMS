var counter = 0;

$(document).on({
    ajaxStart: function() {
        $('.loading').show();
    },
    ajaxSuccess: function() {
        $('.loading').hide();
    }
});

$(document).ready(function () {

    /*var targetOffset = $(".navbar").offset().top;

    $(window).scroll(function(){
        if ($(window).scrollTop() < targetOffset) {
         $(".navbar").removeClass("navbar-fixed-top");
      } else {
         $(".navbar").addClass("navbar-fixed-top");
      }
    });
    */

    $(".loading").hide();

    $(".navbar .nav .dropdown").hover(
        function () {
            $(this).addClass('active');
        },
        function () {
            $(this).removeClass('active');
        }
    );

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
            $(".container .alert-sucess").fadeOut(500);
            $(".container .alert-info").fadeOut(500);
        }, 3000);
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
    $('.selectpicker').selectpicker({ dropupAuto: false });

    // Multiple Delete Focus to Cancel Button
    $(".table-title #multipledelete").click(function () {
        setTimeout(function () {
            $("#deleteEmployeeModal .modal-footer #cancel").focus();
        }, 500);
    });


});