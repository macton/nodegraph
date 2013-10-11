;/*jslint browser: true, devel: true, debug: true */
(function ($) {
    'use strict';
    var IgNodeGraphOptions = function (options) {
            var nodeGraphOptions = this;
            this.callbacks = {};
            this.classBackground = String(options.classBackground || '');
            this.classGrid = String(options.classGrid || '');
            this.classMarqueeSelectionBox = String(options.classMarqueeSelectionBox || '');
            this.connectionBoundingRectSize = parseFloat(options.connectionBoundingRectSize || 10);
            this.connectionBoundingRectPadding = parseFloat(options.connectionBoundingRectPadding || 500);
            this.defaultFrameTime = parseFloat(options.defaultFrameTime || 0.25);
            this.displayGrid = options.displayGrid === true ? true : false;
            this.dragConnectionHandlePadding = parseFloat(options.dragConnectionHandlePadding || 50);
            this.dragConnectionPlugPadding = parseFloat(options.dragConnectionPlugPadding || 20);
            this.dragObjectsPadding = parseFloat(options.dragObjectsPadding || 100);
            this.framingInterpolation = String(options.framingInterpolation || 'easeInOut');
            this.framePadding = parseFloat(options.framePadding || 25);
            this.gridSize = parseFloat(options.gridSize || 16);
            this.startingWorkAreaHeight = parseFloat(options.startingWorkAreaHeight || 10000);
            this.startingWorkAreaWidth = parseFloat(options.startingWorkAreaWidth || 10000);
            this.updateBoundsPadding = parseFloat(options.updateBoundsPadding || 1000);
            this.zoomAroundMouse = options.zoomAroundMouse === true ? true : false;
            this.zoomMin = parseFloat(options.zoomMin || 0.33);
            this.zoomMax = parseFloat(options.zoomMax || 1.00);
            this.zoomSpeed = parseFloat(options.zoomSpeed || 0.0011);
            this.zoomWheelAmounts = [0.33, 0.50, 0.67, 0.75, 0.90, 1.00];
            if (options.defaultConnection) {
                this.defaultConnection = options.defaultConnection;
            } else {
                this.defaultConnection = $(document.createElementNS('http://www.w3.org/2000/svg', 'g')).igConnection('init', {connectionClass: 'connection', markerStartClass: 'connectionMarker', markerEndClass: 'connectionMarker'});
            }
            if ((typeof options.zoomWheelAmounts === 'object') && (options.zoomWheelAmounts.length !== undefined)) {
                this.zoomWheelAmounts = options.zoomWheelAmounts;
            }
            if (options.callbacks) {
                if (typeof options.callbacks.createNewConnection === 'function') {
                    this.callbacks.createNewConnection = options.callbacks.createNewConnection;
                } else {
                    this.callbacks.createNewConnection = function () {
                        var connectionPlugin = nodeGraphOptions.defaultConnection[0].getAttribute('igPluginName'),
                            newConnection = $(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
                        newConnection[connectionPlugin]('init', nodeGraphOptions.defaultConnection[connectionPlugin]('getOptions'));
                        return newConnection;
                    };
                }
                if (typeof options.callbacks.isConnectionValid === 'function') {
                    this.callbacks.isConnectionValid = options.callbacks.isConnectionValid;
                } else {
                    this.callbacks.isConnectionValid = function () { return true; };
                }
                if (typeof options.callbacks.isSingleConnectionPlug === 'function') {
                    this.callbacks.isSingleConnectionPlug = options.callbacks.isSingleConnectionPlug;
                } else {
                    this.callbacks.isSingleConnectionPlug = function () { return false; };
                }
                if (typeof options.callbacks.shouldFlipConnection === 'function') {
                    this.callbacks.shouldFlipConnection = options.callbacks.shouldFlipConnection;
                } else {
                    this.callbacks.shouldFlipConnection = function () { return false; };
                }
                if (typeof options.callbacks.shouldHaveMarker === 'function') {
                    this.callbacks.shouldHaveMarker = options.callbacks.shouldHaveMarker;
                } else {
                    this.callbacks.shouldHaveMarker = function () { return false; };
                }
            }
            Object.seal(this);
            Object.seal(this.callbacks);
        },
        IgNodeGraph = function (root, options) {
            var nodeGraph = this;
            this.animationFrameData = {
                bounds: {left: -options.startingWorkAreaWidth / 2, top: -options.startingWorkAreaHeight / 2, right: options.startingWorkAreaWidth / 2, bottom: options.startingWorkAreaHeight / 2},
                domAddObjects: {comments: {}, connections: {}, nodes: {}, plugs: {}},
                domRefreshObjects: {comments: {}, commentPositions: {}, connections: {}, nodes: {}, nodePositions: {}, plugs: {}},
                domRemoveObjects: {comments: {}, connections: {}, nodes: {}, plugs: {}},
                dragConnection: {
                    state: 'none',
                    connection: options.defaultConnection,
                    connectionPluginName: options.defaultConnection[0].getAttribute('igPluginName'),
                    validPlugs: {},
                    lastId: '',
                    startPlugData: {id: '', showMarker: false, x: 0, y: 0, directionX: 0, directionY: 0},
                    endPlugData: {id: '', showMarker: false, x: 0, y: 0, directionX: 0, directionY: 0}
                },
                dragGenericObjects: {state: 'none', startX: 0, startY: 0, x: 0, y: 0, node: {}, comment: {}, connectionDrag: {}, connectionRefresh: {}},
                frameObjects: {state: 'none', startTime: 0, startPanX: 0, startPanY: 0, startZoomAmount: 0, endTime: 0, endPanX: 0, endPanY: 0, endZoomAmount: 0},
                freezeMouse: {update: false, count: 0},
                mouse: {startX: 0, startY: 0, previousX: 0, previousY: 0, x: 0, y: 0},
                pan: {state: 'none', startX: 0, startY: 0, x: 0, y: 0},
                selection: {state: 'none', objectIds: {}, pendingObjectIds: {}, marqueeObjectIds: {}, marqueeObjectClientRect: {}, marqueeBounds: {left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0}},
                zoom: {state: 'none', startAmount: 1, amount: 1, pivotX: 0, pivotY: 0, wheelDirection: 0}
            };
            this.callbacks = {
                onDragConnection: function (e) { nodeGraph.onDragConnection(e); },
                onDragConnectionMouseMove: function (e) { nodeGraph.onDragConnectionMouseMove(e); },
                onDragConnectionComplete: function (e) { nodeGraph.onDragConnectionComplete(e); },
                onDragGenericObjects: function (e) { nodeGraph.onDragGenericObjects(e); },
                onDragGenericObjectsComplete: function () { nodeGraph.onDragGenericObjectsComplete(); },
                onDragPlug: function (e) { nodeGraph.onDragPlug(e); },
                onKeyDown: function (e) { nodeGraph.onKeyDown(e); },
                onMarqueeSelectUpdate: function (e, bounds) { nodeGraph.onMarqueeSelectUpdate(e, bounds); },
                onMarqueeSelectComplete: function () { nodeGraph.onMarqueeSelectComplete(); },
                onMouseDown: function (e) { nodeGraph.onMouseDown(e); },
                onMouseMove: function (e) { nodeGraph.onMouseMove(e); },
                onMouseWheel: function (e) { nodeGraph.onMouseWheel(e); },
                onPanZoomComplete: function () { nodeGraph.onPanZoomComplete(); },
                onSelectConnectionDeferred: function (e) { nodeGraph.onSelectConnectionDeferred(e); },
                onSelectGenericObjectComplete: function () { nodeGraph.onSelectGenericObjectComplete(); },
                onSelectGenericObjectDeferred: function (e) { nodeGraph.onSelectGenericObjectDeferred(e); },
                onSelectPlugDeferred: function () { nodeGraph.onSelectPlugDeferred(); },
                requestAnimationFrame: function () { nodeGraph.requestAnimationFrameCallback(); },
                setupGrid: function () { nodeGraph.setupGrid(); }
            };
            this.elements = {
                connectionBoundsBottomLeft: document.createElementNS('http://www.w3.org/2000/svg', 'rect'),
                connectionBoundsBottomRight: document.createElementNS('http://www.w3.org/2000/svg', 'rect'),
                connectionBoundsTopLeft: document.createElementNS('http://www.w3.org/2000/svg', 'rect'),
                connectionBoundsTopRight: document.createElementNS('http://www.w3.org/2000/svg', 'rect'),
                containerBackground: document.createElement('div'),
                containerForeground: document.createElement('div'),
                containerGrid: document.createElement('div'),
                containerDrag: document.createElement('div'),
                containerPanZoom: document.createElement('div'),
                containerStationary: document.createElement('div'),
                defsDrag: document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
                defsStationary: document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
                documentFragment: document.createDocumentFragment(),
                groupComments: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                groupConnections: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                groupNodes: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                marqueeSelectionBox: document.createElement('div'),
                root: root,
                svgDragNodesAndComments: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
                svgGrid: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
                svgGridPath: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
                svgStationary: document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            };
            this.flags = {
                recalculateBounds: true,
                requestAnimationFrame: false
            };
            this.objectData = {node: {}, plug: {}, connection: {}, comment: {}};
            this.objectHash = {node: {}, plug: {}, connection: {}, comment: {}};
            this.objectIds = {node: 0, plug: 0, connection: 0, comment: 0};
            this.options = options;
            Object.seal(this.animationFrameData);
            Object.seal(this.animationFrameData.bounds);
            Object.seal(this.animationFrameData.domAddObjects);
            Object.seal(this.animationFrameData.domRefreshObjects);
            Object.seal(this.animationFrameData.domRemoveObjects);
            Object.seal(this.animationFrameData.dragConnection);
            Object.seal(this.animationFrameData.dragGenericObjects);
            Object.seal(this.animationFrameData.frameObjects);
            Object.seal(this.animationFrameData.freezeMouse);
            Object.seal(this.animationFrameData.mouse);
            Object.seal(this.animationFrameData.pan);
            Object.seal(this.animationFrameData.selection);
            Object.seal(this.animationFrameData.zoom);
            Object.seal(this.callbacks);
            Object.seal(this.elements);
            Object.seal(this.flags);
            Object.seal(this.objectHash);
            Object.seal(this.objectIds);
            if (this.options.classMarqueeSelectionBox) {
                this.elements.marqueeSelectionBox.setAttribute('class', this.options.classMarqueeSelectionBox);
            }
            if (this.options.classGrid) {
                this.elements.svgGridPath.setAttribute('class', this.options.classGrid);
            }
            if (this.options.classBackground) {
                this.elements.containerBackground.setAttribute('class', this.options.classBackground);
            }
            this.displayGrid(this.options.displayGrid);
            this.elements.connectionBoundsBottomLeft.setAttribute('style', 'fill: rgb(0, 0, 0); fill-opacity: 0');
            this.elements.connectionBoundsBottomLeft.setAttribute('width', this.options.connectionBoundingRectSize);
            this.elements.connectionBoundsBottomLeft.setAttribute('height', this.options.connectionBoundingRectSize);
            this.elements.connectionBoundsBottomRight.setAttribute('style', 'fill: rgb(0, 0, 0); fill-opacity: 0');
            this.elements.connectionBoundsBottomRight.setAttribute('width', this.options.connectionBoundingRectSize);
            this.elements.connectionBoundsBottomRight.setAttribute('height', this.options.connectionBoundingRectSize);
            this.elements.connectionBoundsTopLeft.setAttribute('style', 'fill: rgb(0, 0, 0); fill-opacity: 0');
            this.elements.connectionBoundsTopLeft.setAttribute('width', this.options.connectionBoundingRectSize);
            this.elements.connectionBoundsTopLeft.setAttribute('height', this.options.connectionBoundingRectSize);
            this.elements.connectionBoundsTopRight.setAttribute('style', 'fill: rgb(0, 0, 0); fill-opacity: 0');
            this.elements.connectionBoundsTopRight.setAttribute('width', this.options.connectionBoundingRectSize);
            this.elements.connectionBoundsTopRight.setAttribute('height', this.options.connectionBoundingRectSize);
            this.elements.containerBackground.style.position = 'absolute';
            this.elements.containerBackground.style.left = '0px';
            this.elements.containerBackground.style.top = '0px';
            this.elements.containerBackground.style.width = '100%';
            this.elements.containerBackground.style.height = '100%';
            this.elements.containerForeground.style.position = 'absolute';
            this.elements.containerForeground.style.left = '0px';
            this.elements.containerForeground.style.top = '0px';
            this.elements.containerForeground.style.width = '100%';
            this.elements.containerForeground.style.height = '100%';
            this.elements.containerPanZoom.style.position = 'absolute';
            this.elements.containerPanZoom.style.left = '0px';
            this.elements.containerPanZoom.style.top = '0px';
            this.elements.containerDrag.style.position = 'absolute';
            this.elements.containerDrag.style.left = '0px';
            this.elements.containerDrag.style.top = '0px';
            this.elements.containerStationary.style.position = 'absolute';
            this.elements.containerStationary.style.left = '0px';
            this.elements.containerStationary.style.top = '0px';
            this.requestAnimationFrameUpdateBounds();
            this.elements.svgGrid.appendChild(this.elements.svgGridPath);
            this.elements.containerGrid.appendChild(this.elements.svgGrid);
            this.elements.containerBackground.appendChild(this.elements.containerGrid);
            this.elements.root.appendChild(this.elements.containerBackground);
            this.elements.svgDragNodesAndComments.appendChild(this.elements.defsDrag);
            this.elements.containerDrag.appendChild(this.elements.svgDragNodesAndComments);
            this.elements.documentFragment.appendChild(this.elements.containerDrag);
            this.elements.documentFragment.appendChild(this.options.defaultConnection[0]);
            this.elements.documentFragment.appendChild(this.elements.connectionBoundsBottomLeft);
            this.elements.documentFragment.appendChild(this.elements.connectionBoundsBottomRight);
            this.elements.documentFragment.appendChild(this.elements.connectionBoundsTopLeft);
            this.elements.documentFragment.appendChild(this.elements.connectionBoundsTopRight);
            this.elements.documentFragment.appendChild(this.elements.containerForeground);
            this.elements.svgStationary.appendChild(this.elements.defsStationary);
            this.elements.svgStationary.appendChild(this.elements.groupConnections);
            this.elements.svgStationary.appendChild(this.elements.groupNodes);
            this.elements.svgStationary.appendChild(this.elements.groupComments);
            this.elements.containerStationary.appendChild(this.elements.svgStationary);
            this.elements.containerPanZoom.appendChild(this.elements.containerStationary);
            this.elements.root.appendChild(this.elements.containerPanZoom);
            this.elements.root.appendChild(this.elements.marqueeSelectionBox);
            $(this.elements.marqueeSelectionBox).igMarqueeSelect('init').on('onMarqueeSelectUpdate', this.callbacks.onMarqueeSelectUpdate).on('onMarqueeSelectComplete', this.callbacks.onMarqueeSelectComplete);
            $(this.elements.root).on('mousedown', this.callbacks.onMouseDown).on('mousewheel', this.callbacks.onMouseWheel);
            $(document).on('keydown', this.callbacks.onKeyDown);
            window.requestAnimationFrame(this.callbacks.setupGrid);
        };
    IgNodeGraph.prototype.requestAnimationFrame = function () {
        if (this.flags.requestAnimationFrame === false) {
            this.flags.requestAnimationFrame = true;
            window.requestAnimationFrame(this.callbacks.requestAnimationFrame);
        }
    };
    IgNodeGraph.prototype.requestAnimationFrameUpdateBounds = function () {
        var connectionBoundingRectPadding = this.options.connectionBoundingRectPadding / this.animationFrameData.zoom.amount,
            connectionBoundingRectOffset = -this.options.connectionBoundingRectSize / 2,
            w = this.animationFrameData.bounds.right - this.animationFrameData.bounds.left,
            h = this.animationFrameData.bounds.bottom - this.animationFrameData.bounds.top;
        this.elements.containerStationary.style.left = this.animationFrameData.bounds.left + 'px';
        this.elements.containerStationary.style.top = this.animationFrameData.bounds.top + 'px';
        this.elements.svgStationary.style.width = w + 'px';
        this.elements.svgStationary.style.height = h + 'px';
        this.elements.connectionBoundsBottomLeft.setAttribute('x', this.animationFrameData.bounds.left + connectionBoundingRectOffset - connectionBoundingRectPadding);
        this.elements.connectionBoundsBottomLeft.setAttribute('y', this.animationFrameData.bounds.bottom + connectionBoundingRectOffset + connectionBoundingRectPadding);
        this.elements.connectionBoundsBottomRight.setAttribute('x', this.animationFrameData.bounds.right + connectionBoundingRectOffset + connectionBoundingRectPadding);
        this.elements.connectionBoundsBottomRight.setAttribute('y', this.animationFrameData.bounds.bottom + connectionBoundingRectOffset + connectionBoundingRectPadding);
        this.elements.connectionBoundsTopLeft.setAttribute('x', this.animationFrameData.bounds.left + connectionBoundingRectOffset - connectionBoundingRectPadding);
        this.elements.connectionBoundsTopLeft.setAttribute('y', this.animationFrameData.bounds.top + connectionBoundingRectOffset - connectionBoundingRectPadding);
        this.elements.connectionBoundsTopRight.setAttribute('x', this.animationFrameData.bounds.right + connectionBoundingRectOffset - connectionBoundingRectPadding);
        this.elements.connectionBoundsTopRight.setAttribute('y', this.animationFrameData.bounds.top + connectionBoundingRectOffset + connectionBoundingRectPadding);
        this.elements.svgStationary.setAttribute('viewBox', this.animationFrameData.bounds.left + ' ' + this.animationFrameData.bounds.top + ' ' + w + ' ' + h);
    };
    IgNodeGraph.prototype.requestAnimationFrameUpdateVisibleBounds = function () {
        var updateBounds = false,
            backgroundClientRect = this.elements.containerBackground.getBoundingClientRect(),
            svgClientRect = this.elements.svgStationary.getBoundingClientRect();
        if (svgClientRect.left > backgroundClientRect.left) {
            this.animationFrameData.bounds.left -= (this.options.updateBoundsPadding + svgClientRect.left - backgroundClientRect.left) / this.animationFrameData.zoom.amount;
            updateBounds = true;
        }
        if (svgClientRect.top > backgroundClientRect.top) {
            this.animationFrameData.bounds.top -= (this.options.updateBoundsPadding + svgClientRect.top - backgroundClientRect.top) / this.animationFrameData.zoom.amount;
            updateBounds = true;
        }
        if (svgClientRect.right < backgroundClientRect.right) {
            this.animationFrameData.bounds.right += (this.options.updateBoundsPadding + backgroundClientRect.right - svgClientRect.right) / this.animationFrameData.zoom.amount;
            updateBounds = true;
        }
        if (svgClientRect.bottom < backgroundClientRect.bottom) {
            this.animationFrameData.bounds.bottom += (this.options.updateBoundsPadding + backgroundClientRect.bottom - svgClientRect.bottom) / this.animationFrameData.zoom.amount;
            updateBounds = true;
        }
        if (updateBounds) {
            this.requestAnimationFrameUpdateBounds();
        }
    };
    IgNodeGraph.prototype.requestAnimationFrameRecalculateBounds = function () {
        var currentBoundingBox,
            newBounds;
        if (this.flags.recalculateBounds) {
            currentBoundingBox = this.elements.svgStationary.getBBox();
            newBounds = {left: currentBoundingBox.x, top: currentBoundingBox.y, right: currentBoundingBox.x + currentBoundingBox.width, bottom: currentBoundingBox.y + currentBoundingBox.height};
            if ((newBounds.left < this.animationFrameData.bounds.left) || (newBounds.top < this.animationFrameData.bounds.top) || (newBounds.right > this.animationFrameData.bounds.right) || (newBounds.bottom > this.animationFrameData.bounds.bottom)) {
                this.animationFrameData.bounds.left = Math.min(newBounds.left - this.options.updateBoundsPadding, this.animationFrameData.bounds.left);
                this.animationFrameData.bounds.top = Math.min(newBounds.top - this.options.updateBoundsPadding, this.animationFrameData.bounds.top);
                this.animationFrameData.bounds.right = Math.max(newBounds.right + this.options.updateBoundsPadding, this.animationFrameData.bounds.right);
                this.animationFrameData.bounds.bottom = Math.max(newBounds.bottom + this.options.updateBoundsPadding, this.animationFrameData.bounds.bottom);
                this.requestAnimationFrameUpdateBounds();
            }
            this.flags.recalculateBounds = false;
        }
    };
    IgNodeGraph.prototype.requestAnimationFrameUpdateFreezeMouse = function () {
        if (this.animationFrameData.freezeMouse.update) {
            if (this.animationFrameData.freezeMouse.count > 0) {
                this.elements.root.appendChild(this.elements.containerForeground);
            } else {
                this.elements.documentFragment.appendChild(this.elements.containerForeground);
            }
        }
    };
    IgNodeGraph.prototype.requestAnimationFrameAddRemoveObjects = function () {
        var id;
        for (id in this.animationFrameData.domAddObjects.comments) {
            if (this.animationFrameData.domAddObjects.comments.hasOwnProperty(id)) {
                this.elements.groupComments.appendChild(this.animationFrameData.domAddObjects.comments[id]);
            }
        }
        this.animationFrameData.domAddObjects.comments = {};
        for (id in this.animationFrameData.domAddObjects.connections) {
            if (this.animationFrameData.domAddObjects.connections.hasOwnProperty(id)) {
                this.elements.groupConnections.appendChild(this.animationFrameData.domAddObjects.connections[id]);
            }
        }
        this.animationFrameData.domAddObjects.connections = {};
        for (id in this.animationFrameData.domAddObjects.nodes) {
            if (this.animationFrameData.domAddObjects.nodes.hasOwnProperty(id)) {
                this.elements.groupNodes.appendChild(this.animationFrameData.domAddObjects.nodes[id]);
            }
        }
        this.animationFrameData.domAddObjects.nodes = {};
        for (id in this.animationFrameData.domAddObjects.plugs) {
            if (this.animationFrameData.domAddObjects.plugs.hasOwnProperty(id) && this.objectHash.node.hasOwnProperty(id)) {
                this.objectHash.node[id][this.objectHash.node[id][0].getAttribute('igPluginName')]('addPlugs', this.animationFrameData.domAddObjects.plugs[id]);
            }
        }
        this.animationFrameData.domAddObjects.plugs = {};
        for (id in this.animationFrameData.domRemoveObjects.plugs) {
            if (this.animationFrameData.domRemoveObjects.plugs.hasOwnProperty(id) && this.objectHash.node.hasOwnProperty(id)) {
                this.objectHash.node[id][this.objectHash.node[id][0].getAttribute('igPluginName')]('removePlugs', this.animationFrameData.domRemoveObjects.plugs[id]);
            }
        }
        this.animationFrameData.domRemoveObjects.plugs = {};
        for (id in this.animationFrameData.domRemoveObjects.nodes) {
            if (this.animationFrameData.domRemoveObjects.nodes.hasOwnProperty(id)) {
                this.elements.groupNodes.removeChild(this.animationFrameData.domRemoveObjects.nodes[id]);
            }
        }
        this.animationFrameData.domRemoveObjects.nodes = {};
        for (id in this.animationFrameData.domRemoveObjects.connections) {
            if (this.animationFrameData.domRemoveObjects.connections.hasOwnProperty(id)) {
                this.elements.groupConnections.removeChild(this.animationFrameData.domRemoveObjects.connections[id]);
            }
        }
        this.animationFrameData.domRemoveObjects.connections = {};
        for (id in this.animationFrameData.domRemoveObjects.comments) {
            if (this.animationFrameData.domRemoveObjects.comments.hasOwnProperty(id)) {
                this.elements.groupcomments.removeChild(this.animationFrameData.domRemoveObjects.comments[id]);
            }
        }
        this.animationFrameData.domRemoveObjects.comments = {};
    };
    IgNodeGraph.prototype.requestAnimationFrameHandleDragNodes = function () {
        var id,
            dragBoundingBox;
        switch (this.animationFrameData.dragGenericObjects.state) {
        case 'startDrag':
        case 'dragging':
            if (this.animationFrameData.dragGenericObjects.state === 'startDrag') {
                for (id in this.animationFrameData.dragGenericObjects.connectionDrag) {
                    if (this.animationFrameData.dragGenericObjects.connectionDrag.hasOwnProperty(id)) {
                        this.elements.svgDragNodesAndComments.appendChild(this.animationFrameData.dragGenericObjects.connectionDrag[id][0]);
                    }
                }
                for (id in this.animationFrameData.dragGenericObjects.node) {
                    if (this.animationFrameData.dragGenericObjects.node.hasOwnProperty(id)) {
                        this.elements.svgDragNodesAndComments.appendChild(this.animationFrameData.dragGenericObjects.node[id][0]);
                    }
                }
                for (id in this.animationFrameData.dragGenericObjects.comment) {
                    if (this.animationFrameData.dragGenericObjects.comment.hasOwnProperty(id)) {
                        this.elements.svgDragNodesAndComments.appendChild(this.animationFrameData.dragGenericObjects.comment[id][0]);
                    }
                }
                this.elements.containerPanZoom.appendChild(this.elements.containerDrag);
                this.elements.groupConnections.appendChild(this.elements.connectionBoundsBottomLeft);
                this.elements.groupConnections.appendChild(this.elements.connectionBoundsBottomRight);
                this.elements.groupConnections.appendChild(this.elements.connectionBoundsTopLeft);
                this.elements.groupConnections.appendChild(this.elements.connectionBoundsTopRight);
                dragBoundingBox = this.elements.svgDragNodesAndComments.getBBox();
                this.elements.svgDragNodesAndComments.style.width = Math.ceil(dragBoundingBox.width + 2 * this.options.dragObjectsPadding) + 'px';
                this.elements.svgDragNodesAndComments.style.height = Math.ceil(dragBoundingBox.height + 2 * this.options.dragObjectsPadding) + 'px';
                this.elements.svgDragNodesAndComments.setAttribute('viewBox', (dragBoundingBox.x - this.options.dragObjectsPadding) + ' ' + (dragBoundingBox.y - this.options.dragObjectsPadding) + ' ' + Math.ceil(dragBoundingBox.width + 2 * this.options.dragObjectsPadding) + ' ' + Math.ceil(dragBoundingBox.height + 2 * this.options.dragObjectsPadding));
                this.animationFrameData.dragGenericObjects.startX = dragBoundingBox.x - this.options.dragObjectsPadding;
                this.animationFrameData.dragGenericObjects.startY = dragBoundingBox.y - this.options.dragObjectsPadding;
                this.animationFrameData.dragGenericObjects.state = 'dragging';
            }
            this.animationFrameData.dragGenericObjects.x = this.animationFrameData.dragGenericObjects.startX + Math.round((this.animationFrameData.mouse.x - this.animationFrameData.mouse.startX) / this.animationFrameData.zoom.amount);
            this.animationFrameData.dragGenericObjects.y = this.animationFrameData.dragGenericObjects.startY + Math.round((this.animationFrameData.mouse.y - this.animationFrameData.mouse.startY) / this.animationFrameData.zoom.amount);
            this.elements.containerDrag.style.webkitTransform = 'translate3D(' + this.animationFrameData.dragGenericObjects.x + 'px, ' + this.animationFrameData.dragGenericObjects.y + 'px, 0px)';
            for (id in this.animationFrameData.dragGenericObjects.connectionRefresh) {
                if (this.animationFrameData.dragGenericObjects.connectionRefresh.hasOwnProperty(id)) {
                    this.animationFrameData.domRefreshObjects.connections[id] = this.animationFrameData.dragGenericObjects.connectionRefresh[id];
                }
            }
            // GV: TODO - Trigger object moving event?
            break;
        case 'finalizeDrag':
            dragBoundingBox = this.elements.svgDragNodesAndComments.getBBox();
            if (this.animationFrameData.dragGenericObjects.x + dragBoundingBox.x < this.animationFrameData.bounds.left) {
                this.flags.recalculateBounds = true;
            } else if (this.animationFrameData.dragGenericObjects.y + dragBoundingBox.y < this.animationFrameData.bounds.top) {
                this.flags.recalculateBounds = true;
            } else if (this.animationFrameData.dragGenericObjects.x + dragBoundingBox.x + dragBoundingBox.width > this.animationFrameData.bounds.right) {
                this.flags.recalculateBounds = true;
            } else if (this.animationFrameData.dragGenericObjects.y + dragBoundingBox.y + dragBoundingBox.height > this.animationFrameData.bounds.bottom) {
                this.flags.recalculateBounds = true;
            }
            this.elements.documentFragment.appendChild(this.elements.containerDrag);
            this.elements.documentFragment.appendChild(this.elements.connectionBoundsBottomLeft);
            this.elements.documentFragment.appendChild(this.elements.connectionBoundsBottomRight);
            this.elements.documentFragment.appendChild(this.elements.connectionBoundsTopLeft);
            this.elements.documentFragment.appendChild(this.elements.connectionBoundsTopRight);
            for (id in this.animationFrameData.dragGenericObjects.connectionDrag) {
                if (this.animationFrameData.dragGenericObjects.connectionDrag.hasOwnProperty(id)) {
                    this.elements.groupConnections.appendChild(this.animationFrameData.dragGenericObjects.connectionDrag[id][0]);
                    this.animationFrameData.domRefreshObjects.connections[id] = this.animationFrameData.dragGenericObjects.connectionDrag[id];
                }
            }
            for (id in this.animationFrameData.dragGenericObjects.node) {
                if (this.animationFrameData.dragGenericObjects.node.hasOwnProperty(id)) {
                    this.objectData.node[id].x += this.animationFrameData.dragGenericObjects.x - this.animationFrameData.dragGenericObjects.startX;
                    this.objectData.node[id].y += this.animationFrameData.dragGenericObjects.y - this.animationFrameData.dragGenericObjects.startY;
                    this.animationFrameData.dragGenericObjects.node[id][0].setAttribute('transform', 'translate(' + this.objectData.node[id].x + ', ' + this.objectData.node[id].y + ')');
                    this.elements.groupNodes.appendChild(this.animationFrameData.dragGenericObjects.node[id][0]);
                    // GV: TODO - Trigger object moved event?
                }
            }
            for (id in this.animationFrameData.dragGenericObjects.comment) {
                if (this.animationFrameData.dragGenericObjects.comment.hasOwnProperty(id)) {
                    this.objectData.comment[id].x += this.animationFrameData.dragGenericObjects.x - this.animationFrameData.dragGenericObjects.startX;
                    this.objectData.comment[id].y += this.animationFrameData.dragGenericObjects.y - this.animationFrameData.dragGenericObjects.startY;
                    this.animationFrameData.dragGenericObjects.comment[id][0].setAttribute('transform', 'translate(' + this.objectData.comment[id].x + ', ' + this.objectData.comment[id].y + ')');
                    this.elements.groupComments.appendChild(this.animationFrameData.dragGenericObjects.comment[id][0]);
                    // GV: TODO - Trigger object moved event?
                }
            }
            this.animationFrameData.dragGenericObjects.node = {};
            this.animationFrameData.dragGenericObjects.comment = {};
            this.animationFrameData.dragGenericObjects.connectionDrag = {};
            this.animationFrameData.dragGenericObjects.connectionRefresh = {};
            this.animationFrameData.dragGenericObjects.state = 'none';
            break;
        }
    };
    IgNodeGraph.prototype.requestAnimationFrameHandleDragNewConnection = function () {
        var addConnection = false,
            newConnection,
            newConnectionData,
            plug,
            node,
            endPlug,
            startPlug,
            point,
            direction,
            refreshConnection = false;
        switch (this.animationFrameData.dragConnection.state) {
        case 'startDrag':
        case 'dragging':
            if (this.animationFrameData.dragConnection.endPlugData.id) {
                if (this.animationFrameData.dragConnection.endPlugData.id !== this.animationFrameData.dragConnection.lastId) {
                    if (this.objectHash.plug.hasOwnProperty(this.animationFrameData.dragConnection.lastId)) {
                        this.animationFrameData.domRefreshObjects.plugs[this.animationFrameData.dragConnection.lastId] = this.objectHash.plug[this.animationFrameData.dragConnection.lastId];
                    }
                    // GV: TODO: Trigger a "Pending Connection Added" event?
                    plug = this.objectHash.plug[this.animationFrameData.dragConnection.endPlugData.id];
                    node = this.objectData.plug[this.animationFrameData.dragConnection.endPlugData.id].node;
                    point = node[node[0].getAttribute('igPluginName')]('getPlugConnectionPoints', [plug])[0];
                    direction = plug[plug[0].getAttribute('igPluginName')]('getConnectionDirection');
                    this.animationFrameData.dragConnection.endPlugData.x = point.x + this.objectData.node[node[0].getAttribute('igNodeGraphId')].x;
                    this.animationFrameData.dragConnection.endPlugData.y = point.y + this.objectData.node[node[0].getAttribute('igNodeGraphId')].y;
                    this.animationFrameData.dragConnection.endPlugData.directionX = direction.x;
                    this.animationFrameData.dragConnection.endPlugData.directionY = direction.y;
                    this.animationFrameData.dragConnection.endPlugData.showMarker = this.options.callbacks.shouldHaveMarker(plug);
                    this.animationFrameData.dragConnection.lastId = this.animationFrameData.dragConnection.endPlugData.id;
                    plug[plug[0].getAttribute('igPluginName')]('setConnected');
                    refreshConnection = true;
                }
            } else {
                if (this.animationFrameData.dragConnection.endPlugData.id !== this.animationFrameData.dragConnection.lastId) {
                    if (this.objectHash.plug.hasOwnProperty(this.animationFrameData.dragConnection.lastId)) {
                        this.animationFrameData.domRefreshObjects.plugs[this.animationFrameData.dragConnection.lastId] = this.objectHash.plug[this.animationFrameData.dragConnection.lastId];
                    }
                    // GV: TODO: Trigger a "Pending Connection Removed" event
                    this.animationFrameData.dragConnection.lastId = '';
                }
                this.animationFrameData.dragConnection.endPlugData.x = this.animationFrameData.zoom.pivotX + (this.animationFrameData.mouse.x - this.animationFrameData.pan.x - this.animationFrameData.zoom.pivotX) / this.animationFrameData.zoom.amount;
                this.animationFrameData.dragConnection.endPlugData.y = this.animationFrameData.zoom.pivotY + (this.animationFrameData.mouse.y - this.animationFrameData.pan.y - this.animationFrameData.zoom.pivotY) / this.animationFrameData.zoom.amount;
                this.animationFrameData.dragConnection.endPlugData.directionX = this.animationFrameData.dragConnection.startPlugData.x - this.animationFrameData.dragConnection.endPlugData.x;
                this.animationFrameData.dragConnection.endPlugData.directionY = this.animationFrameData.dragConnection.startPlugData.y - this.animationFrameData.dragConnection.endPlugData.y;
                this.animationFrameData.dragConnection.endPlugData.showMarker = !this.animationFrameData.dragConnection.startPlugData.showMarker;
                refreshConnection = true;
            }
            if (this.animationFrameData.dragConnection.state === 'startDrag') {
                plug = this.objectHash.plug[this.animationFrameData.dragConnection.startPlugData.id];
                plug[plug[0].getAttribute('igPluginName')]('setConnected');
                this.elements.svgStationary.appendChild(this.animationFrameData.dragConnection.connection[0]);
                this.animationFrameData.dragConnection.state = 'dragging';
                refreshConnection = true;
            }
            if (refreshConnection) {
                this.animationFrameData.dragConnection.connection[this.animationFrameData.dragConnection.connectionPluginName]('setStartPoint', this.animationFrameData.dragConnection.startPlugData.x, this.animationFrameData.dragConnection.startPlugData.y);
                this.animationFrameData.dragConnection.connection[this.animationFrameData.dragConnection.connectionPluginName]('setStartDirection', this.animationFrameData.dragConnection.startPlugData.directionX, this.animationFrameData.dragConnection.startPlugData.directionY);
                this.animationFrameData.dragConnection.connection[this.animationFrameData.dragConnection.connectionPluginName]('showStartMarker', this.animationFrameData.dragConnection.startPlugData.showMarker);
                this.animationFrameData.dragConnection.connection[this.animationFrameData.dragConnection.connectionPluginName]('setEndPoint', this.animationFrameData.dragConnection.endPlugData.x, this.animationFrameData.dragConnection.endPlugData.y);
                this.animationFrameData.dragConnection.connection[this.animationFrameData.dragConnection.connectionPluginName]('setEndDirection', this.animationFrameData.dragConnection.endPlugData.directionX, this.animationFrameData.dragConnection.endPlugData.directionY);
                this.animationFrameData.dragConnection.connection[this.animationFrameData.dragConnection.connectionPluginName]('showEndMarker', this.animationFrameData.dragConnection.endPlugData.showMarker);
                this.animationFrameData.dragConnection.connection[this.animationFrameData.dragConnection.connectionPluginName]('refresh');
            }
            break;
        case 'finalizeDrag':
            if (this.objectHash.plug.hasOwnProperty(this.animationFrameData.dragConnection.startPlugData.id) && this.objectHash.plug.hasOwnProperty(this.animationFrameData.dragConnection.endPlugData.id)) {
                startPlug = this.objectHash.plug[this.animationFrameData.dragConnection.startPlugData.id];
                endPlug = this.objectHash.plug[this.animationFrameData.dragConnection.endPlugData.id];
                if (this.options.callbacks.shouldFlipConnection(startPlug, endPlug)) {
                    startPlug = this.objectHash.plug[this.animationFrameData.dragConnection.endPlugData.id];
                    endPlug = this.objectHash.plug[this.animationFrameData.dragConnection.startPlugData.id];
                }
                if (this.animationFrameData.dragConnection.connection === this.options.defaultConnection) {
                    this.elements.documentFragment.appendChild(this.animationFrameData.dragConnection.connection[0]);
                    newConnection = this.options.callbacks.createNewConnection(startPlug, endPlug);
                    addConnection = true;
                } else {
                    newConnection = this.animationFrameData.dragConnection.connection;
                    newConnectionData = this.objectData.connection[newConnection[0].getAttribute('igNodeGraphId')];
                    if ((newConnectionData.startPlug[0] !== startPlug[0]) || (newConnectionData.endPlug[0] !== endPlug[0])) {
                        this.removeConnections([this.animationFrameData.dragConnection.connection], false, true);
                        addConnection = true;
                    }
                }
                if (addConnection) {
                    this.addConnections([{connection: newConnection, startPlug: startPlug, endPlug: endPlug}], true);
                    newConnectionData = this.objectData.connection[newConnection[0].getAttribute('igNodeGraphId')];
                }
                this.animationFrameData.domRefreshObjects.connections[newConnectionData.id] = newConnection;
            } else if (this.animationFrameData.dragConnection.connection !== this.options.defaultConnection) {
                this.removeConnections([this.animationFrameData.dragConnection.connection], false, true);
                this.elements.svgStationary.removeChild(this.animationFrameData.dragConnection.connection[0]);
            } else {
                this.elements.documentFragment.appendChild(this.animationFrameData.dragConnection.connection[0]);
            }
            if (this.objectHash.plug.hasOwnProperty(this.animationFrameData.dragConnection.startPlugData.id)) {
                this.animationFrameData.domRefreshObjects.plugs[this.animationFrameData.dragConnection.startPlugData.id] = this.objectHash.plug[this.animationFrameData.dragConnection.startPlugData.id];
            }
            if (this.objectHash.plug.hasOwnProperty(this.animationFrameData.dragConnection.endPlugData.id)) {
                this.animationFrameData.domRefreshObjects.plugs[this.animationFrameData.dragConnection.endPlugData.id] = this.objectHash.plug[this.animationFrameData.dragConnection.endPlugData.id];
            }
            this.animationFrameData.dragConnection.state = 'none';
            this.animationFrameData.dragConnection.connection = this.options.defaultConnection;
            this.animationFrameData.dragConnection.connectionPluginName = this.options.defaultConnection[0].getAttribute('igPluginName');
            this.animationFrameData.dragConnection.validPlugs = {};
            this.animationFrameData.dragConnection.lastId = '';
            this.animationFrameData.dragConnection.startPlugData = {id: '', showMarker: false, x: 0, y: 0, directionX: 0, directionY: 0};
            this.animationFrameData.dragConnection.endPlugData = {id: '', showMarker: false, x: 0, y: 0, directionX: 0, directionY: 0};
            break;
        }
    };
    IgNodeGraph.prototype.requestAnimationFrameHandleMarquee = function () {
        var id,
            clientRect;
        switch (this.animationFrameData.selection.state) {
        case 'selecting':
            for (id in this.animationFrameData.selection.marqueeObjectIds) {
                if (this.animationFrameData.selection.marqueeObjectIds.hasOwnProperty(id) && this.animationFrameData.selection.marqueeObjectClientRect.hasOwnProperty(id)) {
                    clientRect = this.animationFrameData.selection.marqueeObjectClientRect[id];
                    if (!((clientRect.right < this.animationFrameData.selection.marqueeBounds.left) || (clientRect.bottom < this.animationFrameData.selection.marqueeBounds.top) || (clientRect.left > this.animationFrameData.selection.marqueeBounds.right) || (clientRect.top > this.animationFrameData.selection.marqueeBounds.bottom))) {
                        if (!this.animationFrameData.selection.pendingObjectIds.hasOwnProperty(id)) {
                            this.selectObject(this.animationFrameData.selection.marqueeObjectIds[id], false);
                        }
                    } else if (this.animationFrameData.selection.pendingObjectIds.hasOwnProperty(id)) {
                        this.deselectObject(this.animationFrameData.selection.marqueeObjectIds[id]);
                    }
                }
            }

            break;
        }
    };
    IgNodeGraph.prototype.requestAnimationFrameHandlePanZoom = function () {
        var i,
            t,
            panX,
            panY,
            time,
            updateTransform = false,
            wheelZoomAmount = this.animationFrameData.zoom.amount;
        switch (this.animationFrameData.frameObjects.state) {
        case 'framing':
            if (this.animationFrameData.frameObjects.endTime <= this.animationFrameData.frameObjects.startTime) {
                t = 1;
                this.animationFrameData.frameObjects.state = 'none';
            } else {
                time = new Date().getTime();
                if (time >= this.animationFrameData.frameObjects.endTime) {
                    time = this.animationFrameData.frameObjects.endTime;
                    this.animationFrameData.frameObjects.state = 'none';
                }
                t = (time - this.animationFrameData.frameObjects.startTime) / (this.animationFrameData.frameObjects.endTime - this.animationFrameData.frameObjects.startTime);
                switch (this.options.framingInterpolation) {
                case 'easeIn':
                    t = t * t;
                    break;
                case 'easeOut':
                    t = 1.0 - (1.0 - t) * (1.0 - t);
                    break;
                case 'easeInOut':
                    t = (t * t * t) * (t * (t * 6.0 - 15.0) + 10.0);
                    break;
                }
            }
            this.animationFrameData.pan.x = this.animationFrameData.frameObjects.startPanX + t * (this.animationFrameData.frameObjects.endPanX - this.animationFrameData.frameObjects.startPanX);
            this.animationFrameData.pan.y = this.animationFrameData.frameObjects.startPanY + t * (this.animationFrameData.frameObjects.endPanY - this.animationFrameData.frameObjects.startPanY);
            this.animationFrameData.zoom.amount = Math.max(this.options.zoomMin, Math.min(this.animationFrameData.frameObjects.startZoomAmount + t * (this.animationFrameData.frameObjects.endZoomAmount - this.animationFrameData.frameObjects.startZoomAmount), this.options.zoomMax));
            updateTransform = true;
            break;
        }
        switch (this.animationFrameData.pan.state) {
        case 'panning':
            this.animationFrameData.pan.x = this.animationFrameData.pan.startX + this.animationFrameData.mouse.x - this.animationFrameData.mouse.startX;
            this.animationFrameData.pan.y = this.animationFrameData.pan.startY + this.animationFrameData.mouse.y - this.animationFrameData.mouse.startY;
            updateTransform = true;
            break;
        case 'panComplete':
            this.animationFrameData.pan.state = 'none';
            this.requestAnimationFrameUpdateVisibleBounds();
            break;
        }
        switch (this.animationFrameData.zoom.state) {
        case 'zoomWheel':
            if (this.animationFrameData.zoom.wheelDirection < 0) {
                for (i = 0; i < this.options.zoomWheelAmounts.length; i += 1) {
                    if (this.options.zoomWheelAmounts[i] >= this.animationFrameData.zoom.amount) {
                        break;
                    }
                    wheelZoomAmount = this.options.zoomWheelAmounts[i];
                }
            } else {
                for (i = this.options.zoomWheelAmounts.length - 1; i >= 0; i -= 1) {
                    if (this.options.zoomWheelAmounts[i] <= this.animationFrameData.zoom.amount) {
                        break;
                    }
                    wheelZoomAmount = this.options.zoomWheelAmounts[i];
                }
            }
            this.animationFrameData.zoom.state = 'none';
            this.animationFrameData.zoom.amount = Math.max(this.options.zoomMin, Math.min(wheelZoomAmount, this.options.zoomMax));
            this.requestAnimationFrameUpdateVisibleBounds();
            updateTransform = true;
            break;
        case 'zooming':
            this.animationFrameData.zoom.amount = Math.max(this.options.zoomMin, Math.min(this.animationFrameData.zoom.startAmount + this.options.zoomSpeed * (this.animationFrameData.mouse.x - this.animationFrameData.mouse.startX), this.options.zoomMax));
            updateTransform = true;
            break;
        case 'zoomComplete':
            this.animationFrameData.zoom.state = 'none';
            this.requestAnimationFrameUpdateVisibleBounds();
            break;
        }
        if (updateTransform) {
            panX = Math.round(this.animationFrameData.pan.x);
            panY = Math.round(this.animationFrameData.pan.y);
            this.elements.containerPanZoom.style.webkitTransformOrigin = this.animationFrameData.zoom.pivotX + 'px ' + this.animationFrameData.zoom.pivotY + 'px';
            this.elements.containerPanZoom.style.webkitTransform = 'translate3D(' + panX + 'px, ' + panY + 'px, 0px) scale3D( ' + this.animationFrameData.zoom.amount + ', ' + this.animationFrameData.zoom.amount + ', 1.0)';
            while (panX > 0) {
                panX -= this.options.gridSize;
            }
            while (panX < -this.options.gridSize) {
                panX += this.options.gridSize;
            }
            while (panY > 0) {
                panY -= this.options.gridSize;
            }
            while (panY < -this.options.gridSize) {
                panY += this.options.gridSize;
            }
            this.elements.containerGrid.style.webkitTransform = 'translate3D(' + panX + 'px, ' + panY + 'px, 0px) scale3D( ' + this.animationFrameData.zoom.amount + ', ' + this.animationFrameData.zoom.amount + ', 1.0)';
        }
    };
    IgNodeGraph.prototype.requestAnimationFrameRefreshObjects = function () {
        var id,
            plugId,
            plugsConnected = {},
            plugsConnectedSearch = true,
            connection,
            connectionPoint,
            connectionDirection,
            pluginName,
            positionData,
            refreshData = {};
        for (id in this.animationFrameData.domRefreshObjects.commentPositions) {
            if (this.animationFrameData.domRefreshObjects.commentPositions.hasOwnProperty(id)) {
                positionData = this.animationFrameData.domRefreshObjects.commentPositions[id];
                this.objectData.comment[id].x = positionData.x;
                this.objectData.comment[id].y = positionData.y;
                this.objectHash.comment[id][0].setAttribute('transform', 'translate(' + positionData.x + ', ' + positionData.y + ')');
            }
        }
        this.animationFrameData.domRefreshObjects.commentPositions = {};
        for (id in this.animationFrameData.domRefreshObjects.nodePositions) {
            if (this.animationFrameData.domRefreshObjects.nodePositions.hasOwnProperty(id)) {
                positionData = this.animationFrameData.domRefreshObjects.nodePositions[id];
                this.objectData.node[id].x = positionData.x;
                this.objectData.node[id].y = positionData.y;
                this.objectHash.node[id][0].setAttribute('transform', 'translate(' + positionData.x + ', ' + positionData.y + ')');
            }
        }
        this.animationFrameData.domRefreshObjects.nodePositions = {};
        for (id in this.animationFrameData.domRefreshObjects.comments) {
            if (this.animationFrameData.domRefreshObjects.comments.hasOwnProperty(id)) {
                pluginName = this.animationFrameData.domRefreshObjects.comments[id][0].getAttribute('igPluginName');
                if (!refreshData.hasOwnProperty(pluginName)) {
                    refreshData[pluginName] = [];
                }
                refreshData[pluginName].push(this.animationFrameData.domRefreshObjects.comments[id][0]);
            }
        }
        this.animationFrameData.domRefreshObjects.comments = {};
        for (id in this.animationFrameData.domRefreshObjects.nodes) {
            if (this.animationFrameData.domRefreshObjects.nodes.hasOwnProperty(id)) {
                pluginName = this.animationFrameData.domRefreshObjects.nodes[id][0].getAttribute('igPluginName');
                if (!refreshData.hasOwnProperty(pluginName)) {
                    refreshData[pluginName] = [];
                }
                refreshData[pluginName].push(this.animationFrameData.domRefreshObjects.nodes[id][0]);
            }
        }
        this.animationFrameData.domRefreshObjects.nodes = {};
        for (pluginName in refreshData) {
            if (refreshData.hasOwnProperty(pluginName)) {
                $(refreshData[pluginName])[pluginName]('refresh');
            }
        }
        for (id in this.animationFrameData.domRefreshObjects.connections) {
            if (this.animationFrameData.domRefreshObjects.connections.hasOwnProperty(id)) {
                connection = this.animationFrameData.domRefreshObjects.connections[id];
                pluginName = connection[0].getAttribute('igPluginName');
                connectionDirection = this.objectData.connection[id].startPlug[this.objectData.connection[id].startPlug[0].getAttribute('igPluginName')]('getConnectionDirection');
                connectionPoint = this.objectData.connection[id].startNode[this.objectData.connection[id].startNode[0].getAttribute('igPluginName')]('getPlugConnectionPoints', [this.objectData.connection[id].startPlug])[0];
                connectionPoint.x += this.objectData.node[this.objectData.connection[id].startNode[0].getAttribute('igNodeGraphId')].x;
                connectionPoint.y += this.objectData.node[this.objectData.connection[id].startNode[0].getAttribute('igNodeGraphId')].y;
                if (this.animationFrameData.dragGenericObjects.node.hasOwnProperty(this.objectData.connection[id].startNode[0].getAttribute('igNodeGraphId'))) {
                    connectionPoint.x += this.animationFrameData.dragGenericObjects.x - this.animationFrameData.dragGenericObjects.startX;
                    connectionPoint.y += this.animationFrameData.dragGenericObjects.y - this.animationFrameData.dragGenericObjects.startY;
                }
                connection[pluginName]('setStartPoint', connectionPoint.x, connectionPoint.y)[pluginName]('setStartDirection', connectionDirection.x, connectionDirection.y);
                connectionDirection = this.objectData.connection[id].endPlug[this.objectData.connection[id].endPlug[0].getAttribute('igPluginName')]('getConnectionDirection');
                connectionPoint = this.objectData.connection[id].endNode[this.objectData.connection[id].endNode[0].getAttribute('igPluginName')]('getPlugConnectionPoints', [this.objectData.connection[id].endPlug])[0];
                connectionPoint.x += this.objectData.node[this.objectData.connection[id].endNode[0].getAttribute('igNodeGraphId')].x;
                connectionPoint.y += this.objectData.node[this.objectData.connection[id].endNode[0].getAttribute('igNodeGraphId')].y;
                if (this.animationFrameData.dragGenericObjects.node.hasOwnProperty(this.objectData.connection[id].endNode[0].getAttribute('igNodeGraphId'))) {
                    connectionPoint.x += this.animationFrameData.dragGenericObjects.x - this.animationFrameData.dragGenericObjects.startX;
                    connectionPoint.y += this.animationFrameData.dragGenericObjects.y - this.animationFrameData.dragGenericObjects.startY;
                }
                connection[pluginName]('setEndPoint', connectionPoint.x, connectionPoint.y)[pluginName]('setEndDirection', connectionDirection.x, connectionDirection.y);
                if (!refreshData.hasOwnProperty(pluginName)) {
                    refreshData[pluginName] = [];
                }
                connection[pluginName]('showStartMarker', this.options.callbacks.shouldHaveMarker(this.objectData.connection[id].startPlug))[pluginName]('showEndMarker', this.options.callbacks.shouldHaveMarker(this.objectData.connection[id].endPlug))[pluginName]('refresh');
            }
        }
        this.animationFrameData.domRefreshObjects.connections = {};
        for (plugId in this.animationFrameData.domRefreshObjects.plugs) {
            if (this.animationFrameData.domRefreshObjects.plugs.hasOwnProperty(plugId)) {
                if (plugsConnectedSearch) {
                    plugsConnectedSearch = false;
                    for (id in this.objectData.connection) {
                        if (this.objectData.connection.hasOwnProperty(id) && (id !== this.animationFrameData.dragConnection.connection[0].getAttribute('igNodeGraphId'))) {
                            plugsConnected[this.objectData.connection[id].startPlug[0].getAttribute('igNodeGraphId')] = true;
                            plugsConnected[this.objectData.connection[id].endPlug[0].getAttribute('igNodeGraphId')] = true;
                        }
                    }
                }
                if (plugsConnected.hasOwnProperty(plugId)) {
                    this.animationFrameData.domRefreshObjects.plugs[plugId][this.animationFrameData.domRefreshObjects.plugs[plugId][0].getAttribute('igPluginName')]('setConnected');
                } else {
                    this.animationFrameData.domRefreshObjects.plugs[plugId][this.animationFrameData.domRefreshObjects.plugs[plugId][0].getAttribute('igPluginName')]('clearConnected');
                }
            }
        }
        this.animationFrameData.domRefreshObjects.plugs = {};
    };
    IgNodeGraph.prototype.requestAnimationFrameCallback = function () {
        document.getSelection().empty();
        this.flags.requestAnimationFrame = false;
        this.requestAnimationFrameUpdateFreezeMouse();
        this.requestAnimationFrameHandleMarquee();
        this.requestAnimationFrameHandlePanZoom();
        this.requestAnimationFrameHandleDragNodes();
        this.requestAnimationFrameHandleDragNewConnection();
        this.requestAnimationFrameAddRemoveObjects();
        this.requestAnimationFrameRefreshObjects();
        this.requestAnimationFrameRecalculateBounds();
        this.animationFrameData.mouse.previousX = this.animationFrameData.mouse.x;
        this.animationFrameData.mouse.previousY = this.animationFrameData.mouse.y;
        if (this.animationFrameData.frameObjects.state === 'framing') {
            this.requestAnimationFrame();
        }
    };
    IgNodeGraph.prototype.setupGrid = function () {
        var x,
            y,
            width,
            height,
            widthAdjusted,
            heightAdjusted,
            backgroundBoundingRect = this.elements.containerBackground.getBoundingClientRect(),
            gridData = '';
        width = (this.options.gridSize * 2 + backgroundBoundingRect.width) / this.options.zoomMin;
        height = (this.options.gridSize * 2 + backgroundBoundingRect.height) / this.options.zoomMin;
        widthAdjusted = Math.ceil(width) - 0.5;
        heightAdjusted = Math.ceil(height) - 0.5;
        for (x = -this.options.gridSize; x <= width; x += this.options.gridSize) {
            gridData += 'M ' + (Math.floor(x) - 0.5) + ' -0.5 L ' + (Math.floor(x) - 0.5) + ' ' + heightAdjusted + ' ';
        }
        for (y = -this.options.gridSize; y <= height; y += this.options.gridSize) {
            gridData += 'M -0.5 ' + (Math.floor(y) - 0.5) + ' L ' + widthAdjusted + ' ' + (Math.floor(y) - 0.5) + ' ';
        }
        this.elements.svgGridPath.setAttribute('d', gridData);
        this.elements.svgGrid.style.width = width + 'px';
        this.elements.svgGrid.style.height = height + 'px';
        this.elements.svgGrid.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        this.elements.containerGrid.style.webkitTransformOrigin = '0px 0px';
    };
    IgNodeGraph.prototype.displayGrid = function (display) {
        this.options.displayGrid = display;
        if (display) {
            this.elements.containerGrid.style.display = 'block';
        } else {
            this.elements.containerGrid.style.display = 'none';
        }
    };
    IgNodeGraph.prototype.freezeMouse = function () {
        var lastCount = this.animationFrameData.freezeMouse.count;
        this.animationFrameData.freezeMouse.count += 1;
        if ((lastCount <= 0) && (this.animationFrameData.freezeMouse.count > 0)) {
            this.animationFrameData.freezeMouse.update = true;
            this.requestAnimationFrame();
        }
    };
    IgNodeGraph.prototype.thawMouse = function () {
        var lastCount = this.animationFrameData.freezeMouse.count;
        this.animationFrameData.freezeMouse.count -= 1;
        if ((lastCount > 0) && (this.animationFrameData.freezeMouse.count <= 0)) {
            this.animationFrameData.freezeMouse.update = true;
            this.requestAnimationFrame();
        }
    };
    IgNodeGraph.prototype.screenSpaceToWorldSpace = function (pointList) {
        var i,
            backgroundClientRect = this.elements.containerBackground.getBoundingClientRect();
        for (i = 0; i < pointList.length; i += 1) {
            pointList[i].x = (pointList[i].x - this.animationFrameData.zoom.pivotX * (1 - this.animationFrameData.zoom.amount) - this.animationFrameData.pan.x - backgroundClientRect.left) / this.animationFrameData.zoom.amount;
            pointList[i].y = (pointList[i].y - this.animationFrameData.zoom.pivotY * (1 - this.animationFrameData.zoom.amount) - this.animationFrameData.pan.y - backgroundClientRect.top) / this.animationFrameData.zoom.amount;
        }
    };
    IgNodeGraph.prototype.getNextId = function (type) {
        this.objectIds[type] += 1;
        return type + ' ' + this.objectIds[type];
    };
    IgNodeGraph.prototype.getObjectOfType = function (jQueryObject, type) {
        var element = jQueryObject[0],
            currentType = String(element.getAttribute('igNodeGraphType') || '');
        while ((currentType !== type) && (element !== this.elements.root)) {
            element = element.parentNode;
            currentType = String(element.getAttribute('igNodeGraphType') || '');
        }
        if (element === this.elements.root) {
            return $();
        }
        return $(element);
    };
    IgNodeGraph.prototype.selectObject = function (obj, permanent) {
        var id = obj[0].getAttribute('igNodeGraphId');
        if (permanent) {
            this.animationFrameData.selection.objectIds[id] = obj;
        } else {
            this.animationFrameData.selection.pendingObjectIds[id] = obj;
        }
        obj[obj[0].getAttribute('igPluginName')]('select');
    };
    IgNodeGraph.prototype.selectObjects = function (objectList) {
        var i,
            objectType;
        for (i = 0; i < objectList.length; i += 1) {
            objectType = objectList[i][0].getAttribute('igNodeGraphType');
            switch (objectType) {
            case 'node':
            case 'plug':
            case 'connection':
            case 'comment':
                this.selectObject(objectList[i], true);
                break;
            }
        }
    };
    IgNodeGraph.prototype.deselectObject = function (obj) {
        var id = obj[0].getAttribute('igNodeGraphId');
        if (this.animationFrameData.selection.objectIds.hasOwnProperty(id)) {
            delete this.animationFrameData.selection.objectIds[id];
        }
        if (this.animationFrameData.selection.pendingObjectIds.hasOwnProperty(id)) {
            delete this.animationFrameData.selection.pendingObjectIds[id];
        }
        obj[obj[0].getAttribute('igPluginName')]('deselect');
    };
    IgNodeGraph.prototype.deselectObjects = function (objectList) {
        var i,
            objectType;
        for (i = 0; i < objectList.length; i += 1) {
            objectType = objectList[i][0].getAttribute('igNodeGraphType');
            switch (objectType) {
            case 'node':
            case 'plug':
            case 'connection':
            case 'comment':
                this.deselectObject(objectList[i]);
                break;
            }
        }
    };
    IgNodeGraph.prototype.deselectOtherObjects = function (selectedObject) {
        var id;
        for (id in this.animationFrameData.selection.objectIds) {
            if (this.animationFrameData.selection.objectIds.hasOwnProperty(id) && (this.animationFrameData.selection.objectIds[id][0] !== selectedObject[0])) {
                this.deselectObject(this.animationFrameData.selection.objectIds[id]);
            }
        }
    };
    IgNodeGraph.prototype.clearSelection = function () {
        var id;
        for (id in this.animationFrameData.selection.objectIds) {
            if (this.animationFrameData.selection.objectIds.hasOwnProperty(id)) {
                this.deselectObject(this.animationFrameData.selection.objectIds[id]);
            }
        }
    };
    IgNodeGraph.prototype.deleteSelectedObjects = function () {
        var id;
        for (id in this.animationFrameData.selection.objectIds) {
            if (this.animationFrameData.selection.objectIds.hasOwnProperty(id)) {
                switch (this.animationFrameData.selection.objectIds[id][0].getAttribute('igNodeGraphType')) {
                case 'node':
                    this.animationFrameData.node.remove[this.animationFrameData.selection.objectIds[id][0].getAttribute('igNodeGraphId')] = this.animationFrameData.selection.objectIds[id];
                    break;
                case 'plug':
                    this.animationFrameData.plug.remove[this.animationFrameData.selection.objectIds[id][0].getAttribute('igNodeGraphId')] = this.animationFrameData.selection.objectIds[id];
                    break;
                case 'connection':
                    this.animationFrameData.connection.remove[this.animationFrameData.selection.objectIds[id][0].getAttribute('igNodeGraphId')] = this.animationFrameData.selection.objectIds[id];
                    break;
                case 'comment':
                    this.animationFrameData.comment.remove[this.animationFrameData.selection.objectIds[id][0].getAttribute('igNodeGraphId')] = this.animationFrameData.selection.objectIds[id];
                    break;
                }
            }
        }
    };
    IgNodeGraph.prototype.frameObjects = function (objectList, duration) {
        var i,
            clientRect,
            backgroundClientRect = this.elements.containerBackground.getBoundingClientRect(),
            points,
            newZoom;
        if (objectList.length <= 0) {
            return;
        }
        clientRect = objectList[0][0].getBoundingClientRect();
        points = [{x: clientRect.left, y: clientRect.top}, {x: clientRect.right, y: clientRect.bottom}];
        for (i = 1; i < objectList.length; i += 1) {
            clientRect = objectList[i][0].getBoundingClientRect();
            points[0].x = Math.min(points[0].x, clientRect.left);
            points[0].y = Math.min(points[0].y, clientRect.top);
            points[1].x = Math.max(points[1].x, clientRect.right);
            points[1].y = Math.max(points[1].y, clientRect.bottom);
        }
        this.screenSpaceToWorldSpace(points);
        newZoom = Math.max(this.options.zoomMin, Math.min((backgroundClientRect.width - this.options.framePadding * 2) / (points[1].x - points[0].x), (backgroundClientRect.height - this.options.framePadding * 2) / (points[1].y - points[0].y), this.options.zoomMax));
        points[0].x *= newZoom;
        points[0].y *= newZoom;
        points[1].x *= newZoom;
        points[1].y *= newZoom;
        this.animationFrameData.pan.x += this.animationFrameData.zoom.pivotX * (1 - this.animationFrameData.zoom.amount);
        this.animationFrameData.pan.y += this.animationFrameData.zoom.pivotY * (1 - this.animationFrameData.zoom.amount);
        this.animationFrameData.zoom.pivotX = 0;
        this.animationFrameData.zoom.pivotY = 0;
        this.animationFrameData.frameObjects.startTime = new Date().getTime();
        this.animationFrameData.frameObjects.startZoomAmount = this.animationFrameData.zoom.amount;
        this.animationFrameData.frameObjects.startPanX = this.animationFrameData.pan.x;
        this.animationFrameData.frameObjects.startPanY = this.animationFrameData.pan.y;
        this.animationFrameData.frameObjects.endTime = this.animationFrameData.frameObjects.startTime + Math.floor(duration * 1000);
        this.animationFrameData.frameObjects.endZoomAmount = newZoom;
        this.animationFrameData.frameObjects.endPanX = ((backgroundClientRect.width - (points[1].x - points[0].x)) / 2) - points[0].x;
        this.animationFrameData.frameObjects.endPanY = ((backgroundClientRect.height - (points[1].y - points[0].y)) / 2) - points[0].y;
        this.animationFrameData.frameObjects.state = 'framing';
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.frameSelection = function (duration) {
        var id,
            selectionList = [];
        for (id in this.animationFrameData.selection.objectIds) {
            if (this.animationFrameData.selection.objectIds.hasOwnProperty(id)) {
                selectionList.push(this.animationFrameData.selection.objectIds[id]);
            }
        }
        if (selectionList.length <= 0) {
            for (id in this.objectHash.comment) {
                if (this.objectHash.comment.hasOwnProperty(id)) {
                    selectionList.push(this.objectHash.comment[id]);
                }
            }
            for (id in this.objectHash.node) {
                if (this.objectHash.node.hasOwnProperty(id)) {
                    selectionList.push(this.objectHash.node[id]);
                }
            }
        }
        if (selectionList.length) {
            this.frameObjects(selectionList, duration);
        }
    };
    IgNodeGraph.prototype.addDefs = function (defs) {
        var i;
        for (i = 0; i < defs.length; i += 1) {
            this.elements.defsStationary.appendChild(defs[i]);
        }
    };
    IgNodeGraph.prototype.addNodes = function (nodes) {
        var i,
            nodeData;
        for (i = 0; i < nodes.length; i += 1) {
            nodeData = {id: this.getNextId('node'), x: 0, y: 0};
            Object.seal(nodeData);
            nodes[i][0].setAttribute('igNodeGraphId', nodeData.id);
            nodes[i][0].setAttribute('igNodeGraphType', 'node');
            nodes[i][0].setAttribute('transform', 'translate(0, 0)');
            this.objectHash.node[nodeData.id] = nodes[i];
            this.objectData.node[nodeData.id] = nodeData;
            this.animationFrameData.domAddObjects.nodes[nodeData.id] = nodes[i][0];
        }
        this.flags.recalculateBounds = true;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.removeNodes = function (nodes) {
        var i,
            id;
        for (i = 0; i < nodes.length; i += 1) {
            // GV: TODO: this.removePlugs( ... );
            // GV: TODO: this.removeConnections( ... );
            id = nodes[i][0].getAttribute('igNodeGraphId');
            delete this.objectData.node[id];
            delete this.objectHash.node[id];
            this.animationFrameData.domRemoveObjects.nodes[id] = nodes[i][0];
        }
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.refreshNodes = function (nodes) {
        var i;
        for (i = 0; i < nodes.length; i += 1) {
            this.animationFrameData.domRefreshObjects.nodes[nodes[i][0].getAttribute('igNodeGraphId')] = nodes[i];
        }
        this.flags.recalculateBounds = true;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.setNodePositions = function (nodes, positions) {
        var i;
        for (i = 0; i < nodes.length; i += 1) {
            this.animationFrameData.domRefreshObjects.nodePositions[nodes[i][0].getAttribute('igNodeGraphId')] = {x: positions[i].x, y: positions[i].y};
        }
        this.flags.recalculateBounds = true;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.addPlugs = function (node, plugs) {
        var i,
            nodeId = node[0].getAttribute('igNodeGraphId'),
            plugData;
        if (!this.animationFrameData.domAddObjects.plugs.hasOwnProperty(nodeId)) {
            this.animationFrameData.domAddObjects.plugs[nodeId] = [];
        }
        for (i = 0; i < plugs.length; i += 1) {
            plugData = {id: this.getNextId('plug'), node: node};
            plugs[i][0].setAttribute('igNodeGraphId', plugData.id);
            plugs[i][0].setAttribute('igNodeGraphType', 'plug');
            plugs[i][plugs[i][0].getAttribute('igPluginName')]('getHandle').setAttribute('igNodeGraphType', 'handle');
            this.objectHash.plug[plugData.id] = plugs[i];
            this.objectData.plug[plugData.id] = plugData;
            this.animationFrameData.domAddObjects.plugs[nodeId].push(plugs[i]);
        }
        this.flags.recalculateBounds = true;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.removePlugs = function (node, plugs) {
        var i,
            plugId,
            nodeId = node[0].getAttribute('igNodeGraphId');
        if (!this.animationFrameData.domRemoveObjects.plugs.hasOwnProperty(nodeId)) {
            this.animationFrameData.domRemoveObjects.plugs[nodeId] = [];
        }
        for (i = 0; i < plugs.length; i += 1) {
            // GV: TODO: this.removeConnections( ... );
            plugId = plugs[i][0].getAttribute('igNodeGraphId');
            delete this.objectData.plug[plugId];
            delete this.objectHash.plug[plugId];
            this.animationFrameData.domRemoveObjects.plugs[nodeId].push(plugs[i]);
        }
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.addConnections = function (connectionDataList, triggerEvent) {
        var i,
            connectionData;
        for (i = 0; i < connectionDataList.length; i += 1) {
            connectionData = {
                id: this.getNextId('connection'),
                startPlug: connectionDataList[i].startPlug,
                startNode: this.objectData.plug[connectionDataList[i].startPlug[0].getAttribute('igNodeGraphId')].node,
                endPlug: connectionDataList[i].endPlug,
                endNode: this.objectData.plug[connectionDataList[i].endPlug[0].getAttribute('igNodeGraphId')].node
            };
            connectionDataList[i].connection[0].setAttribute('igNodeGraphId', connectionData.id);
            connectionDataList[i].connection[0].setAttribute('igNodeGraphType', 'connection');
            this.objectHash.connection[connectionData.id] = connectionDataList[i].connection;
            this.objectData.connection[connectionData.id] = connectionData;
            this.animationFrameData.domAddObjects.connections[connectionData.id] = connectionDataList[i].connection[0];
            this.animationFrameData.domRefreshObjects.plugs[connectionDataList[i].startPlug[0].getAttribute('igNodeGraphId')] = connectionDataList[i].startPlug;
            this.animationFrameData.domRefreshObjects.plugs[connectionDataList[i].endPlug[0].getAttribute('igNodeGraphId')] = connectionDataList[i].endPlug;
            if (triggerEvent) {
                // GV: TODO: Trigger connection added event
                triggerEvent = false;
            }
        }
        this.flags.recalculateBounds = true;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.removeConnections = function (connections, removeFromDom, triggerEvent) {
        var i,
            id;
        for (i = 0; i < connections.length; i += 1) {
            id = connections[i][0].getAttribute('igNodeGraphId');
            if (triggerEvent) {
                // GV: TODO: Trigger connection removed event
                triggerEvent = false;
            }
            if (removeFromDom) {
                this.animationFrameData.domRemoveObjects.connections[id] = connections[i][0];
            }
            delete this.objectData.connection[id];
            delete this.objectHash.connection[id];
        }
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.refreshConnections = function (connections) {
        var i;
        for (i = 0; i < connections.length; i += 1) {
            this.animationFrameData.domRefreshObjects.connections[connections[i][0].getAttribute('igNodeGraphId')] = connections[i];
        }
        this.flags.recalculateBounds = true;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.addComments = function (comments) {
        var i,
            commentData;
        for (i = 0; i < comments.length; i += 1) {
            commentData = {id: this.getNextId('comment'), x: 0, y: 0};
            comments[i][0].setAttribute('igNodeGraphId', commentData.id);
            comments[i][0].setAttribute('igNodeGraphType', 'comment');
            comments[i][0].setAttribute('transform', 'translate(0, 0)');
            this.objectHash.comment[commentData.id] = comments[i];
            this.objectData.comment[commentData.id] = commentData;
            this.animationFrameData.domAddObjects.comments[commentData.id] = comments[i][0];
        }
        this.flags.recalculateBounds = true;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.removeComments = function (comments) {
        var i,
            id;
        for (i = 0; i < comments.length; i += 1) {
            id = comments[i][0].getAttribute('igNodeGraphId');
            this.animationFrameData.domRemoveObjects.comments[id] = comments[i][0];
            delete this.objectData.connection[id];
            delete this.objectHash.connection[id];
        }
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.refreshComments = function (comments) {
        var i;
        for (i = 0; i < comments.length; i += 1) {
            this.animationFrameData.domRefreshObjects.comments[comments[i][0].getAttribute('igNodeGraphId')] = comments[i];
        }
        this.flags.recalculateBounds = true;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.setCommentPositions = function (comments, positions) {
        var i;
        for (i = 0; i < comments.length; i += 1) {
            this.animationFrameData.domRefreshObjects.commentPositions[comments[i][0].getAttribute('igNodeGraphId')] = {x: positions[i].x, y: positions[i].y};
        }
        this.flags.recalculateBounds = true;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.setCommentPositionsImmediate = function (comments, positions) {
        var i,
            commentData;
        for (i = 0; i < comments.length; i += 1) {
            commentData = this.objectData.comment[comments[i][0].getAttribute('igNodeGraphId')];
            commentData.x = positions[i].x;
            commentData.y = positions[i].y;
            comments[i][0].setAttribute('transform', 'translate(' + commentData.x + ', ' + commentData.y + ')');
        }
    };
    IgNodeGraph.prototype.getCommentPositions = function (comments) {
        var i,
            commentData,
            positions = [];
        for (i = 0; i < comments.length; i += 1) {
            commentData = this.objectData.comment[comments[i][0].getAttribute('igNodeGraphId')];
            positions.push({x: commentData.x, y: commentData.y});
        }
        return positions;
    };
    IgNodeGraph.prototype.onKeyDown = function (e) {
        switch (String.fromCharCode(e.which).toLowerCase()) {
        case 'f':
            this.frameSelection(this.options.defaultFrameTime);
            break;
        case 'g':
            this.displayGrid(!this.options.displayGrid);
            break;
        }
    };
    IgNodeGraph.prototype.onMouseWheel = function (e) {
        var mouseX,
            mouseY,
            pivotX,
            pivotY;
        this.animationFrameData.mouse.x = e.originalEvent.pageX - this.elements.root.offsetLeft;
        this.animationFrameData.mouse.y = e.originalEvent.pageY - this.elements.root.offsetTop;
        this.animationFrameData.mouse.startX = this.animationFrameData.mouse.x;
        this.animationFrameData.mouse.startY = this.animationFrameData.mouse.y;
        this.animationFrameData.mouse.previousX = this.animationFrameData.mouse.x;
        this.animationFrameData.mouse.previousY = this.animationFrameData.mouse.y;
        if (this.options.zoomAroundMouse) {
            mouseX = this.animationFrameData.mouse.x;
            mouseY = this.animationFrameData.mouse.y;
        } else {
            mouseX = parseFloat(this.elements.root.style.width || '') / 2;
            mouseY = parseFloat(this.elements.root.style.height || '') / 2;
        }
        pivotX = this.animationFrameData.zoom.pivotX + (mouseX - this.animationFrameData.pan.x - this.animationFrameData.zoom.pivotX) / this.animationFrameData.zoom.amount;
        pivotY = this.animationFrameData.zoom.pivotY + (mouseY - this.animationFrameData.pan.y - this.animationFrameData.zoom.pivotY) / this.animationFrameData.zoom.amount;
        this.animationFrameData.pan.x = (this.animationFrameData.pan.x + (this.animationFrameData.zoom.pivotX - mouseX) * (1 - this.animationFrameData.zoom.amount)) / this.animationFrameData.zoom.amount;
        this.animationFrameData.pan.y = (this.animationFrameData.pan.y + (this.animationFrameData.zoom.pivotY - mouseY) * (1 - this.animationFrameData.zoom.amount)) / this.animationFrameData.zoom.amount;
        this.animationFrameData.zoom.pivotX = pivotX;
        this.animationFrameData.zoom.pivotY = pivotY;
        this.animationFrameData.zoom.wheelDirection = e.originalEvent.wheelDelta < 0 ? -1 : 1;
        this.animationFrameData.zoom.state = 'zoomWheel';
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.onMouseDown = function (e) {
        var target = $(e.target),
            targetType = String(target[0].getAttribute('igNodeGraphType') || ''),
            parents,
            mouseX,
            mouseY,
            pivotX,
            pivotY;
        e.stopPropagation();
        e.preventDefault();
        this.animationFrameData.mouse.x = e.pageX - this.elements.root.offsetLeft;
        this.animationFrameData.mouse.y = e.pageY - this.elements.root.offsetTop;
        this.animationFrameData.mouse.startX = this.animationFrameData.mouse.x;
        this.animationFrameData.mouse.startY = this.animationFrameData.mouse.y;
        this.animationFrameData.mouse.previousX = this.animationFrameData.mouse.x;
        this.animationFrameData.mouse.previousY = this.animationFrameData.mouse.y;
        if (e.altKey) {
            if (e.originalEvent.which === 3) {
                if (this.options.zoomAroundMouse) {
                    mouseX = this.animationFrameData.mouse.x;
                    mouseY = this.animationFrameData.mouse.y;
                } else {
                    mouseX = parseFloat(this.elements.root.style.width || '') / 2;
                    mouseY = parseFloat(this.elements.root.style.height || '') / 2;
                }
                pivotX = this.animationFrameData.zoom.pivotX + (mouseX - this.animationFrameData.pan.x - this.animationFrameData.zoom.pivotX) / this.animationFrameData.zoom.amount;
                pivotY = this.animationFrameData.zoom.pivotY + (mouseY - this.animationFrameData.pan.y - this.animationFrameData.zoom.pivotY) / this.animationFrameData.zoom.amount;
                this.animationFrameData.pan.x = (this.animationFrameData.pan.x + (this.animationFrameData.zoom.pivotX - mouseX) * (1 - this.animationFrameData.zoom.amount)) / this.animationFrameData.zoom.amount;
                this.animationFrameData.pan.y = (this.animationFrameData.pan.y + (this.animationFrameData.zoom.pivotY - mouseY) * (1 - this.animationFrameData.zoom.amount)) / this.animationFrameData.zoom.amount;
                this.animationFrameData.zoom.pivotX = pivotX;
                this.animationFrameData.zoom.pivotY = pivotY;
                this.animationFrameData.zoom.startAmount = this.animationFrameData.zoom.amount;
                this.animationFrameData.zoom.state = 'zooming';
            } else {
                this.animationFrameData.pan.startX = this.animationFrameData.pan.x;
                this.animationFrameData.pan.startY = this.animationFrameData.pan.y;
                this.animationFrameData.pan.state = 'panning';
            }
            $(window).on('mousemove', this.callbacks.onMouseMove).on('mouseup', this.callbacks.onPanZoomComplete);
            this.freezeMouse();
            this.requestAnimationFrame();
        } else {
            switch (targetType) {
            case 'node':
                if (e.originalEvent.which === 1) {
                    this.onSelectGenericObject(e, target);
                }
                break;
            case 'handle':
                if (e.originalEvent.which === 1) {
                    this.onSelectPlug(e, this.getObjectOfType(target, 'plug').first());
                }
                break;
            case 'connection':
                if (e.originalEvent.which === 1) {
                    $(window).on('mousemove', this.callbacks.onDragConnection).on('mouseup', this.callbacks.onSelectConnectionDeferred);
                }
                break;
            case 'comment':
                if (e.originalEvent.which === 1) {
                    this.onSelectGenericObject(e, target);
                }
                break;
            default:
                parents = this.getObjectOfType(target, 'handle');
                if (parents.length > 0) {
                    if (e.originalEvent.which === 1) {
                        this.onSelectPlug(e, this.getObjectOfType(target, 'plug').first());
                    }
                } else {
                    parents = this.getObjectOfType(target, 'node');
                    if (parents.length > 0) {
                        if (e.originalEvent.which === 1) {
                            this.onSelectGenericObject(e, parents.first());
                        }
                    } else {
                        parents = this.getObjectOfType(target, 'connection');
                        if (parents.length > 0) {
                            if (e.originalEvent.which === 1) {
                                $(window).on('mousemove', this.callbacks.onDragConnection).on('mouseup', this.callbacks.onSelectConnectionDeferred);
                            }
                        } else {
                            parents = this.getObjectOfType(target, 'comment');
                            if (parents.length > 0) {
                                if (e.originalEvent.which === 1) {
                                    this.onSelectGenericObject(e, parents.first());
                                }
                            } else {
                                this.onMarqueeSelectBegin(e);
                            }
                        }
                    }
                }
                break;
            }
        }
    };
    IgNodeGraph.prototype.onMouseMove = function (e) {
        this.animationFrameData.mouse.x = e.pageX - this.elements.root.offsetLeft;
        this.animationFrameData.mouse.y = e.pageY - this.elements.root.offsetTop;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.onPanZoomComplete = function () {
        if (this.animationFrameData.pan.state === 'panning') {
            this.animationFrameData.pan.state = 'panComplete';
            this.requestAnimationFrame();
        }
        if (this.animationFrameData.zoom.state === 'zooming') {
            this.animationFrameData.zoom.state = 'zoomComplete';
            this.requestAnimationFrame();
        }
        this.thawMouse();
        $(window).off('mousemove', this.callbacks.onMouseMove).off('mouseup', this.callbacks.onPanZoomComplete);
    };
    IgNodeGraph.prototype.onSelectGenericObject = function (e, obj) {
        if (this.animationFrameData.selection.objectIds.hasOwnProperty(obj[0].getAttribute('igNodeGraphId'))) {
            $(window).on('mousemove', this.callbacks.onDragGenericObjects).on('mouseup', this.callbacks.onSelectGenericObjectDeferred);
        } else {
            if (!e.shiftKey) {
                this.deselectOtherObjects(obj);
            }
            this.selectObject(obj, true);
            this.requestAnimationFrame();
            $(window).on('mousemove', this.callbacks.onDragGenericObjects).on('mouseup', this.callbacks.onSelectGenericObjectComplete);
        }
    };
    IgNodeGraph.prototype.onSelectGenericObjectDeferred = function (e) {
        var obj = this.getObjectOfType($(e.target), 'node');
        if (obj.length <= 0) {
            obj = this.getObjectOfType($(e.target), 'comment');
        }
        $(window).off('mousemove', this.callbacks.onDragGenericObjects).off('mouseup', this.callbacks.onSelectGenericObjectDeferred).off('mouseup', this.callbacks.onSelectGenericObjectComplete);
        if (obj.length) {
            if (e.shiftKey) {
                this.deselectObject(obj);
            } else {
                this.deselectOtherObjects(obj);
            }
            this.requestAnimationFrame();
        }
    };
    IgNodeGraph.prototype.onSelectGenericObjectComplete = function () {
        $(window).off('mousemove', this.callbacks.onDragGenericObjects).off('mouseup', this.callbacks.onSelectGenericObjectDeferred).off('mouseup', this.callbacks.onSelectGenericObjectComplete);
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.onDragGenericObjects = function (e) {
        var i,
            id,
            nodeBoundingBox,
            commentBoundingBoxes = [],
            connectionData,
            dragConnectionStart,
            dragConnectionEnd;
        this.animationFrameData.dragGenericObjects.node = {};
        this.animationFrameData.dragGenericObjects.comment = {};
        this.animationFrameData.dragGenericObjects.connectionDrag = {};
        this.animationFrameData.dragGenericObjects.connectionRefresh = {};
        this.animationFrameData.dragGenericObjects.state = 'startDrag';
        for (id in this.animationFrameData.selection.objectIds) {
            if (this.animationFrameData.selection.objectIds.hasOwnProperty(id)) {
                switch (this.animationFrameData.selection.objectIds[id][0].getAttribute('igNodeGraphType')) {
                case 'node':
                    this.animationFrameData.dragGenericObjects.node[id] = this.animationFrameData.selection.objectIds[id];
                    break;
                case 'comment':
                    this.animationFrameData.dragGenericObjects.comment[id] = this.animationFrameData.selection.objectIds[id];
                    commentBoundingBoxes.push(this.animationFrameData.selection.objectIds[id][0].getBoundingClientRect());
                    break;
                }
            }
        }
        if (commentBoundingBoxes.length) {
            for (id in this.objectHash.node) {
                if (this.objectHash.node.hasOwnProperty(id) && !this.animationFrameData.dragGenericObjects.node.hasOwnProperty(id)) {
                    nodeBoundingBox = this.objectHash.node[id][0].getBoundingClientRect();
                    for (i = 0; i < commentBoundingBoxes.length; i += 1) {
                        if ((nodeBoundingBox.left >= commentBoundingBoxes[i].left) && (nodeBoundingBox.top >= commentBoundingBoxes[i].top) && (nodeBoundingBox.right <= commentBoundingBoxes[i].right) && (nodeBoundingBox.bottom <= commentBoundingBoxes[i].bottom)) {
                            this.animationFrameData.dragGenericObjects.node[id] = this.objectHash.node[id];
                        }
                    }
                }
            }
        }
        for (id in this.objectHash.connection) {
            if (this.objectHash.connection.hasOwnProperty(id)) {
                connectionData = this.objectData.connection[id];
                dragConnectionStart = this.animationFrameData.dragGenericObjects.node.hasOwnProperty(connectionData.startNode[0].getAttribute('igNodeGraphId'));
                dragConnectionEnd = this.animationFrameData.dragGenericObjects.node.hasOwnProperty(connectionData.endNode[0].getAttribute('igNodeGraphId'));
                if (dragConnectionStart && dragConnectionEnd) {
                    this.animationFrameData.dragGenericObjects.connectionDrag[id] = this.objectHash.connection[id];
                } else if (dragConnectionStart || dragConnectionEnd) {
                    this.animationFrameData.dragGenericObjects.connectionRefresh[id] = this.objectHash.connection[id];
                }
            }
        }
        $(window).off('mousemove', this.callbacks.onDragGenericObjects).off('mouseup', this.callbacks.onSelectGenericObjectDeferred).off('mouseup', this.callbacks.onSelectGenericObjectComplete);
        $(window).on('mousemove', this.callbacks.onMouseMove).on('mouseup', this.callbacks.onDragGenericObjectsComplete);
        this.animationFrameData.mouse.x = e.pageX - this.elements.root.offsetLeft;
        this.animationFrameData.mouse.y = e.pageY - this.elements.root.offsetTop;
        this.freezeMouse();
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.onDragGenericObjectsComplete = function () {
        this.animationFrameData.dragGenericObjects.state = 'finalizeDrag';
        this.requestAnimationFrame();
        $(window).off('mousemove', this.callbacks.onMouseMove).off('mouseup', this.callbacks.onDragGenericObjectsComplete);
        this.thawMouse();
    };
    IgNodeGraph.prototype.onSelectPlug = function (e, plug) {
        this.requestAnimationFrame();
        $(window).on('mousemove', this.callbacks.onDragPlug).on('mouseup', this.callbacks.onSelectPlugDeferred);
        // GV: TODO
        e = undefined;
        plug = undefined;
    };
    IgNodeGraph.prototype.onSelectPlugDeferred = function () {
        $(window).off('mousemove', this.callbacks.onDragPlug).off('mouseup', this.callbacks.onSelectPlugDeferred);
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.onDragPlug = function (e) {
        var plug = this.getObjectOfType($(e.target), 'plug');
        $(window).off('mousemove', this.callbacks.onDragPlug).off('mouseup', this.callbacks.onSelectPlugDeferred);
        if (plug.length > 0) {
            this.animationFrameData.mouse.x = e.pageX - this.elements.root.offsetLeft;
            this.animationFrameData.mouse.y = e.pageY - this.elements.root.offsetTop;
            this.onDragConnectionFromPlug(plug, this.options.defaultConnection, '');
        }
    };
    IgNodeGraph.prototype.onSelectConnectionDeferred = function () {
        // GV: TODO
        $(window).off('mousemove', this.callbacks.onDragConnection).off('mouseup', this.callbacks.onSelectConnectionDeferred);
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.onDragConnection = function (e) {
        var connection = this.getObjectOfType($(e.target), 'connection'),
            connectionData,
            connectionPlugin,
            point,
            x,
            y,
            startDistanceSquared,
            endDistanceSquared;
        $(window).off('mousemove', this.callbacks.onDragConnection).off('mouseup', this.callbacks.onSelectConnectionDeferred);
        if (connection.length > 0) {
            this.animationFrameData.mouse.x = e.pageX - this.elements.root.offsetLeft;
            this.animationFrameData.mouse.y = e.pageY - this.elements.root.offsetTop;
            x = this.animationFrameData.zoom.pivotX + (this.animationFrameData.mouse.x - this.animationFrameData.pan.x - this.animationFrameData.zoom.pivotX) / this.animationFrameData.zoom.amount;
            y = this.animationFrameData.zoom.pivotY + (this.animationFrameData.mouse.y - this.animationFrameData.pan.y - this.animationFrameData.zoom.pivotY) / this.animationFrameData.zoom.amount;
            connectionData = this.objectData.connection[connection[0].getAttribute('igNodeGraphId')];
            connectionPlugin = connection[0].getAttribute('igPluginName');
            point = connection[connectionPlugin]('getStartPoint');
            startDistanceSquared = (point.x - x) * (point.x - x) + (point.y - y) * (point.y - y);
            point = connection[connectionPlugin]('getEndPoint');
            endDistanceSquared = (point.x - x) * (point.x - x) + (point.y - y) * (point.y - y);
            if (startDistanceSquared <= endDistanceSquared) {
                if (startDistanceSquared <= (this.options.dragConnectionHandlePadding * this.options.dragConnectionHandlePadding)) {
                    this.onDragConnectionFromPlug(connectionData.endPlug, connection, connectionData.startPlug[0].getAttribute('igNodeGraphId'));
                    this.animationFrameData.domRefreshObjects.plugs[connectionData.startPlug[0].getAttribute('igNodeGraphId')] = connectionData.startPlug;
                }
            } else if (endDistanceSquared <= (this.options.dragConnectionHandlePadding * this.options.dragConnectionHandlePadding)) {
                this.onDragConnectionFromPlug(connectionData.startPlug, connection, connectionData.endPlug[0].getAttribute('igNodeGraphId'));
                this.animationFrameData.domRefreshObjects.plugs[connectionData.endPlug[0].getAttribute('igNodeGraphId')] = connectionData.endPlug;
            }
        }
    };
    IgNodeGraph.prototype.onDragConnectionFromPlug = function (plug, forceConnection, validPlugId) {
        var id,
            point,
            direction,
            node,
            nodeData,
            plugId = plug[0].getAttribute('igNodeGraphId'),
            connection = this.options.defaultConnection,
            connectionCount = 0,
            connections = {},
            connectionData,
            backgroundClientRect = this.elements.containerBackground.getBoundingClientRect(),
            plugClientRect;
        for (id in this.objectHash.connection) {
            if (this.objectHash.connection.hasOwnProperty(id)) {
                connectionData = this.objectData.connection[id];
                if (!connections.hasOwnProperty(connectionData.startPlug[0].getAttribute('igNodeGraphId'))) {
                    connections[connectionData.startPlug[0].getAttribute('igNodeGraphId')] = {};
                }
                connections[connectionData.startPlug[0].getAttribute('igNodeGraphId')][connectionData.endPlug[0].getAttribute('igNodeGraphId')] = true;
                if ((connectionData.startPlug[0] === plug[0]) || (connectionData.endPlug[0] === plug[0])) {
                    connection = this.objectHash.connection[id];
                    connectionCount += 1;
                }
            }
        }
        this.animationFrameData.dragConnection.validPlugs = {};
        if (forceConnection[0] !== this.options.defaultConnection[0]) {
            this.animationFrameData.dragConnection.validPlugs[validPlugId] = this.objectHash.plug[validPlugId][0].getBoundingClientRect();
            this.animationFrameData.dragConnection.connection = forceConnection;
            this.animationFrameData.dragConnection.connectionPluginName = forceConnection[0].getAttribute('igPluginName');
        } else if ((connectionCount === 1) && (this.options.callbacks.isSingleConnectionPlug(plug))) {
            this.animationFrameData.dragConnection.validPlugs[plugId] = plug[0].getBoundingClientRect();
            connectionData = this.objectData.connection[connection[0].getAttribute('igNodeGraphId')];
            plug = plug[0] === connectionData.startPlug[0] ? connectionData.endPlug : connectionData.startPlug;
            plugId = plug[0].getAttribute('igNodeGraphId');
            this.animationFrameData.dragConnection.connection = connection;
            this.animationFrameData.dragConnection.connectionPluginName = connection[0].getAttribute('igPluginName');
        } else {
            this.animationFrameData.dragConnection.connection = this.options.defaultConnection;
            this.animationFrameData.dragConnection.connectionPluginName = this.options.defaultConnection[0].getAttribute('igPluginName');
        }
        for (id in this.objectHash.plug) {
            if (this.objectHash.plug.hasOwnProperty(id) && (plugId !== id) && this.options.callbacks.isConnectionValid(plug, this.objectHash.plug[id])) {
                plugClientRect = this.objectHash.plug[id][0].getBoundingClientRect();
                if ((plugClientRect.left >= backgroundClientRect.left) && (plugClientRect.top >= backgroundClientRect.top) && (plugClientRect.right <= backgroundClientRect.right) && (plugClientRect.bottom <= backgroundClientRect.bottom)) {
                    // GV: TODO - Think about this - Should we disallow making the same connection twice (even in the opposite direction?)
                    if (!connections.hasOwnProperty(plugId)) {
                        this.animationFrameData.dragConnection.validPlugs[id] = plugClientRect;
                    } else if (!connections[plugId].hasOwnProperty(id)) {
                        this.animationFrameData.dragConnection.validPlugs[id] = plugClientRect;
                    }
                }
            }
        }
        node = this.objectData.plug[plugId].node;
        nodeData = this.objectData.node[node[0].getAttribute('igNodeGraphId')];
        direction = plug[plug[0].getAttribute('igPluginName')]('getConnectionDirection');
        point = node[node[0].getAttribute('igPluginName')]('getPlugConnectionPoints', [plug])[0];
        this.animationFrameData.dragConnection.state = 'startDrag';
        this.animationFrameData.dragConnection.startPlugData.id = plugId;
        this.animationFrameData.dragConnection.startPlugData.showMarker = this.options.callbacks.shouldHaveMarker(plug);
        this.animationFrameData.dragConnection.startPlugData.x = point.x + nodeData.x;
        this.animationFrameData.dragConnection.startPlugData.y = point.y + nodeData.y;
        this.animationFrameData.dragConnection.startPlugData.directionX = direction.x;
        this.animationFrameData.dragConnection.startPlugData.directionY = direction.y;
        this.animationFrameData.dragConnection.endPlugData.id = '';
        this.animationFrameData.dragConnection.lastId = '';
        this.freezeMouse();
        this.requestAnimationFrame();
        $(window).on('mousemove', this.callbacks.onDragConnectionMouseMove).on('mouseup', this.callbacks.onDragConnectionComplete);
    };
    IgNodeGraph.prototype.onDragConnectionMouseMove = function (e) {
        var id,
            boundingRect,
            paddedBoundingRect,
            dx,
            dy,
            distanceSquared,
            minDistanceSquared;
        this.animationFrameData.dragConnection.endPlugData.id = '';
        for (id in this.animationFrameData.dragConnection.validPlugs) {
            if (this.animationFrameData.dragConnection.validPlugs.hasOwnProperty(id)) {
                boundingRect = this.animationFrameData.dragConnection.validPlugs[id];
                paddedBoundingRect = {left: boundingRect.left - this.options.dragConnectionPlugPadding, top: boundingRect.top - this.options.dragConnectionPlugPadding, right: boundingRect.right + this.options.dragConnectionPlugPadding, bottom: boundingRect.bottom + this.options.dragConnectionPlugPadding};
                if ((e.pageX - document.body.scrollLeft >= paddedBoundingRect.left) && (e.pageX - document.body.scrollLeft <= paddedBoundingRect.right) && (e.pageY - document.body.scrollTop >= paddedBoundingRect.top) && (e.pageY - document.body.scrollTop <= paddedBoundingRect.bottom)) {
                    dx = e.pageX - document.body.scrollLeft - (paddedBoundingRect.left + paddedBoundingRect.right) / 2;
                    dy = e.pageY - document.body.scrollTop - (paddedBoundingRect.top + paddedBoundingRect.bottom) / 2;
                    distanceSquared = dx * dx + dy * dy;
                    if (!this.animationFrameData.dragConnection.endPlugData.id) {
                        minDistanceSquared = distanceSquared;
                        this.animationFrameData.dragConnection.endPlugData.id = id;
                    } else if (distanceSquared < minDistanceSquared) {
                        minDistanceSquared = distanceSquared;
                        this.animationFrameData.dragConnection.endPlugData.id = id;
                    }
                }
            }
        }
        this.animationFrameData.mouse.x = e.pageX - this.elements.root.offsetLeft;
        this.animationFrameData.mouse.y = e.pageY - this.elements.root.offsetTop;
        this.requestAnimationFrame();
    };
    IgNodeGraph.prototype.onDragConnectionComplete = function () {
        this.animationFrameData.dragConnection.state = 'finalizeDrag';
        this.thawMouse();
        this.requestAnimationFrame();
        $(window).off('mousemove', this.callbacks.onDragConnectionMouseMove).off('mouseup', this.callbacks.onDragConnectionComplete);
    };
    IgNodeGraph.prototype.onMarqueeSelectBegin = function (e) {
        var id,
            clientRect,
            backgroundClientRect = this.elements.containerBackground.getBoundingClientRect();
        this.animationFrameData.selection.marqueeObjectIds = {};
        this.animationFrameData.selection.marqueeObjectClientRect = {};
        this.animationFrameData.selection.pendingObjectIds = {};
        if (!e.shiftKey) {
            this.clearSelection();
        }
        for (id in this.objectHash.node) {
            if (this.objectHash.node.hasOwnProperty(id) && !this.animationFrameData.selection.objectIds.hasOwnProperty(id)) {
                clientRect = this.objectHash.node[id][0].getBoundingClientRect();
                if (!((clientRect.right < backgroundClientRect.left) || (clientRect.bottom < backgroundClientRect.top) || (clientRect.left > backgroundClientRect.right) || (clientRect.top > backgroundClientRect.bottom))) {
                    this.animationFrameData.selection.marqueeObjectIds[id] = this.objectHash.node[id];
                    this.animationFrameData.selection.marqueeObjectClientRect[id] = {left: clientRect.left - backgroundClientRect.left, top: clientRect.top - backgroundClientRect.top, right: clientRect.right - backgroundClientRect.left, bottom: clientRect.bottom - backgroundClientRect.top};
                }
            }
        }
        for (id in this.objectHash.comment) {
            if (this.objectHash.comment.hasOwnProperty(id) && !this.animationFrameData.selection.objectIds.hasOwnProperty(id)) {
                clientRect = this.objectHash.comment[id][0].getBoundingClientRect();
                if (!((clientRect.right < backgroundClientRect.left) || (clientRect.bottom < backgroundClientRect.top) || (clientRect.left > backgroundClientRect.right) || (clientRect.top > backgroundClientRect.bottom))) {
                    this.animationFrameData.selection.marqueeObjectIds[id] = this.objectHash.comment[id];
                    this.animationFrameData.selection.marqueeObjectClientRect[id] = {left: clientRect.left - backgroundClientRect.left, top: clientRect.top - backgroundClientRect.top, right: clientRect.right - backgroundClientRect.left, bottom: clientRect.bottom - backgroundClientRect.top};
                }
            }
        }
        this.freezeMouse();
        this.animationFrameData.selection.state = 'selecting';
        $(this.elements.marqueeSelectionBox).igMarqueeSelect('start', e);
    };
    IgNodeGraph.prototype.onMarqueeSelectUpdate = function (e, bounds) {
        this.animationFrameData.selection.marqueeBounds = bounds;
        this.requestAnimationFrame();
        e = undefined;
    };
    IgNodeGraph.prototype.onMarqueeSelectComplete = function () {
        var id;
        for (id in this.animationFrameData.selection.pendingObjectIds) {
            if (this.animationFrameData.selection.pendingObjectIds.hasOwnProperty(id)) {
                this.animationFrameData.selection.objectIds[id] = this.animationFrameData.selection.pendingObjectIds[id];
            }
        }
        this.thawMouse();
        this.animationFrameData.selection.pendingObjectIds = {};
        this.animationFrameData.selection.state = 'none';
    };
    $.fn.igNodeGraph = function (memberFunctionName, arg1, arg2) {
        var singleNodeGraphFunction = function (nodeGraphArray, name) {
                if (nodeGraphArray.length === 1) {
                    return true;
                }
                console.log('$.fn.igNodeGraph: Function "' + name + '" must operate on exactly one node graph!');
                debugger;
                return false;
            },
            i;
        switch (memberFunctionName) {
        case 'init':
            arg1 = new IgNodeGraphOptions(arg1 || {});
            for (i = 0; i < this.length; i += 1) {
                this[i].setAttribute('igPluginName', 'igNodeGraph');
                $.data(this[i], 'igNodeGraph', new IgNodeGraph(this[i], arg1));
            }
            return this;
        case 'selectObjects':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNodeGraph').selectObjects(arg1);
            }
            return this;
        case 'deselectObjects':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNodeGraph').deselectObjects(arg1);
            }
            return this;
        case 'clearSelection':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNodeGraph').clearSelection();
            }
            return this;
        case 'deleteSelectedObjects':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNodeGraph').deleteSelectedObjects();
            }
            return this;
        case 'addDefs':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNodeGraph').addDefs(arg1);
            }
            return this;
        case 'addNodes':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').addNodes(arg1);
            }
            return this;
        case 'removeNodes':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').removeNodes(arg1);
            }
            return this;
        case 'refreshNodes':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').refreshNodes(arg1);
            }
            return this;
        case 'setNodePositions':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').setNodePositions(arg1, arg2);
            }
            return this;
        case 'addPlugs':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').addPlugs(arg1, arg2);
            }
            return this;
        case 'removePlugs':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').removePlugs(arg1, arg2);
            }
            return this;
        case 'addConnections':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').addConnections(arg1, false);
            }
            return this;
        case 'removeConnections':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').removeConnections(arg1, true, false);
            }
            return this;
        case 'refreshConnections':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').refreshConnections(arg1);
            }
            return this;
        case 'addComments':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').addComments(arg1);
            }
            return this;
        case 'removeComments':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').removeComments(arg1);
            }
            return this;
        case 'refreshComments':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').refreshComments(arg1);
            }
            return this;
        case 'setCommentPositions':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').setCommentPositions(arg1, arg2);
            }
            return this;
        case 'setCommentPositionsImmediate':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').setCommentPositionsImmediate(arg1, arg2);
            }
            return this;
        case 'getCommentPositions':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                return $.data(this[0], 'igNodeGraph').getCommentPositions(arg1);
            }
            return [];
        case 'updateVisibleBounds':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNodeGraph').requestAnimationFrameUpdateVisibleBounds();
            }
            return this;
        case 'recalculateBounds':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNodeGraph').flags.recalculateBounds = true;
                $.data(this[i], 'igNodeGraph').requestAnimationFrame();
            }
            return this;
        case 'screenSpaceToWorldSpace':
            if (singleNodeGraphFunction(this, memberFunctionName)) {
                $.data(this[0], 'igNodeGraph').screenSpaceToWorldSpace(arg1);
            }
            return this;
        case 'freezeMouse':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNodeGraph').freezeMouse();
            }
            return this;
        case 'thawMouse':
            for (i = 0; i < this.length; i += 1) {
                $.data(this[i], 'igNodeGraph').thawMouse();
            }
            return this;
        }
        if (typeof memberFunctionName === 'string') {
            console.log('igNodeGraph.js: Function "' + memberFunctionName + '" does not exist!');
        } else {
            console.log('igNodeGraph.js: No member function name specified!');
        }
        debugger;
        return this;
    };
}(jQuery));