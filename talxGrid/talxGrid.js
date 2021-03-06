/**
 * @author nathan
 */
$.widget('namespace.talxGrid', {
    options: {
        advancedSearchCriteria: null,
        advancedSearchHelper: null,
        version: "0.0.5",
        dateFormat: "m/d/yyyy",
        pageSize: 10,
        maxSearchItems: 5,
        pageSizeOptions: [10, 25, 50, 100],
        data: [],
        noDataMessage: "",
        showPageSizer: true,
        showRowCounter: true,
        showFilter: true,
        showFirstLast: false,
        showPrevNext: true,
        firstText: "&lt;&lt;",
        lastText: "&gt;&gt;",
        prevText: "&lt;",
        nextText: "&gt;",
        showPageNumbers: true,
        showResetAsButton: false,
        showPagerAsButtons: false,
        maxPagesOnPager: 10,
        showPagerEllipsis: false,
        showSearchLabel: true,
        advancedSearchAsButton: false
    },
    _self: this,
    _sort: 0,
    _sortAsc: true,
    _currentPage: 0,
    _filterField: null,
    _filterMatch: null,
    _filterContains: null,
    _filterOnMatch: true,
    _useDateFormat: false,

    _btnSearch: null,
    _ddlSearch: null,
    _txtSearch: null,
    _ddlItemsPerPage: null,
    _btnReset: null,
    _ddlColSelect: null,
    _rowCounter: null,
    _pager: null,
    _pageSizer: null,
    _filter: null,
    _advSearch: null,

    _activeData: null,
    _data: function (data) {
        if (data == undefined) {
            return this._activeData || (this._activeData = this.options.data);
        } else {
            this._activeData = data;
        }
    },
    _filterSortData: function (fld, match, contains) {
        var data = this.options.data;
        var _self = this;
        var fld = this._filterField;
        var match = this._filterMatch;
        var contains = this._filterContains;

        // filter the data
        if (this.options.advancedSearchHelper != null && this.options.advancedSearchCriteria != null) {
            data = this.options.advancedSearchHelper(data, this.options.advancedSearchCriteria);
        } else if (fld != null && (match != null || contains != null)) {
            var x = data.filter(function (item) {
                var val = '' + item[fld];
                var ret = false;
                if (val.length > 5 && val.substr(0, 5) == '/Date') {
                    val = _self._getDate(val, true);
                }
                val = val.toLowerCase();
                if (match != undefined && match != null) {
                    var m = match.toLowerCase();
                    ret = val == m;
                } else {
                    var c = contains.toLowerCase();
                    ret = (val.indexOf(c) > -1);
                }
                return ret;
            });
            data = x;
        }

        data.sort(function (a, b) {
            return _self._sortRows(a, b);
        });

        this._data(data);
    },
    /*
    * Filtering means, we need to know the filtered row count, and get a filter page
    * Is this a filter enumerator, or do we immediately just do the filter of data?
    * Let's go easy code route - filter of data - might have perf problems
    */
    _totalRows: function () {
        return this._data().length;
    },
    _init: function () {
        var tmpDate = new Date();
        this._useDateFormat = (tmpDate.format != undefined);

        var headers = this.options.columns;
        var cols = headers.length;
        var colOptions = "<div class='ui-talxGrid ui-widget ui-widget-content'>";
        colOptions += "<span class='ui-talxGrid-filter'><label for='colSelect'"+(this.options.showSearchLabel ? "" : " style='display: none;'")+">Search:</label>";
        colOptions += "<select name='colSelect'><option value=''>Select Column</option>";
        var tbl = "<span class='ui-talxGrid-pageSizer'><label for='itemsPerPage'>View:</label> <select name='itemsPerPage'>";
        for (var i = 0; i < this.options.pageSizeOptions.length; i++) {
            tbl += "<option value='" + this.options.pageSizeOptions[i] + "'" + (this.options.pageSize == this.options.pageSizeOptions[i] ? "selected='selected'" : "") + ">" + this.options.pageSizeOptions[i] + " at a time</option>";
        }
        tbl += "</select></span>";
        tbl += "<table class='ui-widget-content'><thead><tr>";
        var _self = this;
        for (var i = 0; i < cols; i++) {
            var allowSort = (headers[i].allowSort != undefined ? headers[i].allowSort : true);
            var tdClass = (headers[i].tdClass != null ? " " + headers[i].tdClass : "");
            tbl += "<th class='ui-state-default" + (allowSort ? " ui-talxGrid-sort" : " ui-talxGrid-nosort") + tdClass + "' rel='" + i + "'"
                + (headers[i].width != undefined ? " width='" + headers[i].width + "'" : "") + ">"
                + "<span></span> " + headers[i].header + "</th>";
            var allowFilter = (headers[i].allowFilter != undefined ? headers[i].allowFilter : true);
            if (allowFilter) {
                colOptions += "<option value='" + i + "'>" + headers[i].header + "</option>";
            }
        }
        colOptions += "</select> <input type='text' name='txtSearch' class='ui-state-disabled' disabled='disabled' style='display:none;' /><select name='ddlSearch' class='ui-state-disabled' disabled='disabled' style='display: none;'></select> ";
        colOptions += "<button name='btnSearch' >Search</button> ";
        colOptions += (this.options.showResetAsButton ? "<button name='reset' class='ui-talxGrid-reset'>Reset</button>" : "<a href='#' name='reset' class='ui-talxGrid-reset'>Reset</a>") + "</span>";
        tbl += "</tr></thead><tbody>";
        var tblBottom = "</tbody></table><div><span class='ui-talxGrid-rowCounter'>Showing #-# of #</span><span class='ui-talxGrid-pager'><button>1</button><button>2</button></span></div><br style='clear: both;'/></div>";
        tbl = colOptions + tbl + tblBottom;
        this.element.html(tbl);

        $("button", this.element).button();
        var ths = $("th.ui-talxGrid-sort", this.element);
        ths.live('click', function () { _self._onSort($(this)); });
        ths.hover(function () { $(this).addClass('ui-state-hover'); }, function () { $(this).removeClass('ui-state-hover'); });

        this._btnSearch = $('button[name=btnSearch]', this.element);
        this._btnSearch.button('disable');
        this._ddlSearch = $('select[name=ddlSearch]', this.element);
        this._txtSearch = $('input[name=txtSearch]', this.element);
        this._btnReset = $('[name=reset]', this.element);
        this._ddlItemsPerPage = $('select[name=itemsPerPage]', this.element);
        this._ddlColSelect = $('select[name=colSelect]', this.element);
        this._rowCounter = $('span.ui-talxGrid-rowCounter', this.element);
        this._pager = $('span.ui-talxGrid-pager', this.element);
        this._filter = $('span.ui-talxGrid-filter', this.element);
        this._pageSizer = $('span.ui-talxGrid-pageSizer', this.element);

        if (this.options.advancedSearchHelper != null) {
            this._addAdvSearch();
        }

        $('select[name=itemsPerPage]', this.element).live('change', function () { _self._onPageSizeChange($(this)); });
        $('select[name=colSelect]', this.element).live('change', function () { _self._onColumnSearchChange($(this)); });
        $('.ui-talxGrid-pager button', this.element).live('click', function () { _self._onPageChange($(this)); return false; });
        $('.ui-talxGrid-pager a', this.element).live('click', function () { _self._onPageChange($(this)); return false; });
        $('button[name=btnSearch]', this.element).live('click', function () { _self._onSearch(); return false; });
        $('[name=reset]', this.element).live('click', function () { _self._onReset(); return false; });
        $('th.ui-talxGrid-sort', this.element).live('mouseenter', function () { $(this).addClass('ui-state-hover'); })
        $('th.ui-talxGrid-sort', this.element).live('mouseleave', function () { $(this).removeClass('ui-state-hover'); })
        $('[name=btnAdvancedSearch]', this.element).live('click', function () { return _self._onAdvSearchClick(); });
        this._txtSearch.live("keypress", function (e) {
            if (e.keyCode == 13) {
                _self._btnSearch.click();
                return false;
            }
        });

        if (!this.options.showRowCounter) this._rowCounter.hide();
        if (!this.options.showFilter) this._filter.hide();
        if (!this.options.showPageSizer) this._pageSizer.hide();

        if (this.options.advancedSearchCriteria != null && $.isFunction(this.options.advancedSearchHelper)){
            this._onSearch();
        }else{
            this._updatePager();
            this._getPage();
        }
    },
    _addAdvSearch: function () {
        var ctrlText = (this.options.advancedSearchAsButton ? "<button name='btnAdvancedSearch' class='ui-talxGrid-advSearch'>Advanced Search</button> " : "<a href='#' name='btnAdvancedSearch' class='ui-talxGrid-advSearch'>Advanced Search</a> ")
        this._advSearch = (this._advSearch != null ? this._advSearch
            : $(ctrlText));
        this._btnSearch.after(this._advSearch);
    },
    _removeAdvSearch: function () {
        this._advSearch.remove();
        this._advSearch = null;
    },
    _onAdvSearchClick: function () {
        this.element.trigger('talxgridadvancedsearch');
        return false;
    },
    _onSearch: function () {
        var fld = null;
        var col = parseInt(this._ddlColSelect.val() || -1);
        if (col > -1) {
            fld = this.options.columns[col].displayField;
        }
        this._filterField = fld;
        this._filterMatch = (this._filterOnMatch ? this._ddlSearch.val() : null);
        this._filterContains = (this._filterOnMatch ? null : this._txtSearch.val());
        this._filterSortData();
        this._updatePager();
        this._getPage();
    },
    _onReset: function () {
        this.options.advancedSearchCriteria = null;
        this._ddlColSelect.val("");
        this._onColumnSearchChange(this._ddlColSelect);
        this._onSearch();
    },
    _onColumnSearchChange: function (ddl) {
        var colNum = ddl.val();
        var txtSrch = this._txtSearch;
        var ddlSrch = this._ddlSearch;

        if (colNum != "") {
            var optionList = new Array;
            var fld = this.options.columns[colNum].displayField;
            var data = this.options.data;
            var allowFilterSelect = (this.options.columns[colNum].allowFilterSelect != undefined ? this.options.columns[colNum].allowFilterSelect : true);
            var fieldType = this.options.columns[colNum].dataType != undefined ? this.options.columns[colNum].dataType : "string";
            var uniqueCount = 0;

            if (allowFilterSelect) {
                for (var i = 0; i < data.length; i++) {
                    var colVal = data[i][fld];
                    if (fieldType == "date") {
                        if (colVal.length > 5 && colVal.substr(0, 5) == '/Date') {
                            colVal = this._getDate(colVal, true);
                        }
                    }
                    optionList.push(colVal);

                }
                optionList = optionList.unique();
                optionList.sort();

                uniqueCount = optionList.length;
            }
            if (uniqueCount > 0 && uniqueCount <= this.options.maxSearchItems) {
                this._filterOnMatch = true;
                var ops = "<option>Select One</option>";
                for (i = 0; i < uniqueCount; i++) {
                    ops += "<option value='" + optionList[i] + "'>" + optionList[i] + "</option>";
                }
                ddlSrch.html(ops);
                txtSrch.hide().attr("disabled", "disabled").addClass("ui-state-disabled");
                ddlSrch.removeAttr('disabled').val("").removeClass('ui-state-disabled').show().focus();
                this._btnSearch.button('enable');
            } else {
                this._filterOnMatch = false;
                ddlSrch.hide().attr("disabled", "disabled").addClass("ui-state-disabled");
                txtSrch.removeAttr('disabled').val("").removeClass('ui-state-disabled').show().focus();
                this._btnSearch.button('enable');
            }
        } else {
            ddlSrch.hide().html("");
            txtSrch.show().val("").addClass('ui-state-disabled').attr('disabled', 'disabled').hide();
            this._btnSearch.button('disable');
            this._onSearch();
        }
    },
    _onPageChange: function (btn) {
        var disabled = btn.attr('disabled') || "";
        if (disabled == "") {
            var newPage = (this.options.showPagerAsButtons ? btn.val() : btn.attr('rel'));
            this.pageIndex(newPage);
        }
    },
    _onPageSizeChange: function (ddl) {
        this.options.pageSize = parseInt(ddl.val(), 10);
        this._updatePager();
        this._getPage();
    },
    _onSort: function (headerItem) {
        var newSort = headerItem.attr('rel');
        this._sortAsc = (newSort == this._sort ? !this._sortAsc : true);
        this._sort = newSort;
        $('th span', this.element).removeClass('ui-icon').removeClass('ui-talxGrid-asc').removeClass('ui-talxGrid-desc');
        $('span', headerItem).addClass((this._sortAsc ? 'ui-icon ui-talxGrid-asc' : 'ui-icon ui-talxGrid-desc'));
        this._filterSortData();
        this._getPage();
    },
    _updatePager: function () {
        var allowedPages = (this.options.maxPagesOnPager - 1);
        var pagesBefore = Math.floor((allowedPages) / 2);
        var pagesAfter = Math.ceil((allowedPages) / 2);
        var pages = "";
        var data = this._data();
        var rows = data.length;
        var maxPages = Math.floor(rows / this.options.pageSize) + (rows % this.options.pageSize == 0 ? 0 : 1) - 1;
        maxPages = (maxPages < 0 ? 0 : maxPages);
        this._currentPage = (this._currentPage > maxPages ? maxPages : (this._currentPage < 0 ? 0 : this._currentPage));
        var start = 0;
        var end = maxPages;

        if (end > (allowedPages + 1)) {
            if (this._currentPage + pagesAfter >= end) {
                // figure beginning
                start = end - allowedPages;
            } else if (this._currentPage < pagesBefore) {
                // figure ending
                end = start + allowedPages;
            } else {
                start = this._currentPage - pagesBefore;
                end = this._currentPage + pagesAfter;
            }
        }

        if (this.options.showFirstLast && this._currentPage > 0) {
            pages += (this.options.showPagerAsButtons ? "<button value='0'" + (this._currentPage == 0 ? " disabled='disabled'" : "") + ">" + this.options.firstText + "</button>"
                    : (this._currentPage == 0 ? "<span class='ui-talxGrid-pagerPage-disabled'>" + this.options.firstText + "</span>&nbsp;" : "<a href='#' rel='0'>" + this.options.firstText + "</a>&nbsp;"));
        }
        if (this.options.showPrevNext && this._currentPage > 0) {
            pages += (this.options.showPagerAsButtons ? "<button value='" + (this._currentPage - 1) + "'>" + this.options.prevText + "</button>"
                    : "<a href='#' rel='" + (this._currentPage - 1) + "'>" + this.options.prevText + "</a>");
        }
        if (this.options.showPagerEllipsis && (start > 0)) {
            pages += "<span class='ui-talxGrid-ellipsis'>&hellip;</span>";
        }
        if (this.options.showPageNumbers) {
            for (var i = start; i <= end; i++) {
                pages += (this.options.showPagerAsButtons ? "<button value='" + i + "'" + (i == this._currentPage ? " disabled='disabled'" : "") + ">" + (i + 1) + "</button>"
                    : (i == this._currentPage ? "<span class='ui-talxGrid-pagerPage-disabled'>" + (i + 1) + "</span>" : "<a href='#' rel='" + i + "'>" + (i + 1) + "</a>"));
            }
        }
        if (this.options.showPagerEllipsis && (end < maxPages)) {
            pages += "<span class='ui-talxGrid-ellipsis'>&hellip;</span>";
        }
        if (this.options.showPrevNext && this._currentPage < end) {
            pages += (this.options.showPagerAsButtons ? "<button value='" + (this._currentPage + 1) + "'>" + this.options.nextText + "</button>"
                    : "<a href='#' rel='" + (this._currentPage + 1) + "'>" + this.options.nextText + "</a>");
        }
        if (this.options.showFirstLast && this._currentPage < end) {
            pages += (this.options.showPagerAsButtons ? "<button value='" + maxPages + "'" + (this._currentPage == end ? " disabled='disabled'" : "") + ">" + this.options.lastText + "</button>"
                    : (this._currentPage == end ? "&nbsp;<span class='ui-talxGrid-pagerPage-disabled'>" + this.options.lastText + "</span>" : "&nbsp;<a href='#' rel='" + maxPages + "'>" + this.options.lastText + "</a>"));
        }
        this._pager.html(pages);
        $("button", this._pager).button();

    },
    _updateRowCounter: function () {
        var rowCounter = this._rowCounter;
        var start = (this._currentPage * this.options.pageSize) + 1;
        if (start > this._totalRows()) start = this._totalRows();
        var end = Math.min(start + this.options.pageSize - 1, this._totalRows());
        rowCounter.html('Showing ' + start + '-' + end + ' of ' + this._totalRows());
    },
    _getPage: function () {
        var headers = this.options.columns;
        var cols = headers.length;
        var data = this._data();
        var rows = this._totalRows();
        var maxPages = Math.floor(rows / this.options.pageSize) + (rows % this.options.pageSize == 0 ? 0 : 1) - 1;
        maxPages = (maxPages < 0 ? 0 : maxPages);
        this._currentPage = (this._currentPage > maxPages ? maxPages : this._currentPage);
        var rr = "";
        var begin = 0;
        var end = rows;

        begin = this.options.pageSize * this._currentPage;
        end = begin + this.options.pageSize;
        begin = (begin < 0 ? 0 : begin);
        end = (end > rows ? rows : end);
        var _self = this;

        for (var j = begin; j < end; j++) {
            rr += "<tr" + (j % 2 == 0 ? "" : " class='ui-talxGrid-altRow'") + ">";
            for (var k = 0; k < cols; k++) {
                var dataType = (headers[k].dataType != undefined ? headers[k].dataType : "string");
                var displayFormat = (headers[k].displayMask != undefined ? headers[k].displayMask : "{0}");
                var dField = headers[k].displayField.split('.');
                var colVal = data[j][dField[0]];
                for (var i = 1; i < dField.length && colVal != undefined; i++) {
                    colVal = colVal[dField[i]];
                }
                if (dataType == "date") {
                    colVal = this._getDate(colVal, true);
                } else {
                    colVal = colVal || "";
                    colVal = ($.isFunction(colVal.htmlEncode) ? colVal.htmlEncode() : colVal);
                }
                var info = displayFormat.format(colVal, j);
                if (headers[k].width != undefined) {
                    info = "<span class='ui-talxGrid-width' style='width: " + headers[k].width + "' title='" + this._makeJavascriptSafe(info) + "'>" + info + "</span>";
                }
                var linkField = (headers[k].linkField != undefined ? headers[k].linkField : null);
                if (linkField != null) {
                    var lField = linkField.split('.');
                    var lVal = data[j][lField[0]];
                    for (var f = 1; f < lField.length && lVal != undefined; f++) {
                        lVal = lVal[lField[f]];
                    }
                    lVal = encodeURI(lVal);
                    var linkMask = (headers[k].linkMask != undefined ? headers[k].linkMask : "{1}");
                    info = linkMask.format(lVal, info, j);
                }
                var colClass = (headers[k].tdClass != undefined ? headers[k].tdClass : "");
                rr += "<td class='ui-widget-content" + (dataType != 'string' ? " ui-talxGrid-" + dataType : "") + "" + (colClass != '' ? " " + colClass : "") + "'>" + info + "</td>";
            }
            rr += "</tr>";
        }
        if (rows == 0 && this.options.noDataMessage != undefined && this.options.noDataMessage != '') {
            rr += "<tr><td class='ui-talxGrid-nodata' colspan='" + cols + "'>" + this.options.noDataMessage + "</td></tr>";
            this._rowCounter.hide();
            this._pager.hide();
        } else {
            if (this.options.showRowCounter) this._rowCounter.show();
            this._pager.show();
        }
        this._updateRowCounter();
        $('tbody', this.element).html(rr);
    },
    _getDate: function (dateString, formatIt) {
        var ret = null;
        if ((dateString.length > 5) && (dateString.substr(0, 5) == '/Date')) {
            var start = dateString.indexOf('(');
            var end = dateString.indexOf(')');
            if (start > -1 && end > -1) {
                ret = new Date(parseInt(dateString.substring(start + 1, end), 10));
            }
        }
        if (ret == null) {
            ret = new Date(dateString);
        }
        if (formatIt == true){
            ret = this._useDateFormat ? ret.format(this.options.dateFormat) : ret.toLocaleDateString();
        }

        return ret;
    },
    _sortRows: function (a, b) {
        var x = (this._sortAsc ? a : b);
        var y = (this._sortAsc ? b : a);
        var ret = 0;
        var fld = this.options.columns[this._sort].displayField;
        var dataType = (this.options.columns[this._sort].dataType != undefined ? this.options.columns[this._sort].dataType : "string");
        var xVal = x[fld];
        var yVal = y[fld];
        switch (dataType) {
            case "date":
                xVal = this._getDate(xVal);
                yVal = this._getDate(yVal);
                break;
            case "int":
                xVal = parseInt(xVal, 10);
                yVal = parseInt(yVal, 10);
                break;
            case "float":
                xVal = parseFloat(xVal);
                yVal = parseFloat(yVal);
                break;
            case "boolean":
                xVal = !!xVal;
                yVal = !!yVal;
                break;
            case "string":
                xVal = xVal.toString().toLowerCase();
                yVal = yVal.toString().toLowerCase();
                break;
            default:
                break;
        }
        if (xVal < yVal) ret = -1;
        else if (xVal > yVal) ret = 1;
        return ret;
    },
    _makeJavascriptSafe: function (txt) {
        txt = txt.replace(/\'/g, "&#39;");
        return txt;
    },
    _setOption: function (key, value) {
        switch (key) {
            case "dateFormat":
                this.options.dateFormat = value;
                this.refresh();
                break;
            case "pageSize":
                var nSize = parseInt(value, 10);
                if (nSize > 0){
                    this.options.pageSize = nSize;
                    $("[name=itemsPerPage]", this.element).val(this.options.pageSize);
                    this.refresh();
                }
                break;
            case "maxSearchItems":
                var nItems = parseInt(value, 10);
                if (nItems > 0){
                    this.options.maxSearchItems = nItems;
                    this._onColumnSearchChange(this._ddlColSelect);
                }
                break;
            case "pageSizeOptions":
                if ($.isArray(value)){
                    var pOptions = [];
                    value.forEach(function(item, index){
                        pOptions.push(parseInt(item, 10));
                    });
                    this.options.pageSizeOptions = pOptions;
                    this._ddlItemsPerPage.html("");
                    var self = this;
                    this.options.pageSizeOptions.forEach(function(item, index){
                        self._ddlItemsPerPage.append($("<option value='"+ item +"'>"+ item +" at a time</option>"));
                    });
                    this._ddlItemsPerPage.val(this.options.pageSize);
                }
                break;
            case "data":
                if ($.isArray(value)){
                    this.options.data = value;
                    this._onSearch();
                }
                break;
            case "noDataMessage":
                this.options.noDataMessage = value;
                this.refresh();
                break;
            case "showPageSizer":
                this.options.showPageSizer = value;
                if (!this.options.showPageSizer){
                    this._pageSizer.hide();
                }else{
                    this._pageSizer.show();
                }
                break;
            case "showRowCounter":
                this.options.showRowCounter = value;
                if (this.options.showRowCounter){
                    this._rowCounter.show();
                }else{
                    this._rowCouter.hide();
                }
                break;
            case "showFilter":
                this.options.showFilter = value;
                if(this.options.showFilter){
                    this._filter.show();
                }else{
                    this._filter.hide();
                }
                break;
            case "showFirstLast":
                this.options.showFirstLast = value;
                this._updatePager();
                break;
            case "showPrevNext":
                this.options.showPrevNext = value;
                this._updatePager();
                break;
            case "firstText":
                this.options.firstText = value;
                this._updatePager();
                break;
            case "lastText":
                this.options.lastText = value;
                this._updatePager();
                break;
            case "prevText":
                this.options.prevText = value;
                this._updatePager();
                break;
            case "nextText":
                this.options.nextText = value;
                this._updatePager();
                break;
            case "showPageNumbers":
                this.options.showPageNumbers = value;
                this._updatePager();
                break;
            case "showResetAsButton":
                this.options.showResetAsButton = value;
                if (this.options.showResetAsButton){
                    var btn = $("<button name='reset' class='ui-talxGrid-reset'>Reset</button>");
                    this._btnReset.before(btn);
                    this._btnReset.remove();
                    this._btnReset = btn;
                }else{
                    var lnk = $("<a href='#' name='reset' class='ui-talxGrid-reset'>Reset</a>");
                    this._btnReset.before(lnk);
                    this._btnReset.remove();
                    this._btnReset = lnk;
                }
                break;
            case "showPagerAsButtons":
                this.options.showPagerAsButtons = value;
                this._updatePager();
                break;
            case "maxPagesOnPager":
                this.options.maxPagesOnPager = value;
                this._updatePager();
                break;
            case "showPagerEllipsis":
                this.options.showPagerEllipsis = value;
                this._updatePager();
                break;
            case "showSearchLabel":
                this.options.showSearchLabel = value;
                var lbl = $("span.ui-talxGrid-filter>label[for=colSelect]", this.element);
                if (this.options.showSearchLabel){
                    lbl.show();
                }else{
                    lbl.hide();
                }
                break;
            case 'advancedSearchHelper':
                this.options.advancedSearchHelper = value;
                if (value != null)
                    this._addAdvSearch();
                else
                    this._removeAdvSearch();
                break;
            case 'advancedSearchCriteria':
                this.options.advancedSearchCriteria = value;
                this.search();
                break;
            case 'advancedSearchAsButton':
                var resetControl = value != this.options.advancedSearchAsButton;
                this.options.advancedSearchAsButton = value;
                if (resetControl) {
                    this._removeAdvSearch();
                    this._addAdvSearch();
                }
                break;
        }
    },
    select: function (criteria) {
        if ($.isPlainObject(criteria) && criteria.field != null && criteria.value != null) {
            var i = 0;
            var d = this._data();
            for (i = 0; i < d.length; i++) {
                if (d[i][criteria.field] == criteria.value) break;
            }
            if (i < d.length) {
                var p = Math.floor(i / this.options.pageSize);
                var r = (i % this.options.pageSize) + 1;
                this.pageIndex(p);
                $('tbody tr:nth-child(' + r + ')', this.element).addClass('ui-state-selected');
            }
        }
    },
    pageIndex: function (val) {
        if (val == undefined || val == '') {
            return this._currentPage;
        }
        var newPage = parseInt(val, 10);
        if (this._currentPage != newPage) {
            this._currentPage = newPage;
            this._updatePager();
            this._getPage();
        }
    },
    rowData: function (index, data) {
        if (data == undefined) {
            return this._data()[index];
        } else {
            this._data()[index] = data;
        }
    },
    refresh: function () {
        this._getPage();
    },
    items: function () {
        return this.options.data;
    },
    reset: function () {
        return this._onReset();
    },
    destroy: function () {
        $(this.element).html("");
        $.Widget.prototype.destroy.call(this);
    },
    search: function () {
        return this._onSearch();
    }
});

$.extend($.namespace.talxGrid, {
	defaults: {
		columns: [],
		data: [],
		pageSizeOptions: [10,25,50,100],
		pageSize: 10,
		maxSearchItems: 5
	}
});
if (!Array.prototype.unique) {
    Array.prototype.unique = function() {
        var o = { }, i, l = this.length, r = [];
        for (i = 0; i < l; i += 1) o[this[i]] = this[i];
        for (i in o) r.push(o[i]);
        return r;
    };
}
if (Array.prototype.filter == undefined) {
    Array.prototype.filter = function (callback) {
        var t = this, l = t.length, r = [];
        if (!$.isFunction(callback)) {
            throw new TypeError();
        }
        for (var i = 0; i < l; i++) {
            var p = t[i];
            if (callback(t[i])) { r.push(p); }
        }
        return r;
    };
}
if (!String.prototype.indexOfi) {
    String.prototype.indexOfi = function (v) {
        var vi = v.toLowerCase();
        var m = this.toLowerCase();
        return m.indexOf(vi);
    }
}
if (!String.prototype.htmlEncode) {
    String.prototype.htmlEncode = function () {
        return String(this)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');    
    }
}
if (String.prototype.format == undefined) {
    String.prototype.format = function() {
        var args = arguments;
        var ret = this.replace( /{(\d+)}/g , function(match, number) {
            var x = parseInt(number, 10);
            var r = typeof args[x] != 'undefined'
                ? args[x]
                : match;
            return r;
        });
        return ret;
    };
}
