var entries = [];
var current_options = [];

var lastindex = 0;
var total_gb = 0.00;
var accid = '';
var eflag = false;

function fillallentries() {
    if (entries.length === 0) {
        total_gb = 0.00;
        $("#entries").empty();
        $("#totalentry").empty();
    }
    else {
        total = 0.00;
        var counter = 0;
        $("#entries").empty();
        for (i = 0; i < entries.length; i++) {
            entryob = entries[i];
            counter++;
            var inhtml = `
                <tr id=`+ counter + `>
                    <td>`+ counter + `</td>
                    <td>`+ entryob.sub_account_id + `</td>
                    <td class="left-align">`+ entryob.sub_account_name + `</td>
                    <td class="right-align">&#8377; `+ parseFloat(entryob.receipt_amount).toLocaleString('en-IN') + `</td>
                    <td>`+ entryob.narration + `</td>
                    <td id="actions">
                        <span style="cursor: pointer; color: yellow;" onclick="editentry(`+ counter + `)"><i
                                class="material-icons">&#xE254;</i></span>
                        <span style="cursor: pointer; color: red;" onclick="deleteentry(`+ counter + `)"><i
                                class="material-icons">&#xE872;</i></span>
                    </td>
                    <input type="hidden" name="sub_account_ids[${i}]" value="${entryob.sub_account_id}">
                    <input type="hidden" name="receipt_amounts[${i}]" value="${entryob.receipt_amount}">
                    <input type="hidden" name="narrations[${i}]" value="${entryob.narration}">
                </tr>
            `;
            total = total + parseFloat(entryob.receipt_amount);
            $("#entries").append(inhtml);
        }
        $("#totalentry").html("&#8377; " + total.toLocaleString('en-IN'));
        total_gb = total;
    }
}

function editentry(entryindex) {
    if (eflag)
        return false;
    eflag = true;

    // Identify Row
    var edit_entry = entries[entryindex - 1];
    var row = $("#entries #" + entryindex);

    // Option Change
    var option_col_val = edit_entry["sub_account_id"], options = "";
    for (item of current_options) {
        options = options + `<option>${item}</option>`;
    }
    var inhtml = `
        <select class="form-control selectpicker" data-live-search="true" data-dropup-auto="false" data-size="5" name="sub_account_id_copy" id="sub_account_id_select_copy" onchange="sub_optionchange(true)" required>
        `+ options + `
        </select>
    `;
    row.children("td:eq(1)").html(inhtml);
    $("#sub_account_id_select_copy").selectpicker('refresh');
    $("#sub_account_id_select_copy").selectpicker('val', option_col_val);
    $("#sub_account_id_select_copy").selectpicker('toggle');

    // Sub Account Name Change
    var sub_name_col_val = edit_entry["sub_account_name"];
    inhtml = `<input type="text" name="sub_account_name_copy" id="sub_account_name_res_copy" value="${sub_name_col_val}" disabled>`;
    row.children("td:eq(2)").html(inhtml);

    // Amount Change
    var amount_col_val = edit_entry["receipt_amount"];
    inhtml = `<input type="number" step="0.01" id="receipt_amount_copy" name="receipt_amount_copy" value="${amount_col_val}" class="right-align"></input>`;
    row.children("td:eq(3)").html(inhtml);

    // Narration Change
    inhtml = `<input type="text" name="narration_copy" id="narration_copy" value="${edit_entry["narration"]}"></input>`;
    row.children("td:eq(4)").html(inhtml);

    // Action Chnage
    inhtml = `
        <span style="cursor: pointer; color: green;" onclick="submit_editentry(${entryindex})">
            <i class="material-icons" style="transform: scale(2);" >&#xe834;</i>
        </span>
    `;
    row.children("td:eq(5)").html(inhtml);
}

