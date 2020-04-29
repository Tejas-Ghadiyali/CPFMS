$(document).ready(function () {

    // Empty Entry on load
    $("#deleteEmployeeModal form #hidden-input").empty();

    // Add Modal Focus
    $(".table-title #addnew").click(function () {
        setTimeout(function () {
            $("#addEmployeeModal input[name=village_id]").focus();
        }, 500);
    });

    // District Name Changer Add
    $("#addEmployeeModal form select[name=taluka_id]").change(function () {
        var taluka_name = $("option:selected", this).attr('data-val-name');
        var district_id = $("option:selected", this).attr('data-val-id');
        $("#addEmployeeModal form input[name=taluka_name]").val(taluka_name);
        $("#addEmployeeModal form input[name=district_id]").val(district_id);
    });

    // District Name Changer Edit
    $("#editEmployeeModal form select[name=taluka_id]").change(function () {
        var taluka_name = $("option:selected", this).attr('data-val-name');
        var district_id = $("option:selected", this).attr('data-val-id');
        $("#editEmployeeModal form input[name=taluka_name]").val(taluka_name);
        $("#editEmployeeModal form input[name=district_id]").val(district_id); 
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
            $("#editEmployeeModal input[name=village_name]").focus();
        }, 500);
        var row = $(this).parent().parent();
        var village_id = row.find("td:nth-child(2)").text();
        var village_name = row.find("td:nth-child(3)").text();
        var taluka_id = row.find("td:nth-child(4)").text();
        $("#editEmployeeModal input[name=village_id]").val(village_id);
        $("#editEmployeeModal input[name=village_name]").val(village_name);
        $("#editEmployeeModal select[name=taluka_id]").val(taluka_id).change();
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