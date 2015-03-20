
dbkjs.layout.settingsDialog = function(parent) {
    $(parent).append("<h4>" + i18n.t('app.layout') + "</h4>");
    $(parent).append('<p><div class="row"><div class="col-xs-12">' +
            '<input type="checkbox" id="click_scaleStyle" checked="checked">' + i18n.t('app.scaleStyle') +
            '</div></div></p>' +
            '<p><hr/><div class="row"><div class="col-xs-12">' +
            '<p style="padding-bottom: 15px">' + i18n.t('app.styleSizeAdjust') + '</p>' +
            '<input id="slider_styleSizeAdjust" style="width: 210px" data-slider-id="styleSizeAdjustSlider" type="text" data-slider-min="-10" ' +
            'data-slider-max="4" data-slider-step="1" data-slider-value="0" value="0"/>' +
            '</div></div></p><hr>'
            );

    $("#slider_styleSizeAdjust").slider({ tooltip: "always" });
    $("#slider_styleSizeAdjust").on('slide', function(e) {
        dbkjs.config.styleSizeAdjust = e.value;
        dbkjs.redrawScaledLayers();
    });

    $("#click_scaleStyle").on('change', function(e) {
        dbkjs.config.styleScaleAdjust = e.target.checked;
        dbkjs.redrawScaledLayers();
    });        

    $('#input_contrast').val(parseFloat(dbkjs.map.baseLayer.opacity).toFixed(1));
    $('#input_contrast').keypress(function(event) {
        if (event.keyCode === 13) {
            var newOpacity = parseFloat($('#input_contrast').val()).toFixed(1);
            if (newOpacity > 1.0) {
                $('#input_contrast').val(1.0);
                dbkjs.map.baseLayer.setOpacity(1.0);
            } else if (newOpacity > 1.0) {
                $('#input_contrast').val(1.0);
                dbkjs.map.baseLayer.setOpacity(1.0);
            } else {
                $('#input_contrast').val(parseFloat($('#input_contrast').val()).toFixed(1));
                dbkjs.map.baseLayer.setOpacity(newOpacity);
            }
        }
    });
    $('#click_contrast_up').click(function() {
        var newOpacity = parseFloat(($('#input_contrast').val()) + 0.1).toFixed(1);
        if (newOpacity > 1.0) {
            $('#input_contrast').val(1.0);
            dbkjs.map.baseLayer.setOpacity(1.0);
        } else {
            $('#input_contrast').val((parseFloat($('#input_contrast').val()) + 0.1).toFixed(1));
            dbkjs.map.baseLayer.setOpacity(newOpacity);
        }
    });
    $('#click_contrast_down').click(function() {
        var newOpacity = parseFloat(($('#input_contrast').val()) - 0.1).toFixed(1);
        if (newOpacity < 0.0) {
            $('#input_contrast').val(0.0);
            dbkjs.map.baseLayer.setOpacity(0.0);
        } else {
            $('#input_contrast').val((parseFloat($('#input_contrast').val()) - 0.1).toFixed(1));
            dbkjs.map.baseLayer.setOpacity(newOpacity);
        }
    });
};


