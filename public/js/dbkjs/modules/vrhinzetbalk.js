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
dbkjs.modules.vrhinzetbalk = {
    id: "dbk.module.vrhinzetbalk",
    /**
     * Toggle layers based on type
     */
    availableToggles: {
        toggleBasis: {
            label: 'Basisgegevens',
            icon: 'fa-bus',
            layers: [ 'Toegang terrein', 'Tekst objecten' ], // XXX
            active: true,
            css: {
                'background-color': 'green',
                color: 'white'
            },
            brandweervoorzieningen: [
                'TbeRIJ',   // Bereidbaar
                'TbeBus',   // Bussluis
                'TbeHoogte',// Doorrijhoogte
                'Tbe05',    // Niet toegankelijk
                'Tbe06',    // Parkeerplaats
                'Tbe02',    // Poller
                'Tbe01',    // Sleutel of ring paal
                'Tr504',    // Indicator/flitslicht
                'Tb1.008',  // Opstelplaats 1e TS
                'Tb1.010',  // Opstelplaats RV
                'Tb1.004a', // BMC
                'Tb1.004',  // Brandweerpaneel
                'To04',     // Brandweerinfokast
                'Tb1.005',   // Nevenpaneel
                'Tb1.001'   // Brandweeringang
            ],
            hulplijnen: [
                "Bbarrier",  // Slagboom
                "HEAT",      // Schadecirkel
                "Fence"
            ],
            wms: 'Basis',
            setTopLayerIndex: true
        },
        toggleBrandweer: {
            label: 'Brandweergegevens',
            img: 'images/brwzw.png',
            style: 'width: 32px; margin-bottom: 6px',
            layers: [ 'Brandcompartiment', 'Brandcompartiment label', 'Gevaarlijke stoffen' ],
            active: false,
            showTab: "brandweer",
            css: {
                'background-color': 'red',
                color: 'white'
            },
            brandweervoorzieningen: [
                'Tbk5.001',  // Brandweerlift
                'Tb1.002',   // Overige ingangen / neveningang
                'Tb1.009',   // Opstelplaats overige blusvoertuigen
                'Tb2.005',   // Schakelaar rook-/warmteafvoer
                'Tw16',
                'Tw14',
                'Tw12',
                'Tw10',
                'Tw28',
                'Tw24',
                'Tw23',
                'Tw22',
                'Tw21',
                'Tw03',
                'Tw02',
                'Tw01',
                'TwTemp'
            ],
            wms: 'Brandweer',
            setTopLayerIndex: true
        },
        toggleWaterwinning: {
            label: 'Waterwinning',
            img: 'images/brandkraan.png',
            style: 'height: 36px; margin-bottom: 5px',
            layers: [ ],
            active: false,
            showTab: "waterwinning",
            css: {
                'background-color': '#2D2DFF',
                color: 'white'
            },
            brandweervoorzieningen: [
                'Tb2.024',  // Afsluiter omloopleiding
                'Tb2.026',  // Afsluiter schuimvormend middel
                'Tb2.023',  // Afsluiter sprinkler
                'Tb02',     // Brandslanghaspel
                'Tb.1007a', // Droge blusleiding afnamepunt
                'Tb4.024',  // Gas blusinstallatie / Blussysteem kooldioxide
                'Tb1.011',  // Gas detectiepaneel
                'Tb4.005'   // Gesprinklerde ruimte
            ],
            hulplijnen: [
                "DBL Leiding"
            ],
            wms: 'Water',
            setTopLayerIndex: true
        },
        toggleGebouw: {
            label: 'Gebouwgegevens',
            icon: 'fa-industry',
            layers: [ ],
            active: false,
            showTab: "gebouw",
            css: {
                'background-color': 'black',
                color: 'white'
            },
            brandweervoorzieningen: [
                'Tbk7.004', // Lift
                'Tn05',     // Nooduitgang
                'To1.001',  // Trap
                'To1.002',  // Trap rond
                'To1.003',  // Trappenhuis
                'Tb2.025',  // Afsluiter LPG
                'Tb2.021',  // Afsluiter gas
                'Tb2.022',  // Afsluiter water
                'Tb2.043',  // Noodstop
                'To03',     // Noodstroom aggegraat
                'Falck11',  // Schacht/kanaal
                'Tb2.002',  // Noodschakelaar CV
                'Tb2.001',  // Noodschakelaar neon
                'Tb2.003',  // Schakelaar elektriciteit
                'Tb2.004',  // Schakelaar luchtbehandeling
                'To02',     // Slaapplaats
                'Falck36'   // Hellingbaan
            ],
            hulplijnen: [
                "Binnenmuur"
            ],
            wms: 'Gebouw',
            setTopLayerIndex: true
        }
    },
    disabledLayers: [],
    findConfiguredLayers: function(name) {
        // Find layers with name as given
        var olLayers = dbkjs.map.getLayersByName(name);
        var organisationLayers = [];
        // Find layers from options with different name but name in abstract
        // (as configured by safetymaps-server)
        $.each(dbkjs.options.organisation.wms, function(i, wms) {
            if(wms.name === name) {
                organisationLayers.push(wms);
            } else if (wms.abstract === name) {
                olLayers = olLayers.concat(dbkjs.map.getLayersByName(wms.name));
                organisationLayers.push(wms);
            }
        });
        return { olLayers: olLayers, organisationLayers: organisationLayers };
    },
    rewriteStyles: function() {
        dbkjs.config.styles.brandweervoorziening.styles.default.context.mydisplay = function(feature) {
            return dbkjs.modules.vrhinzetbalk.isBrandweervoorzieningHidden(feature) ? "none" : "true";
        };

        dbkjs.config.styles.hulplijn.styles.default.defaultStyle.display = "${display}";
        dbkjs.config.styles.hulplijn.styles.default.propertyStyles.display = true;
        dbkjs.config.styles.hulplijn1.styles.default.defaultStyle.display = "${display}";
        dbkjs.config.styles.hulplijn1.styles.default.propertyStyles.display = true;
        dbkjs.config.styles.hulplijn2.styles.default.defaultStyle.display = "${display}";
        dbkjs.config.styles.hulplijn2.styles.default.propertyStyles.display = true;

        function hulplijnDisplay(feature) {
            return dbkjs.modules.vrhinzetbalk.isHulplijnHidden(feature) ? "none" : "true";
        };
        dbkjs.config.styles.hulplijn.styles.default.context.display = hulplijnDisplay;
        dbkjs.config.styles.hulplijn1.styles.default.context.display = hulplijnDisplay;
        dbkjs.config.styles.hulplijn2.styles.default.context.display = hulplijnDisplay;
    },
    register: function() {
        var me = this;

        me.rewriteStyles();

        $(dbkjs).one("dbkjs_init_complete", function() {
            if(dbkjs.modules.incidents && dbkjs.modules.incidents.controller) {
                $(dbkjs.modules.incidents.controller).on("new_incident", function() {
                    me.resetToDefault();
                });
            }
        });

        $("#tb03").css('background-color', 'yellow').html("<img src='images/i.png' style='margin-bottom: 5px'>");

        var buttonGroup = $('.layertoggle-btn-group');
        $.each(me.availableToggles, function(toggleKey, toggleOptions) {
            // Create a button for the required toggle and append the button to buttongroup

            if(!toggleOptions.active) {
                me.disabledLayers = me.disabledLayers.concat(toggleOptions.layers);
            }

            $(dbkjs).one("dbkjs_init_complete", function() {
                var ll = me.findConfiguredLayers(toggleOptions.wms)
                $.each(ll.olLayers, function(j,l) {
                    l.setVisibility(toggleOptions.active);

                    if(toggleOptions.setTopLayerIndex) {// TODO handled by wms.index
                        dbkjs.map.setLayerIndex(l, dbkjs.map.layers.length-1);
                    }
                });
                // Hide from legend if parent not null
                $.each(ll.organisationLayers, function(j,l) {
                    if(l.parent !== null) {
                        console.log("hiding legend for " + l.name + " gid " + l.gid, $("div[data-layer-gid=" + l.gid + "]"));
                        $("div[data-layer-gid=" + l.gid + "]").parent().hide();
                    }
                });
            });

            var i;
            if(toggleOptions.img) {
                i = $('<img/>')
                .attr({
                    src: toggleOptions.img,
                    style: (toggleOptions.style || '')
                });
            } else {
                i = $('<i/>')
                .attr({
                    class: "fa " + toggleOptions.icon
                });
            }

            var toggle = $('<a/>')
            .attr({
                id: 'btn_' + toggleKey,
                class: 'btn btn-default navbar-btn ' + (toggleOptions.active ? "on" : ""),
                href: '#',
                title: toggleOptions.label
            })
            .append(i)
            .click(function(e) {
                e.preventDefault();
                if (toggle.hasClass('on')) {
                    toggle.removeClass('on');
                    me.disableLayers(toggleOptions.layers);
                } else {
                    toggle.addClass('on');
                    me.enableLayers(toggleOptions.layers);
                    dbkjs.dbkInfoPanel.show();
                    if(toggleOptions.showTab) {
                        dbkjs.showTab(toggleOptions.showTab);
                    }
                }
                if(toggleOptions.wms) {
                    $.each(me.findConfiguredLayers(toggleOptions.wms).olLayers, function(j,l) {
                        console.log("Setting layer " + l.name + " visibility: " + toggle.hasClass('on'));
                        l.setVisibility(toggle.hasClass('on'));
                    });
                }

                dbkjs.protocol.jsonDBK.resetLayers();
                dbkjs.protocol.jsonDBK.layerBrandweervoorziening.redraw();
                dbkjs.protocol.jsonDBK.layerHulplijn.redraw();
                dbkjs.protocol.jsonDBK.layerHulplijn1.redraw();
                dbkjs.protocol.jsonDBK.layerHulplijn2.redraw();

            })
            .appendTo(buttonGroup);
            if(toggleOptions.css) {
                toggle.css(toggleOptions.css);
            }
        });
        dbkjs.protocol.jsonDBK.resetLayers();
    },
    resetToDefault: function() {
        $.each(this.availableToggles, function(toggleKey, toggleOptions) {
            var button = $("#btn_" + toggleKey);
            if(toggleOptions.active !== button.hasClass("on")) {
                button.click();
            }
        });
    },
    isBrandweervoorzieningHidden: function(feature) {
        var hide = false;
        $.each(this.availableToggles, function(toggleKey, toggleOptions) {
            var on = $("#btn_" + toggleKey).hasClass('on');
            if(!on && toggleOptions.brandweervoorzieningen && toggleOptions.brandweervoorzieningen.indexOf(feature.attributes.type) !== -1) {
                hide = true;
                return false;
            }
        });
        return hide;
    },
    isHulplijnHidden: function(feature) {
        var hide = false;
        $.each(this.availableToggles, function(toggleKey, toggleOptions) {
            var on = $("#btn_" + toggleKey).hasClass('on');
            if(!on && toggleOptions.hulplijnen && toggleOptions.hulplijnen.indexOf(feature.attributes.type) !== -1) {
                hide = true;
                return false;
            }
        });
        return hide;
    },
    enableLayers: function(layers) {
        if(!layers) {
            return;
        }
        var me = this;
        // Temp array
        var disabledLayers = [].concat(me.disabledLayers);
        // Filter layers
        me.disabledLayers = disabledLayers.filter(function(elem, pos) {
            return layers.indexOf(elem) === -1;
        });
    },
    disableLayers: function(layers) {
        if(!layers) {
            return;
        }
        var me = this;
        // Add all layers
        var disabledLayers = me.disabledLayers.concat(layers);
        // Remove duplicates
        me.disabledLayers = disabledLayers.filter(function(elem, pos) {
            return disabledLayers.indexOf(elem) === pos;
        });
    },
    isLayerEnabled: function(layerName) {
        return this.disabledLayers.indexOf(layerName) === -1;
    }
};
