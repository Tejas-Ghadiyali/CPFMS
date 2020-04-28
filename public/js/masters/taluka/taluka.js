$(document).ready(function () {

    // Empty Entry on load
    $("#deleteEmployeeModal form #hidden-input").empty();

    // Add Modal Focus
    $(".table-title #addnew").click(function () {
        setTimeout(function () {
            $("#addEmployeeModal input[name=taluka_id]").focus();
        }, 500);
    });

    // District Name Changer Add
    $("#addEmployeeModal form select[name=district_id]").change(function () {
        var district_name = $("option:selected", this).attr('data-val');
        $("#addEmployeeModal form #dist-name").val(district_name); 
    });

    // District Name Changer Edit
    $("#editEmployeeModal form select[name=district_id]").change(function () {
        var district_name = $("option:selected", this).attr('data-val');
        $("#editEmployeeModal form #dist-name").val(district_name); 
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
            $("#editEmployeeModal input[name=taluka_name]").focus();
        }, 500);
        var row = $(this).parent().parent();
        var taluka_id = row.find("td:nth-child(2)").text();
        var taluka_name = row.find("td:nth-child(3)").text();
        var district_id = row.find("td:nth-child(4)").text();
        $("#editEmployeeModal input[name=taluka_id]").val(taluka_id);
        $("#editEmployeeModal input[name=taluka_name]").val(taluka_name);
        $("#editEmployeeModal select[name=district_id]").val(district_id).change();
        var district_name = $("option:selected", this).attr('data-val');
        $("#addEmployeeModal form #dist-name").val(district_name);
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