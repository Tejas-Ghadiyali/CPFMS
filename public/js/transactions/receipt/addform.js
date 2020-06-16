var entries = [];
var maindata = {
    document_number: null,

}
var lastindex = 0;
var total = 0.00;
var accid = '';
var eflag = false;

function fillallentries(index) {
    if (entries.length === 0) {
        $("#entries").empty();
        $("#totalentry").empty();
    }
    else {
        total = 0.00;
        $("#entries").empty();
        var counter = index || 0;
        var start = index || 0, entryob, i;
        for (i = start; i < entries.length; i++) {
            entryob = entries[i];
            counter++;
            var inhtml = `
                <tr id=`+ counter + `>
                    <td>`+ counter + `</td>
                    <td>`+ entryob.sub_account_id + `</td>
                    <td class="left-align">`+ entryob.sub_account_name + `</td>
                    <td class="right-align">&#8377; `+ parseFloat(entryob.receipt_amount).toLocaleString('en-IN') + `</td>
                    <td>`+ entryob.narration + `</td>
                    <td>
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
    }
}

function editentry(entryindex) {
    if(eflag)
        return false;
    eflag = true
    var entry = entries[entryindex - 1];
    var row = $("#entries #"+entryindex);
    var option_col = row.children("td:eq(1)");
    var option_col_val = option_col.val();
    var inhtml = `
    <select class="form-control selectpicker" data-live-search="true" data-size="5" name="sub_account_id_copy" id="sub_account_id_select_copy" required>
    </select>
    `;
    console.log(inhtml);
    option_col.html(inhtml);
    $("#sub_account_id_select_copy").selectpicker('refresh');
    $(".select").selectpicker('refresh');
    eflag = false;
}

function optionchange() {
    $.ajax({
        url: '/api/transaction/account_details/' + $("#account_id_select").children("option:selected").val(),
        success: function (res) {
            if (res.status === true) {
                $("#account_name_res").val(res.account_name);
                var select_ele = $("#sub_account_id_select"), inhtml, inhtml_1, options = "";
                select_ele.empty();
                select_ele.selectpicker('refresh');
                for (sid of res.sub_account_id) {
                    options = options + "<option>" + sid.sub_account_id + "</option>";
                }
                $(select_ele).append(options);
                $(select_ele).selectpicker('refresh');
                sub_optionchange();
            }
            else {
                $("#sub_account_id_select").empty();
                $("#sub_account_id_select").selectpicker('refresh');
                $("#account_name_res").val("--------NO NAME FOUND--------");
                $("#sub_account_name_res").val("--------NO NAME FOUND--------");
            }
        }
    });
}

function sub_optionchange() {
    if ($("#sub_account_id_select").children("option").length > 0) {
        $.ajax({
            url: '/api/transaction/membername/' + $("#sub_account_id_select").children("option:selected").val(),
            success: function (res) {
                if (res.status === true)
                    $("#sub_account_name_res").val(res.data.sub_account_name);
                else
                    $("#sub_account_name_res").val("--------NO NAME FOUND--------");
            }
        });
    }
    else {
        $("#sub_account_name_res").val("--------NO NAME FOUND--------");
    }
}

function fillmainparameters() {
}

function savemainparameters() {
}

function restoremainparameters() {
}

$(document).ready(function () {

    $("#table_receipt_number input[name=receipt_number]").focus();

    accid = $("#account_id_select").children("option:selected").val();

    if (localStorage.getItem('savedEntries')) {
        entries = JSON.parse(localStorage.getItem('savedEntries'));
        fillallentries();
    }

    optionchange();

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

    $("#clearentry").click(function (e) {
        entries = [];
        total = 0.00;
        fillallentries();
    });

    $("#account_id_select").on("change", function () {
        if ($("#entries").children("tr").length > 0) {
            var flag = confirm("Do you want to change Society ID ?\n All the entries listed below will be deleted..");
            if (flag == true) {
                accid = $(this).val();
                $("#entries").empty();
                $("#totalentry").empty();
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
                <td>
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
        total = total + parseFloat(entryob.receipt_amount);
        $("#totalentry").html("&#8377; " + total.toLocaleString('en-IN'));
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

});