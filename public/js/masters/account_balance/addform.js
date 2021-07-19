$(document).ready(function () {

    $(".loading").hide();

    // Account Head Detail Fetch
    $("form table select[name=account_id]").on('change', function () {
        var id = this.value;
        if (id === "--SELECT--")
            return;
        var url = window.location.href;
        var arr = url.split("/");
        var req_url = arr[0] + "//" + arr[2] + "/api/master/accounthead/" + id;
        $.ajax({
            url: req_url,
            success: function (res) {
                if (res.status === true) {
                    $("form table input[name=account_name]").val(res.data.account_name);
                    $("form table input[name=village_name]").val(res.data.village_name);
                    $("form table input[name=taluka_name]").val(res.data.taluka_name);
                    $("form table input[name=district_name]").val(res.data.district_name);
                    if(res.sub_account_list.length > 0) {
                        sa_arr = []
                        for(sa of res.sub_account_list) {
                            sa_arr.push(sa.sid);
                        }
                        sa_str = sa_arr.join("&#13;&#10;");
                        last_id = sa_arr[0];
                        $("form table textarea[name=sub_account_list]").html(sa_str);
                        $("form table input[name=sub_account_last_id]").val(last_id);
                    }
                    else {
                        $("form table textarea[name=sub_account_list]").val("--NOT AVAILABLE--");
                        $("form table input[name=sub_account_last_id]").val("--NOT AVAILABLE--");
                    }
                }
                else {
                    alert("Unable to fatch data of selected Society !");
                    $("form table input[name=account_name]").val("--NOT AVAILABLE--");
                    $("form table input[name=village_name]").val("--NOT AVAILABLE--");
                    $("form table input[name=taluka_name]").val("--NOT AVAILABLE--");
                    $("form table input[name=district_name]").val("--NOT AVAILABLE--");
                    $("form table textarea[name=sub_account_list]").val("--NOT AVAILABLE--");
                    $("form table input[name=sub_account_last_id]").val("--NOT AVAILABLE--");
                }
            }
        });
    });

    /*
    // Sub Account Detail Fetch
    $("form table select[name=sub_account_id]").on('change', function () {
        var id = this.value;
        if (id === "--SELECT--")
            return;
        var url = window.location.href;
        var arr = url.split("/");
        var req_url = arr[0] + "//" + arr[2] + "/api/master/subaccount/" + id;
        $.ajax({
            url: req_url,
            success: function (res) {
                if (res.status === true) {
                    $("form table input[name=sub_account_name]").val(res.data.sub_account_name);
                    $("form table textarea[name=sub_account_address]").val(res.data.sub_account_address);
                }
                else {
                    alert("Unable to fatch data of selected Member !");
                    $("form table input[name=sub_account_name]").val("--NOT AVAILABLE--");
                    $("form table textarea[name=sub_account_address]").val("--NOT AVAILABLE--");
                }
            }
        });
    });
    */

    // Organization Name Fill
    $("form table select[name=organization_id]").on('change', function () {
        var string = $(this).children("option:selected").data('tokens');
        var arr = string.split(';');
        $("form table input[name=organization_name]").val(arr[1]);
    });

    // Resource Person Name Fill
    $("form table select[name=resource_person_id]").on('change', function () {
        var string = $(this).children("option:selected").data('tokens');
        var arr = string.split(';');
        $("form table input[name=resource_person_name]").val(arr[1]);
    });

    // Cow Cast Name Fill
    $("form table select[name=cow_cast_id]").on('change', function () {
        var string = $(this).children("option:selected").data('tokens');
        var arr = string.split(';');
        $("form table input[name=cow_cast_name]").val(arr[1]);
    });

});