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

/* global OpenLayers, i18n, Proj4js, dbkjsLang, moment */

OpenLayers.ProxyHost = "proxy/?q=";
OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
Proj4js.defs["EPSG:28992"] = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.999908 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs <>";

moment.locale("nl");

var dbkjs = dbkjs || {};
window.dbkjs = dbkjs;
dbkjs.modules = dbkjs.modules || [];
dbkjs.overlays = dbkjs.overlays || [];
dbkjs.map = dbkjs.map || null;
dbkjs.dataPath = dbkjs.dataPath || null;
dbkjs.mediaPath = dbkjs.mediaPath || null;
dbkjs.basePath = dbkjs.basePath || null;

dbkjs.viewmode = 'default';

dbkjs.init = function () {

    dbkjs.setPaths();

    if(dbkjs.viewmode === "fullscreen" && "ontouchstart" in window) {
        // Later wordt TouchNavigation toegevoegd, verwijder standaard
        // navigation control (anders gekke zoom / pan effecten op touchscreen)
        dbkjs.options.map.options.controls = [];
    }

    if (!dbkjs.map) {
        dbkjs.map = new OpenLayers.Map(dbkjs.options.map.options);
    }
    dbkjs.options.organisation = {
        id: dbkjs.util.getQueryVariable(i18n.t('app.organisation'), 'demo')
    };
    dbkjs.options.adres = dbkjs.util.getQueryVariable(i18n.t('app.queryAddress'));
    dbkjs.options.omsnummer = dbkjs.util.getQueryVariable(i18n.t('app.queryNumber'));
    dbkjs.options.dbk = dbkjs.util.getQueryVariable(i18n.t('app.queryDBK'));
    dbkjs.challengeAuth();

    dbkjs.mapcontrols.createMapControls();

    dbkjs.mapcontrols.registerMapEvents(dbkjs.layers.createBaseLayers());

    dbkjs.showStatus = false;

};

/**
 * Function to update the visibility for baseLayers
 * @param {integer} nr
 */
dbkjs.toggleBaseLayer = function (nr) {
    var layerbuttons = $(".bl");
    var i;
    for (i = 0; i < layerbuttons.length; i++) {
        if (i !== nr) {
            $(layerbuttons[i]).removeClass("active", true);
            dbkjs.options.baselayers[i].setVisibility(false);
        } else {
            $(layerbuttons[nr]).addClass("active", true);
            dbkjs.options.baselayers[nr].setVisibility(true);
            dbkjs.map.setBaseLayer(dbkjs.options.baselayers[nr]);
        }
    }
};

dbkjs.setDbkCategoryVisibility = function (category, visible) {
    if (!dbkjs.options.visibleCategories) {
        dbkjs.options.visibleCategories = {};
    }
    dbkjs.options.visibleCategories[category] = visible;
    dbkjs.protocol.jsonDBK.layerBrandweervoorziening.redraw();
};

dbkjs.activateClick = function () {
    dbkjs.map.events.register('click', dbkjs.map, dbkjs.util.onClick);

    // TODO: OpenLayers.Handler.Click with pixelTolerance instead of this?
    if(!dbkjs.options.minTouchMoveEndDistance || dbkjs.options.minTouchMoveEndDistance === 0) {
        dbkjs.map.events.register('touchend', dbkjs.map, dbkjs.util.onClick);
    } else {
        var touchmove = null;

        dbkjs.map.events.register('touchend', dbkjs.map, function(e) {
            // Set on featureselected/featureunselected, as this also fires a
            // touchend, but a click event on feature (un)selected is swallowed
            if(dbkjs.ignoreNextTouchend) {
                dbkjs.ignoreNextTouchend = false;
                return;
            }
            var closeTouch = false;
            if(touchmove !== null && touchmove.xy && e.xy) {
                closeTouch = Math.abs(touchmove.xy.x - e.xy.x) < dbkjs.options.minTouchMoveEndDistance &&
                        Math.abs(touchmove.xy.y - e.xy.y) < dbkjs.options.minTouchMoveEndDistance;
            }
            if(touchmove === null || closeTouch) {
                dbkjs.util.onClick(e);
            }
            touchmove = null;
        });

        dbkjs.map.events.register('touchmove', dbkjs.map, function(e) {
            if(touchmove === null) {
                touchmove = e;
            }
        });
    }
};

