var entries = [];
var current_options = [];

var lastindex = 0;
var cr_total_gb = 0.00;
var dr_total_gb = 0.00;
var eflag = false;

function fillallentries() {
    if (entries.length === 0) {
        cr_total_gb = 0.00;
        dr_total_gb = 0.00;
        $("#entries").empty();
        $("#cr_totalentry").empty();
        $("#dr_totalentry").empty();
    }
    else {
        var cr_total = 0.00;
        var dr_total = 0.00;
        var counter = 0;
        $("#entries").empty();
        for (i = 0; i < entries.length; i++) {
            entryob = entries[i];
            counter++;
            var inhtml = `
                <tr id=${counter}>
                    <td>${counter}</td>
                    <td style="white-space: true;">${entryob.account_id}<br/>${entryob.account_name}</td>
                    <td style="white-space: true;">${entryob.sub_account_id}<br/>${entryob.sub_account_name}</td>
                    <td class="right-align">${parseFloat(entryob.cr_amount).toLocaleString('en-IN')}</td>
                    <td class="right-align">${parseFloat(entryob.dr_amount).toLocaleString('en-IN')}</td>
                    <td>${entryob.narration}</td>
                    <td>
                        <span style="cursor: pointer; color: yellow;" onclick="editentry(`+ lastindex + `)"><i class="material-icons">&#xE254;</i></span>
                        <span style="cursor: pointer; color: red;" onclick="deleteentry(`+ lastindex + `)"><i class="material-icons">&#xE872;</i></span>
                    </td>
                    <input type="hidden" name="account_ids[${lastindex - 1}]" value="${entryob.account_id}">
                    <input type="hidden" name="sub_account_ids[${lastindex - 1}]" value="${entryob.sub_account_id}">
                    <input type="hidden" name="cr_amounts[${lastindex - 1}]" value="${entryob.cr_amount}">
                    <input type="hidden" name="dr_amounts[${lastindex - 1}]" value="${entryob.dr_amount}">
                    <input type="hidden" name="narrations[${lastindex - 1}]" value="${entryob.narration}">
                </tr>
            `;
            cr_total += parseFloat(entryob.cr_amount);
            dr_total += parseFloat(entryob.dr_amount);
            $("#entries").append(inhtml);
        }
        $("#cr_totalentry").html("&#8377; " + cr_total.toLocaleString('en-IN'));
        $("#dr_totalentry").html("&#8377; " + dr_total.toLocaleString('en-IN'));
        cr_total_gb = cr_total;
        dr_total_gb = dr_total;
    }
}

