;/*jslint browser: true, devel: true, debug: true */
(function ($) {
    'use strict';
    var IgCommentOptions = function (options) {
            this.boundsPadding = parseFloat(options.boundsPadding || 5);
            this.classHandleBottomRight = String(options.classHandleBottomRight || '');
            this.classHandleTopLeft = String(options.classHandleTopLeft || '');
            this.classLabel = String(options.classLabel || '');
            this.classOutline = String(options.classOutline || '');
            this.cornerCurveSize = parseFloat(options.cornerCurveSize || 0);
            this.handleBottomRightSize = parseFloat(options.handleBottomRightSize || 25);
            this.handleTopLeftSize = parseFloat(options.handleTopLeftSize || 25);
            this.height = parseFloat(options.height || 100);
            this.label = String(options.label || '');
            this.outlinePadding = parseFloat(options.outlinePadding || 10);
            this.minHeight = parseFloat(options.minHeight || 30);
            this.minWidth = parseFloat(options.minWidth || 30);
            this.width = parseFloat(options.width || 100);
        },
        IgComment = function (parent, nodeGraph, options) {
            var comment = this;
            this.animationFrameData = {startWidth: 0, startHeight: 0, startPosX: 0, startPosY: 0, startMouseX: 0, startMouseY: 0, mouseX: 0, mouseY: 0};
            this.callbacks = {
                onMouseDownBottomRight: function (e) { comment.onMouseDownBottomRight(e); return false; },
                onMouseDownTopLeft: function (e) { comment.onMouseDownTopLeft(e); return false; },
                onMouseMove: function (e) { comment.onMouseMove(e); return false; },
                onMouseUpBottomRight: function () { comment.onMouseUpBottomRight(); return false; },
                onMouseUpTopLeft: function () { comment.onMouseUpTopLeft(); return false; },
                requestAnimationFrame: function () { comment.requestAnimationFrame(); }
            };
            this.elements = {
                boundingArea: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                handleBottomRight: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                handleTopLeft: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                outline: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                outlinePadded: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                plugGroup: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                root: parent,
                label: document.createElementNS('http://www.w3.org/2000/svg', 'text'),
                labelContent: document.createTextNode('')
            };
            this.nodeGraph = nodeGraph;
            this.options = options;
            Object.seal(this);
            if (this.options.classHandleBottomRight) {
                this.elements.handleBottomRight.setAttribute('class', this.options.classHandleBottomRight);
            }
            if (this.options.classHandleTopLeft) {
                this.elements.handleTopLeft.setAttribute('class', this.options.classHandleTopLeft);
            }
            if (this.options.classLabel) {
                this.elements.label.setAttribute('class', this.options.classLabel);
            }
            if (this.options.classOutline) {
                this.elements.outline.setAttribute('class', this.options.classOutline);
                this.elements.outlinePadded.setAttribute('class', this.options.classOutline);
            }
            this.elements.boundingArea.setAttribute('style', 'fill: none');
            this.elements.labelContent.nodeValue = this.options.label;
            this.elements.label.style.alignmentBaseline = 'before-edge';
            this.elements.label.setAttribute('y', 0);
            this.elements.label.appendChild(this.elements.labelContent);
            this.elements.root.appendChild(this.elements.boundingArea);
            this.elements.root.appendChild(this.elements.outlinePadded);
            this.elements.root.appendChild(this.elements.handleBottomRight);
            this.elements.root.appendChild(this.elements.handleTopLeft);
            this.elements.root.appendChild(this.elements.outline);
            this.elements.root.appendChild(this.elements.label);
            $(this.elements.handleBottomRight).on('mousedown', this.callbacks.onMouseDownBottomRight);
            $(this.elements.handleTopLeft).on('mousedown', this.callbacks.onMouseDownTopLeft);
        };
    IgComment.prototype.addClass = function (c) {
        var i,
            elements = [this.elements.outline, this.elements.handleBottomRight, this.elements.handleTopLeft],
            classList;
        for (i = 0; i < elements.length; i += 1) {
            classList = elements[i].getAttribute('class').match(/[\S]+/g);
            if (classList.indexOf(c) < 0) {
                classList.push(c);
                elements[i].setAttribute('class', classList.join(' '));
            }
        }
    };
    IgComment.prototype.removeClass = function (c) {
        var i,
            elements = [this.elements.outline, this.elements.handleBottomRight, this.elements.handleTopLeft],
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
    IgComment.prototype.requestAnimationFrame = function () {
        var dx = this.animationFrameData.mouseX - this.animationFrameData.startMouseX,
            dy = this.animationFrameData.mouseY - this.animationFrameData.startMouseY;
        switch (this.animationFrameData.state) {
        case 'dragBottomRight':
            this.options.width = Math.round(Math.max(this.options.minWidth, this.options.handleBottomRightSize, this.options.handleTopLeftSize, this.options.cornerCurveSize, this.animationFrameData.startWidth + dx));
            this.options.height = Math.round(Math.max(this.options.minHeight, this.options.handleBottomRightSize, this.options.handleTopLeftSize, this.options.cornerCurveSize, this.animationFrameData.startHeight + dy));
            this.refresh();
            break;
        case 'dragTopLeft':
            this.options.width = Math.round(Math.max(this.options.minWidth, this.options.handleBottomRightSize, this.options.handleTopLeftSize, this.options.cornerCurveSize, this.animationFrameData.startWidth - dx));
            this.options.height = Math.round(Math.max(this.options.minHeight, this.options.handleBottomRightSize, this.options.handleTopLeftSize, this.options.cornerCurveSize, this.animationFrameData.startHeight - dy));
            this.nodeGraph[this.nodeGraph[0].getAttribute('igPluginName')]('setCommentPositionsImmediate', [$(this.elements.root)], [{x: this.animationFrameData.startPosX + this.animationFrameData.startWidth - this.options.width, y: this.animationFrameData.startPosY + this.animationFrameData.startHeight - this.options.height}]);
            this.refresh();
            break;
        }
    };
    IgComment.prototype.refresh = function () {
        var labelBoundingBox = this.elements.label.getBBox(),
            p = [
                {x: 0, y: 0},
                {x: this.options.cornerCurveSize, y: 0},
                {x: this.options.width - this.options.cornerCurveSize, y: 0},
                {x: this.options.width, y: 0},
                {x: this.options.width, y: this.options.cornerCurveSize},
                {x: this.options.width, y: this.options.height - this.options.cornerCurveSize},
                {x: this.options.width, y: this.options.height},
                {x: this.options.width - this.options.cornerCurveSize, y: this.options.height},
                {x: this.options.cornerCurveSize, y: this.options.height},
                {x: 0, y: this.options.height},
                {x: 0, y: this.options.height - this.options.cornerCurveSize},
                {x: 0, y: this.options.cornerCurveSize}
            ],
            bounds = {
                left: Math.min(0, labelBoundingBox.x) - this.options.boundsPadding,
                top: Math.min(0, labelBoundingBox.y) - this.options.boundsPadding,
                right: Math.max(labelBoundingBox.x + labelBoundingBox.width, this.options.width) + this.options.boundsPadding,
                bottom: Math.max(labelBoundingBox.y + labelBoundingBox.height, this.options.height) + this.options.boundsPadding
            },
            handleBottomRightSize = Math.max(this.options.handleBottomRightSize, this.options.cornerCurveSize),
            handleTopLeftSize = Math.max(this.options.handleTopLeftSize, this.options.cornerCurveSize),
            outlineData = 'M ' + p[1].x + ' ' + p[1].y,
            bottomRightData = 'M ' + (this.options.width - handleBottomRightSize) + ' ' + this.options.height,
            topLeftData = 'M ' + handleTopLeftSize + ' 0';
        outlineData += ' L ' + p[2].x + ' ' + p[2].y;
        outlineData += ' C ' + p[3].x + ' ' + p[3].y + ' ' + p[3].x + ' ' + p[3].y + ' ' + p[4].x + ' ' + p[4].y;
        outlineData += ' L ' + p[5].x + ' ' + p[5].y;
        outlineData += ' C ' + p[6].x + ' ' + p[6].y + ' ' + p[6].x + ' ' + p[6].y + ' ' + p[7].x + ' ' + p[7].y;
        outlineData += ' L ' + p[8].x + ' ' + p[8].y;
        outlineData += ' C ' + p[9].x + ' ' + p[9].y + ' ' + p[9].x + ' ' + p[9].y + ' ' + p[10].x + ' ' + p[10].y;
        outlineData += ' L ' + p[11].x + ' ' + p[11].y;
        outlineData += ' C ' + p[0].x + ' ' + p[0].y + ' ' + p[0].x + ' ' + p[0].y + ' ' + p[1].x + ' ' + p[1].y;
        outlineData += ' Z';
        bottomRightData += ' L ' + this.options.width + ' ' + (this.options.height - handleBottomRightSize);
        bottomRightData += ' L ' + this.options.width + ' ' + (this.options.height - this.options.cornerCurveSize);
        bottomRightData += ' C ' + this.options.width + ' ' + this.options.height + ' ' + this.options.width + ' ' + this.options.height + ' ' + (this.options.width - this.options.cornerCurveSize) + ' ' + this.options.height;
        bottomRightData += ' Z';
        topLeftData += ' L 0 ' + handleTopLeftSize;
        topLeftData += ' L 0 ' + this.options.cornerCurveSize;
        topLeftData += ' C 0 0 0 0 ' + this.options.cornerCurveSize + ' 0';
        topLeftData += ' Z';
        this.elements.boundingArea.setAttribute('d', 'M ' + bounds.left + ' ' + bounds.top + ' L ' + bounds.right + ' ' + bounds.top + ' ' + bounds.right + ' ' + bounds.bottom + ' ' + bounds.left + ' ' + bounds.bottom + ' Z');
        this.elements.outline.setAttribute('d', outlineData);
        this.elements.outlinePadded.setAttribute('d', outlineData);
        this.elements.outlinePadded.style.strokeWidth = (parseFloat(getComputedStyle(this.elements.outline).strokeWidth || '0') + this.options.outlinePadding) + 'px';
        this.elements.outlinePadded.style.strokeOpacity = 0;
        this.elements.handleBottomRight.setAttribute('d', bottomRightData);
        this.elements.handleTopLeft.setAttribute('d', topLeftData);
        this.elements.label.setAttribute('y', -this.elements.label.getBBox().height);
        switch (getComputedStyle(this.elements.label).textAnchor) {
        case 'middle':
            this.elements.label.setAttribute('x', this.options.width / 2);
            break;
        case 'end':
            this.elements.label.setAttribute('x', this.options.width);
            break;
        default:
            this.elements.label.setAttribute('x', 0);
            break;
        }
    };
    IgComment.prototype.setupDrag = function (e) {
        var nodeGraphPlugin = this.nodeGraph[0].getAttribute('igPluginName'),
            point = {x: e.pageX, y: e.pageY},
            position = this.nodeGraph[nodeGraphPlugin]('freezeMouse')[nodeGraphPlugin]('screenSpaceToWorldSpace', [point])[nodeGraphPlugin]('getCommentPositions', [$(this.elements.root)])[0];
        e.stopPropagation();
        this.animationFrameData.startWidth = this.options.width;
        this.animationFrameData.startHeight = this.options.height;
        this.animationFrameData.startPosX = position.x;
        this.animationFrameData.startPosY = position.y;
        this.animationFrameData.startMouseX = point.x;
        this.animationFrameData.startMouseY = point.y;
        this.animationFrameData.mouseX = this.animationFrameData.startMouseX;
        this.animationFrameData.mouseY = this.animationFrameData.startMouseY;
    };
    IgComment.prototype.onMouseDownBottomRight = function (e) {
        this.setupDrag(e);
        this.animationFrameData.state = 'dragBottomRight';
        $(window).on('mousemove', this.callbacks.onMouseMove).on('mouseup', this.callbacks.onMouseUpBottomRight);
    };
    IgComment.prototype.onMouseDownTopLeft = function (e) {
        this.setupDrag(e);
        this.animationFrameData.state = 'dragTopLeft';
        $(window).on('mousemove', this.callbacks.onMouseMove).on('mouseup', this.callbacks.onMouseUpTopLeft);
    };
    IgComment.prototype.onMouseMove = function (e) {
        var point = {x: e.pageX, y: e.pageY};
        this.nodeGraph[this.nodeGraph[0].getAttribute('igPluginName')]('screenSpaceToWorldSpace', [point]);
        this.animationFrameData.mouseX = point.x;
        this.animationFrameData.mouseY = point.y;
        window.requestAnimationFrame(this.callbacks.requestAnimationFrame);
    };
    IgComment.prototype.onMouseUpBottomRight = function () {
        var nodeGraphPlugin = this.nodeGraph[0].getAttribute('igPluginName');
        this.nodeGraph[nodeGraphPlugin]('thawMouse')[nodeGraphPlugin]('recalculateBounds');
        this.animationFrameData.state = 'none';
        $(window).off('mousemove', this.callbacks.onMouseMove).off('mouseup', this.callbacks.onMouseUpBottomRight);
    };
    IgComment.prototype.onMouseUpTopLeft = function () {
        var nodeGraphPlugin = this.nodeGraph[0].getAttribute('igPluginName');
        this.nodeGraph[nodeGraphPlugin]('thawMouse')[nodeGraphPlugin]('recalculateBounds');
        this.animationFrameData.state = 'none';
        $(window).off('mousemove', this.callbacks.onMouseMove).off('mouseup', this.callbacks.onMouseUpTopLeft);
    };
    $.fn.igComment = function (memberFunctionName, arg1, arg2) {
        var i;
        switch (memberFunctionName) {
        case 'init':
            arg2 = new IgCommentOptions(arg2 || {});
            for (i = 0; i < this.length; i += 1) {
                this[i].setAttribute('igPluginName', 'igComment');
                $.data(this[i], 'igComment', new IgComment(this[i], arg1, arg2));
            }
            return this;
        case 'refresh':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igComment').refresh();
            }
            return this;
        case 'select':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igComment').addClass('selected');
            }
            return this;
        case 'deselect':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igComment').removeClass('selected');
            }
            return this;
        case 'hover':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igComment').addClass('hover');
            }
            return this;
        case 'clearHover':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igComment').removeClass('hover');
            }
            return this;
        }
        if (typeof memberFunctionName === 'string') {
            console.log('IgComment.js: Function "' + memberFunctionName + '" does not exist!');
        } else {
            console.log('IgComment.js: No member function name specified!');
        }
        debugger;
        return this;
    };
}(jQuery));