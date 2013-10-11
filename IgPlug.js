;/*jslint browser: true, devel: true, debug: true */
(function ($) {
    'use strict';
    var boundingBoxCache = {},
        IgPlugOptions = function (options) {
            this.classHandle = String(options.classHandle || '');
            this.classHandleCustomBorder = String(options.classHandleCustomBorder || '');
            this.classLabel = String(options.classLabel || '');
            this.handleHeight = parseFloat(options.handleHeight || 6);
            this.handleInside = options.handleInside === true ? true : false;
            this.handlePadding = parseFloat(options.handlePadding || 0);
            this.handleRx = parseFloat(options.handleRx || 0);
            this.handleRy = parseFloat(options.handleRy || 0);
            this.handleType = String(options.handleType || 'rect');
            this.handleWidth = parseFloat(options.handleWidth || 6);
            this.innerWidth = parseFloat(options.innerWidth || 8192);
            this.label = String(options.label || '');
            this.labelPadding = parseFloat(options.labelPadding || 3);
            this.location = String(options.location || 'left');
            this.offset = parseFloat(options.offset || 0);
            Object.seal(this);
        },
        IgPlug = function (parent, options) {
            var handleType = options.handleType,
                handleCustomBorderType = options.handleType;
            switch (handleType) {
            case 'circle':
            case 'ellipse':
            case 'rect':
                break;
            case 'triangle':
                handleType = 'path';
                handleCustomBorderType = 'path';
                break;
            case 'rectAdjacentBorder':
                handleType = 'rect';
                handleCustomBorderType = 'rect';
                break;
            }
            this.connected = false;
            this.elements = {
                documentFragment: document.createDocumentFragment(),
                handle: document.createElementNS('http://www.w3.org/2000/svg', handleType),
                handleCustomBorder: document.createElementNS('http://www.w3.org/2000/svg', handleCustomBorderType),
                label: document.createElementNS('http://www.w3.org/2000/svg', 'text'),
                labelContent: document.createTextNode(''),
                labelSvg: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
                parent: parent
            };
            this.options = options;
            Object.seal(this);
            if (this.options.classHandle) {
                this.elements.handle.setAttribute('class', this.options.classHandle);
            }
            if (this.options.classHandleCustomBorder) {
                this.elements.handleCustomBorder.setAttribute('class', this.options.classHandleCustomBorder);
            }
            if (this.options.classLabel) {
                this.elements.label.setAttribute('class', this.options.classLabel);
            }
            this.elements.handle.setAttribute('height', this.options.handleHeight);
            this.elements.handle.setAttribute('width', this.options.handleWidth);
            this.elements.handleCustomBorder.setAttribute('height', this.options.handleHeight);
            this.elements.handleCustomBorder.setAttribute('width', this.options.handleWidth);
            this.elements.label.style.alignmentBaseline = 'before-edge';
            this.elements.label.style.textAnchor = 'start';
            this.elements.labelContent.nodeValue = this.options.label;
            this.elements.label.appendChild(this.elements.labelContent);
            this.elements.labelSvg.appendChild(this.elements.label);
            switch (this.options.handleType) {
            case 'visible':
            case 'rectAdjacentBorder':
                parent.appendChild(this.elements.handleCustomBorder);
                break;
            default:
                this.elements.documentFragment.appendChild(this.elements.handleCustomBorder);
                break;
            }
            parent.appendChild(this.elements.labelSvg);
            parent.appendChild(this.elements.handle);
        };
    IgPlug.prototype.addClass = function (c) {
        var i,
            elements = [this.elements.handle, this.elements.label],
            classList;
        for (i = 0; i < elements.length; i += 1) {
            classList = elements[i].getAttribute('class').match(/[\S]+/g);
            if (classList.indexOf(c) < 0) {
                classList.push(c);
                elements[i].setAttribute('class', classList.join(' '));
            }
        }
    };
    IgPlug.prototype.removeClass = function (c) {
        var i,
            elements = [this.elements.handle, this.elements.label],
            classList,
            classIndex,
            changed = false;
        for (i = 0; i < elements.length; i += 1) {
            classList = elements[i].getAttribute('class').match(/[\S]+/g);
            classIndex = classList.indexOf(c);
            while (classIndex >= 0) {
                changed = true;
                classList.splice(classIndex, 1);
                classIndex = classList.indexOf(c);
            }
            if (changed) {
                elements[i].setAttribute('class', classList.join(' '));
            }
        }
    };
    IgPlug.prototype.setConnected = function () {
        this.addClass('connected');
        this.connected = true;
    };
    IgPlug.prototype.clearConnected = function () {
        this.removeClass('connected');
        this.connected = false;
    };
    IgPlug.prototype.getConnected = function () {
        return this.connected;
    };
    IgPlug.prototype.getLabelBoundingBox = function () {
        var key = 'label (' + this.options.classLabel + ') ' + this.options.label;
        if (!boundingBoxCache.hasOwnProperty(key)) {
            boundingBoxCache[key] = this.elements.label.getBBox();
        }
        return boundingBoxCache[key];
    };
    IgPlug.prototype.setHandlePositionTriangle = function (x, y) {
        var location = this.options.handleInside ? (this.options.location === 'left' ? 'right' : (this.options.location === 'top' ? 'bottom' : (this.options.location === 'right' ? 'left' : 'top'))) : this.options.location,
            data;
        switch (location) {
        case 'left':
            data = 'M ' + (x + this.options.handleWidth) + ' ' + y + ' L ' + (x + this.options.handleWidth) + ' ' + (y + this.options.handleHeight) + ' L ' + x + ' ' + (y + this.options.handleHeight / 2) + 'Z';
            break;
        case 'right':
            data = 'M ' + x + ' ' + y + ' L ' + x + ' ' + (y + this.options.handleHeight) + ' L ' + (x + this.options.handleWidth) + ' ' + (y + this.options.handleHeight / 2) + 'Z';
            break;
        case 'top':
            data = 'M ' + x + ' ' + (y + this.options.handleHeight) + ' L ' + (x + this.options.handleWidth) + ' ' + (y + this.options.handleHeight) + ' L ' + (x + this.options.handleWidth / 2) + ' ' + y + 'Z';
            break;
        case 'bottom':
            data = 'M ' + x + ' ' + y + ' L ' + (x + this.options.handleWidth) + ' ' + y + ' L ' + (x + this.options.handleWidth / 2) + ' ' + (y + this.options.handleHeight) + 'Z';
            break;
        }
        this.elements.handle.setAttribute('d', data);
        this.elements.handleCustomBorder.setAttribute('d', data);
    };
    IgPlug.prototype.setHandlePosition = function (x, y) {
        var customHalfBorderWidth;
        switch (this.options.handleType) {
        case 'circle':
            this.elements.handle.setAttribute('cx', x + this.options.handleWidth / 2);
            this.elements.handle.setAttribute('cy', y + this.options.handleHeight / 2);
            this.elements.handle.setAttribute('r', Math.min(this.options.handleWidth / 2, this.options.handleHeight / 2));
            this.elements.handleCustomBorder.setAttribute('cx', x + this.options.handleWidth / 2);
            this.elements.handleCustomBorder.setAttribute('cy', y + this.options.handleHeight / 2);
            this.elements.handleCustomBorder.setAttribute('r', Math.min(this.options.handleWidth / 2, this.options.handleHeight / 2));
            break;
        case 'ellipse':
            this.elements.handle.setAttribute('cx', x + this.options.handleWidth / 2);
            this.elements.handle.setAttribute('cy', y + this.options.handleHeight / 2);
            this.elements.handle.setAttribute('rx', this.options.handleWidth / 2);
            this.elements.handle.setAttribute('ry', this.options.handleHeight / 2);
            this.elements.handleCustomBorder.setAttribute('cx', x + this.options.handleWidth / 2);
            this.elements.handleCustomBorder.setAttribute('cy', y + this.options.handleHeight / 2);
            this.elements.handleCustomBorder.setAttribute('rx', this.options.handleWidth / 2);
            this.elements.handleCustomBorder.setAttribute('ry', this.options.handleHeight / 2);
            break;
        case 'rect':
            this.elements.handle.setAttribute('x', x);
            this.elements.handle.setAttribute('y', y);
            this.elements.handle.setAttribute('rx', this.options.handleRx);
            this.elements.handle.setAttribute('ry', this.options.handleRy);
            this.elements.handleCustomBorder.setAttribute('x', x);
            this.elements.handleCustomBorder.setAttribute('y', y);
            this.elements.handleCustomBorder.setAttribute('rx', this.options.handleRx);
            this.elements.handleCustomBorder.setAttribute('ry', this.options.handleRy);
            break;
        case 'rectAdjacentBorder':
            this.elements.handle.setAttribute('x', x);
            this.elements.handle.setAttribute('y', y);
            this.elements.handle.setAttribute('rx', this.options.handleRx);
            this.elements.handle.setAttribute('ry', this.options.handleRy);
            this.elements.handleCustomBorder.setAttribute('rx', this.options.handleRx);
            this.elements.handleCustomBorder.setAttribute('ry', this.options.handleRy);
            customHalfBorderWidth = parseFloat(getComputedStyle(this.elements.handleCustomBorder).strokeWidth || 0) / 2;
            switch (this.options.location) {
            case 'left':
                this.elements.handleCustomBorder.setAttribute('height', this.options.handleHeight);
                this.elements.handleCustomBorder.setAttribute('width', this.options.handleWidth - customHalfBorderWidth);
                this.elements.handleCustomBorder.setAttribute('x', x + customHalfBorderWidth);
                this.elements.handleCustomBorder.setAttribute('y', y);
                break;
            case 'right':
                this.elements.handleCustomBorder.setAttribute('height', this.options.handleHeight);
                this.elements.handleCustomBorder.setAttribute('width', this.options.handleWidth - customHalfBorderWidth);
                this.elements.handleCustomBorder.setAttribute('x', x);
                this.elements.handleCustomBorder.setAttribute('y', y);
                break;
            case 'top':
                this.elements.handleCustomBorder.setAttribute('height', this.options.handleHeight - customHalfBorderWidth);
                this.elements.handleCustomBorder.setAttribute('width', this.options.handleWidth);
                this.elements.handleCustomBorder.setAttribute('x', x);
                this.elements.handleCustomBorder.setAttribute('y', y + customHalfBorderWidth);
                break;
            case 'bottom':
                this.elements.handleCustomBorder.setAttribute('height', this.options.handleHeight - customHalfBorderWidth);
                this.elements.handleCustomBorder.setAttribute('width', this.options.handleWidth);
                this.elements.handleCustomBorder.setAttribute('x', x);
                this.elements.handleCustomBorder.setAttribute('y', y);
                break;
            }
            break;
        case 'triangle':
            this.setHandlePositionTriangle(x, y);
            break;
        }
    };
    IgPlug.prototype.refresh = function () {
        var labelSvgBoundingBox = this.getLabelBoundingBox(),
            labelSvgWidth = Math.max(0, Math.min(labelSvgBoundingBox.width, this.options.innerWidth - this.options.labelPadding)),
            labelSvgHeight = this.getLabelBoundingBox().height,
            handleStrokeWidth = parseFloat(getComputedStyle(this.elements.handle).strokeWidth || 0);
        this.elements.labelSvg.setAttribute('width', labelSvgWidth);
        this.elements.labelSvg.setAttribute('height', labelSvgHeight);
        if (this.options.handleInside) {
            switch (this.options.location) {
            case 'left':
                this.setHandlePosition(this.options.offset + this.options.handlePadding + (handleStrokeWidth / 2), -this.options.handleHeight / 2);
                this.elements.labelSvg.setAttribute('x', this.options.offset + this.options.handlePadding + handleStrokeWidth + this.options.handleWidth + this.options.labelPadding);
                this.elements.labelSvg.setAttribute('y', -labelSvgHeight / 2);
                break;
            case 'right':
                this.setHandlePosition(-this.options.offset - this.options.handlePadding - (handleStrokeWidth / 2) - this.options.handleWidth, -this.options.handleHeight / 2);
                this.elements.labelSvg.setAttribute('x', -this.options.offset - this.options.handlePadding - handleStrokeWidth - this.options.handleWidth - this.options.labelPadding - labelSvgWidth);
                this.elements.labelSvg.setAttribute('y', -labelSvgHeight / 2);
                break;
            case 'top':
                this.setHandlePosition(-this.options.handleWidth / 2, this.options.offset + this.options.handlePadding + (handleStrokeWidth / 2));
                this.elements.labelSvg.setAttribute('x', -labelSvgWidth / 2);
                this.elements.labelSvg.setAttribute('y', this.options.offset + this.options.handlePadding + handleStrokeWidth + this.options.handleHeight + this.options.labelPadding);
                break;
            case 'bottom':
                this.setHandlePosition(-this.options.handleWidth / 2, -this.options.offset - this.options.handlePadding - (handleStrokeWidth / 2) - this.options.handleHeight);
                this.elements.labelSvg.setAttribute('x', -labelSvgWidth / 2);
                this.elements.labelSvg.setAttribute('y', -this.options.offset - this.options.handlePadding - handleStrokeWidth - this.options.handleHeight - this.options.labelPadding - labelSvgHeight);
                break;
            }
        } else {
            switch (this.options.location) {
            case 'left':
                this.setHandlePosition(-this.options.handleWidth - this.options.handlePadding - (handleStrokeWidth / 2), -this.options.handleHeight / 2);
                this.elements.labelSvg.setAttribute('x', this.options.offset + this.options.labelPadding);
                this.elements.labelSvg.setAttribute('y', -labelSvgHeight / 2);
                break;
            case 'right':
                this.setHandlePosition(this.options.handlePadding + (handleStrokeWidth / 2), -this.options.handleHeight / 2);
                this.elements.labelSvg.setAttribute('x', -this.options.offset - this.options.labelPadding - labelSvgWidth);
                this.elements.labelSvg.setAttribute('y', -labelSvgHeight / 2);
                break;
            case 'top':
                this.setHandlePosition(-this.options.handleWidth / 2, -this.options.handleHeight - this.options.handlePadding - (handleStrokeWidth / 2));
                this.elements.labelSvg.setAttribute('x', -labelSvgWidth / 2);
                this.elements.labelSvg.setAttribute('y', this.options.offset + this.options.labelPadding);
                break;
            case 'bottom':
                this.setHandlePosition(-this.options.handleWidth / 2, this.options.handlePadding + (handleStrokeWidth / 2));
                this.elements.labelSvg.setAttribute('x', -labelSvgWidth / 2);
                this.elements.labelSvg.setAttribute('y', -this.options.offset - this.options.labelPadding - labelSvgHeight);
                break;
            }
        }
    };
    IgPlug.prototype.getLocation = function () {
        return this.options.location;
    };
    IgPlug.prototype.getMaxInnerBounds = function () {
        var handleStrokeWidth = parseFloat(getComputedStyle(this.elements.handle).strokeWidth || 0),
            bounds = {
                height: this.getLabelBoundingBox().height,
                width: this.elements.label.getComputedTextLength()
            };
        if ((this.options.location === 'left') || (this.options.location === 'right')) {
            bounds.width += this.options.labelPadding;
            bounds.height = Math.max(bounds.height, this.options.handleHeight);
            if (this.options.handleInside) {
                bounds.width += this.options.handlePadding + handleStrokeWidth + this.options.handleWidth;
            }
        } else if ((this.options.location === 'top') || (this.options.location === 'bottom')) {
            bounds.width = Math.max(bounds.width, this.options.handleWidth);
            bounds.height += this.options.labelPadding;
            if (this.options.handleInside) {
                bounds.height += this.options.handlePadding + handleStrokeWidth + this.options.handleHeight;
            }
        }
        return bounds;
    };
    IgPlug.prototype.getConnectionPoint = function () {
        if (!this.options.handleInside) {
            switch (this.options.location) {
            case 'left':
                return {x: -this.options.handleWidth - this.options.handlePadding, y: 0};
            case 'right':
                return {x: this.options.handleWidth + this.options.handlePadding, y: 0};
            case 'top':
                return {x: 0, y: -this.options.handleHeight - this.options.handlePadding};
            case 'bottom':
                return {x: 0, y: this.options.handleHeight + this.options.handlePadding};
            }
        }
        return {x: 0, y: 0};
    };
    IgPlug.prototype.getConnectionDirection = function () {
        switch (this.options.location) {
        case 'left':
            return {x: -1, y: 0};
        case 'right':
            return {x: 1, y: 0};
        case 'top':
            return {x: 0, y: -1};
        case 'bottom':
            return {x: 0, y: 1};
        }
        return {x: 0, y: 0};
    };
    IgPlug.prototype.setInnerWidth = function (innerWidth) {
        this.options.innerWidth = innerWidth;
    };
    IgPlug.prototype.setOffset = function (offset) {
        this.options.offset = offset;
    };
    $.fn.igPlug = function (memberFunctionName, arg1) {
        var i,
            numPlugs = this.length;
        switch (memberFunctionName) {
        case 'init':
            arg1 = new IgPlugOptions(arg1 || {});
            for (i = 0; i < numPlugs; i += 1) {
                this[i].setAttribute('igPluginName', 'igPlug');
                $.data(this[i], 'igPlug', new IgPlug(this[i], arg1));
            }
            return this;
        case 'refresh':
            for (i = 0; i < numPlugs; i += 1) {
                $.data(this[i], 'igPlug').refresh();
            }
            return this;
        case 'getLocation':
            if (numPlugs === 1) {
                return $.data(this[0], 'igPlug').getLocation();
            }
            if (numPlugs > 1) {
                console.log('IgPlug.js: Function "getLocation" can only operate on one element!');
                debugger;
            }
            return 0;
        case 'getMaxInnerBounds':
            if (numPlugs === 1) {
                return $.data(this[0], 'igPlug').getMaxInnerBounds();
            }
            if (numPlugs > 1) {
                console.log('IgPlug.js: Function "getMaxInnerBounds" can only operate on one element!');
                debugger;
            }
            return {height: 0, width: 0};
        case 'getConnectionPoint':
            if (numPlugs === 1) {
                return $.data(this[0], 'igPlug').getConnectionPoint();
            }
            if (numPlugs > 1) {
                console.log('IgPlug.js: Function "getConnectionPoint" can only operate on one element!');
                debugger;
            }
            return {x: 0, y: 0};
        case 'getConnectionDirection':
            if (numPlugs === 1) {
                return $.data(this[0], 'igPlug').getConnectionDirection();
            }
            if (numPlugs > 1) {
                console.log('IgPlug.js: Function "getConnectionDirection" can only operate on one element!');
                debugger;
            }
            return {x: 0, y: 0};
        case 'getHandle':
            if (numPlugs === 1) {
                return $.data(this[0], 'igPlug').elements.handle;
            }
            if (numPlugs > 1) {
                console.log('IgPlug.js: Function "getHandle" can only operate on one element!');
                debugger;
            }
            return this[0];
        case 'setInnerWidth':
            arg1 = Math.floor(arg1 || 0);
            for (i = 0; i < numPlugs; i += 1) {
                $.data(this[i], 'igPlug').setInnerWidth(arg1);
            }
            return this;
        case 'setOffset':
            arg1 = Math.floor(arg1 || 0);
            for (i = 0; i < numPlugs; i += 1) {
                $.data(this[i], 'igPlug').setOffset(arg1);
            }
            return this;
        case 'setConnected':
            for (i = 0; i < numPlugs; i += 1) {
                $.data(this[i], 'igPlug').setConnected();
            }
            return this;
        case 'clearConnected':
            for (i = 0; i < numPlugs; i += 1) {
                $.data(this[i], 'igPlug').clearConnected();
            }
            return this;
        case 'getConnected':
            if (numPlugs === 1) {
                return $.data(this[0], 'igPlug').getConnected();
            }
            if (numPlugs > 1) {
                console.log('IgPlug.js: Function "getHandle" can only operate on one element!');
                debugger;
            }
            return false;
        }
        if (typeof memberFunctionName === 'string') {
            console.log('IgPlug.js: Function "' + memberFunctionName + '" does not exist!');
        } else {
            console.log('IgPlug.js: No member function name specified!');
        }
        debugger;
        return this;
    };
}(jQuery));