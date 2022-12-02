(function ($) {
  "use strict";

  var imJs = {
    m: function (e) {
      imJs.d();
      imJs.methods();
    },
    d: function (e) {
      (this._window = $(window)),
        (this._document = $(document)),
        (this._body = $("body")),
        (this._html = $("html"));
    },
    methods: function (e) {
      imJs.featherAtcivation();
      imJs.backToTopInit();
      imJs.stickyHeader();
      imJs.smothScroll();
      imJs.stickyAdjust();
      imJs.slickActivation();
      imJs.contactForm();
      imJs.wowActive();
      imJs.selectJs();
      imJs.popupMobileMenu();
      imJs.masonryActivation();
      imJs.cursorAnimate();
      imJs.rncounterUp();
      imJs.salActive();
      imJs.searchClick();
      imJs.filterClickButton();
      imJs.preloaderInit();
      imJs.unloadImage2();
      imJs.unloadImage();
      imJs.unloadImage3();
    },

    featherAtcivation: function () {
      feather.replace();
    },

    backToTopInit: function () {
      // declare variable
      var scrollTop = $(".backto-top");
      $(window).scroll(function () {
        // declare variable
        var topPos = $(this).scrollTop();
        // if user scrolls down - show scroll to top button
        if (topPos > 100) {
          $(scrollTop).css("opacity", "1");
        } else {
          $(scrollTop).css("opacity", "0");
        }
      });

      //Click event to scroll to top
      $(scrollTop).on("click", function () {
        $("html, body").animate(
          {
            scrollTop: 0,
            easingType: "linear",
          },
          500
        );
        return false;
      });
    },

    stickyHeader: function (e) {
      $(window).scroll(function () {
        if ($(this).scrollTop() > 250) {
          $(".header--sticky").addClass("sticky");
        } else {
          $(".header--sticky").removeClass("sticky");
        }
      });
    },

    smothScroll: function () {
      $(document).on("click", ".smoth-animation", function (event) {
        event.preventDefault();
        $("html, body").animate(
          {
            scrollTop: $($.attr(this, "href")).offset().top - 50,
          },
          300
        );
      });
    },

    stickyAdjust: function (e) {
      // Sticky Top Adjust..,
      $(".rbt-sticky-top-adjust").css({
        top: 100,
      });

      $(".rbt-sticky-top-adjust-two").css({
        top: 200,
      });
      $(".rbt-sticky-top-adjust-three").css({
        top: 25,
      });
      $(".rbt-sticky-top-adjust-four").css({
        top: 90,
      });
      $(".rbt-sticky-top-adjust-five").css({
        top: 100,
      });
    },

    slickActivation: function () {
      $(".slick-activation-01").slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        dots: false,
        arrows: true,
        cssEase: "linear",
        adaptiveHeight: true,
        prevArrow:
          '<button class="slide-arrow prev-arrow"><i class="feather-arrow-left"></i></button>',
        nextArrow:
          '<button class="slide-arrow next-arrow"><i class="feather-arrow-right"></i></button>',
        responsive: [
          {
            breakpoint: 1124,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 868,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 576,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              dots: true,
              arrows: false,
            },
          },
        ],
      });

      $(".slick-activation-02").slick({
        infinite: true,
        slidesToShow: 4,
        slidesToScroll: 1,
        dots: false,
        arrows: true,
        cssEase: "linear",
        adaptiveHeight: true,
        prevArrow:
          '<button class="slide-arrow prev-arrow"><i class="feather-arrow-left"></i></button>',
        nextArrow:
          '<button class="slide-arrow next-arrow"><i class="feather-arrow-right"></i></button>',
        responsive: [
          {
            breakpoint: 1124,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 868,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 576,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              dots: true,
              arrows: false,
            },
          },
        ],
      });

      $(".slick-activation-03").slick({
        infinite: true,
        slidesToShow: 5,
        slidesToScroll: 2,
        dots: false,
        arrows: true,
        cssEase: "linear",
        adaptiveHeight: true,
        prevArrow:
          '<button class="slide-arrow prev-arrow"><i class="feather-arrow-left"></i></button>',
        nextArrow:
          '<button class="slide-arrow next-arrow"><i class="feather-arrow-right"></i></button>',
        responsive: [
          {
            breakpoint: 1399,
            settings: {
              slidesToShow: 4,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 992,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 576,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              dots: true,
              arrows: false,
            },
          },
        ],
      });

      $(".slick-activation-04").slick({
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: true,
        arrows: false,
        cssEase: "linear",
        adaptiveHeight: true,
      });

      $(".slick-activation-05").slick({
        infinite: true,
        slidesToShow: 5,
        slidesToScroll: 2,
        dots: true,
        arrows: true,
        cssEase: "linear",
        adaptiveHeight: true,
        prevArrow:
          '<button class="slide-arrow prev-arrow"><i class="feather-arrow-left"></i></button>',
        nextArrow:
          '<button class="slide-arrow next-arrow"><i class="feather-arrow-right"></i></button>',
        responsive: [
          {
            breakpoint: 1399,
            settings: {
              slidesToShow: 4,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 992,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 576,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              dots: true,
              arrows: false,
            },
          },
        ],
      });

      $(".slick-activation-06").slick({
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: false,
        arrows: true,
        cssEase: "linear",
        adaptiveHeight: true,
        prevArrow:
          '<button class="slide-arrow prev-arrow"><i class="feather-arrow-left"></i></button>',
        nextArrow:
          '<button class="slide-arrow next-arrow"><i class="feather-arrow-right"></i></button>',
        responsive: [
          {
            breakpoint: 1399,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
        ],
      });

      $(".slick-activation-07").slick({
        infinite: true,
        slidesToShow: 5,
        slidesToScroll: 2,
        dots: true,
        arrows: false,
        cssEase: "linear",
        adaptiveHeight: true,
        responsive: [
          {
            breakpoint: 1399,
            settings: {
              slidesToShow: 4,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 992,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 576,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              dots: true,
              arrows: false,
            },
          },
        ],
      });

      $(".slick-activation-08").slick({
        infinite: true,
        slidesToShow: 4,
        slidesToScroll: 2,
        dots: true,
        arrows: true,
        cssEase: "linear",
        adaptiveHeight: true,
        prevArrow:
          '<button class="slide-arrow prev-arrow"><i class="feather-arrow-left"></i></button>',
        nextArrow:
          '<button class="slide-arrow next-arrow"><i class="feather-arrow-right"></i></button>',
        responsive: [
          {
            breakpoint: 1399,
            settings: {
              slidesToShow: 4,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 993,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 576,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              dots: true,
              arrows: false,
            },
          },
        ],
      });

      $(".slick-activation-09").slick({
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: false,
        arrows: false,
        cssEase: "linear",
        adaptiveHeight: true,
      });

      $(".slider-activation-banner-3").slick({
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: false,
        arrows: true,
        cssEase: "linear",
        adaptiveHeight: true,
        // autoplay: true,
        autoplaySpeed: 2000,
        responsive: [
          {
            breakpoint: 1599,
            settings: {
              dots: true,
              arrows: false,
            },
          },
        ],
      });
      $(".slider-activation-banner-4").slick({
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: true,
        arrows: false,
        cssEase: "linear",
        adaptiveHeight: true,
        // autoplay: true,
        autoplaySpeed: 2000,
      });

      $(".top-seller-slick-activation").slick({
        infinite: true,
        slidesToShow: 4,
        slidesToScroll: 2,
        dots: false,
        arrows: false,
        cssEase: "linear",
        adaptiveHeight: true,
        autoplay: false,
        autoplaySpeed: 2000,
        prevArrow:
          '<button class="slide-arrow prev-arrow"><i class="feather-arrow-left"></i></button>',
        nextArrow:
          '<button class="slide-arrow next-arrow"><i class="feather-arrow-right"></i></button>',
        responsive: [
          {
            breakpoint: 1399,
            settings: {
              slidesToShow: 4,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 993,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 576,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              dots: true,
              arrows: false,
            },
          },
        ],
      });
    },

    contactForm: function () {
      $(".rwt-dynamic-form").on("submit", function (e) {
        e.preventDefault();
        var _self = $(this);
        var __selector = _self.closest("input,textarea");
        _self.closest("div").find("input,textarea").removeAttr("style");
        _self.find(".error-msg").remove();
        _self
          .closest("div")
          .find('button[type="submit"]')
          .attr("disabled", "disabled");
        var data = $(this).serialize();
        $.ajax({
          url: "mail.php",
          type: "post",
          dataType: "json",
          data: data,
          success: function (data) {
            _self
              .closest("div")
              .find('button[type="submit"]')
              .removeAttr("disabled");
            if (data.code == false) {
              _self.closest("div").find('[name="' + data.field + '"]');
              _self
                .find(".rn-btn")
                .after('<div class="error-msg"><p>*' + data.err + "</p></div>");
            } else {
              $(".error-msg").hide();
              $(".form-group").removeClass("focused");
              _self
                .find(".rn-btn")
                .after(
                  '<div class="success-msg"><p>' + data.success + "</p></div>"
                );
              _self.closest("div").find("input,textarea").val("");

              setTimeout(function () {
                $(".success-msg").fadeOut("slow");
              }, 5000);
            }
          },
        });
      });
    },

    wowActive: function () {
      new WOW().init();
    },

    selectJs: function (e) {
      $(document).ready(function () {
        $("select").niceSelect();
      });
    },

    popupMobileMenu: function (e) {
      $(".hamberger-button").on("click", function (e) {
        $(".popup-mobile-menu").addClass("active");
      });

      $(".close-menu").on("click", function (e) {
        $(".popup-mobile-menu").removeClass("active");
        $(
          ".popup-mobile-menu .mainmenu .has-droupdown > a, .popup-mobile-menu .mainmenu .with-megamenu > a"
        )
          .siblings(".submenu, .rn-megamenu")
          .removeClass("active")
          .slideUp("400");
        $(
          ".popup-mobile-menu .mainmenu .has-droupdown > a, .popup-mobile-menu .mainmenu .with-megamenu > a"
        ).removeClass("open");
      });

      $(
        ".popup-mobile-menu .mainmenu .has-droupdown > a, .popup-mobile-menu .mainmenu .with-megamenu > a"
      ).on("click", function (e) {
        e.preventDefault();
        $(this)
          .siblings(".submenu, .rn-megamenu")
          .toggleClass("active")
          .slideToggle("400");
        $(this).toggleClass("open");
      });

      $(".popup-mobile-menu").on("click", function (e) {
        e.target === this &&
          $(".popup-mobile-menu").removeClass("active") &&
          $(
            ".popup-mobile-menu .mainmenu .has-droupdown > a, .popup-mobile-menu .mainmenu .with-megamenu > a"
          )
            .siblings(".submenu, .rn-megamenu")
            .removeClass("active")
            .slideUp("400") &&
          $(
            ".popup-mobile-menu .mainmenu .has-droupdown > a, .popup-mobile-menu .mainmenu .with-megamenu > a"
          ).removeClass("open");
      });

      $(".one-page-vavigation-popup .mainmenu li > a").on(
        "click",
        function (e) {
          e.preventDefault();
          $(".popup-mobile-menu").removeClass("active");
          $(".popup-mobile-menu .mainmenu li > a")
            .siblings(".submenu")
            .removeClass("active");
        }
      );
    },

    masonryActivation: function name(params) {
      $(window).load(function () {
        $(".masonary-wrapper-activation").imagesLoaded(function () {
          // filter items on button click
          $(".isotop-filter").on("click", "button", function () {
            var filterValue = $(this).attr("data-filter");
            $(this).siblings(".is-checked").removeClass("is-checked");
            $(this).addClass("is-checked");
            $grid.isotope({
              filter: filterValue,
            });
          });

          // init Isotope
          var $grid = $(".mesonry-list").isotope({
            percentPosition: true,
            transitionDuration: "0.7s",
            layoutMode: "masonry",
            masonry: {
              columnWidth: ".resizer",
            },
          });
        });
      });
    },

    cursorAnimate: function () {
      var myCursor = jQuery(".mouse-cursor");
      if (myCursor.length) {
        if ($("body")) {
          const e = document.querySelector(".cursor-inner"),
            t = document.querySelector(".cursor-outer");
          let n,
            i = 0,
            o = !1;
          (window.onmousemove = function (s) {
            o ||
              (t.style.transform =
                "translate(" + s.clientX + "px, " + s.clientY + "px)"),
              (e.style.transform =
                "translate(" + s.clientX + "px, " + s.clientY + "px)"),
              (n = s.clientY),
              (i = s.clientX);
          }),
            $("body").on("mouseenter", "a, .cursor-pointer", function () {
              e.classList.add("cursor-hover"), t.classList.add("cursor-hover");
            }),
            $("body").on("mouseleave", "a, .cursor-pointer", function () {
              ($(this).is("a") && $(this).closest(".cursor-pointer").length) ||
                (e.classList.remove("cursor-hover"),
                t.classList.remove("cursor-hover"));
            }),
            (e.style.visibility = "visible"),
            (t.style.visibility = "visible");
        }
      }
    },

    rncounterUp: function () {
      $(".counter-odomitter-active").counterUp({
        delay: 10,
        time: 2000,
      });
    },

    salActive: function () {
      sal({
        threshold: 0.1,
        once: true,
      });
    },

    searchClick: function (e) {
      var screenWidth = imJs._window.width();
      if (screenWidth < 992) {
        $(".search-mobile-icon").on("click", function (e) {
          e.preventDefault();
          $(this)
            .toggleClass("open")
            .siblings(".large-mobile-blog-search")
            .toggleClass("active");
        });
      }
    },

    filterClickButton: function () {
      $(".discover-filter-activation").on("click", function () {
        $(this).toggleClass("open");
        $(".default-exp-expand").slideToggle("400");
      });

      $("#slider-range").slider({
        range: true,
        min: 1,
        max: 10000,
        values: [100, 500],
        slide: function (event, ui) {
          $("#amount").val(
            ui.values[0] + " XRP" + " - " + ui.values[1] + " XRP"
          );
        },
      });
      $("#amount").val(
        $("#slider-range").slider("values", 0) +
          " XRP - " +
          $("#slider-range").slider("values", 1) +
          " XRP"
      );
    },

    preloaderInit: function () {
      imJs._window.on("load", function () {
        $(".preloader").fadeOut("slow", function () {
          $(this).remove();
        });
      });
    },

    unloadImage: function name() {
      $("#rbtinput1").click(function (e) {
        $("#fatima").click();
      });

      function rbtPreview() {
        const [file] = fatima.files;
        if (file) {
          rbtinput1.src = URL.createObjectURL(file);
        }
      }
      $("#fatima").change(function () {
        rbtPreview(this);
      });
    },

    unloadImage2: function name() {
      $("#rbtinput2").click(function (e) {
        $("#nipa").click();
      });

      function rbtPreview() {
        const [file2] = nipa.files;
        if (file2) {
          rbtinput2.src = URL.createObjectURL(file2);
        }
      }
      $("#nipa").change(function () {
        rbtPreview(this);
      });
    },

    unloadImage3: function name() {
      $("#createfileImage").click(function (e) {
        $("#createinputfile").click();
      });
      function rbtPreview() {
        const [file2] = createinputfile.files;
        if (file2) {
          createfileImage.src = URL.createObjectURL(file2);
        }
      }
      $("#createinputfile").change(function () {
        rbtPreview(this);
      });
    },
  };

  imJs.m();

  var styleMode = document.querySelector(
    'meta[name="theme-style-mode"]'
  ).content;
  var cookieKey =
    styleMode == 1
      ? "client_dark_mode_style_cookie"
      : "client_light_mode_style_cookie";
  if (Cookies.get(cookieKey) == "dark") {
    $("body").removeClass("active-light-mode");
    $("body").addClass("active-dark-mode");
  } else if (Cookies.get(cookieKey) == "light") {
    $("body").removeClass("active-dark-mode");
    $("body").addClass("active-light-mode");
  } else {
    if (styleMode == 1) {
      $("body").addClass("active-dark-mode");
    } else {
      $("body").addClass("active-light-mode");
    }
  }
})(jQuery, window);
$.ajaxSetup({
  beforeSend: function (xhr) {
    xhr.setRequestHeader(
      "CSRF-Token",
      document.querySelector('meta[name="csrf-token"]').getAttribute("content")
    );
  },
});
function xummSignin() {
  $.ajax({
    type: "POST",
    url: "/sign-in-payload",
    data: { return_url: window.location.href },
    success: function (result) {
      $("#qrModal").modal("toggle");
      $("#qrCodeImage").attr("src", result.refs.qr_png);
      $("#xummLink").attr("href", result.next.always);

      $.ajax({
        type: "POST",
        url: "/sign-in-subscription",
        data: result,
        success: function (resulty) {
          $("#qrModal").modal("toggle");
          $("#rbt-site-header").html(
            '<a href="/logout" id="logout" class="btn btn-primary-alta btn-small">Log out</a>'
          );
          window.location.href = "/profile";
        },
        error: function (resulty) {
          console.warn("Sign in expired, failed or was cancelled.");
          $("#qrModal").modal("toggle");
        },
      });
    },
  });
}
function setBuyOfferBid(NFToken) {
  console.log(document.getElementById("value").value);
  const value = document.getElementById("value").value;
  const acctBal = $('#walletBalance').text()
  if (acctBal >= value) {
    $.ajax({
      type: "POST",
      url: "/nftoken-create-offer",
      data: {
        NFToken: NFToken,
        value: value,
        return_url: window.location.href,
        flags: 0,
      },
      success: function (result) {
        $("#placebidModal").modal("toggle");
        $("#qrModal").modal("toggle");
        $("#qrCodeImage").attr("src", result.refs.qr_png);
        $("#xummLink").attr("href", result.next.always);
        $.ajax({
          type: "POST",
          url: "/XUMM-sign-subscription",
          data: result,
          success: function (resulty) {
            console.log(resulty);
            $("#qrModal").modal("toggle");
          },
          error: function (resulty) {
            console.warn("Sign in expired, failed or was cancelled.");
            $("#qrModal").modal("toggle");
          },
        });
      },
      error: function (result) {
  
        //$("#placebidModal").modal("hide");
        alert(result.responseText);
      }
    });
  } else {
    alert('Insufficient funds')
  }
}
function setSellOfferBid(NFToken) {
  const value = document.getElementById("value").value;
  const destination = document.getElementById("destination").value;
  const expiry = document.getElementById("expiry-time").value;
  if (expiry != 0) {
    var expiryEpoch = new Date(expiry).getTime() / 1000 - 946684800;
  } else {
    var expiryEpoch = 0;
  }
  console.log(expiryEpoch);
  $.ajax({
    type: "POST",
    url: "/nftoken-create-offer",
    data: {
      NFToken: NFToken,
      value: value,
      destination: destination,
      expiry: expiryEpoch,
      return_url: window.location.href,
      flags: 1,
    },
    success: function (result) {
      window.location.href = result.next.always;
    },
  });
}
function NFTokenAcceptOffer(index, NFToken) {
  $.ajax({
    type: "POST",
    url: "/NFTokenAcceptOffer",
    data: {
      index: index,
      NFToken: NFToken,
      return_url: window.location.href,
      flags: 0,
    },
    success: function (result) {
      console.log(result);
      window.location.href = result.payload.next.always;

      $.ajax({
        type: "POST",
        url: "/NFTokenAcceptOfferSubscription",
        data: result,
        success: function (resulty) {
          console.log("Transacted");
        },
        error: function (resulty) {
          console.warn("Transaction expired, failed or was cancelled.");
        },
      });
    },
  });
}
function NFTokenAcceptSellOffer(index, NFToken) {
  $.ajax({
    type: "POST",
    url: "/NFTokenAcceptOffer",
    data: {
      index: index,
      NFToken: NFToken,
      return_url: window.location.href,
      flags: 1,
    },
    success: function (result) {
      console.log(result);
      window.location.href = result.payload.next.always;

      $.ajax({
        type: "POST",
        url: "/NFTokenAcceptOfferSubscription",
        data: result,
        success: function (resulty) {
          console.log("Transacted");
        },
        error: function (resulty) {
          console.warn("Transaction expired, failed or was cancelled.");
        },
      });
    },
  });
}
function NFTokenCancelOffer(index) {
  $.ajax({
    type: "POST",
    url: "/NFTokenCancelOffer",
    data: { index: index, return_url: window.location.href },
    success: function (result) {
      window.location.href = result.next.always;
    },
  });
}
var redeeming = false;
function getRedeem(redeemElement, loadingElement, data) {
  if (data == 'false') {
    alert('please select an option')
    return;
  }
  if (redeeming == false) {
    redeeming = true;
    $(redeemElement).addClass('loading');
    $(redeemElement).prop('disabled', true);
    project = JSON.parse(data).project;
    if (project) {
      $.ajax({
        type: "POST",
        url: "/redeem-nft-payload",
        data: { return_url: window.location.href, project: project },
        success: function (result) {   
          window.location.href = result[0].next.always;
          var information = JSON.stringify(result);
          $.ajax({
            type: "POST",
            url: "/redeem-nft-subscription",
            data: {
              payload: information,
            },
          });
          redeeming = false;
        },
        error: function (result) {
          redeeming = false
          customAlert.alert(result.responseText);
          setTimeout(location.reload(), 1000);
        },
      });
    }
    } 
}
function buyOrderClicked(redeemElement, loadingElement) {
  redeemElement.classList.add("hidden");
  loadingElement.classList.remove("hidden");
}
function buyOrderCanceled(redeemElement, loadingElement) {
  redeemElement.classList.remove("hidden");
  loadingElement.classList.add("hidden");
}
function likeHandler(nftId, DOM) {
  if (DOM.classList.contains("liked")) decrementLike(nftId, DOM);
  else incrementLike(nftId, DOM);
}
function incrementLike(nftId, DOM) {
  $.ajax({
    type: "POST",
    url: "/increment-like",
    data: { id: nftId },
    success: function () {
      const likes = DOM.children[1];
      likes.innerHTML = parseInt(likes.innerHTML) + 1;
      DOM.classList.toggle("liked");
    },
  });
}
function decrementLike(nftId, DOM) {
  $.ajax({
    type: "POST",
    url: "/decrement-like",
    data: { id: nftId },
    success: function () {
      const likes = DOM.children[1];
      likes.innerHTML = parseInt(likes.innerHTML) - 1;
      DOM.classList.toggle("liked");
    },
  });
}
function getListNft(elem) {
  const NFTokenID = $("#tokenID").val();
  const issuer = $("#issuer").val();
  $(elem).addClass('loading');
  $(elem).prop('disabled', true);
  $.ajax({
    type: "POST",
    url: "/list-nft-payload",
    data: {
      return_url: window.location.href,
      NFTokenID: NFTokenID,
      issuer: issuer,
    },
    success: function (result) {
      window.location.href = result.payload.next.always;
      $.ajax({
        type: "POST",
        url: "/list-nft-subscription",
        data: result,
        success: function () {
          location.reload()
        },
        error: function (resulty) {
          console.warn("Payment is expired, failed or was cancelled.");
        },
      });
    },
  });
}
function getListNftCollection() {
  const NFTokenID = $("#tokenID").val();
  const issuer = $("#issuer").val();
  const holder = $("#currentHolder").val();
  $.ajax({
    type: "POST",
    url: "/list-nft-payload-collection",
    data: {
      return_url: window.location.href,
      NFTokenID: NFTokenID,
      issuer: issuer,
      holder: holder,
    },
    success: function (result) {
      window.location.href = result.payload.next.always;
      $.ajax({
        type: "POST",
        url: "/list-nft-subscription-collection",
        data: result,

        error: function (resulty) {
          console.warn("Payment is expired, failed or was cancelled.");
        },
      });
    },
  });
}

