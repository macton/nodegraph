;/*jslint browser: true, devel: true, debug: true */
(function ($) {
    'use strict';
    var setupImageButton = function (imageButton, imagePath, imageHoverPath, imageDownPath) {
            var jQueryImageButton = $(imageButton),
                mouseUpFunction = function (e) {
                    $(window).off('mouseup', mouseUpFunction);
                    jQueryImageButton.removeData('igSvgImageButton');
                    if (e.target === imageButton) {
                        imageButton.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageHoverPath);
                        jQueryImageButton.trigger('onIgSvgImageButtonUp');
                    }
                };
            jQueryImageButton.on('mouseenter', function () {
                if (jQueryImageButton.data('igSvgImageButton') === 'true') {
                    imageButton.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageDownPath);
                } else {
                    imageButton.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageHoverPath);
                }
            }).on('mouseleave', function () {
                imageButton.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imagePath);
            }).on('mousedown', function () {
                imageButton.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageDownPath);
                $(window).on('mouseup', mouseUpFunction);
                jQueryImageButton.data('igSvgImageButton', 'true');
                jQueryImageButton.trigger('onIgSvgImageButtonDown');
            });
        };
    $.fn.igSvgImageButton = function (width, height, imagePath,  imageHoverPath, imageDownPath) {
        var i,
            hoverPath = imageHoverPath || imagePath,
            downPath = imageDownPath || hoverPath;
        for (i = 0; i < this.length; i += 1) {
            this[i].setAttributeNS('http://www.w3.org/1999/xlink', 'href', imagePath);
            this[i].setAttribute('width', width);
            this[i].setAttribute('height', height);
            setupImageButton(this[i], imagePath, hoverPath, downPath);
        }
        return this;
    };
}(jQuery));