dbkjs.challengeAuth = function () {
    var params = {srid: dbkjs.options.projection.srid};
    $.ajax({
        dataType: "json",
        url: dbkjs.dataPath + 'organisation.json',
        data: params,
        cache: false
    })
    .done(function (data) {
        if (data.organisation) {
            dbkjs.options.organisation = data.organisation;
            if (dbkjs.options.organisation.title) {
                document.title = dbkjs.options.organisation.title;
            }
            dbkjs.successAuth();
        } else {
            //drop back to default
            $.getJSON('data/organisation.sample.json', params).done(function (data) {
                if (data.organisation) {
                    dbkjs.options.organisation = data.organisation;
                    if (dbkjs.options.organisation.title) {
                        document.title = dbkjs.options.organisation.title;
                    }
                    dbkjs.successAuth();
                }
            });
        }
    }).fail(function () {
        $.getJSON('data/organisation.sample.json', params).done(function (data) {
            if (data.organisation) {
                dbkjs.options.organisation = data.organisation;
                if (dbkjs.options.organisation.title) {
                    document.title = dbkjs.options.organisation.title;
                }
                dbkjs.successAuth();
            }
        });
    });
};

dbkjs.successAuth = function () {
    dbkjs.hoverControl = new OpenLayers.Control.SelectFeature(
            [],
            {
                hover: true,
                highlightOnly: true,
                clickTolerance: 30,
                renderIntent: "temporary"
            }
    );
    dbkjs.hoverControl.handlers.feature.stopDown = false;
    dbkjs.hoverControl.handlers.feature.stopUp = false;
    dbkjs.map.addControl(dbkjs.hoverControl);
    dbkjs.selectControl = new OpenLayers.Control.SelectFeature(
            [],
            {
                clickout: true,
                clickTolerance: 30,
                toggle: true,
                multiple: false
            }
    );
    dbkjs.selectControl.handlers.feature.stopDown = false;
    dbkjs.selectControl.handlers.feature.stopUp = false;
    dbkjs.map.addControl(dbkjs.selectControl);
    dbkjs.protocol.jsonDBK.init();

    dbkjs.gui.setLogo();

    //register modules
    $.each(dbkjs.modules, function (name, module) {
        var enabled = false;
        $.each(dbkjs.options.organisation.modules, function(i, m) {
            if(m.name === name) {
                enabled = true;
                module.options = m.options;
                return false;
            }
        });
        enabled = enabled || dbkjs.options.additionalModules && $.inArray(name, dbkjs.options.additionalModules) > -1;

        if(enabled && module.register) {
            module.register({namespace: dbkjs.options.organisation.workspace, url: 'geoserver/', visible: true, viewmode: dbkjs.viewmode});
        }
    });

    dbkjs.loadOrganisationCapabilities();
    $(dbkjs).trigger('dbkjs_init_complete');
};