function submit_editentry(entryindex) {
    var entryob = {
        sub_account_id: $("#sub_account_id_select_copy").selectpicker('val'),
        sub_account_name: $("#sub_account_name_res_copy").val(),
        receipt_amount: $("#receipt_amount_copy").val(),
        narration: $("#narration_copy").val()
    }
    var row = $("#entries #" + entryindex);
    row.empty();
    var inhtml = `
        <td>`+ entryindex + `</td>
        <td>`+ entryob.sub_account_id + `</td>
        <td class="left-align">`+ entryob.sub_account_name + `</td>
        <td class="right-align">&#8377; `+ parseFloat(entryob.receipt_amount).toLocaleString('en-IN') + `</td>
        <td>`+ entryob.narration + `</td>
        <td id="actions">
            <span style="cursor: pointer; color: yellow;" onclick="editentry(`+ entryindex + `)"><i
                    class="material-icons">&#xE254;</i></span>
            <span style="cursor: pointer; color: red;" onclick="deleteentry(`+ entryindex + `)"><i
                    class="material-icons">&#xE872;</i></span>
        </td>
        <input type="hidden" name="sub_account_ids[${entryindex - 1}]" value="${entryob.sub_account_id}">
        <input type="hidden" name="receipt_amounts[${entryindex - 1}]" value="${entryob.receipt_amount}">
        <input type="hidden" name="narrations[${entryindex - 1}]" value="${entryob.narration}">
    `;
    row.html(inhtml);
    total_gb = total_gb - parseFloat(entries[entryindex - 1]["receipt_amount"]) + parseFloat(entryob["receipt_amount"]);
    entries[entryindex - 1] = entryob;
    $("#totalentry").html("&#8377; " + total_gb.toLocaleString('en-IN'));
    eflag = false;
}

function deleteentry(entryindex) {
    var flag = confirm('Do you want to delete this entry ?');
    if (flag == true) {
        lastindex--;
        entries.splice(entryindex - 1, 1);
        fillallentries();
    }
    else
        return false;
}

function optionchange() {
    $.ajax({
        url: '/api/transaction/account_details/' + $("#account_id_select").children("option:selected").val(),
        success: function (res) {
            if (res.status === true) {
                $("#account_name_res").val(res.account_name);
                var select_ele = $("#sub_account_id_select"), options = "";
                select_ele.empty();
                select_ele.selectpicker('refresh');
                current_options = [];
                for (sid of res.sub_account_id) {
                    current_options.push(sid.sub_account_id);
                    options = options + "<option>" + sid.sub_account_id + "</option>";
                }
                $(select_ele).append(options);
                $(select_ele).selectpicker('refresh');
                sub_optionchange();
            }
            else {
                current_options = [];
                $("#sub_account_id_select").empty();
                $("#sub_account_id_select").selectpicker('refresh');
                $("#account_name_res").val("--------NO NAME FOUND--------");
                $("#sub_account_name_res").val("--------NO NAME FOUND--------");
            }
        }
    });
}

function sub_optionchange(flag) {
    var ajax_url_id = "#sub_account_id_select";
    var ajax_name_id = "#sub_account_name_res";
    if (flag == true) {
        ajax_url_id = "#sub_account_id_select_copy";
        ajax_name_id = "#sub_account_name_res_copy";
    }
    if ($(ajax_url_id).children("option").length > 0) {
        $.ajax({
            url: '/api/transaction/membername/' + $(ajax_url_id).children("option:selected").val(),
            success: function (res) {
                if (res.status === true)
                    $(ajax_name_id).val(res.data.sub_account_name);
                else
                    $(ajax_name_id).val("--------NO NAME FOUND--------");
            }
        });
    }
    else {
        $(ajax_name_id).val("--------NO NAME FOUND--------");
    }
}

/*
function fillmainparameters() {
}

function savemainparameters() {
}

function restoremainparameters() {
}
*/

