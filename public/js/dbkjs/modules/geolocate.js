/*!
 *  Copyright (c) 2014 Milo van der Linden (milo@dogodigi.net)
 *
 *  This file is part of opendispatcher/safetymapsDBK
 *
 *  opendispatcher is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  opendispatcher is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with opendispatcher. If not, see <http://www.gnu.org/licenses/>.
 *
 */

var dbkjs = dbkjs || {};
window.dbkjs = dbkjs;
dbkjs.modules = dbkjs.modules || {};

dbkjs.modules.geolocate = {
    id: 'dbk.modules.geolocate',
    options: null,
    style: {
        strokeColor: '#CCCC00',
        fillColor: '#CCCC00',
        strokeWidth: 1,
        fillOpacity: 0.1
    },
    // Layer name starts with _ to hide in support module layer list
    layer: new OpenLayers.Layer.Vector('_GPS accuracy circle'),
    markers: new OpenLayers.Layer.Markers("_GPS marker"),
    firstGeolocation: true,
    position: null,
    /**
     *
     * @param {<OpenLayers.Feature>} feature
     */
    pulsate: function(feature) {
        var _obj = dbkjs.modules.geolocate;
        var point = feature.geometry.getCentroid(),
            bounds = feature.geometry.getBounds(),
            radius = Math.abs((bounds.right - bounds.left)/2),
            count = 0,
            grow = 'up';

        var resize = function(){
            if (count>16) {
                clearInterval(window.resizeInterval);
            }
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
            feature.geometry.resize(1+ratio, point);
            _obj.layer.drawFeature(feature);
            count++;
        };
        window.resizeInterval = window.setInterval(resize, 50, point, radius);
    },
    locationupdated: function(e) {
        var _obj = dbkjs.modules.geolocate;

        _obj.position = new OpenLayers.LonLat(e.point.x, e.point.y);
        $("#btn_geolocate").css("color", "black");

        var circle = null;
        if(_obj.options.showAccuracyCircle) {
            _obj.layer.removeAllFeatures();
            circle = new OpenLayers.Feature.Vector(
                OpenLayers.Geometry.Polygon.createRegularPolygon(
                    new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                    e.position.coords.accuracy/2,
                    40,
                    0
                ),
                {},
                _obj.style
            );
            _obj.layer.addFeatures([
                new OpenLayers.Feature.Vector(
                    e.point,
                    {},
                    {
                        graphicName: 'circle',
                        fillColor: '#CCCC00',
                        strokeColor: '#CCCC00',
                        strokeWidth: 1,
                        fillOpacity: 0.3,
                        pointRadius: 10
                    }
                ),
                circle
            ]);
        }

        if(_obj.options.showMarker) {
            _obj.markers.clearMarkers();
            var size = new OpenLayers.Size(36,36);
            var offset = new OpenLayers.Pixel(-(size.w/2), -(size.h/2));
            _obj.markers.addMarker(new OpenLayers.Marker(_obj.position, new OpenLayers.Icon("images/marker-gps.png", size, offset)));
        }

        if (_obj.firstGeolocation) {
            dbkjs.map.setCenter(_obj.position, dbkjs.options.zoom);
            if(circle !== null) {
                _obj.pulsate(circle);
            }
            _obj.firstGeolocation = false;
            _obj.bind = true;
        }
    },
    locationlost: function(e) {
        $("#btn_geolocate").css("color", "gray");
    },
    center: function(e) {
        var _obj = dbkjs.modules.geolocate;
        if(_obj.position !== null) {
            dbkjs.map.setCenter(_obj.position, dbkjs.options.zoom);
        } else {
            _obj.firstGeolocation = true;
            _obj.provider.activate();
        }
    },
    /**
     * Code from: https://github.com/nherment/node-nmea/blob/master/lib/Helper.js
     *
     * License: MIT, https://github.com/nherment/node-nmea/blob/master/LICENSE
     */
    parseLatitude: function(lat, hemi) {
        var h = (hemi === 'N') ? 1.0 : -1.0;
        var a;
        var dg;
        var mn;
        var l;
        a = lat.split('.');
        if(a[0].length === 4) {
            // two digits of degrees
            dg = lat.substring(0, 2);
            mn = lat.substring(2);
        } else if(a[0].length === 3) {
            // 1 digit of degrees (in case no leading zero)
            dg = lat.substring(0, 1);
            mn = lat.substring(1);
        } else {
            // no degrees, just minutes (nonstandard but a buggy unit might do this)
            dg = '0';
            mn = lat;
        }
        // latitude is usually precise to 5-8 digits
        return ((parseFloat(dg) + (parseFloat(mn) / 60.0)) * h).toFixed(8);
    },
    /**
     * Code from: https://github.com/nherment/node-nmea/blob/master/lib/Helper.js
     *
     * License: MIT, https://github.com/nherment/node-nmea/blob/master/LICENSE
     */
    parseLongitude: function(lon, hemi) {
        var h;
        var a;
        var dg;
        var mn;
        h = (hemi === 'E') ? 1.0 : -1.0;
        a = lon.split('.');
        if(a[0].length === 5) {
            // three digits of degrees
            dg = lon.substring(0, 3);
            mn = lon.substring(3);
        } else if(a[0].length === 4) {
            // 2 digits of degrees (in case no leading zero)
            dg = lon.substring(0, 2);
            mn = lon.substring(2);
        } else if(a[0].length === 3) {
            // 1 digit of degrees (in case no leading zero)
            dg = lon.substring(0, 1);
            mn = lon.substring(1);
        } else {
            // no degrees, just minutes (nonstandard but a buggy unit might do this)
            dg = '0';
            mn = lon;
        }
        // longitude is usually precise to 5-8 digits
        return ((parseFloat(dg) + (parseFloat(mn) / 60.0)) * h).toFixed(8);
    },
    getNmea: function() {
        var _obj = dbkjs.modules.geolocate;
        $.ajax("/nmea.json", {
            cache: false,
            dataType: "json"
        })
        .always(function() {
            window.setTimeout(function() {
                _obj.getNmea();
            }, _obj.options.nmeaUpdateInterval);
        })
        .done(function(nmea) {
            if(!_obj.activated) {
                return;
            }

            var gga = nmea.$GPGGA.sentence.split(",");

            if(gga[6] !== "0") {
                var lat = _obj.parseLatitude(gga[2], gga[3]);
                var lon = _obj.parseLongitude(gga[4], gga[5]);

                var pos = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), dbkjs.map.getProjectionObject());

                if(_obj.position === null || _obj.position.lon !== pos.lon || _obj.position.lat !== pos.lat) {
                    _obj.position = pos;
                    _obj.locationupdated({
                        position: {
                            coords: {
                                accuracy: 50
                            }
                        },
                        point: new OpenLayers.Geometry.Point(pos.lon, pos.lat)
                    });
                }
            } else {
                _obj.locationlost();
            }
        });
    },
    register: function(){
        var _obj = dbkjs.modules.geolocate;

        _obj.options = $.extend({
            provider: "geolocate",
            showAccuracyCircle: true,
            showMarker: false,
            button: "activate",
            activateOnStart: false,
            nmeaUpdateInterval: 5000
        }, _obj.options);

        var params = OpenLayers.Util.getParameters();
        if(params.geoprovider && ["geolocate", "nmea"].indexOf(params.geoprovider) !== -1) {
            _obj.options.provider = params.geoprovider;
        }

        if(_obj.options.provider === "geolocate") {
            _obj.control = new OpenLayers.Control.Geolocate({
                bind: true,
                geolocationOptions: {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 7000
                }
            });

            dbkjs.map.addControl(_obj.control);
            _obj.control.events.register("locationupdated",_obj.control,function(e) {
                _obj.locationupdated(e);
            });

            _obj.provider = {
                activate: function() {
                    _obj.control.activate();
                },
                deactivate: function() {
                    _obj.control.deactivate();
                    _obj.firstGeolocation = true;
                }
            };
        } else if(_obj.options.provider === "nmea") {
            _obj.activated = false;

            _obj.provider = {
                activate: function() {
                    if(!_obj.activated) {
                        _obj.getNmea();
                    }
                    _obj.activated = true;
                },
                deactivate: function() {
                    _obj.activated = false;
                    _obj.position = null;
                    _obj.firstGeolocation = true;
                }
            };
        }

        $('#btngrp_3').append('<a id="btn_geolocate" class="btn btn-default navbar-btn" href="#" title="' + i18n.t('map.zoomLocation') + '"><i class="fa fa-crosshairs"></i></a>');

        if(_obj.options.activateOnStart) {
            $("#btn_geolocate").css("color", "gray");

            _obj.provider.activate();

            // When activated on start the button mode is center on position,
            // not 'activate' / 'deactivate'

            _obj.options.button = "center";
            // Do not zoom to position, only on click
            _obj.firstGeolocation = false;
        }

        $('#btn_geolocate').click(function(){

            if(_obj.options.button === "activate") {
                // button mode activate means get geolocation on button click,
                // disable geolocation on second button click

                if ($(this).hasClass('active')) {
                    _obj.layer.removeAllFeatures();
                    _obj.markers.clearMarkers();
                    _obj.provider.deactivate();
                    $(this).removeClass('active');
                    $("#btn_geolocate").blur();
                } else {
                    $("#btn_geolocate").css("color", "gray");
                    $(this).addClass('active');
                    _obj.provider.activate();
                }
            } else if(_obj.options.button === "center") {
                // Center if position already known, otherwise activate provider
                // and set firstGeolocation to true so will center on position
                // when position received
                _obj.center();
            }
        });
        dbkjs.map.addLayers([_obj.layer, _obj.markers]);
    }
};
