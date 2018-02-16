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
    incident: null,
    lineFeature:null,
    dummy: {
        "succes": true,
        "values": [
            {
                "soort": "Tb4.001blau.png",
                "afstand": 20,
                "extra_info": "blablalbla",
                "x": 78200,
                "y": 457250
            },
            {
                "soort": "Tb4.002blau.png",
                "afstand": 38,
                "extra_info": "test1",
                "x": 78250,
                "y": 457300
            }
        ]
    },
    register: function () {
        var me = this;
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
            styleMap: new OpenLayers.StyleMap({
                default: new OpenLayers.Style({
                    externalGraphic: "${myIcon}",
                    pointRadius: "${myradius}"
                }, {
                    context: {
                        myIcon: function (feature) {
                            return dbkjs.basePath + "images/nen1414/" + feature.attributes.soort;
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
            this.Layer.addFeatures([me.lineFeature]);
            
        }
    },
    newIncident: function(incident) {
        var me = this;

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
        ww_table.append(
                '<tr>' +
                '<th>' + "Soort" + '</th>' +
                '<th>' + "Afstand" + '</th>' +
                '<th>' + "Extra info" + '</th>' +
                '</tr>'
                );
        $.each(data, function (i, ww) {
            var myrow = $('<tr id="test'+i+'">' +
                    '<td><img class="thumb" src="' + dbkjs.basePath + "images/nen1414/" + ww.soort + '"</td>' +
                    '<td>' + ww.afstand + 'm' + '</td>' +
                    '<td>' + ww.extra_info + '</td> +'
                    + '</tr>'
                    ).click(function (e) {
                me.drawLine(ww,"test"+i);
                me.zoomToOverview();
            });
            ww_table.append(myrow);
            var location = new OpenLayers.Geometry.Point(ww.x, ww.y);
            var marker = new OpenLayers.Feature.Vector(location, {});
            marker.attributes ={
                "soort":ww.soort,
                "fid":"test" +i
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

    zoomToOverview: function () {
        var me = this;
        if (me.wwData && me.incident){
            var x = (parseInt(me.wwData.x,10)+parseInt(me.incident.x,10))/2;
            var y = (parseInt(me.wwData.y,10)+parseInt(me.incident.y,10))/2;
            dbkjs.map.setCenter(new OpenLayers.LonLat(x, y), dbkjs.options.zoom);
        }
    },
    
    requestData:function(incident){
        var me = this;
        var d = $.Deferred();
        console.log("requesting waterwinning data", incident);
        window.setTimeout(function() {
            console.log("resolving waterwinning data promise");
            d.resolve(me.dummy.values);
        });
        /*
        var incidentObject = {
            "straal": 2500, // moet configureerbaar worden
            "aantal": 3, // moet configureerbaar worden
            "x":incident.x,
            "y":incident.y
        };
        $.ajax("url naar api", {
            dataType: "json",
            data: incidentObject
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            
        })
        .done(function(data, textStatus, jqXHR) {
            if(data.success) {
                
            } else {
                
            }
        });*/
        return d.promise();
    }
};