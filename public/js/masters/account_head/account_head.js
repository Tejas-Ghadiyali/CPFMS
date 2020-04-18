$(document).ready(function () {
    // Activate tooltip
    $('[data-toggle="tooltip"]').tooltip();

    // Activate Select Picker 
    $('.selectpicker').selectpicker();

    // Add Modal Focus
    $(".table-title #addnew").click(function () {
        setTimeout(function () {
            $("#addEmployeeModal input[name=account_id]").focus();
        }, 500);
    });

    // Multiple Delete Focus to Cancel Button
    $(".table-title #multipledelete").click(function () {
        setTimeout(function () {
            $("#deleteEmployeeModal .modal-footer #cancel").focus();
        }, 500);
    });

    // Edit Modal Focus
    // Edit Modal Value Changes
    $('table tbody .edit').click(function () {
        setTimeout(function () {
            $("#editEmployeeModal input[name=account_name]").focus();
        }, 500);
        var row = $(this).parent().parent();
        var li_id = $(this).attr("id");
        var account_name = row.find("td:nth-child(3)").text();
        var account_type = row.find("td:nth-child(4)").text();
        var village_id = row.find("td:nth-child(5)").text();
        var is_society = row.find("td:nth-child(6)").text();
        if (is_society.trim() == "No")
            is_society = "0";
        else
            is_society = "1";
        $("#editEmployeeModal input[name=account_id]").val(li_id);
        $("#editEmployeeModal input[name=account_name]").val(account_name);
        $("#editEmployeeModal select[name=account_type]").val(account_type).change();
        $("#editEmployeeModal select[name=village_id]").val(village_id).change();
        $("#editEmployeeModal select[name=account_type]").val(account_type).change();
        $("#editEmployeeModal input[name=is_society][value=" + is_society + "]").prop('checked', true);
    });

    // Delete One Entry
    $('table tbody .delete').click(function () {
        setTimeout(function () {
            $("#deleteEmployeeModal .modal-footer #cancel").focus();
        }, 500);
        var inputhtml = '<input type="hidden" name="ids[]" value="' + this.id + '">';
        $("#deleteEmployeeModal form").append(inputhtml);
    });

    // Delete Multiple Entry
    $(".table-title #multipledelete").click(function (e) {
        e.preventDefault();
        var checkbox = $('table tbody input[type="checkbox"]');
        var count = 0;
        checkbox.each(function () {
            if (this.checked) {
                ++count;
                var inputhtml = '<input type="hidden" name="ids[]" value="' + this.id + '">';
                $("#deleteEmployeeModal form").append(inputhtml);
            }
        });
        if (count == 0)
            return false;
    });

    // Search Modal
    $(".table-title #search").click(function () {
        setTimeout(function () {
            $("#searchEmployeeModal input[name=searchtext]").focus();
        }, 500);

    });

    // Flash fade effect

    $(".container .alert-success, .container .alert-info").delay(1000).fadeIn(500, function (e) {
        setTimeout(function () {
            $(this).fadeOut(500);
        }, 5000);
        $(document).keydown(function (e) {
            if(e.keyCode===27){
                $(".container .alert").fadeOut(500);
            }
        });
    });
    $(".container .alert-danger").delay(1000).fadeIn(500, function () {
        $(document).keydown(function (e) {
            if(e.keyCode===27){
                $(".container .alert").fadeOut(500);
            }
        });
    });

    $(window).bind("keydown", function (e) {
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

});