//@TODO: Deze goed controleren, er was een haakjes conflict na de resolve
dbkjs.loadOrganisationCapabilities = function () {
    if (dbkjs.options.organisation.wms) {
        dbkjs.loadingcapabilities = 0;
        $.each(dbkjs.options.organisation.wms, function (wms_k, wms_v) {
          var options;
          var params;
          var parent;
          var layertype;
          var metadata;
          var myLayer;
          var index = wms_v.index || 0;
          if (wms_v.getcapabilities === true) {
              dbkjs.loadingcapabilities = dbkjs.loadingcapabilities + 1;
              options = {
                  url: wms_v.url,
                  title: wms_v.name,
                  proxy: wms_v.proxy,
                  index: index,
                  parent: wms_v.parent
              };
              /**
               * Should extend options and params if they are
               * passed from the organisation JSON (issue #413)
               */
              options.options = wms_v.options || {};
              options.params = wms_v.params || {};
              if (!dbkjs.util.isJsonNull(wms_v.pl)) {
                  options.pl = wms_v.pl;
              }
              var myCapabilities = new dbkjs.Capabilities(options);
          } else if (!wms_v.baselayer) {
              params = wms_v.params || {};
              options = wms_v.options || {};
              parent = wms_v.parent || null;
              metadata = {};
              if (!dbkjs.util.isJsonNull(wms_v.abstract)) {
                  metadata.abstract = wms_v.abstract;
              }
              if (!dbkjs.util.isJsonNull(wms_v.pl)) {
                  metadata.pl = wms_v.pl;
              }
              if (!dbkjs.util.isJsonNull(wms_v.legend)) {
                  metadata.legend = wms_v.legend;
              }
              layertype = wms_v.layertype || null;
              myLayer = new dbkjs.Layer(
                  wms_v.name,
                  wms_v.url,
                  params,
                  options,
                  parent,
                  index,
                  metadata,
                  layertype,
                  wms_v.gid
              );
          } else {
              params = wms_v.params || {};
              options = wms_v.options || {};
              options = OpenLayers.Util.extend({isBaseLayer: true}, options);
              parent = wms_v.parent || null;
              metadata = {};
              if (!dbkjs.util.isJsonNull(wms_v.abstract)) {
                  metadata.abstract = wms_v.abstract;
              }
              if (!dbkjs.util.isJsonNull(wms_v.pl)) {
                  metadata.pl = wms_v.pl;
              }
              if (!dbkjs.util.isJsonNull(wms_v.legend)) {
                  metadata.legend = wms_v.legend;
              }
              layertype = wms_v.layertype || null;
              myLayer = new dbkjs.Layer(
                  wms_v.name,
                  wms_v.url,
                  params,
                  options,
                  parent,
                  index,
                  metadata,
                  layertype
              );
          }
        });
        if (dbkjs.loadingcapabilities === 0) {
            dbkjs.finishMap();
        }
    } else {
        if (dbkjs.loadingcapabilities === 0) {
            dbkjs.finishMap();
        }
    }
};

dbkjs.zoomToFixedMapResolutionForBounds = function(bounds) {
    dbkjs.map.zoomToExtent(bounds);

    var res = dbkjs.map.getResolution();
    var zoomIndex = 1;
    for(; zoomIndex < dbkjs.map.options.resolutions.length; zoomIndex++) {
        if(dbkjs.map.options.resolutions[zoomIndex] < res) {
            break;
        }
    }
    zoomIndex--;
    console.log("orig res: " + res + ", higher map resolution at index " + zoomIndex + ", res " + dbkjs.map.options.resolutions[zoomIndex]);
    dbkjs.map.setCenter(dbkjs.map.getCenter(), zoomIndex);
}