function editentry(entryindex) {
    if (eflag)
        return false;
    eflag = true;

    var edit_entry = entries[entryindex - 1];
    console.log(edit_entry);
    var row = $("#entries #" + entryindex);
    var row_to_copy = $("#addentryform");
    row.html(row_to_copy.html());
    row.find("#addentryform_account_id_select").attr("id","addentryform_account_id_select_copy");
    row.find("#account_id_select").attr("id","account_id_select_copy");
    row.find("#account_id_select").attr("name","account_id_copy");
    row.find("#account_name_res").attr("id","account_name_res_copy");
    row.find("#account_name_res").attr("name","account_name_res_copy");
    row.find("#addentryform_sub_account_id_select").attr("id","addentryform_sub_account_id_select_copy");
    row.find("#sub_account_id_select").attr("id","sub_account_id_select_copy");
    row.find("#sub_account_id_select").attr("name","sub_account_id_copy");
    row.find("#sub_account_name_res").attr("id","sub_account_name_res_copy");
    row.find("#sub_account_name_res").attr("name","sub_account_name_res_copy");
    row.find("#addentryform input[name=cr_amount]").attr("name","cr_amount_copy");
    row.find("#addentryform input[name=dr_amount]").attr("name","dr_amount_copy");
    row.find("#addentryform textarea[name=narration]").attr("name","narration_copy");

    // Refresh and Value fill
    row.find("#account_id_select_copy").selectpicker('refresh');
    row.find("#account_id_select_copy").selectpicker('val',edit_entry["account_id"]);
    optionchange(true);
    row.find("#sub_account_id_select_copy").selectpicker('val',edit_entry["sub_account_id"]);
    sub_optionchange(true);

    row.find("#addentryform input[name=cr_amount_copy]").val(edit_entry["cr_amount"]);
    row.find("#addentryform input[name=dr_amount_copy]").val(edit_entry["dr_amount"]);
    row.find("#addentryform textarea[name=narration_copy]").val(edit_entry["narration"]);
    row.find("#addentryform #addentry").attr("onclick","submit_editentry(${entryindex})");

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

function optionchange(flag) {
    var ajax_account_id = "#account_id_select";
    var ajax_account_name = "#account_name_res";
    var ajax_sub_account_id = "#sub_account_id_select";
    var ajax_sub_account_name = "#sub_account_name_res";
    if (flag == true) {
       ajax_account_id = "#account_id_select_copy";
       ajax_account_name = "#account_name_res_copy";
       ajax_sub_account_id = "#sub_account_id_select_copy";
       ajax_sub_account_name = "#sub_account_name_copy";
    }
    var account_id = $(ajax_account_id).children("option:selected").val();
    $.ajax({
        url: '/api/transaction/account_details/' + account_id,
        success: function (res) {
            if (res.status === true) {
                $(ajax_account_name).val(res.account_name);
                var select_ele = $(ajax_sub_account_id), options = "";
                select_ele.empty();
                select_ele.selectpicker('refresh');
                current_options = [];
                for (sid of res.sub_account_id) {
                    current_options.push(sid.sub_account_id);
                    options = options + "<option>" + sid.sub_account_id + "</option>";
                }
                $(select_ele).append(options);
                $(select_ele).selectpicker('refresh');
                sub_optionchange(flag);
            }
            else {
                current_options = [];
                $(ajax_account_id).empty();
                $(ajax_sub_account_id).empty();
                $(ajax_account_id).selectpicker('refresh');
                $(ajax_sub_account_id).selectpicker('refresh');
                $(ajax_account_name).val("--------NO NAME FOUND--------");
                $(ajax_sub_account_name).val("--------NO NAME FOUND--------");
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

    $("#table_jv_number input[name=jv_number]").focus();

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
        fillallentries();
    });

    $("#account_id_select").on("change", function () {
        optionchange();
    });

    $("#sub_account_id_select").change(function () {
        sub_optionchange();
    });

    $("#addentry").click(function () {
        var account_id = $("#addentryform select[name=account_id]");
        var account_name = $("#account_name_res");
        var sub_account_id = $("#addentryform select[name=sub_account_id]");
        var sub_account_name = $("#sub_account_name_res");
        var cr_amount = $("#addentryform input[name=cr_amount]");
        var dr_amount = $("#addentryform input[name=dr_amount]")
        var narration = $("#addentryform textarea[name=narration]");
        var cr_amount_val = parseFloat(cr_amount.val() || '0');
        var dr_amount_val = parseFloat(dr_amount.val() || '0');
        console.log(cr_amount_val, dr_amount_val);
        if (cr_amount_val != 0 && dr_amount_val != 0) {
            alert('Credit and Debit both should not be there!');
            return false;
        }
        if (cr_amount_val == 0 && dr_amount_val == 0) {
            return false;
        }
        if (!account_id.children("option:selected").val() || !sub_account_id.children("option:selected").val() || cr_amount_val < 0 || dr_amount_val < 0) {
            return false;
        }
        /*
        if (!sub_account_id.children("option:selected").val() || !receipt_amount.val() || receipt_amount.val() <= 0)
            return false;
        */
        var entryob = {
            account_id: account_id.children("option:selected").val(),
            account_name: account_name.val(),
            sub_account_id: sub_account_id.children("option:selected").val(),
            sub_account_name: sub_account_name.val(),
            cr_amount: cr_amount_val,
            dr_amount: dr_amount_val,
            narration: narration.val()
        }
        entries.push(entryob);
        lastindex++;
        var inhtml = `
            <tr id=`+ lastindex + `>
                <td>`+ lastindex + `</td>
                <td style="white-space: true;">${entryob.account_id}<br/>${entryob.account_name}</td>
                <td style="white-space: true;">${entryob.sub_account_id}<br/>${entryob.sub_account_name}</td>
                <td class="right-align">${parseFloat(entryob.cr_amount).toLocaleString('en-IN')}</td>
                <td class="right-align">${parseFloat(entryob.dr_amount).toLocaleString('en-IN')}</td>
                <td>${entryob.narration}</td>
                <td>
                    <span style="cursor: pointer; color: yellow;" onclick="editentry(`+ lastindex + `)"><i class="material-icons">&#xE254;</i></span>
                    <span style="cursor: pointer; color: red;" onclick="deleteentry(`+ lastindex + `)"><i class="material-icons">&#xE872;</i></span>
                </td>
                <input type="hidden" name="account_ids[${lastindex - 1}]" value="${entryob.account_id}">
                <input type="hidden" name="sub_account_ids[${lastindex - 1}]" value="${entryob.sub_account_id}">
                <input type="hidden" name="cr_amounts[${lastindex - 1}]" value="${entryob.cr_amount}">
                <input type="hidden" name="dr_amounts[${lastindex - 1}]" value="${entryob.dr_amount}">
                <input type="hidden" name="narrations[${lastindex - 1}]" value="${entryob.narration}">
            </tr>
        `;
        cr_total_gb += parseFloat(entryob.cr_amount);
        dr_total_gb += parseFloat(entryob.dr_amount);
        $("#cr_totalentry").html("&#8377; " + cr_total_gb.toLocaleString('en-IN'));
        $("#dr_totalentry").html("&#8377; " + dr_total_gb.toLocaleString('en-IN'));
        $("#addentryform select[name=account_id] option:first").attr('selected', true).change();
        account_name.val('');
        sub_account_name.val('');
        cr_amount.val('');
        dr_amount.val('');
        narration.val('');
        $("#entries").append(inhtml);
        $("#account_id_select").selectpicker('toggle');
    });

    $("#main-form").submit(function (e) {
        if ($("#entries td").length <= 1) {
            e.preventDefault();
            alert('Enter atleast two entry before submitting the form!');
        }
        else if (cr_total_gb != dr_total_gb) {
            e.preventDefault();
            alert('Credit Amount and Debit Amount should be same!');
        }
    });

});