(function ($) {
    "use strict";
  
    var colJs = {
      m: function (e) {
        colJs.d();
        colJs.methods();
      },
      d: function (e) {
        (this._window = $(window)),
          (this._document = $(document)),
          (this._body = $("body")),
          (this._html = $("html"));
      },
      methods: function () {

      },
      userIssuedCollections: function () {
        $.ajax({
            type: "GET",
            url: "/userIssuedCollections",
            success: function(result) {
              customAlert.alert('Success: '+result)
            },
            error: function(result) {
              customAlert.alert("Error: "+result)
            },
          });
      }
    }
    colJs.m();
})(jQuery, window);