dbkjs.finishMap = function () {
    //find the div that contains the baseLayer.name
    var listItems = $("#baselayerpanel_ul li");
    var areaGeometry = dbkjs.options.mapExtent ? dbkjs.options.mapExtent : new OpenLayers.Format.GeoJSON().read(dbkjs.options.organisation.area.geometry, "Geometry");
    listItems.each(function (idx, li) {
        var test = $(li).children(':first').text();
        if (test === dbkjs.map.baseLayer.name) {
            $(li).addClass('active');
        }
    });
    if (dbkjs.layout) {
        dbkjs.layout.activate();
    }
    dbkjs.activateClick();

    dbkjs.selectControl.activate();
    var hrefzoom = dbkjs.util.getQueryVariable('zoom');
    var hreflat = dbkjs.util.getQueryVariable('lat');
    var hreflon = dbkjs.util.getQueryVariable('lon');
    if (hrefzoom && hreflat && hreflon) {
        dbkjs.argparser = new dbkjs.argParser();
        dbkjs.map.addControl(dbkjs.argparser);
    } else {
        if(dbkjs.options.initialZoomed) {
            return;
        }
        dbkjs.options.initialZoomed = true;
        if (dbkjs.options.organisation.area) {
            if (dbkjs.options.organisation.area.geometry.type === "Point") {
                dbkjs.map.setCenter(
                        new OpenLayers.LonLat(
                                dbkjs.options.organisation.area.geometry.coordinates[0],
                                dbkjs.options.organisation.area.geometry.coordinates[1]
                                ).transform(
                        new OpenLayers.Projection(dbkjs.options.projection.code),
                        dbkjs.map.getProjectionObject()
                        ),
                        dbkjs.options.organisation.area.zoom
                        );
            } else if (dbkjs.options.organisation.area.geometry.type === "Polygon") {
                if (dbkjs.viewmode === 'fullscreen') {
                    dbkjs.zoomToFixedMapResolutionForBounds(areaGeometry.getBounds())
                } else {
                    //get the projection for the Polygon
                    var crs = dbkjs.options.organisation.area.geometry.crs.properties.name || "EPSG:4326";
                    dbkjs.map.zoomToExtent(areaGeometry.getBounds().transform(crs, dbkjs.map.getProjectionObject()));
                }
            }
        } else {
            dbkjs.map.zoomToMaxExtent();
        }
    }
    dbkjs.permalink = new dbkjs.Permalink('permalink');
    dbkjs.map.addControl(dbkjs.permalink);
    if (dbkjs.viewmode !== 'fullscreen') {
        dbkjs.util.configureLayers();
    }
    //get dbk!
};

dbkjs.setPaths = function () {
    if (!dbkjs.basePath) {
        dbkjs.basePath = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;
        var pathname = window.location.pathname;
        // ensure basePath always ends with '/', remove 'index.html' if exists
        if (pathname.charAt(pathname.length - 1) !== '/') {
            pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);
        }
        // ensure single '/' between hostname and path
        dbkjs.basePath = dbkjs.basePath + (pathname.charAt(0) === "/" ? pathname : "/" + pathname);
    }

    if (!dbkjs.dataPath) {
        dbkjs.dataPath = 'api/';
    }

    if (!dbkjs.mediaPath) {
        dbkjs.mediaPath = dbkjs.basePath + 'media/';
    }

};

dbkjs.bind_dbkjs_init_complete = function() {

    $(dbkjs).bind('dbkjs_init_complete', function() {

         if(dbkjs.viewmode !== 'fullscreen') {
            $('#zoom_prev').click(function() {
                dbkjs.naviHis.previousTrigger();
            });
            $('#zoom_next').click(function () {
                dbkjs.naviHis.nextTrigger();
            });
        } else {
            FastClick.attach(document.body);
        }
        (function () {
            function calcMaxWidth() {
                // Calculate the max width for dbk title so other buttons are never pushed down when name is too long
                var childWidth = 0;
                $('.main-button-group .btn-group').each(function () {
                    childWidth += $(this).outerWidth();
                });
                var maxWidth = $('.main-button-group').outerWidth() - childWidth;
                $('.dbk-title').css('max-width', (maxWidth - 25) + 'px');
            }
            // Listen for orientation changes
            window.addEventListener("orientationchange", function () {
                calcMaxWidth();
            }, false);
            calcMaxWidth();
        }());
    });
};

