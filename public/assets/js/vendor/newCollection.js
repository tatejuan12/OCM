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
        colJs.collectionDynamic();
        colJs.wordCount();
        colJs.userIssuedCollections();
      },
      userIssuedCollections: function () {
        $.ajax({
            type: "GET",
            url: "/userIssuedCollections",
            success: function(result) {
              if (!(Array.isArray(result))) {
                $('.collection-chip-container').empty();
                $('.collection-chip-container').html(result);
                return;
              } else {
                let html = ``
                result.forEach(element => {
                  html += `<div class="chip">
                    <span class="family">${element.family}</span>
                    <span class="name">${element.name}</span>
                  </div>`;
                });
                $('.collection-chip-container').empty();
                $('.collection-chip-container').html(html);
              }
            },
            error: function(result) {
              customAlert.alert("Error: "+result);
            },
          });
      },
      collectionDynamic: function () {
        $('.collection-chip-container').on('click', '.chip', function (e) {
          var family = $(this).find(".family").text();
          var name = $(this).find(".name").text();
          console.log("Family: " + family + " Name: " + name);
          $('.collection-chip-container .chip').each(function () {
            $(this).prop('disabled', true)
          });
          //Transition JS
          var newText = "Collection Details";
          var h2 = $('.page-title');
          var currentText = h2.text();
          var newTextArray = newText.split('');
          var currentTextArray = currentText.split('');
          var newTextCounter = 0;
          var currentTextCounter = 0;
          var backspaceInterval = setInterval(function() {
            if (currentTextCounter == currentTextArray.length) {
              clearInterval(backspaceInterval);
              var typeInterval = setInterval(function() {
                h2.text(h2.text() + newTextArray[newTextCounter]);
                newTextCounter++;
                if (newTextCounter == newTextArray.length) {
                  clearInterval(typeInterval);
                }
              }, 50);
            } else {
              h2.text(h2.text().slice(0, -1));
              currentTextCounter++;
            }
          }, 20);
          $('.collection-chip-container').fadeOut(500, function() {
            var existingContent = $('.collection-details-wrap');
            existingContent.css({display: 'flex'});
            existingContent.animate( 500, function() {
              $(this).fadeIn(500);
            });
          });
        });

        $("input").focus(function() {
          $(this).siblings("label").addClass("focus");
        });
      
        $("input").blur(function() {
          if ($(this).val() == "") {
            $(this).siblings("label").removeClass("focus");
          }
        });

        $('.details-inner .logo-preview').click(function() {
          $('input[type="file"]').trigger('click');
        });

        $("input[type='file']").on("change", function() {
          var input = this;
          var size = input.files[0].size;
          if (!input.files[0].type.match("image.*") || input.files[0].type.match("image/gif")) {
            alert("Please select an image file");
            $(this).val('');
            return;
          }
          if (size > 1000000) {
            alert("File size must be less than or equal to 1MB.");
            $(this).val('');
            return;
          }
          
          var reader = new FileReader();
          reader.onload = function(e) {
            $("#logo-preview").attr("src", e.target.result);
          };
          reader.readAsDataURL(input.files[0]);
        });
      },
      wordCount: function () {
        $('.description-input').on('input', function() {
          var characterCount = $(this).val().length;
          var remainingCount = 280 - characterCount;
          $('.character-count').text(remainingCount);
        });
      }
    }
    colJs.m();
})(jQuery, window);