// $("#startMint").click(function () {
//   var uri = document.getElementById("URI").value;
//   var taxon = document.getElementById("taxon").value;
//   var transferFee = document.getElementById("transferFee").value;
//   var memo = document.getElementById("memo").value;
//   var burnable = document.getElementById("burnable").value;
//   var onlyXRP = document.getElementById("onlyXRP").value;
//   var trustline = document.getElementById("trustline").value;
//   var transferable = document.getElementById("transferable").value;
//   // console.log(uri);
//   $.ajax({
//     type: "POST",
//     url: "/mint-NFToken",
//     data: {
//       return_url: window.location.href,
//       uri: uri,
//       taxon: taxon,
//       transferFee: transferFee,
//       memo: memo,
//       burnable: burnable,
//       onlyXRP: onlyXRP,
//       trustline: trustline,
//       transferable: transferable,
//     },
//     success: function (result) {
//       customAlert.alert("NFT minted successfully!");
//     },
//     error: function (result) {
//       customAlert.alert(
//         "Error, failed to mint NFT. Check your inputs and try again."
//       );
//     },
//   });
// });

//No underscores looks for nus class and removes
window.onload = function noUnderscores() {
  const elements = document.querySelectorAll(".nus");
  elements.forEach(
    (e) => (e.innerText = e.innerText.toUpperCase().replaceAll("_", " "))
  );
};

