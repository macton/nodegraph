;/*jslint browser: true, devel: true, debug: true */
(function ($) {
    'use strict';
    var IgConnectionOptions = function (options) {
            this.connectionClass = String(options.connectionClass || '');
            this.controlPointDistance = parseFloat(options.controlPointDistance || 15);
            this.markerEnd = options.markerEnd === true ? true : false;
            this.markerEndClass = String(options.markerEndClass || '');
            this.markerSize = parseFloat(options.markerSize || 16);
            this.markerStart = options.markerStart === true ? true : false;
            this.markerStartClass = String(options.markerStartClass || '');
            this.pathPadding = parseFloat(options.pathPadding || 10);
            this.pathType = String(options.pathType || 's-curve');
            Object.seal(this);
        },
        IgConnection = function (parent, options) {
            var markerSize2 = options.markerSize / 2,
                markerSize4 = options.markerSize / 4,
                markerPath = 'M 0 0 L ' + markerSize2 + ' -' + markerSize4 + ' L ' + markerSize2 + ' ' + markerSize4 + ' Z';
            this.endDirectionX = 0;
            this.endDirectionY = 0;
            this.endX = 0;
            this.endY = 0;
            this.elements = {
                documentFragment: document.createDocumentFragment(),
                markerEnd: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                markerStart: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                parent: parent,
                path: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                pathPadded: document.createElementNS('http://www.w3.org/2000/svg', 'path')
            };
            this.options = options;
            this.startDirectionX = 0;
            this.startDirectionY = 0;
            this.startX = 0;
            this.startY = 0;
            Object.seal(this);
            if (this.options.connectionClass) {
                this.elements.path.setAttribute('class', this.options.connectionClass);
                this.elements.pathPadded.setAttribute('class', this.options.connectionClass);
            }
            if (this.options.markerStartClass) {
                this.elements.markerStart.setAttribute('class', this.options.markerStartClass);
            }
            if (this.options.markerEndClass) {
                this.elements.markerEnd.setAttribute('class', this.options.markerEndClass);
            }
            this.elements.markerStart.setAttribute('d', markerPath);
            this.elements.markerEnd.setAttribute('d', markerPath);
            this.elements.documentFragment.appendChild(this.elements.markerStart);
            this.elements.documentFragment.appendChild(this.elements.markerEnd);
            this.elements.parent.appendChild(this.elements.pathPadded);
            this.elements.parent.appendChild(this.elements.path);
        };
    IgConnection.prototype.drawLine = function (startX, startY, endX, endY) {
        this.elements.path.setAttribute('d', 'M ' + startX + ' ' + startY + ' L ' + endX + ' ' + endY);
        this.elements.pathPadded.setAttribute('d', 'M ' + startX + ' ' + startY + ' L ' + endX + ' ' + endY);
    };
    IgConnection.prototype.drawCurve = function (startX, startY, endX, endY) {
        var dx = endX - startX,
            dy = endY - startY,
            d = Math.sqrt(dx * dx + dy * dy),
            mx = (startX + endX) / 2,
            my = (startY + endY) / 2,
            cpx = mx,
            cpy = my;
        if (d > 0) {
            dx = dx * this.options.controlPointDistance / d;
            dy = dy * this.options.controlPointDistance / d;
        }
        cpx -= dx;
        cpy += dy;
        this.elements.path.setAttribute('d', 'M ' + startX + ' ' + startY + ' C ' + cpx + ' ' + cpy + ' ' + cpx + ' ' + cpy + ' ' + endX + ' ' + endY);
        this.elements.pathPadded.setAttribute('d', 'M ' + startX + ' ' + startY + ' C ' + cpx + ' ' + cpy + ' ' + cpx + ' ' + cpy + ' ' + endX + ' ' + endY);
    };
    IgConnection.prototype.drawSCurveDefault = function (x1, y1, cpx1, cpy1, x2, y2, cpx2, cpy2) {
        var mx = (cpx1 + cpx2) / 2,
            my = (cpy1 + cpy2) / 2,
            data = 'M ' + x1 + ' ' + y1;
        data += ' C ' + cpx1 + ' ' + cpy1 + ' ' + cpx1 + ' ' + cpy1 + ' ' + mx + ' ' + my;
        data += ' C ' + cpx2 + ' ' + cpy2 + ' ' + cpx2 + ' ' + cpy2 + ' ' + x2 + ' ' + y2;
        this.elements.path.setAttribute('d', data);
        this.elements.pathPadded.setAttribute('d', data);
    };
    IgConnection.prototype.drawSCurveNormal = function (x1, y1, cpx1, cpy1, x2, y2, cpx2, cpy2) {
        var dx = x2 - x1,
            dy = y2 - y1,
            distance = Math.sqrt(dx * dx + dy * dy),
            minDistance = this.options.controlPointDistance * 2,
            t;
        if (distance < minDistance) {
            t = distance / minDistance;
            cpx1 = x1 + t * (cpx1 - x1);
            cpy1 = y1 + t * (cpy1 - y1);
            cpx2 = x2 + t * (cpx2 - x2);
            cpy2 = y2 + t * (cpy2 - y2);
        }
        this.drawSCurveDefault(x1, y1, cpx1, cpy1, x2, y2, cpx2, cpy2);
    };
    IgConnection.prototype.drawSCurveSpecial = function (multiplier1, x1, y1, cpx1, cpy1, multiplier2, x2, y2, cpx2, cpy2) {
        var delta = Math.max(Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2);
        if (delta < (multiplier1 * (x1 - cpx1))) {
            cpx1 = x1 - multiplier1 * delta;
        }
        if (delta < (multiplier2 * (y2 - cpy2))) {
            cpy2 = y2 - multiplier2 * delta;
        }
        this.drawSCurveDefault(x1, y1, cpx1, cpy1, x2, y2, cpx2, cpy2);
    };
    IgConnection.prototype.drawSCurve = function (startX, startY, endX, endY) {
        var directionStart = this.getDirectionEnum(this.startDirectionX, this.startDirectionY),
            directionEnd = this.getDirectionEnum(this.endDirectionX, this.endDirectionY),
            startControlPointX = startX + this.startDirectionX * this.options.controlPointDistance,
            startControlPointY = startY + this.startDirectionY * this.options.controlPointDistance,
            endControlPointX = endX + this.endDirectionX * this.options.controlPointDistance,
            endControlPointY = endY + this.endDirectionY * this.options.controlPointDistance;
        if ((directionStart === 'left') && (directionEnd === 'up')) {
            this.drawSCurveSpecial(1, startX, startY, startControlPointX, startControlPointY, 1, endX, endY, endControlPointX, endControlPointY);
        } else if ((directionStart === 'left') && (directionEnd === 'down')) {
            this.drawSCurveSpecial(1, startX, startY, startControlPointX, startControlPointY, -1, endX, endY, endControlPointX, endControlPointY);
        } else if ((directionStart === 'right') && (directionEnd === 'up')) {
            this.drawSCurveSpecial(-1, startX, startY, startControlPointX, startControlPointY, 1, endX, endY, endControlPointX, endControlPointY);
        } else if ((directionStart === 'right') && (directionEnd === 'down')) {
            this.drawSCurveSpecial(-1, startX, startY, startControlPointX, startControlPointY, -1, endX, endY, endControlPointX, endControlPointY);
        } else if ((directionEnd === 'left') && (directionStart === 'up')) {
            this.drawSCurveSpecial(1, endX, endY, endControlPointX, endControlPointY, 1, startX, startY, startControlPointX, startControlPointY);
        } else if ((directionEnd === 'left') && (directionStart === 'down')) {
            this.drawSCurveSpecial(1, endX, endY, endControlPointX, endControlPointY, -1, startX, startY, startControlPointX, startControlPointY);
        } else if ((directionEnd === 'right') && (directionStart === 'up')) {
            this.drawSCurveSpecial(-1, endX, endY, endControlPointX, endControlPointY, 1, startX, startY, startControlPointX, startControlPointY);
        } else if ((directionEnd === 'right') && (directionStart === 'down')) {
            this.drawSCurveSpecial(-1, endX, endY, endControlPointX, endControlPointY, -1, startX, startY, startControlPointX, startControlPointY);
        } else {
            this.drawSCurveNormal(startX, startY, startControlPointX, startControlPointY, endX, endY, endControlPointX, endControlPointY);
        }
    };
    IgConnection.prototype.setupMarker = function (markerGroup, x, y, directionX, directionY) {
        var scale = parseFloat(getComputedStyle(this.elements.path).strokeWidth || '0'),
            angle = 180 * Math.atan(directionY / directionX) / Math.PI;
        if (directionX < 0) {
            angle += 180;
        }
        markerGroup.setAttribute('transform', 'translate(' + x + ', ' + y + ') rotate(' + angle + ') scale(' + scale + ', ' + scale + ')');
        this.elements.parent.appendChild(markerGroup);
        return {x: x + directionX * scale * this.options.markerSize / 2, y: y + directionY * scale * this.options.markerSize / 2};
    };
    IgConnection.prototype.refresh = function () {
        var startX = this.startX,
            startY = this.startY,
            endX = this.endX,
            endY = this.endY,
            newPoint;
        this.elements.pathPadded.style.strokeWidth = (parseFloat(getComputedStyle(this.elements.path).strokeWidth || '0') + this.options.pathPadding) + 'px';
        this.elements.pathPadded.style.strokeOpacity = 0;
        if (this.options.markerStart) {
            newPoint = this.setupMarker(this.elements.markerStart, startX, startY, this.startDirectionX, this.startDirectionY);
            startX = newPoint.x;
            startY = newPoint.y;
        } else {
            this.elements.documentFragment.appendChild(this.elements.markerStart);
        }
        if (this.options.markerEnd) {
            newPoint = this.setupMarker(this.elements.markerEnd, endX, endY, this.endDirectionX, this.endDirectionY);
            endX = newPoint.x;
            endY = newPoint.y;
        } else {
            this.elements.documentFragment.appendChild(this.elements.markerEnd);
        }
        switch (this.options.pathType) {
        case 'curve':
            this.drawCurve(startX, startY, endX, endY);
            break;
        case 's-curve':
            this.drawSCurve(startX, startY, endX, endY);
            break;
        default:
            this.drawLine(startX, startY, endX, endY);
            break;
        }
    };
    IgConnection.prototype.getDirectionEnum = function (x, y) {
        if ((x === 0) && (y === 0)) {
            return 'none';
        }
        if (y >= x) {
            if (y >= -x) {
                return 'down';
            }
            return 'left';
        }
        if (y >= -x) {
            return 'right';
        }
        return 'up';
    };
    IgConnection.prototype.setStartDirection = function (x, y) {
        var d = Math.sqrt(x * x + y * y);
        if (d > 0) {
            this.startDirectionX = x / d;
            this.startDirectionY = y / d;
        } else {
            this.startDirectionX = 0;
            this.startDirectionY = 0;
        }
    };
    IgConnection.prototype.setStartPoint = function (x, y) {
        this.startX = x;
        this.startY = y;
    };
    IgConnection.prototype.setEndDirection = function (x, y) {
        var d = Math.sqrt(x * x + y * y);
        if (d > 0) {
            this.endDirectionX = x / d;
            this.endDirectionY = y / d;
        } else {
            this.endDirectionX = 0;
            this.endDirectionY = 0;
        }
    };
    IgConnection.prototype.setEndPoint = function (x, y) {
        this.endX = x;
        this.endY = y;
    };
    $.fn.igConnection = function (memberFunctionName, arg1, arg2) {
        var i;
        switch (memberFunctionName) {
        case 'init':
            arg1 = new IgConnectionOptions(arg1 || {});
            for (i = 0; i < this.length; i += 1) {
                this[i].setAttribute('igPluginName', 'igConnection');
                $.data(this[i], 'igConnection', new IgConnection(this[i], arg1));
            }
            return this;
        case 'refresh':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igConnection').refresh();
            }
            return this;
        case 'getOptions':
            if (this.length === 1) {
                return $.data(this[0], 'igConnection').options;
            }
            if (this.length > 1) {
                console.log('IgConnection.js: Function "getOptions" can only operate on one element!');
                debugger;
            }
            return new IgConnectionOptions({});
        case 'getStartPoint':
            if (this.length === 1) {
                return {x: $.data(this[0], 'igConnection').startX, y: $.data(this[0], 'igConnection').startY};
            }
            if (this.length > 1) {
                console.log('IgConnection.js: Function "getStartPoint" can only operate on one element!');
                debugger;
            }
            return {x: 0, y: 0};
        case 'setStartPoint':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igConnection').setStartPoint(arg1, arg2);
            }
            return this;
        case 'getStartDirection':
            if (this.length === 1) {
                return {x: $.data(this[0], 'igConnection').startDirectionX, y: $.data(this[0], 'igConnection').startDirectionY};
            }
            if (this.length > 1) {
                console.log('IgConnection.js: Function "getStartDirection" can only operate on one element!');
                debugger;
            }
            return {x: 0, y: 0};
        case 'setStartDirection':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igConnection').setStartDirection(arg1, arg2);
            }
            return this;
        case 'showStartMarker':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igConnection').options.markerStart = arg1;
            }
            return this;
        case 'getEndPoint':
            if (this.length === 1) {
                return {x: $.data(this[0], 'igConnection').endX, y: $.data(this[0], 'igConnection').endY};
            }
            if (this.length > 1) {
                console.log('IgConnection.js: Function "getEndPoint" can only operate on one element!');
                debugger;
            }
            return {x: 0, y: 0};
        case 'setEndPoint':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igConnection').setEndPoint(arg1, arg2);
            }
            return this;
        case 'getEndDirection':
            if (this.length === 1) {
                return {x: $.data(this[0], 'igConnection').endDirectionX, y: $.data(this[0], 'igConnection').endDirectionY};
            }
            if (this.length > 1) {
                console.log('IgConnection.js: Function "getEndDirection" can only operate on one element!');
                debugger;
            }
            return {x: 0, y: 0};
        case 'setEndDirection':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igConnection').setEndDirection(arg1, arg2);
            }
            return this;
        case 'showEndMarker':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igConnection').options.markerEnd = arg1;
            }
            return this;
        case 'addClass':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igConnection').addClass(arg1);
            }
            return this;
        case 'removeClass':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igConnection').removeClass(arg1);
            }
            return this;
        }
        if (typeof memberFunctionName === 'string') {
            console.log('IgConnection.js: Function "' + memberFunctionName + '" does not exist!');
        } else {
            console.log('IgConnection.js: No member function name specified!');
        }
        debugger;
        return this;
    };
}(jQuery));