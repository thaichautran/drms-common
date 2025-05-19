(function ($) {
    /*****No javascript*****/
    $("body").removeClass("no-js").addClass("is-js");
    //========================================
    //▼ Toggle Menu
    //========================================
    $(".sma_menu_open").on("click", function (e) {
        if ($(".wrap-col-lft").is(":visible")) {
            $(".sma_menu_open").addClass("active");
            $("body").addClass("spmenu_open");
            $(".wrap-col-lft").hide("slide", { direction: "left" }, 350);
        } else {
            $(".sma_menu_open").removeClass("active");
            $("body").removeClass("spmenu_open");
            $(".wrap-col-lft").show("slide", { direction: "left" }, 350);
        }
        //
        min_height_content();
        //
        e.preventDefault();
    });
    $(".close-btn").on("click", function (e) {
        $("body").addClass("fit-on");
        e.preventDefault();
    });
    //========================================
    //▼ Handle tab
    //========================================
    if ($("#tabs-map").length) {
        $("#tabs-map").on("click", "a", function (e) {
            $("#tabs-map li").removeClass("active");
            $(this).parent().addClass("active");
            $("body").removeClass("fit-on");
            if ($(this).parent().hasClass("active")) {
                var this_index = $(this).parent().index();
                $(".col-lft-navi-inner > .tab-content > .tab-pane").removeClass("show active");
                $(".col-lft-navi-inner > .tab-content > .tab-pane").eq(this_index).addClass("show active");
                // hgt_title = $('.col-lft-navi-inner > .tab-content > .tab-pane').eq(this_index).find('.top-heading-wrap').innerHeight();
            }
            if ($(".wrap-main-map").length) {
                min_height_content();
            }
            e.stopPropagation();
        });
    }
    //========================================
    //▼ equalHeight
    //========================================
    function equalHeight() {
        var hght_offset = $(window).height() - $("#header").height();
        var hght_column_r = $(".wrap-mainsite .main-inner .wrap-col-main .col-main .col-main-inner").innerHeight();
        $(".wrap-mainsite .main-inner .wrap-col-lft .col-lft-navi").css("min-height", +hght_column_r);
        $(".wrap-mainsite .main-inner .wrap-col-lft .col-lft-navi").css("height", +hght_column_r);
        if (hght_offset > hght_column_r) {
            $(".wrap-mainsite .main-inner .wrap-col-lft .col-lft-navi").css("min-height", +hght_offset);
            $(".wrap-mainsite .main-inner .wrap-col-lft .col-lft-navi").css("height", +hght_offset);
            $(".wrap-mainsite .main-inner .wrap-col-main .col-main .col-main-inner .report-main").css("min-height", +hght_offset);
            $(".wrap-mainsite .main-inner .wrap-col-main .col-main .col-main-inner .report-main").css("height", +hght_offset);
        }
    }
    $(window).on("load resize", function () {
        if ($(".wrap-mainsite").length) {
            equalHeight();
        }
    });
    //========================================
    //▼ Toggle Password
    //========================================
    $(".toggle-password").click(function () {
        var input_pass = $($(this).parent().find("#password"));
        if (input_pass.attr("type") == "password") {
            input_pass.attr("type", "text");
            $(this).parent().find(".far").removeClass("fa-eye").addClass("fa-eye-slash");
        } else {
            input_pass.attr("type", "password");
            $(this).parent().find(".far").addClass("fa-eye").removeClass("fa-eye-slash");
        }
    });
    //========================================
    //▼ Datetimepicker
    //========================================
    function check_advance(_this) {
        if (_this.is(":checked")) {
            $(".group-info").slideDown(450);
        } else {
            $(".group-info").slideUp(350);
        }
    }
    check_advance($("#radius-look"));
    $("#radius-look").click(function () {
        check_advance($(this));
    });
    // Modal
    $(".link-add").on("click", function () {
        $(".modal-maintenance").modal("show");
    });
    //========================================
    //▼ Modal trigger next modal Login, Registries, Forgot Password
    //========================================
    $(document).on("hidden.bs.modal", ".modal", function () {
        $(".modal:visible").length && $(document.body).addClass("modal-open");
    });
    //========================================
    //▼ handle tab
    //========================================
    $("#tabs-map").on("click", "a", function (e) {
        $("body").removeClass("fit-on");
        e.stopPropagation();
    });
    //========================================
    //▼ Fixed Min Height Main Content
    //========================================
    var min_height_content = function () {
        var hgt_rest, hgt_main;
        var hgt_header = $("#header").outerHeight() || $(".map-front-header").outerHeight();
        var hgt_window = $(window).height();
        var hgt_title = $(".col-lft-navi-inner > .tab-content > .tab-pane.active").find(".top-heading-wrap").outerHeight();

        // if ($('.top-heading-wrap').length) {
        //     hgt_rest = hgt_window - (hgt_header + hgt_title);
        //     hgt_main = hgt_rest + hgt_title;
        // } else {
        //     hgt_rest = hgt_window - hgt_header;
        //     hgt_main = hgt_rest;
        // }

        hgt_rest = hgt_main = hgt_window;
        $(".map-navigation").css("height", hgt_rest);
        $(".wrap-main-map").css("height", hgt_rest);
        $(".wrap-main-map .main-inner-map .wrap-col-lft .col-lft-navi").css("height", hgt_rest);
        $(".tab-pane-inner-scroll").css("height", hgt_rest - hgt_title - hgt_header);
        $(".tab-pane-inner-scroll").css("overflow", "auto");
        $(".wrap-main-map .main-inner-map .wrap-col-main .col-main-map-inner").css("height", hgt_main);
        // $(".wrap-main-map .main-inner-map .wrap-col-main .col-main-map-inner").css("height", hgt_main - hgt_header);
    };

    if ($(".wrap-main-map").length) {
        min_height_content();
    }
    //========================================
    //▼ Tab nested
    //========================================
    if ($(".search-navigation").length) {
        $(".search-condition .tab-content .tab-pane").first().addClass("show active");
        $("#tabs-search li .link-condition").on("click", function (e) {
            $("#tabs-search li").removeClass("active");
            $(this).parent().addClass("active");
            if ($("#pane-condition").is(":visible")) {
                $("#pane-condition").removeClass("show active");
            } else {
                $("#pane-condition").addClass("show active");
            }
            $("#pane-result").removeClass("show active");
            e.stopPropagation();
        });
        $("#tabs-search li .link-result").on("click", function (e) {
            $("#tabs-search li").removeClass("active");
            $(this).parent().addClass("active");
            if ($("#pane-result").is(":visible")) {
                $("#pane-result").removeClass("show active");
            } else {
                $("#pane-result").addClass("show active");
            }
            $("#pane-condition").removeClass("show active");
            e.stopPropagation();
        });
    }
    //========================================
    //▼ Focus Form
    //========================================
    if ($(".filter-search .input-group").length) {
        $(".filter-search .search-form .form-control").on("keyup", function () {
            if ($(this).val().length > 0) {
                $(this).parent().addClass("form-focus");
            } else {
                $(this).parent().removeClass("form-focus");
            }
        });
        $(".btn-input-reset").click(function () {
            $(this).parent().find("input").val("");
            $(this).parent().find("input").trigger("change");
            $(this).closest(".input-group").removeClass("form-focus");
        });
    }
    //========================================
    //▼ Accordion Slider bar
    //========================================
    // var accordionSlider = new $.DEVFUNC.accordion({
    //     contentStr: ".accordion-content",
    //     contents: $(".accordion-content"),
    //     hasClassSub: "accordion-content",
    //     item: $(".accordion-item"),
    //     target: ".accordion-title",
    //     wrap: $(".accordion-sidebar")
    // });
    // accordionSlider.handleAccordion();
    //========================================
    //▼ Accordion child Slider bar
    //========================================
    // var childAccordionSlider = new $.DEVFUNC.accordion({
    //     contentStr: ".accordion-child-content",
    //     contents: $(".accordion-child-content"),
    //     hasClassSub: "accordion-child-content",
    //     item: $(".accordion-child-item"),
    //     target: ".accordion-child-title",
    //     wrap: $(".accordion-child-sidebar")
    // });
    // childAccordionSlider.handleAccordion();
    //========================================
    //▼ menu settings
    //========================================


    //========================================
    //▼ Back To Top
    //========================================
    // var back_top = new $.DEVFUNC.BackToTop({
    //     breakpoint: 640,
    //     offset_plus_pc: 70,
    //     offset_plus_sp: -10,
    //     selector: $(".back-top"),
    //     switchClass: "back-top-fixed",
    //     top: 150
    // });

    //========================================
    //▼ Processing for each breakpoint
    //========================================
    // Processing for each breakpoint
    $.HANDLEBREAKPOINT = function (device) {
        $.DEVFUNC.elemMove($.GSET.MOVE_ELEM, device); //Move element
        // Mainvisual
        //if (main_visual.active) main_visual.resize(device);
        // Back To Top
        // if (back_top.active) back_top.init(device);
    };
    // $.DEVFUNC.MATCHMEDIA();
    //========================================
    //▼ matchMedia superfish
    //========================================
    var mql_superfish = window.matchMedia("(max-width: 1150px)");

    function screenSuperfish(e) {
        if (e.matches) {
            /* The viewport is less than, or equal to, 1150px pixels wide */

        } else {
            /* the viewport is more than than 1150px pixels wide */

        }
    }
    screenSuperfish(mql_superfish);
    mql_superfish.addListener(screenSuperfish);
    //==================================================
    //▼ Only processed once when loading the screen end
    //==================================================
    var timer = false;
    $(window).resize(function () {
        if (timer !== false) {
            clearTimeout(timer);
        }
        timer = setTimeout(function () {
            if ($(".wrap-main-map").length) {
                min_height_content();
            }
        }, 100);
    });

    setInterval(() => {
        // hgt_title = $('.col-lft-navi-inner > .tab-content > .tab-pane').eq($('#tabs-map > li.active').index()).find('.top-heading-wrap').innerHeight();
        min_height_content();
        equalHeight();
    }, 250);

})(jQuery);