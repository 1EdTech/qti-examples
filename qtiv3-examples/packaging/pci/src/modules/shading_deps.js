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

define([ "qtiCustomInteractionContext", "jquery", "eve", "raphael" ], function (ctx, $, eve, svg) {

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
     * @method getState
     * @return {String} The current state of this PCI. May be passed to
     * getInstance to later restore this PCI instance.
     */
    getState: function () {
      return JSON.stringify(this.state);
    },

    /** @access public
     * The type identifier allows custom interactions types to be identified in an item
     * Returned values are defined by the implementer.
     * Here, to minimise the risk of namespace collisions the implementation is
     * using an ID which includes a domain which they control (hmhco.com) */
    typeIdentifier: "urn:fdc:hmhco.com:pci:shading_deps",

    /** @access public */
    /** @method getInstance Create a new instance of this portable custom interaction
     *  Will be called by the qtiCustomInteractionContext
     *  @param {DOM Element} dom - the DOM Element this PCI is being added to
     *  @param {Object} configuration - the configuration to apply to this PCI
     *  @param {String} state - a previous saved state to apply to this instance.
     *  This must have been obtained from a prior call to getState on an
     *  instance of this type (same typeIdentifier)
     */
    getInstance: function (dom, configuration, state) {
        console.log("Creating new instance of " + this.typeIdentifier + ". Using jQuery " + $.fn.jquery);
        var newInstance = $.extend( {}, this );
        newInstance.config = $.extend({}, { onready: null, ondone: null }, configuration);

        newInstance.props = newInstance.getProperties();
        newInstance.dom = dom;
        if (state !== undefined) {
          newInstance._setState(state);
        } else {
            newInstance.initializeGrid();
        }
        newInstance.render();
        if (newInstance.config.onready !== undefined && newInstance.config.onready !== null) {
            newInstance.config.onready(newInstance, newInstance.getState());
        }

        return newInstance;
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
      var d = this.props.element_diameter;

      var numRows = this.getNumRows();
      var numCols = this.getNumCols();
      var gridWidth = Math.max(numRows * d, d);
      var gridHeight = Math.max(numCols * d, d);

      var interaction = $(this.dom);
      interaction.empty();
      var wrapper = $("<div></div>");
      interaction.append(wrapper);

      var workspace = svg(wrapper[0], gridWidth, gridHeight);

      for (var r = 0; r < numRows; r++) {
        var row = grid[r];
        for (var c = 0; c < row.length; c++) {
          var cell = this.generateCell(workspace, r, c, d, this.getFillColor(row[c]));
          if (this.isActive()) {
            this.attachClickEventListener(cell, r, c);
          }
        }
      }
      if (this.props.controls === "column" || this.props.controls === "full") {
          var buttonBox = $("<div></div>").css({ float: "left",
              padding: "5px",
              height:  gridHeight + "px", 
              width: gridWidth + "px"});
        var header = $("<div><strong>Columns</strong></div>");
        buttonBox.append(header);
        var moreButton = $("<button></button>").css("margin", "5px").text("More");
        moreButton.click( function () {
            this.addRow();
            this.render();
        }.bind(this));
        buttonBox.append(moreButton);

        var fewerButton = $("<button></button>").css("margin", "5px").text("Fewer");
        fewerButton.click( function () {
            this.removeRow();
            this.render();
        }.bind(this));
        buttonBox.append(fewerButton);

        wrapper.append(buttonBox);
      }
      if (this.props.controls === "row" || this.props.controls === "full") {
          var buttonBox = $("<div></div>").css({ float: "left",
              padding: "5px",
              clear: "both",
              height:  gridHeight + "px", 
              width: gridWidth + "px"});
        var header = $("<div><strong>Rows</strong></div>");
        buttonBox.append(header);
        var moreButton = $("<button></button>").css("margin", "5px").text("More");
        moreButton.click( function () {
            this.addColumn();
            this.render();
        }.bind(this));
        buttonBox.append(moreButton);

        var fewerButton = $("<button></button>").css("margin", "5px").text("Fewer");
        fewerButton.click( function () {
            this.removeColumn();
            this.render();
        }.bind(this));
        buttonBox.append(fewerButton);

        wrapper.append(buttonBox);
      }

      var footer = $("<p></p>").css("clear", "both");
      wrapper.append(footer);
    },
    
    oncompleted: function() {
        console.log(this.typeIdentifier + " completed.");
    },
    
    isActive: function () {
        return this.props.active !== "0";
    },
    
    /** @access protected 
     * @param {Element} cell - DOM Element to attack the click handler to 
     * @param {Number} row - row index of this cell in the grid
     * @param {Number} col - column index of this cell in the grid */
    attachClickEventListener: function(cell, row, col) {
        var grid = this.state.grid;
        cell.click(function (event) {
          var cell = event.currentTarget;

          var selection = grid[this.row][this.col];
          selection = (selection === 1) ? 0 : 1;
          cell.style.fill = this.shading.getFillColor(selection);
          grid[this.row][this.col] = selection;
        }.bind ( { shading: this, row: row, col: col } ));
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
    
    /** @access protected */
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
    
    /** @access protected */
    generateCell: function (workspace, row, column, diameter, fillColor) {
        var cell = workspace.rect(row * diameter, column * diameter, diameter, diameter);
        cell.attr({ "fill": fillColor,
        	          	"stroke": 'black'
                  });
        return cell;
    },
    
    /** @access protected */
    getNumShaded: function() {
      var grid = this.state.grid;
      var value = 0;
      var numRows = grid.length;
      for (var r = 0; r < numRows; r++) {
        var row = grid[r];
        for (var c = 0; c < row.length; c++) {
          if (row[c] === 1) {
            value += 1;
          }
        }
      }
      return value;
    },
        
    /** @access protected */
    getProperties: function() {
      return $.extend(true, {}, this.propertyDefaults, this.config.properties);
    }
  };
  if (ctx) {
    ctx.register( self );
  }
  return self;
});