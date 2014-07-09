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
dbkjs.modules.gms = {
    id: "dbk.module.gms",
    gmsPopup: null,
    gms: null,
    updated: null,
    viewed: false,
    register: function(options) {
        var _obj = dbkjs.modules.gms;
        _obj.createPopup();
        $('<a></a>')
            .attr({
                'id': 'btn_opengms',
                'class': 'btn btn-default navbar-btn',
                'href': '#',
                'title': i18n.t('map.gms.button')
            })
            .append('<i class="icon-align-justify"></i>')
            .click(function(e) {
                e.preventDefault();
                _obj.gmsPopup.show();
                _obj.viewed = true;
                $("#btn_opengms").removeClass("unread");
            })
            .appendTo('#btngrp_3');
        this.loadGms();
    },
    createPopup: function() {
        var _obj = dbkjs.modules.gms;
        _obj.gmsPopup = dbkjs.util.createModalPopup({
            title: 'Melding'
        });
        _obj.gmsPopup.getView().append($('<h4 id="gmsUpdate" style="padding-bottom: 15px">Gegegevens ophalen...</h4><div id="gms"></div>'));
    },
    loadGms: function() {
        var me = this;
        me.error = false;
        me.updateGmsTitle();
        $.ajax("../eal/Gms.json", {
            dataType: "json",
            cache: false,
            ifModified: true,
            complete: function(jqXHR, textStatus) {
                if(textStatus === "success") {
                    var oldSequence = me.gms ? me.gms.Sequence : null;
                    me.gms = jqXHR.responseJSON.EAL2OGG;
                    if(me.gms.Sequence !== oldSequence) {
                        me.updated = moment();
                        me.viewed = false;
                    }
                    me.displayGms();
                } else if(textStatus !== "notmodified") {
                    me.error = "Fout bij het ophalen van de informatie: " + jqXHR.statusText;
                    me.gms = null;
                }
                me.updateGmsTitle();

                window.setTimeout(function() {
                    me.loadGms();
                }, 5000);
            }
        });
    },
    updateGmsTitle: function() {
        var text;
        var melding = this.gms && this.gms.Gms && this.gms.Gms.Nummer;
        var updated = this.updated ? this.updated.fromNow() : "";
        if(melding) {
            if(this.updated) {
                text = "Actieve melding (laatste update " + updated + ")";
            } else {
                text = "Actieve melding (updaten...)";
            }
        } else {
            if(this.error) {
                text = this.error;
            } else {
                if(this.updated) {
                    text = "Geen actieve melding (laatste update " + updated + ")";
                } else {
                    text = "Geen actieve melding (updaten...)";
                }
            }
        }
        if(melding) {
            $("#btn_opengms").html('<i class="icon-exclamation-sign"></i>');
            if(this.viewed) {
                $("#btn_opengms").removeClass("unread");
            } else {
                $("#btn_opengms").addClass("unread");
            }
            $("#gmsUpdate").addClass("melding");
        } else {
            $("#btn_opengms").html('<i class="icon-align-justify"></i>');
            $("#gmsUpdate").removeClass("melding");
            $("#btn_opengms").removeClass("unread");
        }
        $("#gmsUpdate").text(text);
    },
    displayGms: function() {
        if(this.gms === null || !this.gms.Gms) {
            $("#gms").replaceWith('<div id="gms"></div>');
            return;
        }
        var g = this.gms.Gms;
        var table_div = $('<div id="gms" class="table-responsive"></div>');
        var table = $('<table class="table table-hover"></table>');
        table_div.append(table);

        function row(val, caption) {
            if(!dbkjs.util.isJsonNull(val)) {
                table.append('<tr><td>' + caption + '</td><td>' + val + '</td></tr>');
            }
        }

        function e(s) {
            if(s) {
                return dbkjs.util.htmlEncode(s);
            }
            return null;
        }
        function en(s) {
            var s = e(s);
            return s === null ? "" : s;
        }

        row(e(g.Nummer), "Nummer");
        var m = moment(g.Tijd);
        row(m.format("DD MMMM YYYY HH:mm:ss") + " (" + m.fromNow() + ")", "Tijd");
        row(e(g.Prioriteit), "Prioriteit");
        row(e(g.Classificatie), "Classificatie");
        row(e(g.Karakterestiek), "Karakteristiek"); // sic
        var a = g.IncidentAdres;
        if(a && a.Adres) {
            var s = en(a.Adres.Straat) + " " + en(a.Adres.Huisnummer) + en(a.Adres.HuisnummerToevg) + ", " +
                    en(a.Adres.Postcode) + " " + en(a.Adres.Plaats);
            row(s, "Adres");
            row(e(a.Aanduiding), "Aanduiding");
            if(a.Positie) {
                c = e(a.Positie.X + ", " + a.Positie.Y);
                table.append('<tr><td>Coördinaten</a></td>' +
                        '<td><a href="#" onclick="dbkjs.modules.gms.zoom();">' + c + '</a></td></tr>');
            }
        }
        row(e(g.Kladblok), "Kladblok");

        $("#gms").replaceWith(table_div);
    },
    zoom: function() {
        if(this.gms && this.gms.Gms && this.gms.Gms.IncidentAdres && this.gms.Gms.IncidentAdres.Positie) {
            var x = Number(this.gms.Gms.IncidentAdres.Positie.X);
            var y = Number(this.gms.Gms.IncidentAdres.Positie.Y);
            dbkjs.map.setCenter(new OpenLayers.LonLat(x, y), dbkjs.options.zoom);
            dbkjs.modules.gms.gmsPopup.hide();
        }
    }
};
