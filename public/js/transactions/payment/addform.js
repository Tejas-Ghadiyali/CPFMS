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
            scounter = counter.toString();
            var inhtml = `
                <tr id="${scounter+"_first"}">
                    <td>${scounter}</td>
                    <td>${entryob.sub_account_id}</td>
                    <td colspan="6">${entryob.sub_account_name}</td>
                    <td></td>
                    <td rowspan="2">${entryob.narration}</td>
                    <td id="actions">
                        <span style="cursor: pointer; color: yellow;" onclick="editentry(${counter})"><i
                                class="material-icons">&#xE254;</i></span>
                        <span style="cursor: pointer; color: red;" onclick="deleteentry(${counter})"><i
                                class="material-icons">&#xE872;</i></span>
                    </td>
                </tr>
                <tr id="${scounter}">
                    <td></td>
                    <td></td>
                    <td>&#8377; ${parseFloat(entryob.cattle_feed).toLocaleString('en-IN')}</td>
                    <td>&#8377; ${parseFloat(entryob.mineral_mix).toLocaleString('en-IN')}</td>
                    <td>&#8377; ${parseFloat(entryob.pasu_posak).toLocaleString('en-IN')}</td>
                    <td>&#8377; ${parseFloat(entryob.insurance).toLocaleString('en-IN')}</td>
                    <td>&#8377; ${parseFloat(entryob.other).toLocaleString('en-IN')}</td>
                    <td>&#8377; ${parseFloat(entryob.other1).toLocaleString('en-IN')}</td>
                    <td class="right-align">&#8377; ${parseFloat(entryob.sub_total).toLocaleString('en-IN')}</td>
                    <td></td>
                    <input type="hidden" name="sub_account_ids[${i}]" value="${entryob.sub_account_id}">
                    <input type="hidden" name="narrations[${i}]" value="${entryob.narration}">
                    <input type="hidden" name="cattle_feeds[${i}]" value="${entryob.cattle_feed}">
                    <input type="hidden" name="mineral_mixs[${i}]" value="${entryob.mineral_mix}">
                    <input type="hidden" name="pasu_posaks[${i}]" value="${entryob.pasu_posak}">
                    <input type="hidden" name="insurances[${i}]" value="${entryob.insurance}">
                    <input type="hidden" name="others[${i}]" value="${entryob.other}">
                    <input type="hidden" name="other1s[${i}]" value="${entryob.other1}">
                </tr>
            `;
            total = total + parseFloat(entryob.sub_total);
            $("#entries").append(inhtml);
        }
        $("#totalentry").html("&#8377; " + total.toLocaleString('en-IN'));
        total_gb = total;
    }
}

function editentry(entryindex_1) {
    if (eflag)
        return false;
    eflag = true;

    entryindex = parseInt(entryindex_1);

    // Identify Row
    var edit_entry = entries[entryindex - 1];
    
    var row_first = $("#entries #" + entryindex + "_first");
    var row = $("#entries #" + entryindex);

    // Option Change
    var option_col_val = edit_entry["sub_account_id"], options = "";
    
    for (item of current_options) {
        options = options + `<option>${item}</option>`;
    }
    
    var sub_name_col_val = edit_entry["sub_account_name"];
    
    var inhtml1 = `
        <td>${entryindex}</td>
        <td>
            <select class="form-control selectpicker" data-live-search="true" data-dropup-auto="false" data-size="5" name="sub_account_id_copy" id="sub_account_id_select_copy" onchange="sub_optionchange(true)" required>
                ${options}
            </select>
        </td>
        <td colspan="6">
            <input type="text" name="sub_account_name_copy" id="sub_account_name_res_copy" style="text-align: center;" value="${sub_name_col_val}" disabled>
        </td>
        <td></td>
        <td rowspan="2"><textarea name="narration" id="narration_copy" cols="20" rows="4">${edit_entry.narration}</textarea></td>
        <td id="actions">
        </td>
    `;

    // Values Change
    inhtml2 = `
        <td></td>
        <td></td>
        <td><input type="number" min="0" step="0.01" name="cattle_feed_copy" id="cattle_feed_copy" class="right-align" value="${parseFloat(edit_entry.cattle_feed).toLocaleString('en-IN')}"></td>
        <td><input type="number" min="0" step="0.01" name="mineral_mix_copy" id="mineral_mix_copy" class="right-align" value="${parseFloat(edit_entry.mineral_mix).toLocaleString('en-IN')}"></td>
        <td><input type="number" min="0" step="0.01" name="pasu_posak_copy" id="pasu_posak_copy" class="right-align" value="${parseFloat(edit_entry.pasu_posak).toLocaleString('en-IN')}"></td>
        <td><input type="number" min="0" step="0.01" name="insurance_copy" id="insurance_copy" class="right-align" value="${parseFloat(edit_entry.insurance).toLocaleString('en-IN')}"></td>
        <td><input type="number" min="0" step="0.01" name="other_copy" id="other_copy" class="right-align" value="${parseFloat(edit_entry.other).toLocaleString('en-IN')}"></td>
        <td><input type="number" min="0" step="0.01" name="other1_copy" id="other1_copy" class="right-align" value="${parseFloat(edit_entry.other1).toLocaleString('en-IN')}"></td>
        <td id="entry_total_copy"></td>
        <td>
            <span style="cursor: pointer; color: green;" onclick="submit_editentry(${entryindex})">
                <i class="material-icons" style="transform: scale(2);" >&#xe834;</i>
            </span>
        </td>
    `;

    row_first.empty();
    row.empty();

    row_first.html(inhtml1)
    row.html(inhtml2);

    $("#sub_account_id_select_copy").selectpicker('refresh');
    $("#sub_account_id_select_copy").selectpicker('val', option_col_val);
    $("#sub_account_id_select_copy").selectpicker('toggle');

}

