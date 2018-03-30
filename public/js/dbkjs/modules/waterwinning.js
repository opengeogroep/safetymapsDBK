/* global OpenLayers, Mustache, i18n, Proj4js */

var dbkjs = dbkjs || {};
window.dbkjs = dbkjs;
dbkjs.modules = dbkjs.modules || {};
dbkjs.modules.waterwinning = {
    id: "dbk.module.waterwinning",
    options: null,
    incident: null,
    lineFeature:null,
    test: null,
    testMarker: null,
    noRouteSort: null,
    register: function () {
        var me = this;

        if(window.location.hostname.endsWith(".local")) {
            this.options.url = "api/vrh/waterwinning.json";
        }

        me.createLayer();

        var params = OpenLayers.Util.getParameters();
        me.test = params.ww === "test";
        me.noRouteSort = params.wwnoroutesort === "true";
        if(me.test) {
            $(dbkjs).one("dbkjs_init_complete", function () {
                me.newIncident({x: params.wwx, y: params.wwy}, true, true);
            });
        } else  {
            $(dbkjs).one("dbkjs_init_complete", function () {
                if (dbkjs.modules.incidents && dbkjs.modules.incidents.controller) {
                    $(dbkjs.modules.incidents.controller).on("new_incident", function (event, incident) {
                        me.newIncident(incident);
                    });
                    $(dbkjs.modules.incidents.controller).on("end_incident", function () {
                        me.resetTab();
                    });
                }
            });
        }
    },
    createLayer: function () {
        var me = this;
        this.Layer = new OpenLayers.Layer.Vector("waterwinning", {
            rendererOptions: {
                zIndexing: true
            },
            options: {
                minScale: 10000
            },
            styleMap: new OpenLayers.StyleMap({
                default: new OpenLayers.Style({
                    cursor:"pointer",
                    externalGraphic: "${myIcon}",
                    pointRadius: 18
                }, {
                    context: {
                        myIcon: function (feature) {
                            return dbkjs.basePath + feature.attributes.img;
                        },
                        myradius: function (feature) {
                            return dbkjs.scaleStyleValue(12, 10);
                        }
                    }
                }), 
                'select': new OpenLayers.Style({
                    pointRadius: "${myradius}"
                }, {
                    context: {
                        myradius: function (feature) {
                            return dbkjs.scaleStyleValue(12, 25);
                        }
                    }
                })
            })
        });
        this.Layer.events.register("featureselected", me, me.selectFeature);
        dbkjs.map.addLayer(this.Layer);
        dbkjs.selectControl.setLayer((dbkjs.selectControl.layers || dbkjs.selectControl.layer).concat([this.Layer]));
    },
    selectFeature: function(feature){
        this.drawLine(feature.feature.attributes.ww);
    },
    drawLine: function (destination, id) {
        var me = this;
        //dbkjs.selectControl.select(test);
        if(me.lineFeature){
            me.Layer.removeFeatures([me.lineFeature]);
        }
        if(me.endOfRouteToDestLineFeature) {
            me.Layer.removeFeatures([me.endOfRouteToDestLineFeature]);
        }
        if (me.incident) {
            var line;
            if(destination.route) {
                console.log("Using route for waterwinning point", destination);
                line = new OpenLayers.Format.GeoJSON().read(destination.route.data.features[0].geometry)[0].geometry;
                console.log("Line to point", line);   
                var points = line.getVertices();
                var reprojected = [];
                reprojected.push(new OpenLayers.Geometry.Point(me.incident.x, me.incident.y));
                for(var i = 0; i < points.length; i++) {
                    var p = new Proj4js.Point(points[i].x, points[i].y);
                    var t = Proj4js.transform(new Proj4js.Proj("EPSG:4326"), new Proj4js.Proj(dbkjs.options.projection.code), p);                
                    reprojected.push(new OpenLayers.Geometry.Point(t.x, t.y));
                }
                line = new OpenLayers.Geometry.LineString(reprojected);
                console.log("Reprojected line to point", line);
                var lastRoutePoint = reprojected[reprojected.length-1];
                var coords = [new OpenLayers.Geometry.Point(lastRoutePoint.x, lastRoutePoint.y), new OpenLayers.Geometry.Point(destination.x, destination.y)];
                me.endOfRouteToDestLineFeature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(coords), {}, {
                    strokeColor: "blue", strokeOpacity: 0.8, strokeWidth: 3, strokeDashstyle: "dash"
                });
                this.Layer.addFeatures(me.endOfRouteToDestLineFeature);
            } else {
                var endPt = new OpenLayers.Geometry.Point(destination.x, destination.y);
                var startPt = new OpenLayers.Geometry.Point(me.incident.x, me.incident.y);            
                line = new OpenLayers.Geometry.LineString([startPt, endPt]);
            }
            var style = {strokeColor: "#0500bd", strokeOpacity: 0.5, strokeWidth: 10};
            me.lineFeature = new OpenLayers.Feature.Vector(line, {}, style);
            this.Layer.addFeatures([me.lineFeature]);      
        }
    },
    newIncident: function(incident, zoom, addTestMarker) {
        var me = this;
        me.incident = incident;
        me.resetTab();
        $("#tab_waterwinning").html("<i>Ophalen gegevens...</i>");

        if(addTestMarker) {
            var location = new OpenLayers.Geometry.Point(me.incident.x, me.incident.y);
            var marker = new OpenLayers.Feature.Vector(location, {});
            marker.attributes ={
                "img": "images/marker-red.png"
            };
            me.Layer.addFeatures([marker]);
        }
        me.requestData(incident)
        .done(function(data) {
            me.renderData(data);
            if(zoom) {
                dbkjs.map.setCenter(new OpenLayers.LonLat(me.incident.x, me.incident.y), dbkjs.options.zoom);
            }
        })
        .fail(function(error) {
            console.log("error requesting waterwinning data", arguments);
            $("#tab_waterwinning").html("<i>Fout bij ophalen gegevens: " + Mustache.escape(error) + "</i>");
        });
    },
    renderData: function(data) {
        console.log("rendering waterwinning data", data);

        var me = this;
        var ww_table_div = $('<div class="table-responsive"></div>');
        if(me.test) {
            ww_table_div.append('<input type="button" class="btn btn-primary" id="ww_test_btn" value="Test nieuwe locatie door klik op kaart"><p>');
            ww_table_div.append('<a href="?ww=test&wwx=' + me.incident.x + '&wwy=' + me.incident.y + '">Permalink test waterwinning op deze locatie</a><p>');
        }

        var ww_table = $('<table id="wwlist" class="table table-hover"></table>');
        ww_table.append('<tr><th>Soort</th><th>Afstand</th><th>Extra info</th></tr>');
        var all = data.primary.concat(data.secondary);
        all.sort(function(lhs, rhs) {
            var ld = lhs.distance;
            if(lhs.route && lhs.route.success) {
                ld = lhs.route.distance;
            }
            var rd = rhs.distance;
            if(rhs.route && rhs.route.success) {
                rd = rhs.route.distance;
            }
            return ld - rd;
        });
        $.each(all, function (i, ww) {
            var img = "images/nen1414/Tb4.002.png";
            if(ww.type === "bovengronds") {
                img = "images/nen1414/Tb4.001.png";
            } else if(ww.type === "open_water") {
                img = "images/other/Falck20.png";
            } else if(ww.type === "bluswaterriool") {
                img = "images/other/Falck19.png";
            }
            var fid = "ww_" + i;
            var routeDist = "";
            if(ww.route) {
                routeDist = "<span style='color:red'>" + Math.round(ww.route.distance) + "m</span><br>";
            }
            var myrow = $('<tr id="test'+i+'">' +
                    '<td><img style="width: 42px" src="' + dbkjs.basePath + img + '"></td>' +
                    '<td>' + routeDist + ww.distance.toFixed() + 'm' + '</td>' +
                    '<td>' + (ww.info ? ww.info : '') + '</i></td> +'
                    + '</tr>'
            ).click(function (e) {
                me.drawLine(ww, fid);
                me.zoomToOverview(ww);
            });
            ww_table.append(myrow);
            var location = new OpenLayers.Geometry.Point(ww.x, ww.y);
            var marker = new OpenLayers.Feature.Vector(location, {});
            marker.attributes ={
                "img": img,
                "fid": fid,
                "ww": ww
            };
            me.testMarker = marker;
            me.Layer.addFeatures([marker]);
        });
        if(data.primary.length === 0) {
            ww_table.append('<tr><td colspan="3" style="font-style: italic">Geen primaire waterwinning binnen 500 meter gevonden!</td></tr>');
        }
        if(data.secondary.length === 0) {
            ww_table.append('<tr><td colspan="3" style="font-style: italic">Geen secondaire waterwinning binnen 3000 meter gevonden!</td></tr>');
        }

        ww_table_div.append(ww_table);
        $("#tab_waterwinning").html(ww_table_div);

        if(me.test) {
            $("#ww_test_btn").click(function() {
                $("#ww_test_btn").attr("disabled");
                $("#ww_test_btn").val("Klik op de kaart...");
                dbkjs.map.events.register('click', me, me.mapClickTest);
            });
        }
        dbkjs.map.setLayerIndex(this.Layer,99);
        dbkjs.protocol.jsonDBK.addMouseoverHandler("#wwlist",me.Layer);
    },
    mapClickTest: function(e) {
        var me = this;
        dbkjs.map.events.unregister('click', me, me.mapClickTest);

        var pos = dbkjs.map.getLonLatFromPixel(e.xy);
        me.newIncident({x: pos.lon, y: pos.lat}, true, true);
    },
    resetTab: function () {
        $("#tab_waterwinning").html($('<i> ' + i18n.t("dialogs.noinfo") + '</i>'));
        this.Layer.removeAllFeatures();
    },
    zoomToOverview: function (ww) {
        var me = this;
        if (ww && me.incident){
            var x = (parseInt(ww.x,10)+parseInt(me.incident.x,10))/2;
            var y = (parseInt(ww.y,10)+parseInt(me.incident.y,10))/2;
            dbkjs.map.setCenter(new OpenLayers.LonLat(x, y), dbkjs.options.zoom);
            me.checkIfPointsInScreen(ww);
        }
    },
    
    checkIfPointsInScreen: function(destination){
        var me = this;

        if(me.lineFeature) {
            dbkjs.map.zoomToExtent(me.lineFeature.geometry.getBounds(), true);
            if(dbkjs.map.getZoom() > dbkjs.options.zoom) {
                dbkjs.map.setCenter(dbkjs.map.getCenter(), dbkjs.options.zoom);
            }
            return;
        }

        var pointsInScreen = false;
        var i = 0;
        while(!pointsInScreen){
            var bounds = dbkjs.map.calculateBounds();
                if(bounds.containsLonLat({lon:destination.x, lat:destination.y}) && bounds.containsLonLat({lon:me.incident.x, lat:me.incident.y})){
                pointsInScreen = true;
            }else {
                i++;
                    dbkjs.map.zoomOut();
                }
            if(i>25){
                console.log("points are not found");
                pointsInScreen = true;
            }
        }
        return pointsInScreen; 
    },
    
    requestData:function(incident){
        var me = this;
        var d = $.Deferred();
        console.log("requesting waterwinning data", incident);

        $.ajax(me.options.url, {
            data: {
                x: Number(incident.x).toFixed(),
                y: Number(incident.y).toFixed(),
                noRouteSort: me.noRouteSort
            }
        })
        .done(function(data) {
            if(data.success) {
                d.resolve(data.value);
            } else {
                d.reject(data.error);
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            d.reject("Ajax error: HTTP status " + jqXHR.status + " " + jqXHR.statusText + ", " + jqXHR.responseText);
        });
        return d.promise();
    }
};
