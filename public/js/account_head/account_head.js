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
        var village_id =row.find("td:nth-child(5)").text();
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

});