dbkjs.documentReady = function () {
    // Make sure i18n is initialized
    i18n.init({
        lng: dbkjsLang, debug: false, postProcess: "doReplacements"
    }, function (err,t) {
        i18n.addPostProcessor("doReplacements", function (val, key, options) {
            if (dbkjs.options.i18nReplacements) {
                var lngReplacements = dbkjs.options.i18nReplacements[i18n.lng()];
                if (lngReplacements && lngReplacements[key]) {
                    return lngReplacements[key];
                }
            }
            return val;
        });
        OpenLayers.Lang[dbkjsLang] = OpenLayers.Util.applyDefaults(
            {'Scale = 1 : ${scaleDenom}': i18n.t("app.scale")}
        );
        OpenLayers.Lang.setCode(dbkjsLang);
        if (dbkjs.viewmode !== 'fullscreen') {
            $('body').append(dbkjs.util.createDialog('infopanel', '<i class="fa fa-info-circle"></i> ' + i18n.t("dialogs.info"), 'right:0;bottom:0;'));
            $('body').append(dbkjs.util.createDialog('vectorclickpanel', '<i class="fa fa-info-circle"></i> ' + i18n.t("dialogs.clickinfo"), 'left:0;bottom:0;margin-bottom:0px;position:fixed'));
        } else {
            dbkjs.initPanel();

            // We are removing / moving some existing DIVS from HTML to convert prev. popups to fullscreen modal popups
            $('#baselayerpanel').remove();
            $('#overlaypanel').attr('id', 'tmp_overlaypanel');
            var baseLayerPopup = dbkjs.util.createModalPopup({name: 'baselayerpanel'});
            baseLayerPopup.getView().append($('<div></div>').attr({'id': 'baselayerpanel_b'}));
            var overlaypanelPopup = dbkjs.util.createModalPopup({name: 'overlaypanel'});
            overlaypanelPopup.getView().append($('#tmp_overlaypanel .tabbable'));
            $('#tmp_overlaypanel').remove();

            $('#tb01, #tb02').on('click', function (e) {
                e.preventDefault();
                var panelId = $(this).attr('href').replace('#', '');
                if (panelId === 'baselayerpanel') {
                    $.each(dbkjs.options.baselayers, function (bl_index, bl) {
                        if (bl.getVisibility()) {
                            $('#bl' + bl_index).addClass('active');
                        }
                    });
                }
                dbkjs.util.getModalPopup(panelId).show();
            });

        }
        if (dbkjs.viewmode !== 'fullscreen') {
            $('body').append(dbkjs.util.createDialog('wmsclickpanel', '<i class="fa fa-info-circle"></i> ' + i18n.t("dialogs.clickinfo"), 'right:0;bottom:0;'));
            $('body').append(dbkjs.util.createDialog('vectorclickpanel', '<i class="fa fa-info-circle"></i> ' + i18n.t("dialogs.clickinfo"), 'left:0;bottom:0;'));
            $('body').append(dbkjs.util.createModal('printpanel', '<i class="fa fa-print"></i> ' + i18n.t("app.print"), ''));
            dbkjs.wms_panel = dbkjs.util.createTabbable();
            $('#wmsclickpanel_b').append(dbkjs.wms_panel);
            $('body').append(dbkjs.util.createDialog('minimappanel', '<i class="fa fa-picture-o"></i> ' + i18n.t("dialogs.refmap"), 'bottom:0;'));
            $('.dialog').drags({handle: '.panel-heading'});
            $('.btn-group').drags({handle: '.drag-handle'});
            dbkjs.util.setModalTitle('overlaypanel', i18n.t('map.overlays'));
            dbkjs.util.setModalTitle('baselayerpanel', i18n.t('map.baselayers'));
        } else {
            $('body').append(dbkjs.util.createDialog('vectorclickpanel', '<i class="icon-info-sign"></i> ' + i18n.t("dialogs.clickinfo"), 'left:0;bottom:0;margin-bottom:0px;position:fixed'));
            $("#vectorclickpanel").on('click', function() {
                dbkjs.selectControl.unselectAll();
                $('#vectorclickpanel').hide();
            });
        }
        dbkjs.init();

        // dbkjs.options.enableSplitScreen: enable split screen setting
        // dbkjs.options.splitScreenChecked: split screen is enabled
        if(dbkjs.options.enableSplitScreen) {
            $(".main-button-group").css({paddingRight: "10px", width: "auto", float: "right", right: "0%"});

            var addSplitscreenOption = function() {
                // Add config option to enable / disable split screen


                $($("#settingspanel_b div.row")[0]).append('<div class="col-xs-12"><label><input type="checkbox" id="checkbox_splitScreen" ' + (dbkjs.options.splitScreenChecked ? 'checked' : '') + '>Toon informatie naast de kaart</label></div>');

                $("#checkbox_splitScreen").on('change', function (e) {
                    dbkjs.options.splitScreenChecked = e.target.checked;
                    $(dbkjs).triggerHandler('setting_changed_splitscreen', dbkjs.options.splitScreenChecked);
                });

                // Hide all modal popups when settings is opened
                $("#c_settings").on('click', function(e) {
                    $(dbkjs).triggerHandler('modal_popup_show', {popupName: 'settings'});
                });
            };

            // XXX timing dependent for #settingspanel_b div.row appears, not
            // only dbkjs_init_compelete...
            var check = function() {
                if($("#settingspanel_b div.row").length === 0) {
                    window.setTimeout(check, 500);
                } else {
                    addSplitscreenOption();
                }
            };
            $(dbkjs).bind('dbkjs_init_complete', check);
        }

        $('#infopanel_b').html(dbkjs.options.info);
        $('#tb03').click(function () {
            if (dbkjs.viewmode !== 'fullscreen') {
                $('#infopanel').toggle();
            } else {
                dbkjs.dbkInfoPanel.show();
                dbkjs.showTab("algemeen");
            }
        });
        $("#c_minimap").click(function() {
            $('#minimappanel').toggle();
        });
        // Added touchstart event to trigger click on. There was some weird behaviour combined with FastClick,
        // this seems to fix the issue
        $('#zoom_extent').on('click touchstart', function () {
          var areaGeometry = new OpenLayers.Format.GeoJSON().read(dbkjs.options.organisation.area.geometry, "Geometry");
            if (dbkjs.options.organisation.modules.regio) {
                dbkjs.modules.regio.zoomExtent();
            } else {
                if (dbkjs.options.organisation.area.geometry.type === "Point") {
                    dbkjs.map.setCenter(
                            new OpenLayers.LonLat(
                                    dbkjs.options.organisation.area.geometry.coordinates[0],
                                    dbkjs.options.organisation.area.geometry.coordinates[1]
                                    ).transform(
                            new OpenLayers.Projection(dbkjs.options.projection.code),
                            dbkjs.map.getProjectionObject()
                            ),
                            dbkjs.options.organisation.area.zoom
                            );
                } else if (dbkjs.options.organisation.area.geometry.type === "Polygon") {
                    if (dbkjs.viewmode === 'fullscreen') {
                        dbkjs.zoomToFixedMapResolutionForBounds(areaGeometry.getBounds());
                    } else {
                        var crs = dbkjs.options.organisation.area.geometry.crs.properties.name || "EPSG:4326";
                        dbkjs.map.zoomToExtent(areaGeometry.getBounds().transform(crs, dbkjs.map.getProjectionObject()));
                    }
                }
            }
        });
        dbkjs.bind_dbkjs_init_complete();
    });
};

