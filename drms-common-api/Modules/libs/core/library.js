jQuery.noConflict();
window.matchMedia || (window.matchMedia = function () {
    "use strict";

    // For browsers that support matchMedium api such as IE 9 and webkit
    var styleMedia = (window.styleMedia || window.media);

    // For those that don't support matchMedium
    if (!styleMedia) {
        var style = document.createElement("style"),
            script = document.getElementsByTagName("script")[0],
            info = null;

        style.type = "text/css";
        style.id = "matchmediajs-test";

        if (!script) {
            document.head.appendChild(style);
        } else {
            script.parentNode.insertBefore(style, script);
        }

        // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
        info = ("getComputedStyle" in window) && window.getComputedStyle(style, null) || style.currentStyle;

        styleMedia = {
            matchMedium: function (media) {
                var text = "@media " + media + "{ #matchmediajs-test { width: 1px; } }";

                // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
                if (style.styleSheet) {
                    style.styleSheet.cssText = text;
                } else {
                    style.textContent = text;
                }

                // Test if media query is true or false
                return info.width === "1px";
            }
        };
    }

    return function (media) {
        return {
            matches: styleMedia.matchMedium(media || "all"),
            media: media || "all"
        };
    };
}());
(function () {
    // Bail out for browsers that have addListener support
    if (window.matchMedia && window.matchMedia("all").addListener) {
        return false;
    }

    var localMatchMedia = window.matchMedia,
        hasMediaQueries = localMatchMedia("only all").matches,
        isListening = false,
        timeoutID = 0, // setTimeout for debouncing 'handleChange'
        queries = [], // Contains each 'mql' and associated 'listeners' if 'addListener' is used
        handleChange = function (evt) {
            // Debounce
            clearTimeout(timeoutID);

            timeoutID = setTimeout(function () {
                for (var i = 0, il = queries.length; i < il; i++) {
                    var mql = queries[i].mql,
                        listeners = queries[i].listeners || [],
                        matches = localMatchMedia(mql.media).matches;

                    // Update mql.matches value and call listeners
                    // Fire listeners only if transitioning to or from matched state
                    if (matches !== mql.matches) {
                        mql.matches = matches;

                        for (var j = 0, jl = listeners.length; j < jl; j++) {
                            listeners[j].call(window, mql);
                        }
                    }
                }
            }, 30);
        };

    window.matchMedia = function (media) {
        var mql = localMatchMedia(media),
            listeners = [],
            index = 0;

        mql.addListener = function (listener) {
            // Changes would not occur to css media type so return now (Affects IE <= 8)
            if (!hasMediaQueries) {
                return;
            }

            // Set up 'resize' listener for browsers that support CSS3 media queries (Not for IE <= 8)
            // There should only ever be 1 resize listener running for performance
            if (!isListening) {
                isListening = true;
                window.addEventListener("resize", handleChange, true);
            }

            // Push object only if it has not been pushed already
            if (index === 0) {
                index = queries.push({
                    listeners: listeners,
                    mql: mql
                });
            }

            listeners.push(listener);
        };

        mql.removeListener = function (listener) {
            for (var i = 0, il = listeners.length; i < il; i++) {
                if (listeners[i] === listener) {
                    listeners.splice(i, 1);
                }
            }
        };

        return mql;
    };
}());
(function ($) {

    $.GSET = {};

    //Breakpoint (MediaQuery) settings
    $.GSET.MODEL = {
        //Breakpoint name (used to move elements, etc.): MediaQuery value
        pc: "(min-width: 980px)",
        sp: "only screen and (max-width : 640px)",
        tb: "only screen and (min-width : 640px) and (max-width : 980px)"
    };

    //Element movement settings
    $.GSET.MOVE_ELEM = [{
        elem: ".navigationa",
        pc: [".setting-wrap", "prepend"],
        sp: ["#sma-navi", "prepend"],
        tb: ["#sma-navi", "prepend"]
    }];

    //PC / smartphone switching settings
    $.GSET.MODEL_CHANGE_BASE_MODEL = "pc"; // Breakpoint name on PC display
    $.GSET.MODEL_CHANGE_SP_MODEL = "sp"; // Breakpoint name on smartphone display

})(jQuery);

