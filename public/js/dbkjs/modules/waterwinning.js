/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var dbkjs = dbkjs || {};
window.dbkjs = dbkjs;
dbkjs.modules = dbkjs.modules || {};
dbkjs.modules.waterwinning = {
    id: "dbk.module.waterwinning",
    options: null,
    incident: null,
    lineFeature:null,
    register: function () {
        var me = this;

        if(window.location.hostname.endsWith(".local")) {
            this.options.url = "api/vrh/waterwinning.json";
        }

        me.createLayer();
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
    },
    createLayer: function () {
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
        dbkjs.map.addLayer(this.Layer);
        dbkjs.selectControl.setLayer((dbkjs.selectControl.layers || dbkjs.selectControl.layer).concat([this.Layer]));
    },

    drawLine: function (destination, id) {
        var me = this;
        //me.Layer.destroyFeatures();
        var test = this.Layer.getFeatureBy("fid",id);
        //dbkjs.selectControl.select(test);
        if(me.lineFeature){
            me.Layer.removeFeatures([me.lineFeature]);
        }
        if (me.incident) {
            var endPt = new OpenLayers.Geometry.Point(destination.x, destination.y);
            var startPt = new OpenLayers.Geometry.Point(me.incident.x, me.incident.y);
            var line = new OpenLayers.Geometry.LineString([startPt, endPt]);
            var style = {strokeColor: "#0500bd", strokeWidth: 3};
            me.lineFeature = new OpenLayers.Feature.Vector(line, {}, style);
            dbkjs.map.setLayerIndex(this.Layer,99);
            this.Layer.addFeatures([me.lineFeature]);      
        }
    },
    newIncident: function(incident) {
        var me = this;
        me.incident =incident;
        me.resetTab();
        $("#tab_waterwinning").html("<i>Ophalen gegevens...</i>");

        me.requestData(incident)
        .done(function(data) {
            me.renderData(data);
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
        var ww_table = $('<table id="wwlist" class="table table-hover"></table>');
        ww_table.append('<tr><th>Soort</th><th>Afstand</th><th>Extra info</th></tr>');
        ww_table.append('<tr><th colspan="3" style="font-weight: bold">Primair</th></tr>');
        if(data.primary.length === 0) {
            ww_table.append('<tr><td colspan="3" style="font-style: itaqlic">Geen primaire waterwinning binnen 500 meter gevonden!</td></tr>');
        }
        $.each(data.primary, function (i, ww) {
            var img = "images/nen1414/Tb4.002.png";
            if(ww.type === "bovengronds") {
                img = "images/nen1414/Tb4.001.png";
            } else if(ww.soort === "open_water") {
                img = "images/other/Falck20.png";
            }
            var fid = "ww_primary_" + i;
            var myrow = $('<tr id="test'+i+'">' +
                    '<td><img style="width: 42px" src="' + dbkjs.basePath + img + '"></td>' +
                    '<td>' + ww.distance.toFixed() + 'm' + '</td>' +
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
                "fid": fid
            };
            me.Layer.addFeatures([marker]);
        });
        ww_table.append('<tr><th colspan="3" style="font-weight: bold">Secundair</th></tr>');
        if(data.secondary.length === 0) {
            ww_table.append('<tr><td colspan="3" style="font-style: itaqlic">Geen primaire waterwinning binnen 500 meter gevonden!</td></tr>');
        }
        $.each(data.secondary, function (i, ww) {
            if(ww.type === "bluswaterriool") {
                img = "images/other/Falck19.png";
            } else {
                img = "images/other/Falck20.png"; // open water
            }
            var fid = "ww_secondary_" + i;
            var myrow = $('<tr id="test'+i+'">' +
                    '<td><img style="width: 42px" src="' + dbkjs.basePath + img + '"></td>' +
                    '<td>' + ww.distance.toFixed() + 'm' + '</td>' +
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
                "fid": fid
            };
            me.Layer.addFeatures([marker]);
        });
        ww_table_div.append(ww_table);
        $("#tab_waterwinning").html(ww_table_div);
        dbkjs.protocol.jsonDBK.addMouseoverHandler("#wwlist",me.Layer);
    },

    resetTab: function () {
        $("#tab_waterwinning").html($('<i> ' + i18n.t("dialogs.noinfo") + '</i>'));
        this.Layer.removeFeatures();
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
                x: incident.x,
                y: incident.y
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