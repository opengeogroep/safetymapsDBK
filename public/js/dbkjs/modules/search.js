/*!
 *  Copyright (c) 2014 Milo van der Linden (milo@dogodigi.net)
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
dbkjs.modules.updateFilter = function(id) {
    //Is er een DBK geselecteerd of is de id leeg?
    $.each(dbkjs.modules, function(mod_index, module) {
        if ($.inArray(mod_index, dbkjs.options.organisation.modules) > -1) {
            if (module.updateFilter) {
                module.updateFilter(id);
            }
        }
    });
};
dbkjs.modules.search = {
    id: "dbk.modules.search",
    style: {
        strokeColor: '#CCCC00',
        fillColor: '#ffffff',
        strokeWidth: 0,
        fillOpacity: 0.1
    },
    layer: null,
    searchPopup: null,
    viewmode: 'fullscreen',
    register: function(options) {
        if(options && options.viewmode) {
            this.viewmode = options.viewmode;
        }
        if(this.viewmode === 'fullscreen') {
            this.fullscreenLayout();
        } else {
            this.inlineLayout();
        }
        this.layer = new OpenLayers.Layer.Vector('search');
        dbkjs.map.addLayer(this.layer);
    },
    inlineLayout: function() {
        var search_div = $('#btn-grp-search');
        search_div.append(this.createSearchGroup());
        search_div.show();
        this.activate();
    },
    fullscreenLayout: function() {
        var _obj = dbkjs.modules.search;
        $('<a></a>')
            .attr({
                'id': 'btn_opensearch',
                'class': 'btn btn-default navbar-btn',
                'href': '#',
                'title': i18n.t('map.search.search')
            })
            .append('<i class="icon-search"></i>')
            .click(function(e) {
                e.preventDefault();
                _obj.showSearchPopup();
            })
            .appendTo('#btngrp_3');
    },
    showSearchPopup: function() {
        var _obj = dbkjs.modules.search;
        if(_obj.searchPopup === null) {
            _obj.initSearchPopup();
        }
        _obj.searchPopup.show();
    },
    initSearchPopup: function() {
        var _obj = dbkjs.modules.search;
        _obj.searchPopup = dbkjs.util.createModalPopup({
            title: 'Zoeken'
        });
        _obj.searchPopup.getView().append(_obj.createSearchGroup());
        _obj.activate();
    },
    createSearchGroup: function() {
        var search_group = $('<div></div>').addClass('input-group');
        if(this.viewmode === 'fullscreen') {
            search_group.addClass('input-group-lg');
        } else {
            search_group.addClass('navbar-btn');
        }
        var search_pre = $('<span id="search-add-on" class="input-group-addon"><i class="icon-building"></i></span>');
        var search_input = $('<input id="search_input" name="search_input" type="text" class="form-control" placeholder="' + i18n.t("search.dbkplaceholder") + '">');
        var search_btn_grp = $(
            '<div class="input-group-btn">' +
                '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' + i18n.t("search.search") + ' <span class="caret"></span></button>' +
                '<ul class="dropdown-menu pull-right" id="search_dropdown">' +
                    '<li><a href="#" id="s_dbk"><i class="icon-building"></i> ' + i18n.t("search.dbk") + '</a></li>' +
                    '<li><a href="#" id="s_oms"><i class="icon-bell"></i> ' + i18n.t("search.oms") + '</a></li>' +
                    '<li><a href="#" id="s_adres"><i class="icon-home"></i> ' + i18n.t("search.address") + '</a></li>' +
                    '<li><a href="#" id="s_coord"><i class="icon-pushpin"></i> ' + i18n.t("search.coordinates") + '</a></li>' +
                '</ul>' +
            '</div>'
        );
        search_group.append(search_pre);
        search_group.append(search_input);
        search_group.append(search_btn_grp);
        return search_group;
    },
    zoomAndPulse: function(lonlat){
        var _obj = dbkjs.modules.search;
        _obj.layer.removeAllFeatures();
        var point = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)
        var circle = new OpenLayers.Feature.Vector(
            OpenLayers.Geometry.Polygon.createRegularPolygon(
                point,
                100,
                40,
                0
            ),
            {},
            _obj.style
        );
        _obj.layer.addFeatures([
            new OpenLayers.Feature.Vector(
                point,
                {},
                {
                    graphicName: 'circle',
                    fillColor: '#ff0000',
                    strokeColor: '#ff0000',
                    strokeWidth: 3,
                    fillOpacity: 0.1,
                    pointRadius: 7
                }
            ),
            circle
        ]);
        dbkjs.map.zoomToExtent(_obj.layer.getDataExtent());
        _obj.pulsate(circle);
        if(_obj.viewmode === 'fullscreen' && _obj.searchPopup) {
            _obj.searchPopup.hide();
        }
    },
    pulsate: function(feature) {
        var _obj = dbkjs.modules.search;
        var point = feature.geometry.getCentroid(),
            bounds = feature.geometry.getBounds(),
            radius = Math.abs((bounds.right - bounds.left)/2),
            count = 0,
            grow = 'up';

        var resize = function(){
            if (count>16) {
                clearInterval(window.resizeInterval);
                _obj.layer.removeFeatures(feature,{silent: true});
            } else {
                var interval = radius * 0.03;
                var ratio = interval/radius;
                switch(count) {
                    case 4:
                    case 12:
                        grow = 'down'; break;
                    case 8:
                        grow = 'up'; break;
                }
                if (grow!=='up') {
                    ratio = - Math.abs(ratio);
                }
                if(count>16){
                    _obj.layer.removeFeatures(feature,{silent: true});
                } else {
                    feature.geometry.resize(1+ratio, point);
                    _obj.layer.drawFeature(feature);
                    count++;    
                }
            }
        };
        window.resizeInterval = window.setInterval(resize, 50, point, radius);
    },
    activate: function() {
        var _obj = dbkjs.modules.search;
        $('#search_input').typeahead({
            name: 'address',
            remote: {
                //url: 'nominatim?format=json&countrycodes=nl&addressdetails=1&q=%QUERY',
                url: 'api/autocomplete/%QUERY',
                filter: function(parsedResponse) {
                    var dataset = [];

                    for (i = 0; i < parsedResponse.length; i++) {
                        var pnt = new OpenLayers.Geometry.Point(
                                parsedResponse[i].lon,
                                parsedResponse[i].lat).transform(
                                new OpenLayers.Projection("EPSG:4326"),
                                dbkjs.map.getProjectionObject()
                                );
                        dataset.push({
                            value: parsedResponse[i].display_name,
                            id: parsedResponse[i].osm_id,
                            geometry: pnt
                        });
                    }
                    return dataset;
                }
            }
        });
        $('#search_input').bind('typeahead:selected', function(obj, datum) {
            dbkjs.modules.updateFilter(datum.id);
            _obj.zoomAndPulse(datum.geometry.getBounds().getCenterLonLat());
        });
        $('#search_input').click(
                //function(e) {
                //    console.log(e);
                //    $(this).val('');
                //}
        );
        $('#search_dropdown a').click(function(e) {
            $('#search_input').typeahead('destroy');
            $('#search_input').val('');
            var mdiv = $(this).parent().parent().parent();
            var mbtn = $('#search-add-on');
            var minp = mdiv.parent().find('input');
            var searchtype = $(this).text().trim();
            if (searchtype === i18n.t("search.address")) {
                mbtn.html('<i class="icon-home"></i>');
                minp.attr("placeholder", i18n.t("search.addressplaceholder"));
                if (dbkjs.modules.search) {
                    dbkjs.modules.search.activate();
                }
            } else if (searchtype === i18n.t("search.coordinates")) {
                mbtn.html('<i class="icon-pushpin"></i>');
                minp.attr("placeholder", i18n.t("search.coordplaceholder"));
                $('#search_input').change(function() {
                    var ruwe_input = $('#search_input').val();
                    var loc;
                    var coords = ruwe_input.split(/[\s,]+/);;
                    coords[0] = parseFloat(coords[0]);
                    coords[1] = parseFloat(coords[1]);
                    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                        if (coords[0] > 50.0 && coords[0] < 54.0 && coords[1] > 2.0 && coords[1] < 8.0) { //wgs84
                            loc = new OpenLayers.LonLat(coords[1], coords[0]).transform(new OpenLayers.Projection("EPSG:4326"),dbkjs.map.getProjectionObject());
                            dbkjs.modules.updateFilter(0);
                            _obj.zoomAndPulse(loc);
                            $('#search_input').removeClass('has-error');
                        } else if (coords[0] > -14000.0 && coords[0] < 293100.0 && coords[1] > 293100.0 && coords[1] < 650000.0) { //rd
                            loc = new OpenLayers.LonLat(coords[0], coords[1]).transform(new OpenLayers.Projection("EPSG:28992"), dbkjs.map.getProjectionObject());
                            dbkjs.modules.updateFilter(0);
                            _obj.zoomAndPulse(loc);
                            $('#search_input').removeClass('has-error');
                        } else {
                            // @todo build function to handle map fault
                            //maak het vakje rood, geen geldige coordinaten
                            $('#search_input').addClass('has-error');
                        }
                    } else {
                        $('#search_input').addClass('has-error');
                    }
                    return false;
                });
            } else if (searchtype === i18n.t("search.dbk")) {
                mbtn.html('<i class="icon-building"></i>');
                minp.attr("placeholder", i18n.t("search.dbkplaceholder"));
                dbkjs.modules.feature.search_dbk();
            } else if (searchtype === i18n.t("search.oms")) {
                mbtn.html('<i class="icon-bell"></i>');
                minp.attr("placeholder", i18n.t("search.omsplaceholder"));
                dbkjs.modules.feature.search_oms();
            }
            mdiv.removeClass('open');
            mdiv.removeClass('active');
            //e.preventDefault();
            return false;
        });

        // default handler
        dbkjs.modules.feature.search_dbk();
    }
};