dbkjs.updatePanelContentHeight = function() {
    var view = dbkjs.dbkInfoPanel.getView();
    var tabContentHeight = view.height() - view.find(".nav-pills").height();
    view.find(".tab-content").css("height", tabContentHeight);

    view.find(".pdf-embed").css("height", tabContentHeight - 28);
};

dbkjs.initPanel = function() {
    // Create the infopanel
    dbkjs.util.createModalPopup({name: 'infopanel'}).getView().append($('<div></div>').attr({'id': 'infopanel_b'}));

    // Create the DBK infopanel
    dbkjs.dbkInfoPanel = new SplitScreenWindow("dbkinfopanel");
    dbkjs.dbkInfoPanel.createElements();

    // Put tabs at the bottom after width transition has ended
    $(window).resize(dbkjs.updatePanelContentHeight);

    $(dbkjs.dbkInfoPanel).on("show", function() {
        var event = dbkjs.util.getTransitionEvent();
        if(event) {
            dbkjs.dbkInfoPanel.getView().parent().on(event, dbkjs.updatePanelContentHeight);
        } else {
            dbkjs.updatePanelContentHeight();
        }

        $.each(dbkjs.dbkInfoPanel.getView().find(".pdf-embed"), function(i, pdf) {
            if(pdf.children.length === 0) {
                console.log("embedding PDF " + $(pdf).attr("data-url"));
                // Add cache buster to avoid unexpected server response (206) on iOS 10 safari webapp
                PDFObject.embed($(pdf).attr("data-url") + "?t=" + new Date().getTime(), pdf, {
                    // Use custom built pdf.js with src/core/network.js function
                    // PDFNetworkStreamFullRequestReader_validateRangeRequestCapabilities
                    // always returning false to also avoid 206 error
                    PDFJS_URL: "js/libs/pdfjs-1.6.210-disablerange-minified/web/viewer.html",
                    forcePDFJS: !!dbkjs.options.forcePDFJS
                });                      
                // Remove buttons from PDFJS toolbar
                // XXX hack, use PDFJS documentloaded event?
                function removeToolbar() {
                    var iframe = $("iframe").contents();
                    if(iframe.find("#download")[0] || iframe.find("#secondaryDownload")[0] ) {
                        console.log("found PDFJS toolbar buttons, removing");
                        iframe.find("#download").remove();
                        iframe.find("#openFile").remove();
                        iframe.find("#print").remove();
                        iframe.find("#secondaryDownload").remove();
                        iframe.find("#secondaryOpenFile").remove();
                        iframe.find("#secondaryPrint").remove();
                    } else {
                        console.log("PDFJS toolbar not found, waiting")
                        window.setTimeout(removeToolbar, 500);
                    }
                }
                //this check is needed. If the program is not using PDFJS then we can't remove buttons.
                if(PDFObject.supportsPDFs || dbkjs.options.forcePDFJS ){
                    removeToolbar();
                }
            }
        });
    });

    dbkjs.dbkInfoPanel.getView().append(
            $('<div></div>')
            .attr({'id': 'dbkinfopanel_b'})
            .text(i18n.t("dialogs.noinfo"))
    );
  

    var div = $('<div class="tabbable"></div>');
    dbkjs.panel_group = $('<div class="tab-content"></div>');
    dbkjs.panel_tabs = $('<ul class="nav nav-pills nav-pills-bottom"></ul>');
    div.append(dbkjs.panel_group);
    div.append(dbkjs.panel_tabs);
    
    dbkjs.addTab("incident", "Incident", $('<i> '+ i18n.t("dialogs.noinfo") + '</i>' ));
    dbkjs.noObjectInfoTabs();
    dbkjs.addTab("waterwinning", "Waterwinning", $('<i> '+ i18n.t("dialogs.noinfo") + '</i>' ), "last");

    dbkjs.showTab("incident");    

    $('#dbkinfopanel_b').html(div);
    
};

