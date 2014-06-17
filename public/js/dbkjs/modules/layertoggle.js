/*!
 *  Copyright (c) 2014 B3Partners (info@b3partners.nl)
 * 
 *  This file is part of safetymapDBK
 *  
 *  safetymapDBK is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  safetymapDBK is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with safetymapDBK. If not, see <http://www.gnu.org/licenses/>.
 *
 */

var dbkjs = dbkjs || {};
window.dbkjs = dbkjs;
dbkjs.modules = dbkjs.modules || {};
dbkjs.modules.layertoggle = {
    id: "dbk.module.layertoggle",
    /**
     * Toggle layers based on type
     */
    availableToggles: {
        'togglePreventive': {
            'icon': 'icon-check-sign',
            'layers': [ 'Pandgeometrie', 'Brandcompartiment' ]
        }
    },
    enabledLayers: [],
    enabled: false,
    register: function(options) {
        var _obj = dbkjs.modules.layertoggle;
        _obj.enabled = true;
        $.each(_obj.availableToggles, function(toggleKey, toggleOptions) {
            // Create a button for the required toggle and append the button to buttongroup
            var toggle = $('<a></a>')
                .attr({
                    'id': 'btn_' + toggleKey,
                    'class': 'btn btn-default navbar-btn active',
                    'href': '#',
                    'title': i18n.t('map.toggle.' + toggleKey)
                })
                .append('<i class="' + toggleOptions.icon + '"></i>')
                .click(function(e) {
                    e.preventDefault();
                    if (toggle.hasClass('active')) {
                        toggle.removeClass('active');
                        _obj.disableLayers(toggleOptions.layers);
                    } else {
                        toggle.addClass('active');
                        _obj.enableLayers(toggleOptions.layers);
                    }
                })
                .appendTo('#btngrp_3');
            // Enable layers by default (by adding them all to enabledLayers)
            _obj.enableLayers(toggleOptions.layers);
        });
    },
    disableLayers: function(layers) {
        var _obj = dbkjs.modules.layertoggle;
        // Temp array
        var enabledLayers = [].concat(_obj.enabledLayers);
        // Filter layers
        _obj.enabledLayers = enabledLayers.filter(function(elem, pos) {
            return layers.indexOf(elem) === -1;
        });
    },
    enableLayers: function(layers) {
        var _obj = dbkjs.modules.layertoggle;
        // Add all layers
        var enabledLayers = _obj.enabledLayers.concat(layers);
        // Remove duplicates
        _obj.enabledLayers = enabledLayers.filter(function(elem, pos) {
            return enabledLayers.indexOf(elem) == pos;
        });
    },
    isLayerEnabled: function(layerName) {
        var _obj = dbkjs.modules.layertoggle;
        if(!_obj.enabled) {
            // When not used, always return true
            return true;
        }
        return _obj.enabledLayers.indexOf(layerName) !== -1;
    }
};