//Function definition
(function ($) {
    $.DEVFUNC = {};
    //========================================
    // $.DEVFUNC.customEvent
    //========================================
    $.DEVFUNC.customEvent = function () {
        var listeners = [];

        function add_event(event_name, event_handler) {
            if (listeners[event_name]) {
                listeners[event_name].push(event_handler);
            } else {
                listeners[event_name] = [event_handler];
            }
        }

        function remove_event(event_name, event_handler) {
            if (listeners[event_name]) {
                if (event_handler) {
                    while (listeners[event_name].indexOf(event_handler) > -1) {
                        listeners[event_name].splice(listeners[event_name].indexOf(event_handler), 1);
                    }
                } else {
                    listeners[event_name] = [];
                }
            }
        }
        return {
            getEventListeners: function (event_name) {
                if (listeners[event_name]) {
                    return listeners[event_name];
                } else {
                    return [];
                }
            },
            off: function (event_name, event_handler) {
                if (typeof event_name == "undefined") {
                    listeners = [];
                } else if (typeof event_name == "string") {
                    remove_event(event_name, event_handler);
                } else if (Array.isArray(event_name)) {
                    event_name.forEach(function (name) {
                        remove_event(name, event_handler);
                    });
                }
            },
            on: function (event_name, event_handler) {
                if (typeof event_name == "string") {
                    add_event(event_name, event_handler);
                } else if (Array.isArray(event_name)) {
                    event_name.forEach(function (name) {
                        add_event(name, event_handler);
                    });
                }
            },
            trigger: function (event_name, args, _this) {
                if (!_this) _this = null;
                if (listeners[event_name] && listeners[event_name].length) {
                    var max = listeners[event_name].length;
                    for (var i = 0; i < max; i++) {
                        if (args && Array.isArray(args)) {
                            listeners[event_name][i].apply(_this, args);
                        } else {
                            listeners[event_name][i].call(_this, args);
                        }
                    }
                }
            }
        };
    };
    //========================================
    // $.DEVFUNC.inViewObserver
    //========================================
    $.DEVFUNC.inViewObserver = function (options) { //v1.0
        var defaults = {
                inviewCondition: function (self_percent, window_percent, inview_px) {
                    return self_percent > 0.5;
                },
                selector: null
            },
            s = $.extend(defaults, options);

        if (!(s.selector && s.selector.length)) return { active: false };

        var _e = new $.DEVFUNC.customEvent(),
            _t = s.selector,
            ready = false,
            inview_state = false;


        /*---- INIT ----*/
        function init() {
            if (ready) return false;
            $(window).on("scroll resize load", init_event);
            init_event();
            ready = true;
        }

        function destroy() {
            if (!ready) return false;
            $(window).off("scroll resize load", init_event);
            _e.off();
            ready = false;
        }
        /*---- PRIVATE FUNCTION ----*/
        function get_inview_self(inview) {
            return _t.outerHeight() ? inview / _t.outerHeight() : 0;
        }

        function get_inview_window(inview) {
            if (inview) {
                return {
                    bottom: Math.min(Math.max((_t.offset().top + _t.outerHeight() - window.pageYOffset) / $(window).outerHeight(), 0), 1),
                    top: Math.min(Math.max((_t.offset().top - window.pageYOffset) / $(window).outerHeight(), 0), 1),
                };
            } else {
                return {
                    bottom: 0,
                    top: 0
                };
            }
        }

        function get_inview() {
            return Math.max(_t.outerHeight() + Math.min(_t.offset().top - window.pageYOffset, 0) + Math.min((window.pageYOffset + $(window).outerHeight()) - (_t.offset().top + _t.outerHeight()), 0), 0);
        }

        /*---- EVENT ----*/
        function init_event() {
            var inview = get_inview();
            if (inview && s.inviewCondition(get_inview_self(inview), get_inview_window(inview), inview)) {
                if (!inview_state) {
                    inview_state = true;
                    _e.trigger("in_view", inview);
                }
                _e.trigger("viewing");
            } else {
                if (inview_state) {
                    inview_state = false;
                    _e.trigger("out_of_view");
                }
                _e.trigger("not_viewing");
            }
        }


        /*---- PUBLIC ----*/
        return {
            //public function and variables
            active: true,
            checkCondition: init_event,
            destroy: destroy,
            init: init,
            off: _e.off,
            on: _e.on,
            selector: s.selector,
            trigger: _e.trigger
        };
    };
    //========================================
    // ▼switchSlickLayout
    //========================================
    $.DEVFUNC.updateSlick = function (options) {
        var defaults = {
                nextArrowHover: null,
                pcCallBack: function () { },
                prevArrowHover: null,
                selector: $("#tmp_jcarousel .slick_slides"),
                slickPcSettings: {
                    arrows: true,
                    autoplay: true,
                    dots: true,
                    focusOnSelect: true,
                    infinite: true,
                    slidesToScroll: 1,
                    slidesToShow: 4,
                },
                slickSpSettings: false,
                slickTbSettings: false,
                spCallBack: function () { },
                startButtonText: "start",
                stopButtonText: "stop",
                tbCallBack: function () { },
                useStopControl: true,
                wrap: $("#tmp_jcarousel .slick_wrap"),
            },
            s = $.extend(defaults, options),
            first_pc = true,
            first_tb = true,
            first_sp = true,
            first_pc_start = true,
            first_tb_start = true,
            first_sp_start = true,
            tb_selector,
            sp_selector;

        /*---- INIT ----*/
        if (s.selector.length && $.fn.slick) {
            sp_selector = $(s.selector[0].outerHTML);
            tb_selector = $(s.selector[0].outerHTML);
        } else {
            return {
                active: false
            };
        }

        /*---- PRIVATE FUNCTION ----*/
        function pc_layout() {
            sp_selector.detach();
            tb_selector.detach();
            s.wrap.append(s.selector);
            if (s.slickPcSettings) {
                if (first_pc) {
                    first_pc = false;
                    s.selector.slick(s.slickPcSettings);
                    append_control(s.selector);
                    hoverArrow();
                    if (first_pc_start == false) {
                        s.selector.slick("slickPause");
                        s.selector.find(".btn_slides").removeClass("stop").addClass("start").find("span").text(s.startButtonText);
                    }
                }
                s.selector.slick("setPosition");
                s.pcCallBack();
            }
        }

        function tb_layout() {
            s.selector.detach();
            sp_selector.detach();
            s.wrap.append(tb_selector);
            hoverArrow();
            if (s.slickTbSettings) {
                if (first_tb) {
                    first_tb = false;
                    tb_selector.slick(s.slickTbSettings);
                    append_control(tb_selector);
                    if (first_tb_start == false) {
                        tb_selector.slick("slickPause");
                        tb_selector.find(".btn_slides").removeClass("stop").addClass("start").find("span").text(s.startButtonText);
                    }
                }
                tb_selector.slick("setPosition");
                s.tbCallBack();
            }
        }

        function sp_layout() {
            s.selector.detach();
            tb_selector.detach();
            s.wrap.append(sp_selector);
            hoverArrow();
            if (s.slickSpSettings) {
                if (first_sp) {
                    first_sp = false;
                    sp_selector.slick(s.slickSpSettings);
                    append_control(sp_selector);
                    if (first_sp_start == false) {
                        sp_selector.slick("slickPause");
                        sp_selector.find(".btn_slides").removeClass("stop").addClass("start").find("span").text(s.startButtonText);
                    }
                }
                sp_selector.slick("setPosition");
                s.spCallBack();
            }
        }

        function append_control(target) {
            if (s.useStopControl) {
                target.find(".slick-dots").wrap("<div class=\"slick_control\"></div>");
                target.find(".slick_control").prepend("<p class=\"btn_slides stop\"><a href=\"javascript:void(0);\"><span>stop</span></a></p>");
                target.find(".slick_control .btn_slides").on("click", function (e) {
                    if ($(this).hasClass("stop")) {
                        if (s.slickPcSettings && !first_pc) {
                            s.selector.slick("slickPause");
                            s.selector.find(".btn_slides").removeClass("stop").addClass("start").find("span").text(s.startButtonText);
                        }
                        if (s.slickTbSettings && !first_tb) {
                            tb_selector.slick("slickPause");
                            tb_selector.find(".btn_slides").removeClass("stop").addClass("start").find("span").text(s.startButtonText);
                        }
                        if (s.slickSpSettings && !first_sp) {
                            sp_selector.slick("slickPause");
                            sp_selector.find(".btn_slides").removeClass("stop").addClass("start").find("span").text(s.startButtonText);
                        }
                        first_pc_start = false;
                        first_tb_start = false;
                        first_sp_start = false;
                    } else {
                        if (s.slickPcSettings && !first_pc) {
                            s.selector.slick("slickPlay");
                            s.selector.find(".btn_slides").removeClass("start").addClass("stop").find("span").text(s.stopButtonText);
                        }
                        if (s.slickTbSettings && !first_tb) {
                            tb_selector.slick("slickPlay");
                            tb_selector.find(".btn_slides").removeClass("start").addClass("stop").find("span").text(s.stopButtonText);
                        }
                        if (s.slickSpSettings && !first_sp) {
                            sp_selector.slick("slickPlay");
                            sp_selector.find(".btn_slides").removeClass("start").addClass("stop").find("span").text(s.stopButtonText);
                        }
                        first_pc_start = true;
                        first_tb_start = true;
                        first_sp_start = true;
                    }
                });
            }
        }

        function hoverArrow() {
            if (s.nextArrowHover && s.prevArrowHover) {
                var slickPrev = $(".service_slide_gallery").find(".slick-prev.slick-arrow").children("img").attr("src");
                var slickNext = $(".service_slide_gallery").find(".slick-next.slick-arrow").children("img").attr("src");
                $(".service_slide_gallery").find(".slick-arrow").off("mouseover mouseleave");
                $(".service_slide_gallery").find(".slick-prev.slick-arrow").on("mouseover", "img", function () {
                    $(this).attr("src", s.prevArrowHover);
                });
                $(".service_slide_gallery").find(".slick-prev.slick-arrow").on("mouseleave", "img", function () {
                    $(this).attr("src", slickPrev);
                });
                $(".service_slide_gallery").find(".slick-next.slick-arrow").on("mouseover", "img", function () {
                    $(this).attr("src", s.nextArrowHover);
                });
                $(".service_slide_gallery").find(".slick-next.slick-arrow").on("mouseleave", "img", function () {
                    $(this).attr("src", slickNext);
                });
            }
        }

        /*---- PUBLIC ----*/
        return {
            active: true,
            resize: function (e) {
                if (e == "pc") {
                    pc_layout();
                } else if (e == "tb") {
                    tb_layout();
                } else {
                    sp_layout();
                }
            }
        };
    };
    //========================================
    // ▼ Sticky floating
    //========================================
    $.DEVFUNC.StickyFloating = function (options) { //v1.0
        var defaults = {
                area_floating: $(".menu-floating"),
                area_wrap_pc: $(".slidebar .slidebar-content .nav-slidebar"),
                area_wrap_sp: $(".menu-floating .floating-content"),
                breakpoint: 640,
                button: $(".floating-button"),
                scrolload: false,
                //Default Options
                target: $(".slidebar-link")
            },
            s = $.extend(defaults, options);
        if (!(s.target && s.target.length && s.area_wrap_pc && s.area_wrap_pc.length && s.area_wrap_sp && s.area_wrap_sp.length)) return { active: false };

        /*---- INIT ----*/
        function init(e) {
            if ($(window).width() <= s.breakpoint && e == "sp") {
                s.area_wrap_sp.append(s.target);
            } else {
                s.area_wrap_pc.append(s.target);
            }
        }
        /*---- EVENT ----*/
        s.button.on("click", function (e) {
            e.preventDefault();
            if (!s.area_floating.hasClass("side-close")) {
                s.area_floating.addClass("side-close");
                $(this).children(".menu-toggler__dots").addClass("is-active");
            } else {
                s.area_floating.removeClass("side-close");
                $(this).children(".menu-toggler__dots").removeClass("is-active");
            }
        });
        /*---- END EVENT ----*/

        /*---- PRIVATE FUNCTION ----*/

        /*---- END PRIVATE FUNCTION ----*/

        /*---- PUBLIC ----*/
        return {
            //public function and variables
            active: true,
            init: init
        };
    };
    //========================================
    // ▼ Accordion
    //========================================
    $.DEVFUNC.accordion = function (options) {
        var defaults = {
                contentStr: ".accordion-content",
                contents: $(".accordion-content"),
                hasClassSub: "accordion-content",
                item: $(".accordion-item"),
                target: ".accordion-title",
                wrap: $(".accordion")
            },
            s = $.extend(defaults, options);
        //Private Function
        function toggleSlide() {
            s.wrap.each(function () {
                $(this).children(".active").children(s.contentStr).slideDown(450);
                $(this).children(".active").addClass("active");
            });
            s.wrap.on("click", s.target, function (e) {
                if ($(this).next().hasClass(s.hasClassSub) == false) {
                    return;
                }
                var parent = $(this).parent().parent();
                var subAccordion = $(this).next();
                // parent.children('.active').children(s.contentStr).slideUp(450);
                // parent.children('.active').removeClass('active');

                if (subAccordion.is(":visible")) {
                    $(this).parent().removeClass("active");
                    subAccordion.slideUp(450);
                    if ($(this).find("input[type=checkbox]").length) {
                        $(this).find("input[type=checkbox]").prop("checked", false);
                    }
                } else {
                    $(this).parent().addClass("active");
                    subAccordion.slideDown(450);
                    if ($(this).find("input[type=checkbox]").length) {
                        $(this).find("input[type=checkbox]").prop("checked", true);
                    }
                }

                e.preventDefault();
            });
        }
        //Public Fuction
        return {
            handleAccordion: function () {
                toggleSlide();
            }
        };
    };
    //========================================
    // Back To Top
    //========================================
    $.DEVFUNC.BackToTop = function (options) { //v1.0
        var defaults = {
                breakpoint: 640,
                offset_plus_pc: 70,
                offset_plus_sp: 0,
                //Default Options
                selector: $(".back-top"),
                switchClass: "back-top-fixed",
                top: 100
            },
            s = $.extend(defaults, options);
        if (!(s.selector && s.selector.length)) return { active: false };

        /*---- INIT ----*/
        function init(e) {
            function scrollWindow(e) {
                $(window).on("scroll load", function () {
                    var offset = $("#footer").offset().top;
                    var offset_math = (e == "pc") ? Math.floor(offset) + s.offset_plus_pc : Math.floor(offset) + s.offset_plus_sp;
                    var scroll_position = ($(window).width() < $(".container").width() && $(window).width() > s.breakpoint) ? (($(".container").width() / $(window).width()) * $(window).height() + $(window).scrollTop()) : $(window).scrollTop() + $(window).height();
                    if (scroll_position <= offset_math) {
                        s.selector.addClass(s.switchClass);
                    }
                    else {
                        s.selector.removeClass(s.switchClass);
                    }
                });
            }
            if (device != "sp") {
                scrollWindow(e);
            } else {
                setTimeout(function () { scrollWindow(e); }, 100);
            }
            $(s.selector).on("click", function (e) {
                e.preventDefault();
                $("html, body").animate({ scrollTop: 0 }, 250);
            });
            $(window).on("scroll load", function () {
                if ($(window).scrollTop() > s.top) {
                    s.selector.fadeIn(150);
                }
                else {
                    s.selector.fadeOut(150);
                }
            });
        }
        /*---- PUBLIC ----*/
        return {
            //public function and variables
            active: true,
            init: init
        };
    };
    //========================================
    //▼ Smartphone menu
    //========================================
    $.DEVFUNC.mobileMenu = function (options) {
        var o = $.extend({
            addClass: "spmenu_open", //Class to be given to body
            closeBtn: ".close_btn", //Close button
            menuBtn: [{
                oBtn: "#btn-nav-sp a", //menu button
                target: "#smartphone-menu" //Menu to expand
            }],
            //callBack: function() {}
        }, options);
        var l = o.menuBtn.length;
        if (l >= 0) {
            for (var i = 0; i < l; i++) {
                $(o.menuBtn[i].oBtn).on("click", { elem: o.menuBtn[i].target }, function (e) {
                    var self = $(this);
                    if (self.hasClass("active")) {
                        self.removeClass("active");
                        $(e.data.elem).hide();
                        $("body").removeClass(o.addClass);
                    } else {
                        for (var i = 0; i < o.menuBtn.length; i++) {
                            if ($(o.menuBtn[i].oBtn).hasClass("active")) $(o.menuBtn[i].oBtn).removeClass("active");
                            $(o.menuBtn[i].target).hide();
                        }
                        self.addClass("active");
                        $(e.data.elem).show();
                        if (o.addClass) $("body").addClass(o.addClass);
                    }
                });
                $(o.menuBtn[i].target).on("click", o.closeBtn, { elem: o.menuBtn[i] }, function (ev) {
                    $(ev.data.elem.oBtn).removeClass("active");
                    $(ev.data.elem.target).hide();
                    $("body").removeClass(o.addClass);
                });

                // Processing to close the menu when tapping outside the screen
                $(document).on("click touchstart", { elem: o.menuBtn[i] }, function (e) {
                    //Close if tapped element's parent is html element
                    if (($(e.target).parent().is($("html")))) {
                        $(o.menuBtn).each(function () {
                            if ($(this.oBtn).hasClass("active")) {
                                $(this.oBtn).removeClass("active");
                            }
                        });
                        $("body").removeClass(o.addClass);
                        $(e.data.elem.target).hide();
                    }
                });
            }
        }
    };
    //========================================
    //▼ Move element
    //========================================
    $.DEVFUNC.elemMove = function (option, device) {
        var option = $.GSET.MOVE_ELEM;
        if (!option || option.length <= 0) return false; //要素移動の設定が無い、もしくは移動の要素が無い場合に中断
        var eLength = option.length;
        for (var i = 0; i < eLength; i++) {
            if (typeof option[i].flg === "undefined" || option[i].flg || option[i][device] || $(option[i].elem).length) {
                switch (option[i][device][1]) {
                    case ("append"):
                        $(option[i][device][0]).append($(option[i].elem));
                        break;
                    case ("prepend"):
                        $(option[i][device][0]).prepend($(option[i].elem));
                        break;
                    case ("after"):
                        $(option[i][device][0]).after($(option[i].elem));
                        break;
                    case ("before"):
                        $(option[i][device][0]).before($(option[i].elem));
                        break;
                }
            }
        }
    };
    //========================================
    //▼ MatchMedia
    //========================================
    var mql = [];
    $.DEVFUNC.MATCHMEDIA = function () {
        for (var device in $.GSET.MODEL) {
            var mediaQuery = matchMedia($.GSET.MODEL[device]);
            var mc = localStorage.getItem("pc");

            // Run when the page loads
            handle(mediaQuery);

            // Now runs even if the window size is changed
            mediaQuery.addListener(handle);

            function handle(mq) {
                if (!mc) {
                    for (var device in $.GSET.MODEL) {
                        if (mql[device].matches && !$("body").hasClass("device_" + device)) {
                            $("body").addClass("device_" + device);
                            $.HANDLEBREAKPOINT(device);
                        }
                        if (!mql[device].matches && $("body").hasClass("device_" + device)) {
                            $("body").removeClass("device_" + device);
                        }
                    }
                } else if (mc) {
                    for (var device in $.GSET.MODEL) {
                        $("body").removeClass("device_" + device);
                    }
                    device = "pc";
                    $("body").addClass("device_" + $.GSET.MODEL_CHANGE_SP_MODEL);
                    $.HANDLEBREAKPOINT($.GSET.MODEL_CHANGE_BASE_MODEL);
                }
            }
        }
    };
    for (var device in $.GSET.MODEL) {
        var mc = localStorage.getItem("pc");
        if (mc) {
            mql[device] = "pc";
        } else {
            mql[device] = matchMedia($.GSET.MODEL[device]);
        }
    }
})(jQuery);