function submit_editentry(entryindex) {
    var row_first = $("#entries #" + entryindex + "_first");
    var row = $("#entries #" + entryindex);
    var entryob = {
        sub_account_id: $("#sub_account_id_select_copy").selectpicker('val'),
        sub_account_name: $("#sub_account_name_res_copy").val(),
        cattle_feed: $("#cattle_feed_copy").val(),
        mineral_mix: $("#mineral_mix_copy").val(),
        pasu_posak: $("#pasu_posak_copy").val(),
        insurance: $("#insurance_copy").val(),
        other: $("#other_copy").val(),
        other1: $("#other1_copy").val(),
        narration: $("#narration_copy").val()
    }
    if(entryob.cattle_feed < 0 || entryob.mineral_mix < 0 || entryob.pasu_posak < 0 || entryob.insurance < 0 || entryob.other < 0 || entryob.other1 < 0)
        return false;
    sub_total = parseFloat(entryob.cattle_feed) + parseFloat(entryob.mineral_mix) + parseFloat(entryob.pasu_posak) + parseFloat(entryob.insurance) + parseFloat(entryob.other) + parseFloat(entryob.other1);
    entryob.sub_total = sub_total;

    row_first.empty();
    row.empty();
    
    var inhtml1 = `
        <td>${entryindex}</td>
        <td>${entryob.sub_account_id}</td>
        <td colspan="6">${entryob.sub_account_name}</td>
        <td></td>
        <td rowspan="2">${entryob.narration}</td>
        <td id="actions">
            <span style="cursor: pointer; color: yellow;" onclick="editentry(${entryindex})"><i
                    class="material-icons">&#xE254;</i></span>
            <span style="cursor: pointer; color: red;" onclick="deleteentry(${entryindex})"><i
                    class="material-icons">&#xE872;</i></span>
        </td>
    `;
    var inhtml2 = `
        <td></td>
        <td></td>
        <td>&#8377; ${parseFloat(entryob.cattle_feed).toLocaleString('en-IN')}</td>
        <td>&#8377; ${parseFloat(entryob.mineral_mix).toLocaleString('en-IN')}</td>
        <td>&#8377; ${parseFloat(entryob.pasu_posak).toLocaleString('en-IN')}</td>
        <td>&#8377; ${parseFloat(entryob.insurance).toLocaleString('en-IN')}</td>
        <td>&#8377; ${parseFloat(entryob.other).toLocaleString('en-IN')}</td>
        <td>&#8377; ${parseFloat(entryob.other1).toLocaleString('en-IN')}</td>
        <td class="right-align">&#8377; ${parseFloat(entryob.sub_total).toLocaleString('en-IN')}</td>
        <td></td>
        <input type="hidden" name="sub_account_ids[${entryindex - 1}]" value="${entryob.sub_account_id}">
        <input type="hidden" name="narrations[${entryindex - 1}]" value="${entryob.narration}">
        <input type="hidden" name="cattle_feeds[${entryindex - 1}]" value="${entryob.cattle_feed}">
        <input type="hidden" name="mineral_mixs[${entryindex - 1}]" value="${entryob.mineral_mix}">
        <input type="hidden" name="pasu_posaks[${entryindex - 1}]" value="${entryob.pasu_posak}">
        <input type="hidden" name="insurances[${entryindex - 1}]" value="${entryob.insurance}">
        <input type="hidden" name="others[${entryindex - 1}]" value="${entryob.other}">
        <input type="hidden" name="other1s[${entryindex - 1}]" value="${entryob.other1}">
    `;

    row_first.html(inhtml1);
    row.html(inhtml2);

    total_gb = total_gb - parseFloat(entries[entryindex - 1]["sub_total"]) + parseFloat(entryob["sub_total"]);
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

    $("#account_id_select").selectpicker('toggle');

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
        var sub_account_id = $("#addentryform_first select[name=sub_account_id]");
        var sub_account_name = $("#addentryform_first input[name=sub_account_name]");
        var cattle_feed = $("#addentryform #cattle_feed");
        var mineral_mix = $("#addentryform #mineral_mix");
        var pasu_posak = $("#addentryform #pasu_posak");
        var insurance = $("#addentryform #insurance");
        var other = $("#addentryform #other");
        var other1 = $("#addentryform #other1");
        var sub_total = parseInt(cattle_feed.val()) + parseInt(mineral_mix.val()) + parseInt(pasu_posak.val()) + parseInt(insurance.val()) + parseInt(other.val()) + parseInt(other1.val());
        var narration = $("#addentryform_first textarea[name=narration]");
        if(cattle_feed.val() < 0 || mineral_mix.val() < 0 || pasu_posak.val() < 0 || insurance.val() < 0 || other.val() < 0 || other1.val() < 0)
            return false;
        if (!sub_account_id.children("option:selected").val())
            return false;
        var entryob = {
            sub_account_id: sub_account_id.children("option:selected").val(),
            sub_account_name: sub_account_name.val(),
            cattle_feed: cattle_feed.val(),
            mineral_mix: mineral_mix.val(),
            pasu_posak: pasu_posak.val(),
            insurance: insurance.val(),
            other: other.val(),
            other1: other1.val(),
            narration: narration.val(),
            sub_total: sub_total
        }
        entries.push(entryob);
        lastindex++;
        var inhtml = `
            <tr id="${lastindex+"_first"}">
                <td>${lastindex}</td>
                <td>${entryob.sub_account_id}</td>
                <td colspan="6">${entryob.sub_account_name}</td>
                <td></td>
                <td rowspan="2">${entryob.narration}</td>
                <td id="actions">
                    <span style="cursor: pointer; color: yellow;" onclick="editentry(${lastindex})"><i
                            class="material-icons">&#xE254;</i></span>
                    <span style="cursor: pointer; color: red;" onclick="deleteentry(${lastindex})"><i
                            class="material-icons">&#xE872;</i></span>
                </td>
            </tr>
            <tr id="${lastindex}">
                <td></td>
                <td></td>
                <td>&#8377; ${parseFloat(entryob.cattle_feed).toLocaleString('en-IN')}</td>
                <td>&#8377; ${parseFloat(entryob.mineral_mix).toLocaleString('en-IN')}</td>
                <td>&#8377; ${parseFloat(entryob.pasu_posak).toLocaleString('en-IN')}</td>
                <td>&#8377; ${parseFloat(entryob.insurance).toLocaleString('en-IN')}</td>
                <td>&#8377; ${parseFloat(entryob.other).toLocaleString('en-IN')}</td>
                <td>&#8377; ${parseFloat(entryob.other1).toLocaleString('en-IN')}</td>
                <td class="right-align">&#8377; ${parseFloat(entryob.sub_total).toLocaleString('en-IN')}</td>
                <td></td>
                <input type="hidden" name="sub_account_ids[${lastindex - 1}]" value="${entryob.sub_account_id}">
                <input type="hidden" name="narrations[${lastindex - 1}]" value="${entryob.narration}">
                <input type="hidden" name="cattle_feeds[${lastindex - 1}]" value="${entryob.cattle_feed}">
                <input type="hidden" name="mineral_mixs[${lastindex - 1}]" value="${entryob.mineral_mix}">
                <input type="hidden" name="pasu_posaks[${lastindex - 1}]" value="${entryob.pasu_posak}">
                <input type="hidden" name="insurances[${lastindex - 1}]" value="${entryob.insurance}">
                <input type="hidden" name="others[${lastindex - 1}]" value="${entryob.other}">
                <input type="hidden" name="other1s[${lastindex - 1}]" value="${entryob.other1}">
            </tr>
        `;
        total_gb = total_gb + parseFloat(entryob.sub_total);
        $("#totalentry").html("&#8377; " + total_gb.toLocaleString('en-IN'));
        $("#addentryform_first select[name=sub_account_id] option:first").attr('selected', true).change();
        cattle_feed.val('0');
        mineral_mix.val('0');
        pasu_posak.val('0');
        insurance.val('0');
        other.val('0');
        other1.val('0');
        narration.val('');
        $("#entries").append(inhtml);
        $("#sub_account_id_select").selectpicker('toggle');
    });

    $("#table_cheque_no input[name=cheque_no]").on('input', function () {
        var txt = "# Cheque No.: " + $(this).val();
        $("#table_narration textarea[name=acc_narration]").val(txt);
    });

    $("#main-form").submit(function (e) {
        if ($("#entries td").length <= 0) {
            e.preventDefault();
            alert('Enter atleast one entry before submitting the form!');
        }
    });

});