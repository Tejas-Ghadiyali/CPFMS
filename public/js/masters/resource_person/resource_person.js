$(document).ready(function () {

    // Empty Entry on load
    $("#deleteEmployeeModal form #hidden-input").empty();

    // Add Modal Village Name Changer
    $("#addEmployeeModal form select[name=resource_person_village_id]").change(function () {
        var v_name = $("option:selected",this).attr("data-name");
        $("#addEmployeeModal form input[name=village_name]").val(v_name);
    });

    // Edit Modal Village Name Changer
    $("#editEmployeeModal form select[name=resource_person_village_id]").change(function () {
        var v_name = $("option:selected", this).attr("data-name");
        $("#editEmployeeModal form input[name=village_name]").val(v_name);
    });

    // Add Modal Focus
    $(".table-title #addnew").click(function () {
        setTimeout(function () {
            $("#addEmployeeModal input[name=resource_person_id]").focus();
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
            $("#editEmployeeModal input[name=resource_person_name]").focus();
        }, 500);
        var row = $(this).parent().parent();
        var li_id = row.find("td:nth-child(2)").text();
        var resource_person_name = row.find("td:nth-child(3)").text();
        var resource_person_address = row.find("td:nth-child(4)").text();
        var resource_person_contact = row.find("td:nth-child(5)").text();
        var resource_person_village_id = row.find("td:nth-child(6)").text();
        var resource_person_remark = row.find("td:nth-child(7)").text();
        $("#editEmployeeModal input[name=resource_person_id]").val(li_id);
        $("#editEmployeeModal input[name=resource_person_name]").val(resource_person_name);
        $("#editEmployeeModal textarea[name=resource_person_address]").val(resource_person_address);
        $("#editEmployeeModal input[name=resource_person_contact]").val(resource_person_contact);
        $("#editEmployeeModal select[name=resource_person_village_id]").val(resource_person_village_id).change();
        $("#editEmployeeModal textarea[name=resource_person_remark]").val(resource_person_remark);
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