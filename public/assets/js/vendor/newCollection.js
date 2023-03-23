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
        colJs.submitCollection();
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
                    <img src="${element.image}"/>
                    <span class="family">${element.family}</span>
                    <span class="name">${element.name}</span>
                    <span class="count">${element.count} items</span>
                    <span style="display: none;" class="taxon">${element._id.taxon}</span>
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
          let items = {
            family: $(this).find(".family").text(),
            name: $(this).find(".name").text(),
            image: $(this).find('img').prop('src'),
            taxon: $(this).find('.taxon').text()
          };
          //store item obj to local storage using key as name
          setLocalStorageItems(items);
          //disbale chips so no info errors can occur on display change
          $('.collection-chip-container .chip').each(function () {
            $(this).prop('disabled', true)
          });
          //Transition JS to collection details tab
          transitionText('Collection Details', '.page-title');

          $('.collection-chip-container').fadeOut(500, function() {
            var existingContent = $('.collection-details-wrap');
            //show different input tabs dependant on the kind of info found
            if (items.family != 'undefined') {
              $('#collectionFamily').val(items.family).prop('disabled', true);
              $('#collectionName').val(items.name).prop('disabled', true);
              $('label[for="collectionFamily"]').addClass('focus');
              $('label[for="collectionName"]').addClass('focus');
            }
            $('#taxonNumber').html(items.taxon);
            existingContent.css({display: 'flex'});
            existingContent.animate( 500, function() {
              $(this).fadeIn(500);
            });
          });
        });

        $('#goBack').on('click', function () {
          transitionText('Choose A Collection', '.page-title');
          $('.collection-details-wrap').fadeOut(500, function() {
            $('.collection-chip-container .chip').each(function () {
              $(this).prop('disabled', false)
            });
            $('.collection-chip-container').fadeIn(500)
          })

        })

        $("#collectionData input").focus(function() {
          $(this).siblings("label").addClass("focus");
        });
      
        $("#collectionData input").blur(function() {
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
      },
      submitCollection: async function () {
        $('#createNewCollection').on('click', async function() {

          $(this).prop('disabled', true).html(`<i class="fa fa-spinner fa-spin"></i>Loading`)

          let formIsComplete = checkAllFieldsFilled();

          if (!formIsComplete) {
            makeToast('Please complete all the fields', 'error');
            $(this).prop('disabled', false).html(`Create`)
            return;
          }

          let twitterUrl = $('#twitterAt').val();
          let twitterUrlValid = isValidTwitterUrl(twitterUrl);

          if (!twitterUrlValid) {
            makeToast('Invalid twitter URL','error');
            $(this).prop('disabled', false).html(`Create`)
            return;
          }

          //Get the information that will be used to make the collection from the form
          let collectionData = {
            family: $('#collectionFamily').val(),
            name: $('#collectionName').val(),
            displayName: $('#displayName').val(),
            twitter: $('#twitterAt').val(),
            description: $('#descriptionInput').val(),
            image: $('#logo-image')[0].files[0],
            taxon: $('#taxonNumber').html()
          };
          console.log(collectionData)

          let formData = await createFormData(collectionData);

          $.ajax({
            type: 'POST',
            url: '/08bf721e8493c66d402e1e4fad1525c0',
            data: formData,
            processData: false,
            contentType: false,
            enctype: "multipart/form-data",
            success: function () {
              makeToast('New collection was successful.', 'success')
              setTimeout(() => location.reload(), 3500);
              return;
            },
            error: function (result) {
              console.error(result.responseJSON.error)
              if (result.responseJSON.error == 'undefined') {
                makeToast('Something went wrong on our end. Please try again.', 'error');
              } else {
                makeToast(result.responseJSON.error, 'error')
              }
              $('#createNewCollection').prop('disabled', false).html(`Create`)
            }
          })
        })
      }
    }
    colJs.m();
})(jQuery, window);

function setLocalStorageItems(items) {
  for (var key in items) {
    localStorage.setItem(key, items[key]);
  }
};

async function createFormData (data) {
  let formData = new FormData();
  for (let key in data) {
    formData.append(key, data[key]);
  }
  return formData;
}

function checkAllFieldsFilled() {
  const inputs = document.querySelectorAll('.details-inner input');
  const textarea = document.querySelector('.description-input');
  let allFilled = true;

  inputs.forEach(input => {
    if (input.value.trim() === '') {
      allFilled = false;
      return;
    }
  });

  if (textarea.value.trim() === '') {
    allFilled = false;
  }

  return allFilled;
}

function isValidTwitterUrl(url) {
  const twitterRegex = /^https?:\/\/(?:www\.)?twitter\.com\/(?:#!\/)?(\w+)\/?$/;
  return twitterRegex.test(url);
}

async function transitionText (text, target) {
  var newText = text;
  var h2 = $(`${target}`);
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
      }, 20);
    } else {
      h2.text(h2.text().slice(0, -1));
      currentTextCounter++;
    }
  }, 10);
}

//Show toast message on top right of users screen
function makeToast (text, type) {
  data = {
    text: text,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true,
    style: {
      background: '#1C1C1C',
      color: '#000000',
      fontWeight: '700'
    }
  }
  if (type == 'success') {
    data.style.color = 'green'
  }
  if (type == 'error') {
    data.style.color = 'red';
  }
  Toastify(data).showToast();
}