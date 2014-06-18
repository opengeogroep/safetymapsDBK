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
            'icon': 'icon-home',
            'layers': [ 'Brandcompartiment' ]
        },
        'togglePreparative': {
            'icon': 'icon-home',
            'layers': [ 'Brandweervoorziening', 'Toegang terrein', 'Hulplijn' ]
        },
        'toggleDanger': {
            'icon': 'icon-home',
            'layers': [ 'Gevaarlijke stoffen' ]
        }
    },
    disabledLayers: [],
    enabled: false,
    register: function(options) {
        var _obj = dbkjs.modules.layertoggle;
        _obj.enabled = true;
        var buttonGroup = $('.layertoggle-btn-group');
        $.each(_obj.availableToggles, function(toggleKey, toggleOptions) {
            // Create a button for the required toggle and append the button to buttongroup
            var toggle = $('<a></a>')
                .attr({
                    'id': 'btn_' + toggleKey,
                    'class': 'btn btn-default navbar-btn active ' + toggleKey,
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
                    dbkjs.protocol.jsonDBK.resetLayers();
                })
                .appendTo(buttonGroup);
            // Enable layers by default (by adding them all to enabledLayers)
            _obj.enableLayers(toggleOptions.layers);
        });
    },
    enableLayers: function(layers) {
        var _obj = dbkjs.modules.layertoggle;
        // Temp array
        var disabledLayers = [].concat(_obj.disabledLayers);
        // Filter layers
        _obj.disabledLayers = disabledLayers.filter(function(elem, pos) {
            return layers.indexOf(elem) === -1;
        });
    },
    disableLayers: function(layers) {
        var _obj = dbkjs.modules.layertoggle;
        // Add all layers
        var disabledLayers = _obj.disabledLayers.concat(layers);
        // Remove duplicates
        _obj.disabledLayers = disabledLayers.filter(function(elem, pos) {
            return disabledLayers.indexOf(elem) == pos;
        });
    },
    isLayerEnabled: function(layerName) {
        var _obj = dbkjs.modules.layertoggle;
        if(!_obj.enabled) {
            // When not used, always return true
            return true;
        }
        return _obj.disabledLayers.indexOf(layerName) === -1;
    }
};