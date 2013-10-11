;/*jslint browser: true, devel: true, debug: true */
(function ($) {
    'use strict';
    var IgNodeOptions = function (options) {
            this.autoSize = options.autoSize === undefined ? true : (options.autoSize ? true : false);
            this.borderRadiusBottomLeft = parseFloat(options.borderRadiusBottomLeft || 5);
            this.borderRadiusBottomRight = parseFloat(options.borderRadiusBottomRight || 5);
            this.borderRadiusTopLeft = parseFloat(options.borderRadiusTopLeft || 5);
            this.borderRadiusTopRight = parseFloat(options.borderRadiusTopRight || 5);
            this.classNode = String(options.classNode || '');
            this.classNodeOutline = String(options.classNodeOutline || '');
            this.classNodeSelectionBorderInner = String(options.classNodeSelectionBorderInner || '');
            this.classNodeSelectionBorderOuter = String(options.classNodeSelectionBorderOuter || '');
            this.classNodeTitle = String(options.classNodeTitle || '');
            this.classNodeTitleBar = String(options.classNodeTitleBar || '');
            this.classNodeTitleBarOutline = String(options.classNodeTitleBarOutline || this.classNodeOutline);
            this.highlightBrightColor = String(options.highlightBrightColor || '#ffffff');
            this.highlightBrightOpacity = parseFloat(options.highlightBrightOpacity || 0.5);
            this.highlightBrightWidth = parseFloat(options.highlightBrightWidth || 1);
            this.highlightDarkColor = String(options.highlightDarkColor || '#000000');
            this.highlightDarkOpacity = parseFloat(options.highlightDarkOpacity || 0.15);
            this.highlightDarkWidth = parseFloat(options.highlightDarkWidth || 1);
            this.minHeight = parseFloat(options.minHeight || 33);
            this.minWidth = parseFloat(options.minWidth || 25);
            this.plugPadding = parseFloat(options.plugPadding || 3);
            this.title = String(options.title || '');
            this.titleBarImagePadding = parseFloat(options.titleBarImagePadding || 3);
            this.titleBarHeight = parseFloat(options.titleBarHeight || 20);
            Object.seal(this);
        },
        IgNode = function (parent, options) {
            this.elements = {
                background: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                highlightBright: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                highlightDark: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                imageGroup: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                outline: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                plugGroup: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                root: parent,
                selectionBorderGroup: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                selectionBorderInner: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                selectionBorderOuter: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                title: document.createElementNS('http://www.w3.org/2000/svg', 'text'),
                titleBar: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                titleBarGroupLeft: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                titleBarGroupRight: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                titleBarOutline: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                titleContent: document.createTextNode(''),
                titleSvg: document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            };
            this.height = options.minHeight;
            this.options = options;
            this.plugId = 0;
            this.plugData = {};
            this.width = options.minWidth;
            Object.seal(this);
            if (this.options.classNode) {
                this.elements.background.setAttribute('class', this.options.classNode);
            }
            if (this.options.classNodeOutline) {
                this.elements.outline.setAttribute('class', this.options.classNodeOutline);
            }
            if (this.options.classNodeTitle) {
                this.elements.title.setAttribute('class', this.options.classNodeTitle);
            }
            if (this.options.classNodeTitleBar) {
                this.elements.titleBar.setAttribute('class', this.options.classNodeTitleBar);
            }
            if (this.options.classNodeTitleBarOutline) {
                this.elements.titleBarOutline.setAttribute('class', this.options.classNodeTitleBarOutline);
            }
            this.elements.highlightBright.setAttribute('fill', 'none');
            this.elements.highlightBright.setAttribute('stroke', this.options.highlightBrightColor);
            this.elements.highlightBright.setAttribute('stroke-opacity', this.options.highlightBrightOpacity);
            this.elements.highlightBright.setAttribute('stroke-width', this.options.highlightBrightWidth);
            this.elements.highlightDark.setAttribute('fill', 'none');
            this.elements.highlightDark.setAttribute('stroke', this.options.highlightDarkColor);
            this.elements.highlightDark.setAttribute('stroke-opacity', this.options.highlightDarkOpacity);
            this.elements.highlightDark.setAttribute('stroke-width', this.options.highlightDarkWidth);
            this.elements.titleContent.nodeValue = this.options.title;
            this.elements.title.style.alignmentBaseline = 'before-edge';
            this.elements.title.setAttribute('y', 0);
            this.elements.title.appendChild(this.elements.titleContent);
            this.elements.titleSvg.appendChild(this.elements.title);
            this.elements.selectionBorderGroup.appendChild(this.elements.selectionBorderOuter);
            this.elements.selectionBorderGroup.appendChild(this.elements.selectionBorderInner);
            parent.appendChild(this.elements.selectionBorderGroup);
            parent.appendChild(this.elements.background);
            parent.appendChild(this.elements.titleBar);
            parent.appendChild(this.elements.titleBarOutline);
            parent.appendChild(this.elements.titleSvg);
            parent.appendChild(this.elements.highlightDark);
            parent.appendChild(this.elements.highlightBright);
            parent.appendChild(this.elements.outline);
            parent.appendChild(this.elements.plugGroup);
            parent.appendChild(this.elements.imageGroup);
            parent.appendChild(this.elements.titleBarGroupLeft);
            parent.appendChild(this.elements.titleBarGroupRight);
        };
    IgNode.prototype.setOutlineGroupClass = function (element, elementClass) {
        var i;
        if (element.childNodes.length < 1) {
            return;
        }
        if (element.childNodes[0].getAttribute('class') !== elementClass) {
            element.childNodes[0].setAttribute('class', elementClass);
        }
        for (i = 1; i < element.childNodes.length; i += 1) {
            if (element.childNodes[i].childNodes[0].getAttribute('class') !== elementClass) {
                element.childNodes[i].childNodes[0].setAttribute('class', elementClass);
            }
        }
    };
    IgNode.prototype.setOutlineClass = function (additionalClassString) {
        var innerClass = additionalClassString ? this.options.classNodeSelectionBorderInner + ' ' + additionalClassString : this.options.classNodeSelectionBorderInner,
            outerClass = additionalClassString ? this.options.classNodeSelectionBorderOuter + ' ' + additionalClassString : this.options.classNodeSelectionBorderOuter;
        this.setOutlineGroupClass(this.elements.selectionBorderInner, innerClass);
        this.setOutlineGroupClass(this.elements.selectionBorderOuter, outerClass);
    };
    IgNode.prototype.addTitleBarImages = function (group, images) {
        var i;
        for (i = 0; i < images.length; i += 1) {
            group.appendChild(images[i]);
        }
    };
    IgNode.prototype.addImages = function (images) {
        var i;
        for (i = 0; i < images.length; i += 1) {
            this.elements.imageGroup.appendChild(images[i]);
        }
    };
    IgNode.prototype.addPlugs = function (plugs) {
        var i,
            plugId;
        for (i = 0; i < plugs.length; i += 1) {
            this.plugId += 1;
            plugId = 'plug ' + this.plugId;
            plugs[i][0].setAttribute('igNodeId', plugId);
            this.plugData[plugId] = {x: 0, y: 0};
            this.elements.plugGroup.appendChild(plugs[i][0]);
        }
    };
    IgNode.prototype.removePlugs = function (plugs) {
        var i;
        for (i = 0; i < plugs.length; i += 1) {
            this.elements.plugGroup.removeChild(plugs[i][0]);
        }
    };
    IgNode.prototype.getPlugConnectionPoints = function (plugs) {
        var i,
            plugData,
            connectionPoints = [];
        for (i = 0; i < plugs.length; i += 1) {
            connectionPoints.push(plugs[i][plugs[i][0].getAttribute('igPluginName')]('getConnectionPoint'));
            plugData = this.plugData[plugs[i][0].getAttribute('igNodeId')];
            connectionPoints[i].x += plugData.x;
            connectionPoints[i].y += plugData.y;
        }
        return connectionPoints;
    };
    IgNode.prototype.getRefreshData = function () {
        var i,
            plug,
            bounds,
            boundingBox,
            refreshData = {
                autoWidth: 0,
                autoHeight: 0,
                leftPlugs: [],
                leftPlugHeight: 0,
                rightPlugs: [],
                rightPlugHeight: 0,
                topPlugs: [],
                topPlugWidth: 0,
                bottomPlugs: [],
                bottomPlugWidth: 0,
                titleHeight: this.elements.titleSvg.getBBox().height,
                titleBarLeftBoundingBoxes: [],
                titleBarRightBoundingBoxes: [],
                titleBarElementWidth: this.elements.title.getComputedTextLength() + 2 * this.options.titleBarImagePadding,
                imageBoundingBoxes: [],
                imageAndPlugsWidth: this.options.plugPadding * 2,
                imageAndPlugsHeight: this.options.titleBarHeight + this.options.plugPadding,
                maxLeftLabelWidth: 0,
                maxLeftLabelHeight: 0,
                maxRightLabelWidth: 0,
                maxRightLabelHeight: 0,
                maxTopLabelWidth: 0,
                maxTopLabelHeight: 0,
                maxBottomLabelWidth: 0,
                maxBottomLabelHeight: 0,
                maxImageWidth: 0
            };
        for (i = 0; i < this.elements.plugGroup.childNodes.length; i += 1) {
            plug = $(this.elements.plugGroup.childNodes[i]);
            bounds = plug[plug[0].getAttribute('igPluginName')]('getMaxInnerBounds');
            switch (plug[plug[0].getAttribute('igPluginName')]('getLocation')) {
            case 'left':
                refreshData.leftPlugs.push(plug[0]);
                refreshData.maxLeftLabelWidth = Math.max(refreshData.maxLeftLabelWidth, bounds.width);
                refreshData.maxLeftLabelHeight = Math.max(refreshData.maxLeftLabelHeight, bounds.height);
                break;
            case 'right':
                refreshData.rightPlugs.push(plug[0]);
                refreshData.maxRightLabelWidth = Math.max(refreshData.maxRightLabelWidth, bounds.width);
                refreshData.maxRightLabelHeight = Math.max(refreshData.maxRightLabelHeight, bounds.height);
                break;
            case 'top':
                refreshData.topPlugs.push(plug[0]);
                refreshData.maxTopLabelWidth = Math.max(refreshData.maxTopLabelWidth, bounds.width);
                refreshData.maxTopLabelHeight = Math.max(refreshData.maxTopLabelHeight, bounds.height);
                break;
            case 'bottom':
                refreshData.bottomPlugs.push(plug[0]);
                refreshData.maxBottomLabelWidth = Math.max(refreshData.maxBottomLabelWidth, bounds.width);
                refreshData.maxBottomLabelHeight = Math.max(refreshData.maxBottomLabelHeight, bounds.height);
                break;
            }
        }
        for (i = 0; i < this.elements.titleBarGroupLeft.childNodes.length; i += 1) {
            boundingBox = this.elements.titleBarGroupLeft.childNodes[i].getBBox();
            refreshData.titleBarLeftBoundingBoxes.push(boundingBox);
            refreshData.titleBarElementWidth += boundingBox.width + this.options.titleBarImagePadding;
        }
        for (i = 0; i < this.elements.titleBarGroupRight.childNodes.length; i += 1) {
            boundingBox = this.elements.titleBarGroupRight.childNodes[i].getBBox();
            refreshData.titleBarRightBoundingBoxes.push(boundingBox);
            refreshData.titleBarElementWidth += boundingBox.width + this.options.titleBarImagePadding;
        }
        for (i = 0; i < this.elements.imageGroup.childNodes.length; i += 1) {
            boundingBox = this.elements.imageGroup.childNodes[i].getBBox();
            refreshData.imageBoundingBoxes.push(boundingBox);
            refreshData.maxImageWidth = Math.max(refreshData.maxImageWidth, boundingBox.width);
            refreshData.imageAndPlugsHeight += boundingBox.height + this.options.plugPadding;
        }
        refreshData.leftPlugHeight = this.options.titleBarHeight + refreshData.maxTopLabelHeight + (refreshData.leftPlugs.length + 1) * (refreshData.maxLeftLabelHeight + this.options.plugPadding) + refreshData.maxBottomLabelHeight;
        refreshData.rightPlugHeight = this.options.titleBarHeight + refreshData.maxTopLabelHeight + (refreshData.rightPlugs.length + 1) * (refreshData.maxRightLabelHeight + this.options.plugPadding) + refreshData.maxBottomLabelHeight;
        refreshData.topPlugWidth = (refreshData.topPlugs.length + 1) * (refreshData.maxTopLabelWidth + this.options.plugPadding);
        refreshData.bottomPlugWidth = (refreshData.bottomPlugs.length + 1) * (refreshData.maxBottomLabelWidth + this.options.plugPadding);
        refreshData.imageAndPlugsWidth += refreshData.maxLeftLabelWidth + refreshData.maxImageWidth + refreshData.maxRightLabelWidth;
        refreshData.imageAndPlugsHeight += refreshData.maxTopLabelHeight + refreshData.maxBottomLabelHeight;
        refreshData.autoWidth = Math.max(this.options.minWidth, refreshData.titleBarElementWidth, refreshData.topPlugWidth, refreshData.imageAndPlugsWidth, refreshData.bottomPlugWidth);
        refreshData.autoHeight = Math.max(this.options.minHeight, refreshData.leftPlugHeight, refreshData.imageAndPlugsHeight, refreshData.rightPlugHeight);
        return refreshData;
    };
    IgNode.prototype.clearSelectionBorder = function () {
        while (this.elements.selectionBorderInner.childNodes.length) {
            this.elements.selectionBorderInner.removeChild(this.elements.selectionBorderInner.childNodes[0]);
        }
        while (this.elements.selectionBorderOuter.childNodes.length) {
            this.elements.selectionBorderOuter.removeChild(this.elements.selectionBorderOuter.childNodes[0]);
        }
    };
    IgNode.prototype.generatePoints = function (x1, y1, x2, y2, borderRadiusTopLeft, borderRadiusTopRight, borderRadiusBottomLeft, borderRadiusBottomRight) {
        var curveOffset = 0.35,
            points = [
                { x: x1 + borderRadiusTopLeft, y: y1 },
                { x: x2 - borderRadiusTopRight, y: y1 },
                { x: x2 - borderRadiusTopRight * curveOffset, y: y1 },
                { x: x2, y: y1 + borderRadiusTopRight * curveOffset },
                { x: x2, y: y1 + borderRadiusTopRight },
                { x: x2, y: y2 - borderRadiusBottomRight },
                { x: x2, y: y2 - borderRadiusBottomRight * curveOffset },
                { x: x2 - borderRadiusBottomRight * curveOffset, y: y2 },
                { x: x2 - borderRadiusBottomRight, y: y2 },
                { x: x1 + borderRadiusBottomLeft, y: y2 },
                { x: x1 + borderRadiusBottomLeft * curveOffset, y: y2 },
                { x: x1, y: y2 - borderRadiusBottomLeft * curveOffset },
                { x: x1, y: y2 - borderRadiusBottomLeft },
                { x: x1, y: y1 + borderRadiusTopLeft },
                { x: x1, y: y1 + borderRadiusTopLeft * curveOffset },
                { x: x1 + borderRadiusTopLeft * curveOffset, y: y1 },
                { x: x1, y: this.options.titleBarHeight },
                { x: x2, y: this.options.titleBarHeight }
            ];
        return points;
    };
    IgNode.prototype.positionBackgroundAndTitleBar = function () {
        var highlightBrightSize2 = this.options.highlightBrightWidth / 2,
            highlightDarkSize2 = this.options.highlightDarkWidth / 2,
            hBright = this.generatePoints(highlightBrightSize2, highlightBrightSize2, this.width - highlightBrightSize2, this.height - highlightBrightSize2, this.options.borderRadiusTopLeft - highlightBrightSize2, this.options.borderRadiusTopRight - highlightBrightSize2, this.options.borderRadiusBottomLeft - highlightBrightSize2, this.options.borderRadiusBottomRight - highlightBrightSize2),
            hDark = this.generatePoints(highlightDarkSize2, highlightDarkSize2, this.width - highlightDarkSize2, this.height - highlightDarkSize2, this.options.borderRadiusTopLeft - highlightDarkSize2, this.options.borderRadiusTopRight - highlightDarkSize2, this.options.borderRadiusBottomLeft - highlightDarkSize2, this.options.borderRadiusBottomRight - highlightDarkSize2),
            p = this.generatePoints(0, 0, this.width, this.height, this.options.borderRadiusTopLeft, this.options.borderRadiusTopRight, this.options.borderRadiusBottomLeft, this.options.borderRadiusBottomRight),
            outlineData = 'M ' + p[0].x + ' ' + p[0].y + ' ',
            titleBarData = 'M ' + p[0].x + ' ' + p[0].y + ' ',
            highlightBrightData = 'M ' + hBright[16].x + ' ' + hBright[16].y + ' ',
            highlightDarkData = 'M ' + hDark[4].x + ' ' + hDark[4].y + ' ';
        outlineData += ' L ' + p[1].x + ' ' + p[1].y;
        outlineData += ' C ' + p[2].x + ' ' + p[2].y + ' ' + p[3].x + ' ' + p[3].y + ' ' + p[4].x + ' ' + p[4].y;
        outlineData += ' L ' + p[5].x + ' ' + p[5].y;
        outlineData += ' C ' + p[6].x + ' ' + p[6].y + ' ' + p[7].x + ' ' + p[7].y + ' ' + p[8].x + ' ' + p[8].y;
        outlineData += ' L ' + p[9].x + ' ' + p[9].y;
        outlineData += ' C ' + p[10].x + ' ' + p[10].y + ' ' + p[11].x + ' ' + p[11].y + ' ' + p[12].x + ' ' + p[12].y;
        outlineData += ' L ' + p[13].x + ' ' + p[13].y;
        outlineData += ' C ' + p[14].x + ' ' + p[14].y + ' ' + p[15].x + ' ' + p[15].y + ' ' + p[0].x + ' ' + p[0].y;
        outlineData += ' Z';
        titleBarData += ' L ' + p[1].x + ' ' + p[1].y;
        titleBarData += ' C ' + p[2].x + ' ' + p[2].y + ' ' + p[3].x + ' ' + p[3].y + ' ' + p[4].x + ' ' + p[4].y;
        titleBarData += ' L ' + p[17].x + ' ' + p[17].y;
        titleBarData += ' L ' + p[16].x + ' ' + p[16].y;
        titleBarData += ' L ' + p[13].x + ' ' + p[13].y;
        titleBarData += ' C ' + p[14].x + ' ' + p[14].y + ' ' + p[15].x + ' ' + p[15].y + ' ' + p[0].x + ' ' + p[0].y;
        titleBarData += ' Z';
        highlightBrightData += ' L ' + hBright[13].x + ' ' + hBright[13].y;
        highlightBrightData += ' C ' + hBright[14].x + ' ' + hBright[14].y + ' ' + hBright[15].x + ' ' + hBright[15].y + ' ' + hBright[0].x + ' ' + hBright[0].y;
        highlightBrightData += ' L ' + hBright[1].x + ' ' + hBright[1].y;
        highlightDarkData += ' L ' + hDark[17].x + ' ' + hDark[17].y;
        this.elements.background.setAttribute('d', outlineData);
        this.elements.outline.setAttribute('d', outlineData);
        this.elements.titleBar.setAttribute('d', titleBarData);
        this.elements.titleBarOutline.setAttribute('d', 'M ' + p[16].x + ' ' + (p[16].y - 0.5) + ' L ' + p[17].x + ' ' + (p[17].y - 0.5));
        this.elements.highlightBright.setAttribute('d', highlightBrightData);
        this.elements.highlightDark.setAttribute('d', highlightDarkData);
    };
    IgNode.prototype.positionTitleBarElements = function (refreshData) {
        var i,
            imageLeftX = this.options.titleBarImagePadding,
            imageRightX = this.width - this.options.titleBarImagePadding,
            boundingBox;
        for (i = 0; i < this.elements.titleBarGroupLeft.childNodes.length; i += 1) {
            boundingBox = refreshData.titleBarLeftBoundingBoxes[i];
            this.elements.titleBarGroupLeft.childNodes[i].setAttribute('x', imageLeftX);
            this.elements.titleBarGroupLeft.childNodes[i].setAttribute('y', Math.round((this.options.titleBarHeight - boundingBox.height) / 2));
            imageLeftX += boundingBox.width + this.options.titleBarImagePadding;
        }
        for (i = this.elements.titleBarGroupRight.childNodes.length - 1; i >= 0; i -= 1) {
            boundingBox = refreshData.titleBarRightBoundingBoxes[i];
            imageRightX -= boundingBox.width;
            this.elements.titleBarGroupRight.childNodes[i].setAttribute('x', imageRightX);
            this.elements.titleBarGroupRight.childNodes[i].setAttribute('y', Math.round((this.options.titleBarHeight - boundingBox.height) / 2));
            imageRightX -= this.options.titleBarImagePadding;
        }
        this.elements.titleSvg.setAttribute('y', Math.round((this.options.titleBarHeight - refreshData.titleHeight) / 2));
        this.elements.titleSvg.setAttribute('width', imageRightX - imageLeftX);
        this.elements.titleSvg.setAttribute('x', imageLeftX);
        switch (getComputedStyle(this.elements.title).textAnchor) {
        case 'middle':
            this.elements.title.setAttribute('x', (imageRightX - imageLeftX) / 2);
            break;
        case 'end':
            this.elements.title.setAttribute('x', imageRightX - imageLeftX);
            break;
        default:
            this.elements.title.setAttribute('x', 0);
            break;
        }
    };
    IgNode.prototype.positionPlugsAndImages = function (refreshData) {
        var i,
            leftLabelWidth,
            rightLabelWidth,
            topLabelWidth = this.width / (refreshData.topPlugs.length + 1),
            bottomLabelWidth = this.width / (refreshData.bottomPlugs.length + 1),
            totalLabelWidth,
            plugLeftEnd,
            plugRightEnd,
            plugTopEnd,
            plugBottomEnd,
            pluginName,
            plug,
            plugX,
            plugY,
            totalWidth,
            imageMaxWidth = 0,
            imageMaxHeight = 0,
            imageHeight = 0,
            imageX,
            imageY,
            outlineHalfStrokeWidth = parseFloat(getComputedStyle(this.elements.outline).strokeWidth || 0) / 2;
        for (i = 0; i < this.elements.imageGroup.childNodes.length; i += 1) {
            imageMaxWidth = Math.max(imageMaxWidth, parseFloat(this.elements.imageGroup.childNodes[i].getAttribute('width')));
            imageMaxHeight = Math.max(imageMaxHeight, parseFloat(this.elements.imageGroup.childNodes[i].getAttribute('height')));
            imageHeight += parseFloat(this.elements.imageGroup.childNodes[i].getAttribute('height'));
        }
        totalWidth = 2 * this.options.plugPadding + refreshData.maxLeftLabelWidth + imageMaxWidth + refreshData.maxRightLabelWidth;
        totalLabelWidth = Math.max(0, this.width - 2 * this.options.plugPadding - imageMaxWidth);
        leftLabelWidth = totalLabelWidth * refreshData.maxLeftLabelWidth / Math.max(1, refreshData.maxLeftLabelWidth + refreshData.maxRightLabelWidth);
        rightLabelWidth = totalLabelWidth * refreshData.maxRightLabelWidth / Math.max(1, refreshData.maxLeftLabelWidth + refreshData.maxRightLabelWidth);
        plugLeftEnd = leftLabelWidth + this.options.plugPadding;
        plugRightEnd = this.width - rightLabelWidth - this.options.plugPadding;
        plugTopEnd = this.options.titleBarHeight + this.options.plugPadding + refreshData.maxTopLabelHeight;
        plugBottomEnd = this.height - this.options.plugPadding - refreshData.maxBottomLabelHeight;
        plugX = -outlineHalfStrokeWidth;
        plugY = this.options.titleBarHeight + (this.height - this.options.titleBarHeight) / (refreshData.leftPlugs.length + 1);
        for (i = 0; i < refreshData.leftPlugs.length; i += 1) {
            plug = $(refreshData.leftPlugs[i]);
            this.plugData[plug[0].getAttribute('igNodeId')] = {x: plugX, y: plugY};
            pluginName = plug[0].getAttribute('igPluginName');
            refreshData.leftPlugs[i].setAttribute('transform', 'translate(' + plugX + ', ' + plugY + ')');
            plug[pluginName]('setInnerWidth', leftLabelWidth)[pluginName]('refresh');
            plugY += (this.height - this.options.titleBarHeight) / (refreshData.leftPlugs.length + 1);
        }
        plugX = this.width + outlineHalfStrokeWidth;
        plugY = this.options.titleBarHeight + (this.height - this.options.titleBarHeight) / (refreshData.rightPlugs.length + 1);
        for (i = 0; i < refreshData.rightPlugs.length; i += 1) {
            plug = $(refreshData.rightPlugs[i]);
            this.plugData[plug[0].getAttribute('igNodeId')] = {x: plugX, y: plugY};
            pluginName = plug[0].getAttribute('igPluginName');
            refreshData.rightPlugs[i].setAttribute('transform', 'translate(' + plugX + ', ' + plugY + ')');
            plug[pluginName]('setInnerWidth', leftLabelWidth)[pluginName]('refresh');
            plugY += (this.height - this.options.titleBarHeight) / (refreshData.rightPlugs.length + 1);
        }
        plugX = this.width / (refreshData.topPlugs.length + 1);
        plugY = -outlineHalfStrokeWidth;
        for (i = 0; i < refreshData.topPlugs.length; i += 1) {
            plug = $(refreshData.topPlugs[i]);
            this.plugData[plug[0].getAttribute('igNodeId')] = {x: plugX, y: plugY};
            pluginName = plug[0].getAttribute('igPluginName');
            refreshData.topPlugs[i].setAttribute('transform', 'translate(' + plugX + ', ' + plugY + ')');
            plug[pluginName]('setInnerWidth', topLabelWidth)[pluginName]('setOffset', this.options.titleBarHeight + outlineHalfStrokeWidth)[pluginName]('refresh');
            plugX += this.width / (refreshData.topPlugs.length + 1);
        }
        plugX = this.width / (refreshData.bottomPlugs.length + 1);
        plugY = this.height + outlineHalfStrokeWidth;
        for (i = 0; i < refreshData.bottomPlugs.length; i += 1) {
            plug = $(refreshData.bottomPlugs[i]);
            this.plugData[plug[0].getAttribute('igNodeId')] = {x: plugX, y: plugY};
            pluginName = plug[0].getAttribute('igPluginName');
            refreshData.bottomPlugs[i].setAttribute('transform', 'translate(' + plugX + ', ' + plugY + ')');
            plug[pluginName]('setInnerWidth', bottomLabelWidth)[pluginName]('refresh');
            plugX += this.width / (refreshData.bottomPlugs.length + 1);
        }
        imageX = (plugLeftEnd + plugRightEnd) / 2;
        imageY = plugTopEnd + (plugBottomEnd - plugTopEnd - imageHeight) / (this.elements.imageGroup.childNodes.length + 1);
        for (i = 0; i < this.elements.imageGroup.childNodes.length; i += 1) {
            this.elements.imageGroup.childNodes[i].setAttribute('x', Math.round(imageX - parseFloat(this.elements.imageGroup.childNodes[i].getAttribute('width')) / 2));
            this.elements.imageGroup.childNodes[i].setAttribute('y', Math.round(imageY));
            imageY += parseFloat(this.elements.imageGroup.childNodes[i].getAttribute('height')) + (plugBottomEnd - plugTopEnd - imageHeight) / (this.elements.imageGroup.childNodes.length + 1);
        }
    };
    IgNode.prototype.updateSelectionBorder = function () {
        var i,
            outlineBounds = this.elements.outline.getBoundingClientRect(),
            group,
            plug,
            plugBounds,
            plugHandle;
        this.elements.selectionBorderInner.appendChild(this.elements.outline.cloneNode(false));
        this.elements.selectionBorderOuter.appendChild(this.elements.outline.cloneNode(false));
        for (i = 0; i < this.elements.plugGroup.childNodes.length; i += 1) {
            plug = $(this.elements.plugGroup.childNodes[i]);
            plugHandle = plug[plug[0].getAttribute('igPluginName')]('getHandle');
            plugBounds = plugHandle.getBoundingClientRect();
            if ((plugBounds.right < outlineBounds.left) || (plugBounds.bottom < outlineBounds.top) || (plugBounds.left > outlineBounds.right) || (plugBounds.top > outlineBounds.bottom)) {
                group = plug[0].cloneNode(false);
                group.appendChild(plugHandle.cloneNode(false));
                this.elements.selectionBorderInner.appendChild(group);
                this.elements.selectionBorderOuter.appendChild(group.cloneNode(true));
            }
        }
    };
    $.fn.igNode = function (memberFunctionName, arg1) {
        var i,
            node,
            nodes = [],
            refreshData = [];
        switch (memberFunctionName) {
        case 'init':
            arg1 = new IgNodeOptions(arg1 || { });
            for (i = 0; i < this.length; i += 1) {
                this[i].setAttribute('igPluginName', 'igNode');
                $.data(this[i], 'igNode', new IgNode(this[i], arg1));
            }
            return this;
        case 'refresh':
            for (i = 0; i < this.length; i += 1) {
                node = $.data(this[i], 'igNode');
                nodes.push(node);
                refreshData.push(node.getRefreshData());
                node.clearSelectionBorder();
                if (node.options.autoSize) {
                    node.width = refreshData[i].autoWidth;
                    node.height = refreshData[i].autoHeight;
                }
            }
            for (i = 0; i < this.length; i += 1) {
                node = nodes[i];
                node.positionBackgroundAndTitleBar();
                node.positionTitleBarElements(refreshData[i]);
                node.positionPlugsAndImages(refreshData[i]);
                node.updateSelectionBorder();
            }
            return this;
        case 'addTitleBarImagesLeft':
            if (this.length === 1) {
                node = $.data(this[0], 'igNode');
                node.addTitleBarImages(node.elements.titleBarGroupLeft, arg1);
            } else if (this.length > 1) {
                console.log('IgNode.js: Function "addTitleBarImagesLeft" can only operate on one element!');
                debugger;
            }
            return this;
        case 'addTitleBarImagesRight':
            if (this.length === 1) {
                node = $.data(this[0], 'igNode');
                node.addTitleBarImages(node.elements.titleBarGroupRight, arg1);
            } else if (this.length > 1) {
                console.log('IgNode.js: Function "addTitleBarImagesRight" can only operate on one element!');
                debugger;
            }
            return this;
        case 'addImages':
            if (this.length === 1) {
                $.data(this[0], 'igNode').addImages(arg1);
            } else if (this.length > 1) {
                console.log('IgNode.js: Function "addImages" can only operate on one element!');
                debugger;
            }
            return this;
        case 'addPlugs':
            if (this.length === 1) {
                $.data(this[0], 'igNode').addPlugs(arg1);
            } else if (this.length > 1) {
                console.log('IgNode.js: Function "addPlugs" can only operate on one element!');
                debugger;
            }
            return this;
        case 'removePlugs':
            if (this.length === 1) {
                $.data(this[0], 'igNode').removePlugs(arg1);
            } else if (this.length > 1) {
                console.log('IgNode.js: Function "removePlugs" can only operate on one element!');
                debugger;
            }
            return this;
        case 'getPlugConnectionPoints':
            if (this.length === 1) {
                return $.data(this[0], 'igNode').getPlugConnectionPoints(arg1);
            }
            if (this.length > 1) {
                console.log('IgNode.js: Function "getPlugConnectionPoints" can only operate on one element!');
                debugger;
            }
            return [];
        case 'select':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNode').setOutlineClass('selected');
            }
            return this;
        case 'hover':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNode').setOutlineClass('hover');
            }
            return this;
        case 'deselect':
        case 'clearHover':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNode').setOutlineClass('');
            }
            return this;
        }
        if (typeof memberFunctionName === 'string') {
            console.log('IgNode.js: Function "' + memberFunctionName + '" does not exist!');
        } else {
            console.log('IgNode.js: No member function name specified!');
        }
        debugger;
        return this;
    };
}(jQuery));