dbkjs.noObjectInfoTabs = function() {
    dbkjs.removeTabs("info");

    dbkjs.showTab("incident");
};

dbkjs.addTab = function(id, title, div, clazz) {
    $("#tab_" + id).remove();
    $("#tab_li_" + id).remove();
    var tab = $('<div class="tab-pane ' + (clazz || '') + '" id="tab_' + id + '"></div>');
    tab.append(div);
    dbkjs.panel_group.append(tab);
    var li = '<li class="' + (clazz || '') + '" id="tab_li_' + id + '"><a data-toggle="tab" href="#tab_' + id + '">' + title + '</a></li>';
    var last = $(dbkjs.panel_tabs).find(".last");
    if(last.length > 0) {
        $(li).insertBefore(last);
    } else {
        dbkjs.panel_tabs.append(li);
    }
};

dbkjs.showTab = function(id) {
    var tab = $(dbkjs.panel_group).find("#tab_" + id);
    if(tab.length === 0) {
        return;
    }

    $(dbkjs.panel_group).find(".tab-pane.active").removeClass("active");
    $(dbkjs.panel_tabs).find("li.active").removeClass("active");
    tab.addClass("active");
    $(dbkjs.panel_tabs).find("#tab_li_" + id).addClass("active");
    dbkjs.updatePanelContentHeight();
};

dbkjs.removeTabs = function(clazz) {
    $(dbkjs.panel_group).find(".tab-pane." + clazz).remove();
    $(dbkjs.panel_tabs).find("li." + clazz).remove();
};