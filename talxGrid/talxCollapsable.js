/**
 * @author nathan
 */
$.widget('namespace.talxCollapsable', {
	_header: null,
	_headerIcon: null,
	_wrapper: null,
	_content: null,
	_baseClass: 'talxCollapsable',
	_openIconClass: 'ui-icon-triangle-1-n',
	_openHeaderClass: 'ui-corner-bottom',
	
	_dropDown: false,
	
	_init: function(){
		var startOpen = this.options.startOpen || false;
		this._dropDown = this.options.dropDown || false;
		var useAccordionClasses = this.options.useAccordionClasses || false;
		this._baseClass = (useAccordionClasses ? 'accordion' : 'talxCollapsable');
		if (this._dropDown){
			this._openIconClass = 'ui-icon-triangle-1-s';
			this._openHeaderClass = 'ui-corner-top';
		}
		
		this._content=this.element;
		if (!startOpen) this._content.hide();
		var title = this.element.attr("title");
		this._content.wrapAll("<div class='ui-"+this._baseClass+" ui-widget ui-helper-reset ui-"+this._baseClass+"-icons'></div>");
		this._wrapper = this._content.parent();
		this._header = $("<h3 class='ui-"+this._baseClass+"-header ui-helper-reset ui-state-default ui-corner-all ui-content-header'><a href='#'>"+title+"</a></h3>");
		this._headerIcon = $("<span class='ui-icon ui-icon-triangle-1-e'/>");
	    if (this._dropDown) 
			this._content.before(this._header);
		else 
			this._content.after(this._header);
		this._header.prepend(this._headerIcon);
		this._content.addClass("ui-"+this._baseClass+"-content ui-helper-reset ui-widget-content "+(this._dropDown ? "ui-corner-bottom": "ui-corner-top"));
		
		var self = this;
		this._header.mouseenter(function(){$(this).addClass('ui-state-hover');});
		this._header.mouseleave(function(){$(this).removeClass('ui-state-hover');})
		this._header.click(function(){
			return self._onClick(this);
		});
		$('a',this._header).click(function(){
			return self._onClick(this);
		});
		
		if(startOpen){this._open();}
	},
	_open: function(){
		var self = this;
		this._content.slideDown(400, function(){
			self._header.removeClass('ui-state-default ui-corner-all').addClass('ui-state-active').addClass(self._openHeaderClass);
			self._headerIcon.removeClass('ui-icon-triangle-1-e').addClass(self._openIconClass);
		});
	},
	_close: function(){
		var self = this;
		this._content.slideUp(400, function(){
			self._header.removeClass('ui-state-active').removeClass(self._openHeaderClass).addClass('ui-state-default ui-corner-all');
			self._headerIcon.removeClass(self._openIconClass).addClass('ui-icon-triangle-1-e');
		});
	},
	_onClick: function(eventCtrl){
		var open = this._header.hasClass('ui-state-active');
		if (open){
			this._close();
		}else{
			this._open();
		}
		return false;
	},

	open: function(){
		this._open();
	},
	close: function(){
		this._close();
	},
    destroy: function () {
		this._wrapper.before(this.element);
		this.element.removeClass('ui-helper-reset ui-widget-content ui-corner-bottom ui-corner-top ui-'+this._baseClass+'-content').show();
		this._wrapper.remove();
        $.widget.prototype.apply(this, arguments);
    }
});

$.extend($.namespace.talxCollapsable, {
	defaults: {
		startOpen: false
	}
});

