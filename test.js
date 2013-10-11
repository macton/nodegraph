;/*jslint browser: true, devel: true, debug: true */
(function ($) {
    'use strict';
    var createNode = function (nodeId) {
            var node = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                image = document.createElementNS('http://www.w3.org/2000/svg', 'image'),
                previewButton = document.createElementNS('http://www.w3.org/2000/svg', 'image'),
                addButton = document.createElementNS('http://www.w3.org/2000/svg', 'image'),
                removeButton = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'lib/image.jpg');
            image.setAttribute('width', 32);
            image.setAttribute('height', 32);
            $(previewButton).igSvgImageButton(13, 13, 'lib/preview.jpg', 'lib/previewHover.jpg', 'lib/previewDown.jpg');
            $(addButton).igSvgImageButton(13, 13, 'lib/add.jpg', 'lib/addHover.jpg', 'lib/addDown.jpg');
            $(removeButton).igSvgImageButton(13, 13, 'lib/remove.jpg', 'lib/removeHover.jpg', 'lib/removeDown.jpg');
            $(node).igNode('init', {
                classNode: 'node',
                classNodeOutline: 'nodeOutline',
                classNodeSelectionBorderInner: 'nodeSelectionInner',
                classNodeSelectionBorderOuter: 'nodeSelectionOuter',
                classNodeTitle: 'nodeTitle',
                classNodeTitleBar: 'nodeTitleBar',
                classNodeTitleBarOutline: 'nodeTitleBarOutline',
                title: 'Node ' + (nodeId + 1)
            }).igNode('addImages', [image]).igNode('addTitleBarImagesRight', [previewButton]);
            return $(node);
        },
        createPlugsForNode = function () {
            var i,
                plugInside,
                plugs = [
                    document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                    document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                    document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                    document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                    document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                    document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                    document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                    document.createElementNS('http://www.w3.org/2000/svg', 'g')
                ],
                jQueryPlugs = [],
                plugLocations = ['left', 'left', 'right', 'right', 'top', 'top', 'bottom', 'bottom'];
            for (i = 0; i < plugs.length; i += 1) {
                plugInside = (i === 0) || (i === 1) || (i === 4) || (i === 5);
                jQueryPlugs.push($(plugs[i]));
                jQueryPlugs[i].igPlug('init', {
                    classLabel: 'plugLabel',
                    classHandle: plugInside ? 'plugInside' : 'plugOutside',
                    classHandleCustomBorder: plugInside ? 'plugInsideBorder' : '',
                    handleInside: plugInside,
                    handleHeight: plugInside ? 5 : i > 3 ? 10 : 15,
                    handleWidth: plugInside ? 5 : i > 3 ? 15 : 10,
                    handleType: plugInside ? 'rectAdjacentBorder' : 'triangle',
                    location: plugLocations[i % plugLocations.length],
                    label: 'Plug ' + (i + 1)
                }).attr('myPlugId', i + 1);
            }
            return jQueryPlugs;
        },
        setupComments = function (nodeGraph) {
            var commentElement = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
                comment = $(commentElement).igComment('init', nodeGraph, {
                    classHandleBottomRight: 'commentHandle',
                    classHandleTopLeft: 'commentHandle',
                    classLabel: 'commentLabel',
                    classOutline: 'commentOutline',
                    label: 'This is my comment'
                });
            comment = undefined;
            // nodeGraph.igNodeGraph('addComments', [comment]).igNodeGraph('setCommentPositions', [comment], [{x: 100, y: 250}]).igNodeGraph('refreshComments', [comment]);
        },
        setupNodeGraph = function () {
            var i,
                size = 400,
                rowCount = 10,
                nodes = [],
                nodeCount = 20,
                nodeGraph = $('#igTestDiv'),
                positions = [],
                plugs,
                previousPlug,
                connection,
                connectionList = [],
                connectionDataList = [],
                defs = [];
            defs.push(document.createElementNS('http://www.w3.org/2000/svg', 'filter'));
            defs.push(document.createElementNS('http://www.w3.org/2000/svg', 'filter'));
            defs[0].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur'));
            defs[0].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feOffset'));
            defs[0].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feSpecularLighting'));
            defs[0].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feComposite'));
            defs[0].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feComposite'));
            defs[0].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feMerge'));
            defs[0].childNodes[2].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'fePointLight'));
            defs[0].childNodes[5].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode'));
            defs[0].childNodes[5].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode'));
            defs[0].setAttributeNS(null, 'id', 'virtual_light');
            defs[0].setAttributeNS(null, 'filterUnits', 'objectBoundingBox');
            defs[0].setAttributeNS(null, 'x', '-0.1');
            defs[0].setAttributeNS(null, 'y', '-0.1');
            defs[0].setAttributeNS(null, 'width', '1.2');
            defs[0].setAttributeNS(null, 'height', '1.2');
            defs[0].childNodes[0].setAttributeNS(null, 'in', 'SourceAlpha');
            defs[0].childNodes[0].setAttributeNS(null, 'stdDeviation', '2');
            defs[0].childNodes[0].setAttributeNS(null, 'result', 'alpha_blur');
            defs[0].childNodes[1].setAttributeNS(null, 'in', 'alpha_blur');
            defs[0].childNodes[1].setAttributeNS(null, 'dx', '4');
            defs[0].childNodes[1].setAttributeNS(null, 'dy', '4');
            defs[0].childNodes[1].setAttributeNS(null, 'result', 'offset_alpha_blur');
            defs[0].childNodes[2].setAttributeNS(null, 'in', 'alpha_blur');
            defs[0].childNodes[2].setAttributeNS(null, 'surfaceScale', '1');
            defs[0].childNodes[2].setAttributeNS(null, 'specularConstant', '1');
            defs[0].childNodes[2].setAttributeNS(null, 'specularExponent', '25');
            defs[0].childNodes[2].setAttributeNS(null, 'lighting-color', '#ffffff');
            defs[0].childNodes[2].setAttributeNS(null, 'result', 'spec_light');
            defs[0].childNodes[2].childNodes[0].setAttributeNS(null, 'x', '10000');
            defs[0].childNodes[2].childNodes[0].setAttributeNS(null, 'y', '10000');
            defs[0].childNodes[2].childNodes[0].setAttributeNS(null, 'z', '10000');
            defs[0].childNodes[3].setAttributeNS(null, 'in', 'spec_light');
            defs[0].childNodes[3].setAttributeNS(null, 'in2', 'SourceAlpha');
            defs[0].childNodes[3].setAttributeNS(null, 'operator', 'in');
            defs[0].childNodes[3].setAttributeNS(null, 'result', 'spec_light');
            defs[0].childNodes[4].setAttributeNS(null, 'in', 'SourceGraphic');
            defs[0].childNodes[4].setAttributeNS(null, 'in2', 'spec_light');
            defs[0].childNodes[4].setAttributeNS(null, 'operator', 'out');
            defs[0].childNodes[4].setAttributeNS(null, 'result', 'spec_light_fill');
            defs[0].childNodes[5].childNodes[0].setAttributeNS(null, 'in', 'offset_alpha_blur');
            defs[0].childNodes[5].childNodes[1].setAttributeNS(null, 'in', 'spec_light_fill');
            defs[1].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur'));
            defs[1].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feOffset'));
            defs[1].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feMerge'));
            defs[1].childNodes[2].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode'));
            defs[1].childNodes[2].appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode'));
            defs[1].setAttributeNS(null, 'id', 'drop_shadow');
            defs[1].setAttributeNS(null, 'filterUnits', 'objectBoundingBox');
            defs[1].setAttributeNS(null, 'x', '-0.1');
            defs[1].setAttributeNS(null, 'y', '-0.1');
            defs[1].setAttributeNS(null, 'width', '1.2');
            defs[1].setAttributeNS(null, 'height', '1.2');
            defs[1].childNodes[0].setAttributeNS(null, 'in', 'SourceAlpha');
            defs[1].childNodes[0].setAttributeNS(null, 'stdDeviation', '2');
            defs[1].childNodes[0].setAttributeNS(null, 'result', 'alpha_blur');
            defs[1].childNodes[1].setAttributeNS(null, 'in', 'alpha_blur');
            defs[1].childNodes[1].setAttributeNS(null, 'dx', '4');
            defs[1].childNodes[1].setAttributeNS(null, 'dy', '4');
            defs[1].childNodes[1].setAttributeNS(null, 'result', 'offset_alpha_blur');
            defs[1].childNodes[2].childNodes[0].setAttributeNS(null, 'in', 'offset_alpha_blur');
            defs[1].childNodes[2].childNodes[1].setAttributeNS(null, 'in', 'SourceGraphic');
            for (i = 0; i < nodeCount; i += 1) {
                nodes.push(createNode(i));
                positions.push({x: 25 + ((i % rowCount) * size), y: 25 + Math.floor(i / rowCount) * size});
            }
            nodeGraph[0].style.position = 'absolute';
            nodeGraph[0].style.left = '50px';
            nodeGraph[0].style.top = '50px';
            nodeGraph[0].style.width = '1000px';
            nodeGraph[0].style.height = '1000px';
            nodeGraph[0].style.overflow = 'hidden';
            nodeGraph.igNodeGraph('init', {
                callbacks: {
                    isConnectionValid: function (startPlug, endPlug) {
                        switch (startPlug.attr('myPlugId')) {
                        case '1':
                            return endPlug.attr('myPlugId') === '4' ? true : false;
                        case '2':
                            return endPlug.attr('myPlugId') === '3' ? true : false;
                        case '3':
                            return endPlug.attr('myPlugId') === '2' ? true : false;
                        case '4':
                            return endPlug.attr('myPlugId') === '1' ? true : false;
                        case '5':
                            return endPlug.attr('myPlugId') === '8' ? true : false;
                        case '6':
                            return endPlug.attr('myPlugId') === '7' ? true : false;
                        case '7':
                            return endPlug.attr('myPlugId') === '6' ? true : false;
                        case '8':
                            return endPlug.attr('myPlugId') === '5' ? true : false;
                        }
                        return false;
                    },
                    isSingleConnectionPlug: function (plug) {
                        switch (plug.attr('myPlugId')) {
                        case '3':
                        case '4':
                        case '7':
                        case '8':
                            return false;
                        }
                        return true;
                    },
                    shouldFlipConnection: function (startPlug, endPlug) {
                        endPlug = undefined;
                        switch (startPlug.attr('myPlugId')) {
                        case '3':
                        case '4':
                        case '7':
                        case '8':
                            return false;
                        }
                        return true;
                    },
                    shouldHaveMarker: function (plug) {
                        switch (plug.attr('myPlugId')) {
                        case '3':
                        case '4':
                        case '7':
                        case '8':
                            return false;
                        }
                        return true;
                    }
                },
                classBackground: 'nodeGraphBackground',
                classGrid: 'grid',
                classMarqueeSelectionBox: 'marquee',
                displayGrid: true
            }).igNodeGraph('addDefs', defs).igNodeGraph('addNodes', nodes).igNodeGraph('setNodePositions', nodes, positions).igNodeGraph('refreshNodes', nodes);
            for (i = 0; i < nodeCount; i += 1) {
                plugs = createPlugsForNode();
                nodeGraph.igNodeGraph('addPlugs', nodes[i], plugs);
                if (previousPlug) {
                    connection = $(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
                    connection.igConnection('init', {connectionClass: 'connection', markerStartClass: 'connectionMarker', markerEndClass: 'connectionMarker', markerEnd: true});
                    connectionDataList.push({startPlug: previousPlug, endPlug: plugs[0], connection: connection});
                    connectionList.push(connection);
                }
                previousPlug = plugs[3];
            }
            nodeGraph.igNodeGraph('addConnections', connectionDataList).igNodeGraph('refreshConnections', connectionList);
            setupComments(nodeGraph);
        };
    $(document).ready(setupNodeGraph);
}(jQuery));
