$(document).ready(function () {

    $("#deleteEmployeeModal form #hidden-input").empty();
    $("#resetEmployeeModal form #hidden-input").empty();

    // Add Modal Focus
    $(".table-title #addnew").click(function () {
        setTimeout(function () {
            $("#addEmployeeModal input[name=user_id]").focus();
        }, 500);
    });

    // Password Checking
    $("#addEmployeeModal form").submit(function (e) {
        var pass1 = $("#addEmployeeModal form input[name=password]").val();
        var pass2 = $("#addEmployeeModal form input[name=confirm_password]").val();
        if (pass1 != pass2) {
            e.preventDefault();
            var ele = $("#addEmployeeModal form .alert-danger");
            if (!ele.length) {
                var inhtml = `
                    <div class="alert alert-block alert-danger">
                        Password and Confirm Password should be same !
                    </div>
                    `;
                $("#addEmployeeModal form #pass_error").append(inhtml);
            }
        }
    });

    // Edit Modal Focus
    // Edit Modal Value Changes
    $('table tbody .edit').click(function () {
        setTimeout(function () {
            $("#editEmployeeModal input[name=user_name]").focus();
        }, 500);
        var row = $(this).parent().parent();
        var user_id = row.find("td:nth-child(2)").text();
        var user_name = row.find("td:nth-child(3)").text();
        var user_type = row.find("td:nth-child(4)").text();
        var active = row.find("td:nth-child(5)").text();
        if (active.trim() == "No")
            active = "0";
        else
            active = "1";
        $("#editEmployeeModal input[name=user_id]").val(user_id);
        $("#editEmployeeModal input[name=user_name]").val(user_name);
        $("#editEmployeeModal select[name=user_type]").val(user_type).change();
        $("#editEmployeeModal input[name=active][value=" + active + "]").prop('checked', true);
    });

    // Delete One Entry
    $('table tbody .delete').click(function () {
        setTimeout(function () {
            $("#deleteEmployeeModal .modal-footer #cancel").focus();
        }, 500);
        var inputhtml = '<input type="hidden" name="ids[]" value="' + this.id + '">';
        $("#deleteEmployeeModal form #hidden-input").append(inputhtml);
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

    // Reset Password
    $(".table tbody .reset").click(function (e) {
        setTimeout(function () {
            $("#resetEmployeeModal .modal-footer #cancel").focus();
        }, 500);
        var inputhtml = '<input type="hidden" name="user_id" value="' + this.id + '">';
        $("#resetEmployeeModal form #hidden-input").append(inputhtml);
    });

    //Cancel event of delete modal
    $("#deleteEmployeeModal").on("hidden.bs.modal", function () {
        $("#deleteEmployeeModal form #hidden-input").empty();
    });

    //Cancel event of reset modal
    $("#resetEmployeeModal").on("hidden.bs.modal", function () {
        $("#resetEmployeeModal form #hidden-input").empty();
    });

    // Search Modal
    $(".table-title #search").click(function () {
        setTimeout(function () {
            $("#searchEmployeeModal input[name=searchtext]").focus();
        }, 500);

    });
});