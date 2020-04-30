$(document).ready(function () {

    // Empty Entry on load
    $("#deleteEmployeeModal form #hidden-input").empty();

    // Add Modal Focus
    $(".table-title #addnew").click(function () {
        setTimeout(function () {
            $("#addEmployeeModal input[name=sub_account_id]").focus();
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
            $("#editEmployeeModal input[name=sub_account_name]").focus();
        }, 500);
        var row = $(this).parent().parent();
        var li_id = row.find("td:nth-child(2)").text().trim();
        var sub_account_name = row.find("td:nth-child(3)").text();
        var sub_account_address = row.find("td:nth-child(4)").text();
        var sub_account_remark = row.find("td:nth-child(5)").text();
        $("#editEmployeeModal input[name=sub_account_id]").val(li_id);
        $("#editEmployeeModal input[name=sub_account_name]").val(sub_account_name);
        $("#editEmployeeModal textarea[name=sub_account_address]").val(sub_account_address);
        $("#editEmployeeModal textarea[name=sub_account_remark]").val(sub_account_remark);
    });

    // Delete One Entry
    $('table tbody .delete').click(function () {
        setTimeout(function () {
            $("#deleteEmployeeModal .modal-footer #cancel").focus();
        }, 500);
        var inputhtml = '<input type="hidden" name="ids[]" value="' + this.id + '">';
        $("#deleteEmployeeModal form #hidden-input").append(inputhtml);
    });

    //Cancel event of delete modal
    $("#deleteEmployeeModal").on("hidden.bs.modal", function () {
        $("#deleteEmployeeModal form #hidden-input").empty();
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
                $("#deleteEmployeeModal form #hidden-input").append(inputhtml);
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