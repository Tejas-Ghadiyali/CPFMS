$(document).ready(function () {

    // Empty Entry on load
    $("#deleteEmployeeModal form #hidden-input").empty();

    // Add Modal Focus
    $(".table-title #addnew").click(function () {
        setTimeout(function () {
            $("#addEmployeeModal input[name=activity_id]").focus();
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
            $("#editEmployeeModal input[name=activity_name]").focus();
        }, 500);
        var row = $(this).parent().parent();
        var activity_num = row.attr("id");
        var activity_id = row.find("td:nth-child(3)").text();
        var activity_name = row.find("td:nth-child(4)").text();
        var activity_amount = row.find("td:nth-child(5)").text();
        var activity_field = row.find("td:nth-child(6)").attr('data-id');
        var remark = row.find("td:nth-child(7)").text();
        var member_debit = row.find("td:nth-child(8)").text();
        if (member_debit.trim() == "No")
            member_debit = "0";
        else
            member_debit = "1";
        var member_debit_amount = row.find("td:nth-child(9)").text();
        $("#editEmployeeModal input[name=activity_num]").val(activity_num);
        $("#editEmployeeModal input[name=activity_id]").val(activity_id);
        $("#editEmployeeModal input[name=activity_name]").val(activity_name);
        $("#editEmployeeModal input[name=activity_amount]").val(activity_amount);
        $("#editEmployeeModal select[name=activity_field]").val(activity_field).change();
        $("#editEmployeeModal textarea[name=remark]").val(remark);
        $("#editEmployeeModal input[name=member_debit][value=" + member_debit + "]").prop('checked', true);
        $("#editEmployeeModal input[name=member_debit_amount]").val(member_debit_amount);
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