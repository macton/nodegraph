;/*jslint browser: true, devel: true, debug: true */
(function ($) {
    'use strict';
    var IgMarqueeSelect = function (div) {
        var marqueeSelect = this;
        this.callbacks = {
            onMouseMove: function (e) { marqueeSelect.onMouseMove(e); },
            onMouseUp: function (e) { marqueeSelect.onMouseUp(e); },
            refresh: function () { marqueeSelect.refresh(); }
        };
        this.borderBottomWidth = 0;
        this.borderLeftWidth = 0;
        this.borderRightWidth = 0;
        this.borderTopWidth = 0;
        this.div = div;
        this.offsetLeft = 0;
        this.offsetTop = 0;
        this.maxX = 0;
        this.maxY = 0;
        this.minX = 0;
        this.minY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseStartX = 0;
        this.mouseStartY = 0;
        Object.seal(this);
        this.div.style.display = 'none';
        this.div.style.position = 'absolute';
    };
    IgMarqueeSelect.prototype.refresh = function () {
        var left = Math.min(this.mouseStartX, this.mouseX),
            top = Math.min(this.mouseStartY, this.mouseY),
            width = Math.max(0, Math.abs(this.mouseStartX - this.mouseX) - this.borderLeftWidth - this.borderRightWidth),
            height = Math.max(0, Math.abs(this.mouseStartY - this.mouseY) - this.borderTopWidth - this.borderBottomWidth),
            right = left + width,
            bottom = top + height;
        this.div.style.left = left + 'px';
        this.div.style.top = top + 'px';
        this.div.style.width = width + 'px';
        this.div.style.height = height + 'px';
        $(this.div).trigger('onMarqueeSelectUpdate', [{left: left, top: top, right: right, bottom: bottom, width: width, height: height}]);
    };
    IgMarqueeSelect.prototype.start = function (e) {
        var element = this.div.parentElement,
            boundingRect = element.getBoundingClientRect(),
            style = getComputedStyle(this.div);
        this.offsetLeft = 0;
        this.offsetTop = 0;
        while (element !== null) {
            this.offsetLeft += element.offsetLeft;
            this.offsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        this.borderBottomWidth = parseFloat(style.borderBottomWidth || '0');
        this.borderLeftWidth = parseFloat(style.borderLeftWidth || '0');
        this.borderRightWidth = parseFloat(style.borderRightWidth || '0');
        this.borderTopWidth = parseFloat(style.borderTopWidth || '0');
        this.maxX = boundingRect.right + document.body.scrollLeft;
        this.maxY = boundingRect.bottom + document.body.scrollTop;
        this.minX = boundingRect.left + document.body.scrollLeft;
        this.minY = boundingRect.top + document.body.scrollTop;
        this.mouseStartX = Math.max(this.minX, Math.min(e.pageX, this.maxX)) - this.offsetLeft;
        this.mouseStartY = Math.max(this.minY, Math.min(e.pageY, this.maxY)) - this.offsetTop;
        this.mouseX = this.mouseStartX;
        this.mouseY = this.mouseStartY;
        this.div.style.display = 'inline';
        window.requestAnimationFrame(this.callbacks.refresh);
        $(window).on('mousemove', this.callbacks.onMouseMove).on('mouseup', this.callbacks.onMouseUp);
    };
    IgMarqueeSelect.prototype.onMouseMove = function (e) {
        this.mouseX = Math.max(this.minX, Math.min(e.pageX, this.maxX)) - this.offsetLeft;
        this.mouseY = Math.max(this.minY, Math.min(e.pageY, this.maxY)) - this.offsetTop;
        window.requestAnimationFrame(this.callbacks.refresh);
    };
    IgMarqueeSelect.prototype.onMouseUp = function () {
        this.div.style.display = 'none';
        $(window).off('mousemove', this.callbacks.onMouseMove).off('mouseup', this.callbacks.onMouseUp);
        $(this.div).trigger('onMarqueeSelectComplete');
    };
    $.fn.igMarqueeSelect = function (memberFunctionName, e) {
        var i;
        switch (memberFunctionName) {
        case 'init':
            for (i = 0; i < this.length; i += 1) {
                $.attr(this[i], 'igPluginName', 'igMarqueeSelect');
                $.data(this[i], 'igMarqueeSelect', new IgMarqueeSelect(this[i]));
            }
            return this;
        case 'start':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igMarqueeSelect').start(e);
            }
            return this;
        }
        if (typeof memberFunctionName === 'string') {
            console.log('IgMarqueeSelect.js: Function "' + memberFunctionName + '" does not exist!');
        } else {
            console.log('IgMarqueeSelect.js: No member function name specified!');
        }
        debugger;
        return this;
    };
}(jQuery));