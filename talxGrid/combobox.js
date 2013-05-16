(function ($) {
    $.widget("equifax.combobox", {
        options: {
            source: null,
            haveBlank: true,
            selectedValue: null
        },

        _create: function () {
            if ($.isArray(this.options.source)) {
                this._fillSelectOptions();
            }
            var self = this,
                select = this.element.hide(),
                selected = select.children(":selected"),
                value = selected.val() ? selected.text() : "";
            var input = this.input = $("<input>")
                .insertAfter(select)
                .val(value)
                .autocomplete({
                    delay: 0,
                    minLength: 0,
                    source: function (request, response) {
                        var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
                        response(select.children("option").map(function () {
                            var text = $(this).text();
                            if (this.value && (!request.term || matcher.test(text)))
                                return {
                                    label: text.replace(
                                        new RegExp(
                                            "(?![^&;]+;)(?!<[^<>]*)(" +
                                                $.ui.autocomplete.escapeRegex(request.term) +
                                                    ")(?![^<>]*>)(?![^&;]+;)", "gi"
                                        ), "<strong>$1</strong>"),
                                    value: text,
                                    option: this
                                };
                        }));
                    },
                    select: function (event, ui) {
                        ui.item.option.selected = true;
                        self._trigger("selected", event, {
                            item: ui.item.option
                        });
                    },
                    change: function (event, ui) {
                        if (!ui.item) {
                            var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex($(this).val()) + "$", "i"),
                                valid = false;
                            select.children("option").each(function () {
                                if ($(this).text().match(matcher)) {
                                    this.selected = valid = true;
                                    return false;
                                }
                            });
                            if (!valid) {
                                // remove invalid value, as it didn't match anything
                                $(this).val("");
                                select.val("");
                                input.data("autocomplete").term = "";
                                return false;
                            }
                        }
                    }
                })
                .addClass("ui-widget ui-widget-content ui-corner-left");

            input.data("autocomplete")._renderItem = function (ul, item) {
                return $("<li></li>")
                    .data("item.autocomplete", item)
                    .append("<a>" + item.label + "</a>")
                    .appendTo(ul);
            };

            this.button = $("<button type='button'>&nbsp;</button>")
                .attr("tabIndex", -1)
                .attr("title", "Show All Items")
                .insertAfter(input)
                .button({
                    icons: {
                        primary: "ui-icon-triangle-1-s"
                    },
                    text: false
                })
                .removeClass("ui-corner-all")
                .addClass("ui-corner-right ui-button-icon ui-combobox-button")
                .click(function () {
                    // close if already visible
                    if (input.autocomplete("widget").is(":visible")) {
                        input.autocomplete("close");
                        return;
                    }

                    // work around a bug (likely same cause as #5265)
                    $(this).blur();

                    // pass empty string as value to search for, displaying all results
                    input.autocomplete("search", "");
                    input.focus();
                });
            this.resize();
            this._setValue(value);
        },

        _fillSelectOptions: function () {
            var opts = "";
            var value = this.options.source;
            var foundBlank = false;
            for (var i = 0; i < value.length; i++) {
                var opt = value[i];
                var val = null;
                var dis = null;
                if (typeof opt === "string") {
                    dis = opt;
                } else if (typeof opt.label === "string" && typeof opt.value === "string") {
                    dis = opt.label;
                    val = opt.value;
                }
                if (dis != null) {
                    var useVal = val || dis;
                    foundBlank = foundBlank || (useVal == "");
                    opts += "<option" + (val != null ? " value='" + val + "'" : "") + ">" + dis + "</option>";
                }
            }
            if (this.options.haveBlank && !foundBlank) opts = "<option value=''>Select One</option>" + opts;
            this.element.html(opts);
            selected = this.element.children(":selected"),
            value = selected.val() ? selected.text() : "";
            if (this.input != null) this._setValue(value);
        },

        _setValue: function (value) {
            var selectedItem = $("option[value='" + value + "']", this.element);
            if (selectedItem.length > 0) {
                this.element.val(value);
            } else {
                var select = this.element;
                var selectedItem = select.children(":selected");
                value = selectedItem.val() ? selectedItem.text() : "";
            }
            //this.options.selectedValue = value;
            this.input.val(selectedItem.text());

            return value;
        },

        _setOption: function (key, value) {
            switch (key) {
                case "source":
                    if ($.isArray(value)) {
                        this.options.source = value;
                        this._fillSelectOptions();
                    }
                    break;
                case "selectedValue":
                    value = this._setValue(value);
                    break;
            }

            // In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
            $.Widget.prototype._setOption.apply(this, arguments);
            // In jQuery UI 1.9 and above, you use the _super method instead
            //this._super("_setOption", key, value);
        },

        resize: function () {
            this.button.innerHeight(this.input.outerHeight())
            .innerWidth(this.input.outerHeight());
            var ipos = this.input.offset();
            var bpos = this.button.offset();
            this.button.offset({ top: ipos.top, left: bpos.left });
        },

        destroy: function () {
            this.input.remove();
            this.button.remove();
            this.element.show();
            $.Widget.prototype.destroy.call(this);
        }
    });
})(jQuery);


(function ($) {
    $.widget("demo.multi", {

        // These options will be used as defaults
        options: {
            clear: null
        },

        // Set up the widget
        _create: function () {
        },

        // Use the _setOption method to respond to changes to options
        _setOption: function (key, value) {
            switch (key) {
                case "clear":
                    // handle changes to clear option
                    break;
            }

            // In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
            $.Widget.prototype._setOption.apply(this, arguments);
            // In jQuery UI 1.9 and above, you use the _super method instead
            this._super("_setOption", key, value);
        },

        // Use the destroy method to clean up any modifications your widget has made to the DOM
        destroy: function () {
            // In jQuery UI 1.8, you must invoke the destroy method from the base widget
            $.Widget.prototype.destroy.call(this);
            // In jQuery UI 1.9 and above, you would define _destroy instead of destroy and not call the base method
        }
    });
} (jQuery));
