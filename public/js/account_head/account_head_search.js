$(document).ready(function () {

    var data = <%- JSON.stringify(data) %>;
    var entries_per_page = 25;
    var pagenum = 1;
    var totalentries = data.length;
    var totalpages = Math.ceil(totalentries / entries_per_page);
    var inhtml, item;
    for (var i = 0; i < entries_per_page && i < totalentries; ++i) {
        item = data[i];
        inhtml = `
            <tr id="`+ item.account_id + `">
                <td>
                    <span class="custom-checkbox">
                        <input type="checkbox" id="`+ item.account_id + `">
                        <label for="`+ item.account_id + `"></label>
                    </span>
                </td>
                <td>`+ item.account_id + `</td>
                <td>`+ item.account_name + `</td>
                <td>`+ item.account_type + `</td>
                <td>`+ item.village_id + `</td>
                <td>
                    `+ (item.is_society ? "Yes" : "No") + `
                </td>
                <td>
                    <a href="#editEmployeeModal" class="edit" data-toggle="modal" id="`+ item.account_id + `"><i
                            class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>
                    <a href="#deleteEmployeeModal" class="delete" data-toggle="modal"
                        id="`+ item.account_id + `"><i class="material-icons" data-toggle="tooltip"
                            title="Delete">&#xE872;</i></a>
                </td>
            </tr>
            `;
        $("table #search-rows").append(inhtml);
    }

    // Hint-text in clearfix
    if (totalentries == 0) {
        inhtml = `<b>No entry found.</b>`;
    }
    else {
        inhtml = `Showing entries from <b>1</b> to <b>` + Math.min(entries_per_page, totalentries) + `</b> out of <b>` + totalentries + `</b> entries`;
    }
    $(".clearfix .hint-text").append(inhtml);

    // Pagination Initial Setup
    function initial_pagination_setup() {
        if (totalentries !== 0) {
            inhtml = `
            <span id="pagination-pre">                 
                <span class="a a-disabled" id="first">
                    <i class="material-icons">&#xe045;</i>
                </span>
                <span class="a a-disabled" id="previous">
                    <i class="material-icons flip-to-left one-change">&#xe037;</i>
                </span>
            </span>
            <input type="number" name="pagenum" id="pageno" min="1" max="`+ totalpages + `" style="text-align: center;" value="` + pagenum + `"> / ` + totalpages;
            if (totalpages == 1) {
                inhtml = inhtml + `
                <span id="pagination-next">
                    <span class="a a-disabled" id="next">
                        <i class="material-icons one-change">&#xe037;</i>
                    </span>
                    <span class="a a-disabled" id="last">
                        <i class="material-icons">&#xe044;</i>
                    </span>
                </span>
                `;
            }
            else {
                inhtml = inhtml + `
                <span id="pagination-next">
                    <span class="a" id="next" onclick="changepage(3)">
                        <i class="material-icons one-change">&#xe037;</i>
                    </span>
                    <span class="a" id="last" onclick="changepage(4)">
                        <i class="material-icons">&#xe044;</i>
                    </span>
                </span>
                `;
            }
            $(".pagination .page-link").append(inhtml);
        }
    }
     
    initial_pagination_setup();

    // Entry Per Page Handler
    $("table #entryid").change(function () {
        entries_per_page = parseInt($(this).children("option:selected").val());
        var ending = Math.min(entries_per_page, totalentries);
        $("table #search-rows").empty();
        for (var i = 0; i < ending; ++i) {
            item = data[i];
            inhtml = `
                <tr id="`+ item.account_id + `">
                    <td>
                        <span class="custom-checkbox">
                            <input type="checkbox" id="`+ item.account_id + `">
                            <label for="`+ item.account_id + `"></label>
                        </span>
                    </td>
                    <td>`+ item.account_id + `</td>
                    <td>`+ item.account_name + `</td>
                    <td>`+ item.account_type + `</td>
                    <td>`+ item.village_id + `</td>
                    <td>
                        `+ (item.is_society ? "Yes" : "No") + `
                    </td>
                    <td>
                        <a href="#editEmployeeModal" class="edit" data-toggle="modal" id="`+ item.account_id + `"><i
                                class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>
                        <a href="#deleteEmployeeModal" class="delete" data-toggle="modal"
                            id="`+ item.account_id + `"><i class="material-icons" data-toggle="tooltip"
                                title="Delete">&#xE872;</i></a>
                    </td>
                </tr>
                `;
            $("table #search-rows").append(inhtml);
        }
        if (totalentries == 0) {
            inhtml = `<b>No entry found.</b>`;
        }
        else {
            inhtml = `Showing entries from <b>` + 1 + `</b> to <b>` + ending + `</b> out of <b>` + totalentries + `</b> entries`;
        }
        $(".clearfix .hint-text").empty();
        $(".clearfix .hint-text").append(inhtml);
        $(".clearfix .page-link").empty();
        initial_pagination_setup();
    });

    // Pagination Handler
    function changepage(inum) {
        if (inum == 1) {
            if (pagenum <= 1) {
                pagenum = 1;
                return false;
            }
            pagenum = 1;
        }
        else if (inum == 2) {
            if (pagenum <= 1) {
                pagenum = 1;
                return false;
            }
            pagenum = pagenum - 1;
        }
        else if (inum == 3) {
            if (pagenum >= totalpages) {
                pagenum = totalpages;
                return false;
            }
            pagenum = pagenum + 1;
        }
        else {
            if (pagenum >= totalpages) {
                pagenum = totalpages;
                return false;
            }
            pagenum = totalpages;
        }
        var starting = (pagenum - 1) * entries_per_page;
        var ending = starting + Math.min(entries_per_page, totalentries - starting);
        $("table #search-rows").empty();
        for (var i = starting; i < ending; ++i) {
            item = data[i];
            inhtml = `
                <tr id="`+ item.account_id + `">
                    <td>
                        <span class="custom-checkbox">
                            <input type="checkbox" id="`+ item.account_id + `">
                            <label for="`+ item.account_id + `"></label>
                        </span>
                    </td>
                    <td>`+ item.account_id + `</td>
                    <td>`+ item.account_name + `</td>
                    <td>`+ item.account_type + `</td>
                    <td>`+ item.village_id + `</td>
                    <td>
                        `+ (item.is_society ? "Yes" : "No") + `
                    </td>
                    <td>
                        <a href="#editEmployeeModal" class="edit" data-toggle="modal" id="`+ item.account_id + `"><i
                                class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>
                        <a href="#deleteEmployeeModal" class="delete" data-toggle="modal"
                            id="`+ item.account_id + `"><i class="material-icons" data-toggle="tooltip"
                                title="Delete">&#xE872;</i></a>
                    </td>
                </tr>
                `;
            $("table #search-rows").append(inhtml);
        }
        $(".clearfix .page-link").empty();
        if (totalentries !== 0) {
            if (pagenum == 1) {
                inhtml = `
                    <span id="pagination-pre">                 
                        <span class="a a-disabled" id="first">
                            <i class="material-icons">&#xe045;</i>
                        </span>
                        <span class="a a-disabled" id="previous">
                            <i class="material-icons flip-to-left one-change">&#xe037;</i>
                        </span>
                    </span>
                    <input type="number" name="pagenum" id="pageno" min="1" max="`+ totalpages + `" style="text-align: center;" value="` + pagenum + `"> / ` + totalpages;
            }
            else {
                inhtml = `
                    <span id="pagination-pre">                 
                        <span class="a" id="first" onclick="changepage(1)">
                            <i class="material-icons">&#xe045;</i>
                        </span>
                        <span class="a a-disabled" id="previous" onclick="changepage(2)">
                            <i class="material-icons flip-to-left one-change">&#xe037;</i>
                        </span>
                    </span>
                    <input type="number" name="pagenum" id="pageno" min="1" max="`+ totalpages + `" style="text-align: center;" value="` + pagenum + `"> / ` + totalpages;
            }
            if (totalpages == 1) {
                inhtml = inhtml + `
                    <span id="pagination-next">
                        <span class="a a-disabled" id="next">
                            <i class="material-icons one-change">&#xe037;</i>
                        </span>
                        <span class="a a-disabled" id="last">
                            <i class="material-icons">&#xe044;</i>
                        </span>
                    </span>
                    `;
            }
            else {
                inhtml = inhtml + `
                    <span id="pagination-next">
                        <span class="a" id="next" onclick="changepage(3)">
                            <i class="material-icons one-change">&#xe037;</i>
                        </span>
                        <span class="a" id="last" onclick="changepage(4)">
                            <i class="material-icons">&#xe044;</i>
                        </span>
                    </span>
                    `;
            }
            $(".pagination .page-link").append(inhtml);
        }
        if (totalentries == 0) {
            inhtml = `<b>No entry found.</b>`;
        }
        else {
            inhtml = `Showing entries from <b>` + (starting+1) + `</b> to <b>` + ending + `</b> out of <b>` + totalentries + `</b> entries`;
        }
        $(".clearfix .hint-text").empty();
        $(".clearfix .hint-text").append(inhtml);
    }

});