
dbkjs.mapcontrols.createMapControls = function() {
    dbkjs.map.addControl(new OpenLayers.Control.TouchNavigation({
        dragPanOptions: {
            enableKinetic: false
        },
        autoActivate: true
    }));

    if(dbkjs.options.showZoomButtons) {

        var zoomContainer = $("<div id='zoom_buttons'/>").css({
            "position": "absolute",
            "left": "20px",
            "bottom": "80px",
            "z-index": "3000"
        });
        zoomContainer.appendTo("#mapc1map1");

        $("#zoom_in").css({"display": "block", "font-size": "24px"}).removeClass("navbar-btn").appendTo(zoomContainer).show();
        $("#zoom_out").css({"display": "block", "font-size": "24px"}).removeClass("navbar-btn").appendTo(zoomContainer).show();
	$("#zoom_in").on("click", function () {
		dbkjs.map.zoomIn();
	});
	$("#zoom_out").on("click", function () {
		dbkjs.map.zoomOut();
	});
    }
};

dbkjs.mapcontrols.registerMapEvents = function() {
};