function submitEmail() {
  var mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  var submittedEmail = document.getElementById("emailSub").value;
  if (submittedEmail.match(mailFormat)) {
    const formData = new FormData();
    formData.append("email", document.getElementById("emailSub").value);
    $.ajax({
      type: "POST",
      url: "/subscribe-email",
      data: formData,
      processData: false,
      contentType: false,
      success: function (resulty) {
        customAlert.alert("Email Address Submitted");
      },
      error: function (resulty) {
        customAlert.alert("Error submitting email address, try again later.");
      },
    });
  } else {
    alert("You have entered an invalid email address!");
  }
}
function getCurrencyBalance() {
  var currentWindow;
  try {
    $("#walletBalance").load(
      `/get-token-balance?issuer=XRP&hex=XRP&token=XRP`
    );
  } catch (err) {
    console.error("Couldn't parse balance");
  }
}
//collection form submit button disabler
$(function () {
  $("#subCollection").attr("disabled", true);
  $("#collectionForm").change(function () {
    if (
      $('#displayName').val() != "" &&
      $('#family').val() != "" &&
      $("#name").val() != "" &&
      $("#brand").val() != "" &&
      $("#url").val() != "" &&
      $("#issuer").val() != ""
    ) {
      $("#subCollection").attr("disabled", false);
    } else {
      $("#subCollection").attr("disabled", true);
    }
  });
});
//Mint Form button Disabler
$(function () {
  $("#startMint").attr("onclick", "allFields()");
  $("#mintForm-01").change(function () {
    if (
      $("#name").val() != "" &&
      $("#description").val() != "" &&
      $("#collection-family") != "" &&
      $("#collection-name") != "" &&
      $("#createinputfile").val() != ""
    ) {
      $("#startMint").attr("onclick", "submitMintingInformation()");
    } else {
      $("#startMint").attr("onclick", "allFields()");
    }
  });
});
//Complete all fileds alert
function allFields() {
  alert("Please Complete Required Fields");
}
function populateListNft(data) {
  $("#tokenID").val(data.NFTokenID);
  $("#issuer").val(data.issuer);
  $("#taxon").val(data.taxon);
  $("#assetName").text(data.name);
  $("#currentHolder").val(data.currentHolder);
  $("#link").attr("href", `https://bithomp.com/explorer/${data.NFTokenID}`);
  var imageExt = new Set(["jpg", "jpeg", "png", "gif"]);
  var vidExt = new Set(["mp4", "mov", "avi", "webm", "mpg", "wmv"]);
  if (imageExt.has(data.image.substring(data.image.lastIndexOf(".") + 1))) {
    $("#listImage").html(
      `<img src="${data.image} " alt="Nft_Profile" draggable="false" loading="lazy">`
    );
  } else if (
    vidExt.has(data.image.substring(data.image.lastIndexOf(".") + 1))
  ) {
    $("#listImage").html(`<video controls>
        <source src="${data.image}" type="video/mp4">
        <source src="${data.image}" type="video/webm">
        <source src="${data.image}" type="video/ogg">
      </video>`);
  } else {
    $("#listImage").html(`<image src="${data.image}">`);
  }
  $("#exampleModalCenter").modal("toggle");
}