$(document).ready(function () {

    $("#table_receipt_number input[name=receipt_number]").focus();

    /*
    if (localStorage.getItem('savedEntries')) {
        entries = JSON.parse(localStorage.getItem('savedEntries'));
        fillallentries();
    }
    */

    optionchange();

    /*
    $("#saveentry").click(function (e) {
        e.preventDefault();
        if (entries.length != 0)
            localStorage.setItem('savedEntries', JSON.stringify(entries));
        alert('Data saved locally !');
    });

    $("#restoreentry").click(function (e) {
        e.preventDefault();
        entries = JSON.parse(localStorage.getItem('savedEntries'));
        fillallentries();
    });

    $("#removedata").click(function (e) {
        localStorage.removeItem('savedEntries');
    });
    */

    $("#clearentry").click(function (e) {
        entries = [];
        lastindex = 0;
        fillallentries();
    });

    $("#account_id_select").on("change", function () {
        if ($("#entries").children("tr").length > 0) {
            var flag = confirm("Do you want to change Society ID ?\n All the entries listed below will be deleted..");
            if (flag == true) {
                accid = $(this).val();
                $("#entries").empty();
                $("#totalentry").empty();
                entries = [];
                total_gb = 0.00;
                optionchange();
            }
            else {
                $(this).selectpicker('val', accid);
            }
        }
        else {
            accid = $(this).val();
            optionchange();
        }
    });

    $("#sub_account_id_select").change(function () {
        sub_optionchange();
    });

    $("#addentry").click(function () {
        var sub_account_id = $("#addentryform select[name=sub_account_id]");
        var sub_account_name = $("#addentryform input[name=sub_account_name]");
        var receipt_amount = $("#addentryform input[name=receipt_amount]");
        var narration = $("#addentryform input[name=narration]");
        if (!sub_account_id.children("option:selected").val() || !receipt_amount.val() || receipt_amount.val() <= 0)
            return false;
        var entryob = {
            sub_account_id: sub_account_id.children("option:selected").val(),
            sub_account_name: sub_account_name.val(),
            receipt_amount: receipt_amount.val(),
            narration: narration.val()
        }
        entries.push(entryob);
        lastindex++;
        var inhtml = `
            <tr id=`+ lastindex + `>
                <td>`+ lastindex + `</td>
                <td>`+ entryob.sub_account_id + `</td>
                <td class="left-align">`+ entryob.sub_account_name + `</td>
                <td class="right-align">&#8377; `+ parseFloat(entryob.receipt_amount).toLocaleString('en-IN') + `</td>
                <td>`+ entryob.narration + `</td>
                <td id="actions">
                    <span style="cursor: pointer; color: yellow;" onclick="editentry(`+ lastindex + `)"><i
                            class="material-icons">&#xE254;</i></span>
                    <span style="cursor: pointer; color: red;" onclick="deleteentry(`+ lastindex + `)"><i
                            class="material-icons">&#xE872;</i></span>
                </td>
                <input type="hidden" name="sub_account_ids[${lastindex - 1}]" value="${entryob.sub_account_id}">
                <input type="hidden" name="receipt_amounts[${lastindex - 1}]" value="${entryob.receipt_amount}">
                <input type="hidden" name="narrations[${lastindex - 1}]" value="${entryob.narration}">
            </tr>
        `;
        total_gb = total_gb + parseFloat(entryob.receipt_amount);
        $("#totalentry").html("&#8377; " + total_gb.toLocaleString('en-IN'));
        $("#addentryform select[name=sub_account_id] option:first").attr('selected', true).change();
        sub_account_name.val('');
        receipt_amount.val('');
        narration.val('');
        $("#entries").append(inhtml);
        $("#sub_account_id_select").selectpicker('toggle');
    });

    $("#table_receipt_number input[name=receipt_number]").on('input', function () {
        var txt = "Receipt No.: " + $(this).val();
        $("#table_narration textarea[name=acc_narration]").val(txt);
    });

    $("#main-form").submit(function (e) {
        if ($("#entries td").length <= 0) {
            e.preventDefault();
            alert('Enter atleast one entry before submitting the form!');
        }
    });

});