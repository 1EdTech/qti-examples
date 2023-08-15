/* 
 * Copyright 2016, 2017 and 2018 by Houghton Mifflin Harcourt Publishing Company.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @module hmhco.com:pci:shading  **/
/** @author Padraig O hIceadha <Padraig.OhIceadha@hmhco.com> **/
"use strict";
//
define([ "qtiCustomInteractionContext" ], function (ctx) {

    if (Number.parseFloat === undefined) { // Polyfill for IE 11
        Number.parseFloat = parseFloat;
    };
    
    var self = {
    /** @access private  */
    config: {},
    /** @access private  */
    propertyDefaults: {
          "dimension1_initial": 1,
          "dimension2_initial": 1,
          "value": "numShaded",
          "element_diameter": 50,
          "selected": "",
          "selected_color": "red",
          "unselected_color": "white",
          "active": "1"
    },
    /** @access private  */
    state: { grid: [ [ ] ] },

    /** @access public 
     * @method getResponse
     * @return {Object} - the value to assign to the bound QTI response variable
     */
    getResponse: function () {
      var props = this.getProperties();
      var value = 0;
      if (props.value === "numShaded") {
          value = this.getNumShaded();
      }
      return {
        "base": {
          "integer": value
        }
      };
    },

    /** @access public
     * The type identifier allows custom interactions types to be identified in an item
     * Returned values are defined by the implementer.
     * Here, to minimise the risk of namespace collisions the implementation is
     * using an ID which includes a domain which they control (hmhco.com) */
    typeIdentifier: "urn:fdc:hmhco.com:2019:ßpci:shading",

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
      this.config = this.extend({ onready: null, ondone: null }, configuration);

      this.props = this.getProperties();
      this.dom = dom;
      if (state !== undefined) {
          this._setState(state);
      } else {
            this.initializeGrid();
      }
      this.render();
      if (this.config.onready !== undefined && this.config.onready !== null) {
        this.config.onready(this, this.getState());
      }

      return this;
    },
    
    /** @access public
     * @method getState
     * @return {String} The current state of this PCI. May be passed to
     * getInstance to later restore this PCI instance.
     */
    getState: function () {
       return JSON.stringify(this.state);
     },  
    
    _setState: function (serializedState) {
        var state = JSON.parse(serializedState);
        $.extend(this.state, state);
        this.props = this.getProperties();
    },
  /** @access protected */
  // Render the qti-portable-interaction
  render: function () {
      var grid = this.state.grid;
      var d = Number.parseFloat(this.props.element_diameter);
      d = (isNaN(d)) ? this.propertyDefaults.element_diameter : d;

      var numRows = this.getNumRows();
      var numCols = this.getNumCols();

      var data = {
          gridWidth: Math.max(numRows * d, d) + 1, 
          gridHeight: Math.max(numCols * d, d) + 1
      };

      // Create a template to render the HTML for the interaction.
      // Supports simple variable expansion.
      var interaction = [
          "<svg width='${gridWidth}px' height='${gridHeight}px' style='float: left'>"
      ];
      for (var r = 0; r < numRows; r++) {
        var row = grid[r];
        for (var c = 0; c < row.length; c++) {
          interaction.push(this.generateCell(r, c, d, this.getFillColor(row[c])));
        }
      }
      interaction.push("</svg>");
      if (this.props.controls === "column" || this.props.controls === "full") {
        var colButtons = [
            "<div style='height: ${gridHeight}px; width: ${gridWidth}px; float: left; padding: 5px'>",
            "<div><strong>Columns</strong></div>",
            "<button class='colMore' style='margin: 5px'>More</button>",
            "<button class='colFewer' style='margin: 5px'>Fewer</button></div>"
        ];
        interaction = interaction.concat(colButtons);
      }
      if (this.props.controls === "row" || this.props.controls === "full") {
        var rowButtons = [
            "<div style='height: ${gridHeight}px; width: ${gridWidth}px; float: left; padding: 5px; clear: both'>",
            "<div><strong>Rows</strong></div>",
            "<button class='rowMore' style='margin: 5px'>More</button>",
            "<button class='rowFewer' style='margin: 5px'>Fewer</button></div>"
        ];
        interaction = interaction.concat(rowButtons);
      }
      // Create the template object
      var interaction = this.template(interaction);
      var interaction = interaction.expand(data); // Perform the variable expansion

      var footer = "<p style='clear: both'></p>";
      this.dom.innerHTML = "<div style='margin: 7px 0px'>" + interaction + "</div>" + footer;
      
      if (this.isActive()) {
        this.attachClickEventListeners();
      }

      this.addListener(".rowMore", "click", function () {
        this.addRow();
        this.render();
      });

      this.addListener(".rowFewer", "click", function () {
        this.removeRow();
        this.render();
      });

      this.addListener(".colMore", "click", function () {
        this.addColumn();
        this.render();
      });

      this.addListener(".colFewer", "click", function () {
        this.removeColumn();
        this.render();
      });
    },
    
    isActive: function () {
        return this.props.active !== "0";
    },
    
    /** @access protected
     * @method addListener Add a callback to an element identified by id.
     * @param {string} selector selector which will match the element to bind the callback to
     * @param {string} event Name of the event to bind
     * @param {string} callback - callback function to handle the event */
    addListener: function (selector, event, callback) {
      var element = this.dom.querySelector(selector);
      if (element) {
        element.addEventListener(event, callback.bind(this));
      }
    },
    
    /** @access protected */
    attachClickEventListeners: function() {
      var grid = this.state.grid;
      var cells = this.dom.querySelectorAll("rect");
      for ( var i = 0; i < cells.length; i++ ) {
        cells[i].addEventListener("click", function (event) {
          var cell = event.currentTarget;
          var row = cell.getAttribute("data-row"); // IE 11 doesn't support dataset for SVGElement
          var col = cell.getAttribute("data-col");

          var selection = grid[row][col];
          selection = (selection === 1) ? 0 : 1;
          cell.style.fill = this.getFillColor(selection);
          grid[row][col] = selection;
        }.bind ( this ));
      };
    },
    
    /** @access protected */
    addRow: function() {
      var grid = this.state.grid;
      if (grid.length === 0) {
          grid.push([]);
      }
      for (var i = 0; i < grid.length; i++) {
          grid[i].push(0);
      }
    },

    /** @access protected */
    removeRow: function() {
      var grid = this.state.grid;
      for (var i = grid.length; i > 0 ; i) {
          grid[--i].pop();
          if (grid[i].length === 0) {
              grid.pop();
          }
      }
    },

    /** @access protected */
    addColumn: function() {
      var grid = this.state.grid;
      var numCols = grid.length > 0 ? Math.max(grid[0].length, 1) : 1;
      var row = [];
      for (var i = 0; i < numCols; i++) {
        row.push(0);
      }
      grid.push(row);
    },
    
    /** @access protected */
    removeColumn: function () {
      var grid = this.state.grid;
      if (grid.length > 0) {
        grid.pop();
      }
    },
    
    /** @access protected
     * @method getFillColor - the fill color to use for the supplied selection state
     * @param {integer} selection the selection state
     * @returns {string} the fill color to use for the supplied selection state
     */
    getFillColor: function (selection) {
      return selection === 1? this.props.selected_color : this.props.unselected_color;
    },
    
    /** @access protected */
    getNumCols: function() {
        var numCols = 0;
        if (this.getNumRows() > 0) {
          numCols = this.state.grid[0].length;
        }
        return numCols;
    },
    
    /** @access protected */
    getNumRows: function() {
        return this.state.grid.length;
    },
    
    /** @access protected */
    initializeGrid: function() {
      var initialSelection = this.props.selected.split(",");
      var grid = [];

      var numRows = this.props.dimension1_initial;
      var numCols = this.props.dimension2_initial;
      for (var r = 0; r < numRows; r++) {
        var row = [];
        for (var c = 0; c < numCols; c++) {
          if (initialSelection.includes(r + "." + c)) {
            row.push(1);
          } else {
            row.push(0);
          }
        }
        grid.push(row);
      }
      this.state.grid = grid;
      return grid;
    },
    
    /** @access protected
     * @method generateCell Create the HTML for a single cell in the grid
     * @param {integer} row  row index
     * @param {integer} column  column index
     * @param {integer} diameter  cell diameter
     * @param {string} fillColor  Color with which to fill the cell
     */
    generateCell: function (row, column, diameter, fillColor) {
      var cellTemplate = this.template(
          "<rect data-row='${row}' data-col='${column}' x='${xPos}' y='${yPos}'",
          "      width='${diameter}' height='${diameter}' stroke='black' fill='${fillColor}' />"
      );
      return cellTemplate.expand({ 
          row: row, column: column, xPos: row * diameter, yPos: column * diameter,
          diameter: diameter, fillColor: fillColor
      });
    },
    
    /** @access protected */
    getNumShaded: function() {
      var value = 0;
      var numRows = this.state.grid.length;
      for (var r = 0; r < numRows; r++) {
        var row = this.state.grid[r];
        for (var c = 0; c < row.length; c++) {
          if (row[c] === 1) {
            value += 1;
          }
        }
      }
      return value;
    },
    /** @access protected
     * @method template Create a template object
     * @param {Array} arg The template accepts either a single String array of
     * lines of a template or a variable number of string arguments.
     * These will all be joined together as a single string with each line 
     * seperated by a newline.
     * The template object supports an expand method which takes a single object 
     * and will expand any occurances of the pattern ${propertyName} by the value
     * of the corresponding property in the object supplied.
     * @return {Object} the template object
     */
    template: function (arg) {
        var self = {};
        var args;
        if (Array.isArray(arg)) {
            args = arg;
        } else {
            args = Array.prototype.slice.call(arguments);
        }
        self.templateString =  args.join('\n');
        
        self.expand = function (object) {
            var t = this.templateString;
            var expansions = t.match(/\$\{[\w-]*\}/g);
            if (expansions === null) {
                return t; // No substitutions required
            }
            var staticTexts = t.split(/\$\{[\w-]*\}/g);
            return expansions.reduce(function(accumulator, current) {
                var varName = current.substring(2, current.length -1);
                return accumulator + object[varName] + staticTexts.shift();
            }, staticTexts.shift());
        }.bind(self);
        return self;
    },
  
    /** @access protected */
    getProperties: function() {
      return this.extend(this.propertyDefaults, this.config.properties);
    },
    extend: function(objectA, objectB) {
        var result = {};
        for (var prop in objectA) {
            result[prop] = objectA[prop];
        }
        for (var prop in objectB) {
            result[prop] = objectB[prop];
        }
        return result;
    }
  };
  if (ctx) {
    ctx.register( self );
  }
  return self;
});