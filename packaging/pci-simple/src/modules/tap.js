"use strict";

/** Tap To Reveal portable custom interaction
 * @param ctx - PCI communications bridge
 */
define([ "qtiCustomInteractionContext" ], function (ctx) {
  var self = {
    // The type identifier allows custom interactions types to be identified in an item
    // Returned values are defined by the implementer.
    // Here, to minimise the risk of namespace collisions the implementation is 
    // using an ID which includes a domain which they control (hmhco.com)
    typeIdentifier: 'urn:fdc:hmhco.com:pci:tapToReveal',

    /** @access private
     *  defaults for properties (data- attributes)
     */  
    _propertyDefaults: {
        toggle: "false",
        altText: "Select to reveal the contents"
    },
    
    /** @access private
     * internal state of the interaction
     */
    _state: {
        numReveals: 0
    },
    _baseElement: null,
    _config: {},
    _props: {
        toggle: "false",
        altText: "Select to reveal the contents"
    },
    _eventListener: undefined,

    /** @access public
     *  @method getInstance Create a new instance of this portable custom interaction
     *  Will be called by the qtiCustomInteractionContext
     *  @param {DOM Element} dom - the DOM Element this PCI is being added to
     *  @param {Object} configuration - the configuration to apply to this PCI
     *  @param {String} state - a previous saved state to apply to this instance.
     *  This must have been obtained from a prior call to getState on an
     *  instance of this type (same typeIdentifier)
     */
    getInstance: function (dom, configuration, state) {
        var newInstance = this._extend({}, this);
        newInstance._init = newInstance._init.bind(newInstance);
        newInstance._init(dom, configuration, state);
        return newInstance;
    },
    
    _init: function(dom, configuration, state) {
        this._baseElement = dom;
        var uid = "tap-" + Math.floor(Math.random() * 100000);
        dom.setAttribute("data-uid", uid);
        this._addCSS(uid);

        this._config = configuration;
        this._props = this._extend(this._propertyDefaults, this._config.properties);
        if (state) {
            this._state = JSON.parse(state);
        }
        var images = dom.querySelectorAll("img.tap");
        var hasRevelationState = false;
        if (this._state.revealed && this._state.revealed.length === images.length) {
            hasRevelationState = true;
        } else {
            this._state.revealed = [];
        }
        for (var i = 0; i < images.length; i++) {
            var image = images[i];
            image.width = image.clientWidth;
            image.height = image.clientHeight;
            image.setAttribute("data-src", image.src);
            image.src = this._coverImage;
            image.setAttribute("data-alt", image.getAttribute("alt"));
            image.setAttribute("alt", this._props.altText);
            image.dataset.index = i;
            if (hasRevelationState) {
                if (this._state.revealed[i]) {
                    this._swap(image);
                }
            } else {
                this._state.revealed[i] = false;
            }
            var source = image.outerHTML;
            image.outerHTML = "<button class='hmh-tap-image' aria-live='polite' aria-relevant='all'>" + source + "</button>";
        }
        var buttons = dom.querySelectorAll("button.hmh-tap-image");
        this._eventListener = this.onclick.bind(this);
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("click", this._eventListener);
        }
        this.oncompleted = this.cleanup.bind(this);
        if (this._config.onready !== undefined && this._config.onready !== null) {
            this._config.onready(this, this.getState());
        }
        return this;
    },

    /** @access public 
     * @method getResponse
     * @return {Object} - the value to assign to the bound QTI response variable
     */
    getResponse: function () {
        return {
            "base": {
                "integer": this._state.numReveals
            }
        };
    },

    /** @access public
     * @method getState
     * @return {String} The current state of this PCI. May be passed to
     * getInstance to later restore this PCI instance.
     */
    getState: function () {
        return JSON.stringify(this._state);
    },

    /** @access public
     * @method onclick - user has clicked/pressed Enter on the button
     * @param {MouseEvent} event - the click Event.
     */
    onclick: function (event) {
        var img = event.currentTarget.querySelector("img");
        var toggle = this._swap(img);
        this._state.numReveals += 1;
        this._state.revealed[ img.dataset.index ] = (toggle? (!this._state.revealed[ img.dataset.index ]) : true);
    },
    
    _swap: function(img) {
        var toggle = this._props.toggle && ("true".localeCompare(this._props.toggle) === 0);
        var alt = img.getAttribute("alt");
        var src = img.src;
        img.src = img.dataset.src;
        img.setAttribute("alt", alt);
        if (toggle) {
            img.dataset.src = src;
            img.dataset.alt = alt;
        }
        return toggle;
    },

    /** @access private
     * Add the CSS scoped to this PCI instance
     * @param {type} uid
     * @return {undefined}
     */
    _addCSS: function (uid) {
        var stylesheet = document.createElement("style");
        stylesheet.innerHTML = this._stylesheet.join("").replace(/\${uid}/g, uid);
        this._baseElement.appendChild(stylesheet);
    },
    /** 
     * This will be provided as the oncompleted callback to cleanup 
     * before this PCI is unloaded.
     * @return {none}
     */
    cleanup: function() {
        var buttons = this._baseElement.querySelectorAll("button.hmh-tap-image");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].removeEventListener("click", this._eventListener);
        }
    },
    
    _stylesheet: [
        '[data-uid="${uid}"] .qti-interaction-markup {              ',
        '   display: table;                                         ',
        '}                                                          ',
        '[data-uid="${uid}"] .border {                              ',
        '   display: table;                                         ',
        '   padding: 15px;                                          ',
        '}                                                          ',
        '[data-uid="${uid}"] .hmh-tap-image {                       ',
        '   border: 1px solid #00a3c0;                              ',
        '   border-radius: 3px;                                     ',
        '   padding: 10px;                                          ',
        '   vertical-align: middle;                                 ',
        '   background-color: #f1f1f1;                              ',
        '   width: 100%;                                            ',
        '}                                                          ',
        '.hmh-tap-border-rounded [data-uid="${uid}"] .border {      ',
        '   border: 2px solid #DDDDDD;                              ',
        '   border-radius: 4px;                                     ',
        '}                                                          ',
        '[data-uid="${uid}"] [role="grid"] {                        ',
        '   padding: 15px;                                          ',
        '}                                                          ',
        '[data-uid="${uid}"] [role="gridcell"] {                    ',
        '   display: inline-block;                                  ',
        '   width: 100%;                                            ',
        '   margin: 15px;                                           ',
        '   padding: 10px;                                          ',
        '}                                                          ',
        '[data-uid="${uid}"] figcaption {                           ',
        '   text-align: center;                                     ',
        '}                                                          ',
        '[data-uid="${uid}"] div[role="row"] {                      ',
        '   display: grid;                                          ',
        '   grid-auto-flow: column;                                 ',
        '   align-items: center;                                    ',
        '   justify-items: center;                                  ',
        '}                                                          ',
        '[data-uid="${uid}"] .tap {                                 ',
        '   width: 100%;                                            ',
        '}'
    ],
    
    _coverImage: "data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI2cHgiIHZpZXdCb3g9IjAgMCAyNCAyNiI+DQogICAgPGRlZnMgLz4NCiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4NCiAgICAgICAgPHBhdGggZD0iTTIwLjI3NjQwNDcsMjIuNTEyIEwyMC4yNzY0MDQ3LDE1LjEyOCBDMjAuMjc2NDA0NywxNC4wMjggMTkuMzc2NDA0NywxMy4xMjggMTguMjc2NDA0NywxMy4xMjggTDEyLjI3NjQwNDcsMTMuMTI4IEwxMi4yNzY0MDQ3LDcuMTI4IEMxMi4yNzY0MDQ3LDYuMDI4IDExLjM3NjQwNDcsNS4xMjggMTAuMjc2NDA0Nyw1LjEyOCBDOS4xNzY0MDQ2OSw1LjEyOCA4LjI3NjQwNDY5LDYuMDI4IDguMjc2NDA0NjksNy4xMjggTDguMjc2NDA0NjksMTguMTI4IEw1LjU3NjQwNDY5LDE2LjAyOCBDNC43NzY0MDQ2OSwxNS40MjggMy43NzY0MDQ2OSwxNS4yMjggMi44NzY0MDQ2OSwxNS42MjggQzIuMDc2NDA0NjksMTUuOTI4IDEuNzc2NDA0NjksMTYuODI4IDIuMTc2NDA0NjksMTcuNDI4IEw1LjI4NjQwNDY5LDIyLjUxIE0xNS45NDE0MDQ3LDkuNTkyIEMxNi4yNjA0MDQ3LDguODQ3IDE2LjQzNzQwNDcsOC4wMjcgMTYuNDM3NDA0Nyw3LjE2NiBDMTYuNDM3NDA0NywzLjc2MSAxMy42NzY0MDQ3LDEgMTAuMjcwNDA0NywxIEM2Ljg2NTQwNDY5LDEgNC4xMDQ0MDQ2OSwzLjc2MSA0LjEwNDQwNDY5LDcuMTY2IEM0LjEwNDQwNDY5LDguMjQxIDQuMzc5NDA0NjksOS4yNTIgNC44NjM0MDQ2OSwxMC4xMzIiIHN0cm9rZT0iIzdGODI4MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIC8+DQogICAgPC9nPg0KPC9zdmc+",

    _extend: function(A, B) {
        var r = {};
        for (var prop in A) {
            r[prop] = A[prop];
        }
        for (var prop in B) {
            r[prop] = B[prop];
        }
        return r;
    }
  };
  // Register this PCI instance with the communication bridge
  if (ctx) {
    ctx.register( self );
  }
  return self;
});