/**
 * plotly-plot-behavior.js - Plotly.js capability for Polymer elements
 *
 * Copyright (c) 2015 Ginkgo Bioworks, Inc.
 * @license MIT
 */

/* eslint-env browser, amd */
/* global Polymer, Plotly, Promise */
(function _umd(global, factory) {
  // UMD Format for exports. Works with all module systems: AMD/RequireJS, CommonJS, and global
  var mod;

  // AMD
  if (typeof define === 'function' && define.amd) {
    define('PlotlyPlot', ['exports'], factory);
  } else if (typeof exports !== 'undefined') {
    factory(exports);
  } else {
    mod = {
      exports: {},
    };

    factory(mod.exports);
    global.PlotlyPlot = mod.exports;
  }
})(this, function _plotlyPlotUmdFactory(exports) {
  /**
   * Defines how `plotly-plot` elements interact with plotly.js
   *
   * To make your own element with your own extended behavior, import this
   * behavior into an element, and define the .getPlot() method to point to the
   * part of your local DOM that contains the plot div. By default, it will
   * use the element with the id `plot`.
   *
   * @polymerBehavior PlotlyPlot.PlotlyPlotBehavior
   */
  exports.PlotlyPlotBehavior = [Polymer.IronResizableBehavior, {
    properties: {
      /**
       * The data and parameters of each of the traces to be plotted. An
       * array of nested object that significantly depends on the plot type,
       * etc.
       *
       * @type {Array<Object>}
       * @default [{x: [], y: []}]
       *
       * @see the {@link https://plot.ly/javascript/reference/|plotly.js docs}
       */
      data: {
        type: Array,
        reflectToAttribute: true,
        notify: true,
        observer: '_autoRedraw',
        value: function () { return [{x: [], y: []}]; },
      },

      /**
       * Settings for the layout of the plot as  a whole:
       * width, height, title, etc.
       *
       * @type {Object}
       * @default {}
       *
       * @see the {@link https://plot.ly/javascript/reference/|plotly.js docs}
       */
      layout: {
        type: Object,
        reflectToAttribute: true,
        notify: true,
        observer: '_autoRelayout',
        value: function () { return {}; },
      },

      /**
       * Top-level configurations for features in the library: whether or
       * not to show the toolbar, plot.ly icon, whether or not to make the
       * plot static, etc.
       *
       * @type {Object}
       * @default {}
       *
       * @see the {@link https://plot.ly/javascript/reference/|plotly.js docs}
       */
      config: {
        type: Object,
        reflectToAttribute: true,
        notify: true,
        observer: '_autoRedraw',
        value: function () { return {}; },
      },

      /**
       * If true, manually update the plot instead of having it automatically
       * redraw itself on property changes (the default).
       *
       * @type {boolean}
       * @default false
       */
      manual: {
        type: Boolean,
        reflectToAttribute: true,
        notify: true,
        value: false,
      },

      /**
       * How often to allow automatic update events to fire. At most one such
       * event will happen every this number of milliseconds.
       *
       * @type {number}
       * @default 30
       */
      debounceInterval: {
        type: Number,
        value: 30,
      },
    },

    observers: [
      // Redraw the plot after any of the nested data in the properties change
      '_autoRedraw(data.*)',
      '_autoRedraw(layout.*)',
      '_autoRedraw(config.*)',
    ],

    listeners: {
      // Listen for the `iron-resize` event to implement fluid resizing.
      'iron-resize': '_onIronResize',
    },


    // Manage life cycle events

    /**
     * When the element is attached, create the plot and bind the Polymer
     * wrapper events to the plotly custom events.
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the asynchronous plot creation that resolves to the
     *  Polymer element.
     */
    attached: function () {
      var self = this;
      // Fire Polymer events in accordance with the plotly.js ones as well.
      // These event handlers need to be bound to variables because of
      // event binding and unbinding upon attach/detach/reattach

      /**
       * Custom plotly-specific click event for tracking clicks on the chart.
       *
       * @event plotly-click
       * @see the {@link https://plot.ly/javascript/plotlyjs-events/|events reference}
       */
      self._onPlotlyClick = function (data) {
        return self.fire('plotly-click', {data: data});
      };

      /**
       * Custom plotly-specific event for tracking hovers on the chart.
       * Fires before the hover happens.
       *
       * @event plotly-beforehover
       * @see the {@link https://plot.ly/javascript/hover-events/|hover events tutorial}
       */
      self._onPlotlyBeforehover = function (data) {
        return self.fire('plotly-beforehover', {data: data});
      };

      /**
       * Custom plotly-specific event for tracking hovers on the chart.
       * Fires during the hover.
       *
       * @event plotly-hover
       * @see the {@link https://plot.ly/javascript/hover-events/|hover events tutorial}
       */
      self._onPlotlyHover = function (data) {
        return self.fire('plotly-hover', {data: data});
      };

      /**
       * Custom plotly-specific event for tracking hovers on the chart.
       * Fires when the hover ends.
       *
       * @event plotly-unhover
       * @see the {@link https://plot.ly/javascript/hover-events/|hover events tutorial}
       */
      self._onPlotlyUnhover = function (data) {
        return self.fire('plotly-unhover', {data: data});
      };

      return Plotly.newPlot(
        self.getPlot(), self.data, self.layout, self.config
      ).then(function (plotDiv) {
        // Attach the polymer events to the plotly events.
        plotDiv.on('plotly_click', self._onPlotlyClick);
        plotDiv.on('plotly_beforehover', self._onPlotlyBeforehover);
        plotDiv.on('plotly_hover', self._onPlotlyHover);
        plotDiv.on('plotly_unhover', self._onPlotlyUnhover);

        return self;
      });
    },

    /**
     * When the element is detached, remove the attached Polymer events.
     */
    detached: function () {
      // Protect detaching listeners in an if statement, because
      // `removeListener` is plotly.js functionality, which is removed
      // if .purge is called before the element is detached.
      if (typeof this.getPlot().removeListener === 'function') {
        this.getPlot().removeListener('plotly_click', this._onPlotlyClick);
        this.getPlot().removeListener('plotly_beforehover', this._onPlotlyBeforehover);
        this.getPlot().removeListener('plotly_hover', this._onPlotlyHover);
        this.getPlot().removeListener('plotly_unhover', this._onPlotlyUnhover);
      }

      return;
    },


    // Manage other events

    /**
     * Resize the plot when the containing element is resized.
     *
     * @listens {iron-resize} Listens for the iron-resize event
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the resize action that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://plot.ly/javascript/responsive-fluid-layout/|plotly.js fluid layout reference}
     */
    _onIronResize: function () {
      return this.resize();
    },


    // Controlled access to the plot itself

    /**
     * Get the element that holds the plot itself
     *
     * @return {HTMLElement} the plot element
     */
    getPlot: function () {
      return this.$.plot;
    },


    // Generic implementation of any Plotly function

    /**
     * Return the value of a path on the Plotly object, or undefined if no
     * such path exists.
     *
     * Amounts to a safe way to call `eval('Plotly.' + path)`.
     *
     * @param {string=} path
     *  the path to find; if missing, just return the Plotly object itself
     *
     * @returns {*} Whatever is located at Plotly.`path`
     *
     * @throws {TypeError} if a non-string value is passed.
     */
    getPlotly: function (path) {
      if (typeof path === 'undefined') {
        return Plotly;
      } else if (typeof path !== 'string') {
        throw new TypeError('Must pass string as path');
      } else {
        return this.get(path, Plotly);
      }
    },

    /**
     * Call a function in the Plotly namespace by name, passing the plot div
     * as the first parameter, or call any function passed in with the plot
     * div as its first parameter.
     *
     * This method should _not_ be used to call functions like `redraw` or
     * `relayout`, for which methods already exist. This is instead useful
     * for a convenient way to access low-level or "beta," functionality,
     * such as the undo/redo queue. There are many functions implemented in
     * this way in the Plotly.js API that are effectively ready to use, but
     * have not been set in stone in the top-level API and documented in the
     * function reference yet.
     *
     * Caveat emptor. Plotly.js itself describes these functions as in beta,
     * and warns that you  use them at your own risk. This method enforces
     * basic consistency by throwing errors when you send something of the
     * wrong, type or null, returning the Polymer element instead of the plot
     * div, and updating the element properties after every call, but it
     * cannot be robust enough to account for everything the plotly.js source
     * exposes, and calling functions that are too low-level without doing
     * the appropriate surrounding work is a sure-fire way to get in trouble.
     * Make sure you know what you are doing, and expect that updates to
     * plotly might break it.
     *
     * @example <caption>Calling the 'undo' method</caption>
     * var pplot = document.querySelector('plotly-plot');
     * // string API
     * pplot.call('Queue.undo')
     * // function API
     * pplot.call(Plotly.Queue.undo)
     * // either way amounts to basically doing the following:
     * Plotly.queue.undo(pplot.getPlot())
     *
     * @param {!string|function} func
     *  the path to the function to call, or the function itself
     * @param {*...} args
     *  arguments to pass to the method, if any
     *
     * @returns {*|Promise<*>}
     *  if the function returns a promise, update the element properties
     *  (data, layout, config) from the plot, in case they've changed after
     *  the promise resolves. If the promise resolves to the plot div, make
     *  that promise resolve to the element instead. Otherwise, just return
     *  whatever the plot resolves to.
     *
     * @throws {ReferenceError}
     *  if it can't find the function or you give it nothing
     * @throws {TypeError}
     *  if what it finds isn't a function or you give invalid input
     *
     * @see the {@link https://github.com/plotly/plotly.js/blob/master/src/|plotly.js source}
     */
    call: function (func) {
      var self = this;
      var requestedFunc;
      var args;
      var returnValue;

      // Check the sanity of the passed-in argument
      if (!func) {
        throw new ReferenceError('Must pass in a non-empty function name or path');
      }

      if (typeof func === 'string') {
        requestedFunc = self.getPlotly(func);
      } else if (typeof func === 'function') {
        requestedFunc = func;
      } else {
        throw new TypeError('Must pass a function or a path to one inside Plotly namespace');
      }

      if (typeof requestedFunc === 'undefined') {
        throw new ReferenceError('No function with the path "' + func + '" found');
      } else if (typeof requestedFunc !== 'function') {
        throw new TypeError('The path "' + func + '" does not resolve to a function');
      }

      if (requestedFunc.length < 1) {
        throw new TypeError('The function "' + func + '" does not take a plot div argument');
      }

      // If we've gotten here, we can be confident that requestedFunc is a
      // valid function that takes at least one parameter.

      // Pull everything after the first argument into an array for an
      // .apply call, and prepend the plot div to it
      args = Array.prototype.slice.call(arguments, 1);
      args.unshift(self.getPlot());

      // Call the function and store its return value
      returnValue = requestedFunc.apply(self.getPlot(), args);

      // Special promise-handling logic which we can do safely
      if (returnValue && typeof returnValue.then === 'function') {
        return returnValue.then(function (resolvedValue) {
          // Upddate the element properties to reflect any changes done to
          // the plot div by requestedFunc.
          self._safeUpdateProps(function () {
            self.data = self.getPlot().data;
            self.layout = self.getPlot().layout;
            self.config = self.getPlot().config;
          });

          // Like our other methods, if requestedFunc resolves to the plot
          // div, resolve to the element itself instead.
          if (resolvedValue === self.getPlot()) {
            return self;
          } else {
            return resolvedValue;
          }
        });
      } else {
        return (returnValue === self.getPlot() ? self : returnValue);
      }
    },


    // Update the plot to reflect new data

    /**
     * Redraw the plot using the current state of the widget's properties.
     *
     * This should happen automatically if you use `.set`, but if you want to
     * do a lot of manipulation in multiple steps and then redraw at the end,
     * call this method.
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the asynchronous plot update that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://plot.ly/javascript/plotlyjs-function-reference/|plotly.js function reference}
     */
    redraw: function () {
      var self = this;

      // XXX For some reason, this class gets removed and plotly.js complains
      self.toggleClass('js-plotly-plot', true, self.getPlot());

      // Set the plot data, layout, and config state to reflect the current
      // state of the polymer properties
      self.getPlot().data = self.data;
      self.getPlot().layout = self.layout;
      self.getPlot().config = self.config;

      return Plotly.redraw(self.getPlot()).then(function () {
        // Remove any tasks waiting to go; prevent any further debounced
        // redraws
        self.cancelDebouncer('autoRedraw');

        return self;
      });
    },

    /**
     * Automatically redraw the plot on data updates, if not manual.
     * Debounces the .redraw call.
     */
    _autoRedraw: function () {
      var self = this;

      if (typeof self.manual !== 'undefined' && !self.manual) {
        // Limit the frequency of redraw tasks by putting them in a
        // debounce queue
        self.debounce(
          'autoRedraw',
          function () { return self.redraw(); },
          self.debounceInterval
        );
      }

      return;
    },

    /**
     * Update the properties of the object object without triggering any
     * automatic actions they might be bound to, by turning on the 'manual'
     * flag temporarily
     *
     * @param {function (Polymer.Base, boolean, boolean): Promise<*>|<*>} updateAction
     *  the action to take; if asynchronous, should return a Promise. Otherwise,
     *  a typical value, or void, is fine. The function is passed the element,
     *  followed by the current and former states of the manual flag.
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise that resolves to the element when the manual flag has been
     *  returned to its original value
     */
    _safeUpdateProps: function (updateAction) {
      var self = this;
      var oldManual;

      return new Promise(function (resolve, _reject) {
        oldManual = self.manual;
        self.manual = true;
        resolve();
      }).then(function () {
        return updateAction(self, self.manual, oldManual);
      }).then(function () {
        self.manual = oldManual;
        return self;
      });
    },


    /**
     * Restyle the plot with updates to all (or a specified subset of) the
     * traces. Will update the plot's `data` property with the effective
     * resulting changes.
     *
     * @param {Object<string,*|Array>} style
     *  an object whose keys are normal trace keys, and whose values are
     *  either regular keys, or array versions of the normal trace object
     *  values: one value in the array will be applied to each of the traces
     *  in the `traceIndices` argument.
     * @param {number|Array<number>} traceIndices
     *  a single index, or an array of indices of traces (the elements of
     *  `.data`) on which to apply the styles
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the asynchronous plot update that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://plot.ly/javascript/plotlyjs-function-reference/|plotly.js function reference}
     */
    restyle: function (style, traceIndices) {
      var self = this;

      return Plotly.restyle(self.getPlot(), style, traceIndices)
        .then(function (plotDiv) {
          // Update the Polymer properties to reflect the updated data without
          // triggering any new relayout calls.
          return self._safeUpdateProps(function () {
            self.data = plotDiv.data;
          });
        });
    },

    /**
     * Update the plot layout. Will update the plot's `layout` property
     * with the effective resulting changes.
     *
     * @param {Object} layoutUpdate
     *  the data to change in the `layout` property
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the asynchronous plot update that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://plot.ly/javascript/plotlyjs-function-reference/|plotly.js function reference}
     */
    relayout: function (layoutUpdate) {
      var self = this;

      return Plotly.relayout(self.getPlot(), layoutUpdate)
        .then(function (plotDiv) {
          // Remove any debounced relayout tasks waiting to go;
          // prevent any further relayouts
          self.cancelDebouncer('autoRelayout');

          // Update the Polymer properties to reflect the updated data without
          // triggering any new relayout calls.
          return self._safeUpdateProps(function () {
            self.layout = plotDiv.layout;
          });
        });
    },

    /**
     * Automatically redraw the plot on layout updates, unless `manual` is
     * set. Debounces the `.relayout` call.
     *
     * @param {Object} layoutUpdate
     *  the data to change in the `layout` property
     */
    _autoRelayout: function (layoutUpdate) {
      var self = this;

      if (typeof self.manual !== 'undefined' && !self.manual) {
        // Limit the frequency of relayout tasks by putting them in a
        // debounce queue
        self.debounce(
          'autoRelayout',
          function () { self.relayout(layoutUpdate); },
          self.debounceInterval
        );
      }

      return;
    },

    /**
     * Resize the plot to fit in its container.
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the resize action that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://plot.ly/javascript/responsive-fluid-layout/|plotly.js fluid layout reference}
     */
    resize: function () {
      var self = this;

      return Plotly.Plots.resize(self.getPlot()).then(function () {
        return self;
      });
    },

    /**
     * Update the data and layout simultaneously by passing in parameters
     *
     * @param {Object} traceUpdate
     *  attribute object `{astr1: val1, astr2: val2 ...}`
     *  corresponding to updates in the plot's traces
     * @param {Object=} layoutUpdate
     *  attribute object `{astr1: val1, astr2: val2 ...}`
     *  corresponding to updates in the plot's layout
     * @param {number|Array<number>=} traces
     *  integer or array of integers for the traces to alter (all if omitted)
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the asynchronous plot update that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_api.js#L2148|plotly.js source}
     */
    update: function (traceUpdate, layoutUpdate, traces) {
      var self = this;

      return Plotly.update(self.getPlot(), traceUpdate, layoutUpdate, traces)
        .then(function (plotDiv) {
          // Remove any debounced relayout tasks waiting to go;
          // prevent any further relayouts
          self.cancelDebouncer('autoRelayout');

          // Update the Polymer properties to reflect the updated data without
          // triggering any new relayout calls.
          return self._safeUpdateProps(function () {
            self.layout = plotDiv.layout;
            self.data = plotDiv.data;
          });
        });
    },

    // Animation

    /**
     * Animate to a frame, sequence of frames, frame group, or frame
     * definition
     *
     * @param {string|Object|Array<string|Object>} frames
     *  a single frame, array of frames, or group to which to animate. The
     *  intent is inferred by the type of the input. Valid inputs are:
     *
     *  - string, e.g. 'groupname': animate all frames of a given `group` in
     *    the order in which they are defined via `Plotly.addFrames`.
     *  - array of strings, e.g. ['frame1', frame2']: a list of frames by
     *    name to which to animate in sequence
     *  - object, e.g. {data: ...}: a frame definition to animate. The frame
     *    is not and does not need to be added via `Plotly.addFrames`. It may
     *    contain any of the properties of a frame, including `data`,
     *    `layout`, and `traces`. The frame is used as provided and does not
     *    use the `baseframe` property.
     *  - array of objects, e.g. [{data: ...}, {data: ...}]: a list of frame
     *    objects each following the same rules as a single object.
     *
     * @param {Object} options
     *  configuration for the animation
     *
     * @returns {Promise}
     *  when the animation completes
     *
     * @see the {@link https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_api.js|plotly.js source}
     */
    animate: function (frames, options) {
      return this.call('animate', frames, options);
    },

    /**
     * @typedef {Object} FrameDef
     * @property {string} name name of frame to add
     * @property {Array<Object>} data trace data
     * @property {Object} layout layout definition
     * @property {Array<number>} traces trace indices
     * @property {string} baseframe name of frame from which this frame gets
     *                              defaults
     */

    /**
     * Register new frames
     *
     * @param {Array<FrameDef>} frames
     *  list of frame definitions
     *
     * @param {Array<number>} indices
     *  an array of integer indices matching the respective frames in
     *  `frames`. If not provided, an index will be provided in serial
     *  order. If already used, the frame will be overwritten.
     *
     * @returns {Promise}
     *  when the frame changes complete
     *
     * @see the {@link https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_api.js|plotly.js source}
     */
    addFrames: function (frames, indices) {
      return this.call('addFrames', frames, indices);
    },

    /**
     * Register new frames
     *
     * @param {Array<number>} indices
     *  an array of integer frame indices to delete
     *
     * @returns {Promise}
     *  when the frame changes complete
     *
     * @see the {@link https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_api.js|plotly.js source}
     */
    deleteFrames: function (indices) {
      return this.call('deleteFrames', indices);
    },


    // Manipulate traces

    /**
     * Add traces to the plot in the specified indices, if provided.
     *
     * @param {(Object|Array<Object>)} traces
     *  an individual trace, as an object of trace information, or an array
     *  of those traces
     * @param {(number|Array<number>)=} traceIndices
     *  an individual index or an array of indices specifying where to add
     *  the traces
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the asynchronous plot update that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://plot.ly/javascript/plotlyjs-function-reference/|plotly.js function reference}
     */
    addTraces: function (traces, traceIndices) {
      var self = this;

      return Plotly.addTraces(self.getPlot(), traces, traceIndices)
        .then(function (plotDiv) {
          // Update the Polymer properties to reflect the updated data without
          // triggering any new relayout calls.
          return self._safeUpdateProps(function () {
            self.data = plotDiv.data;
          });
        });
    },

    /**
     * Delete the specified traces from the plot.
     *
     * @param {(number|Array<number>)=} traceIndices
     *  an individual index or an array of indices specifying which traces to
     *  delete
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the asynchronous plot update that resolves to the
     *  Polymer element.

     * @see the {@link https://plot.ly/javascript/plotlyjs-function-reference/|plotly.js function reference}
     */
    deleteTraces: function (traceIndices) {
      var self = this;

      return Plotly.deleteTraces(self.getPlot(), traceIndices)
        .then(function (plotDiv) {
          // Update the Polymer properties to reflect the updated data without
          // triggering any new relayout calls.
          return self._safeUpdateProps(function () {
            self.data = plotDiv.data;
          });
        });
    },

    /**
     * Move a specified set of traces from the plot to a newly specified set
     * of destination trace positions.
     *
     * @param {(number|Array<number>)} traceIndicesFrom
     *  an individual index or an array of indices specifying which traces to
     *  move
     * @param {(number|Array<number>)} traceIndicesTo
     *  an individual index or an array of indices specifying where the
     *  traces should move
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the asynchronous plot update that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://plot.ly/javascript/plotlyjs-function-reference/|plotly.js function reference}
     */
    moveTraces: function (traceIndicesFrom, traceIndicesTo) {
      var self = this;

      return Plotly.moveTraces(self.getPlot(), traceIndicesFrom, traceIndicesTo)
        .then(function (plotDiv) {
          // Update the Polymer properties to reflect the updated data without
          // triggering any new relayout calls.
          return self._safeUpdateProps(function () {
            self.data = plotDiv.data;
          });
        });
    },

    /**
     * Extend traces at indices with update arrays, window trace lengths to
     * maxPoints
     *
     * .extend and .prepend have identical APIs. Prepend inserts an array at
     * the head while Extend inserts an array off the tail. Prepend truncates
     * the tail of the array, counting maxPoints from the head, whereas
     * Extend truncates the head of the array, counting backward maxPoints
     * from the tail.
     *
     * If maxPoints is undefined, nonNumeric, negative or greater than the
     * extended trace length, no truncation / windowing will be performed.
     * If it's zero, the whole trace is truncated.
     *
     * @param {Object} update
     *  the key:array map of target attributes to extend
     * @param {number|Array<number>} indices
     *  the locations of traces to be extended
     * @param {number=} maxPoints
     *  number of points for trace window after lengthening.
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the asynchronous plot update that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_api.js|plotly.js source}
     */
    extendTraces: function (update, indices, maxPoints) {
      var self = this;

      return Plotly.extendTraces(self.getPlot(), update, indices, maxPoints)
        .then(function (plotDiv) {
          // Update the Polymer properties to reflect the updated data without
          // triggering any new relayout calls.
          return self._safeUpdateProps(function () {
            self.data = plotDiv.data;
          });
        });
    },

    /**
     * Prepend traces at indices with update arrays, window trace lengths to
     * maxPoints
     *
     * .extend and .prepend have identical APIs. Prepend inserts an array at
     * the head while Extend inserts an array off the tail. Prepend truncates
     * the tail of the array, counting maxPoints from the head, whereas
     * Extend truncates the head of the array, counting backward maxPoints
     * from the tail.
     *
     * If maxPoints is undefined, nonNumeric, negative or greater than the
     * extended trace length, no truncation / windowing will be performed.
     * If it's zero, the whole trace is truncated.
     *
     * @param {Object} update
     *  the key:array map of target attributes to extend
     * @param {number|Array<number>} indices
     *  the locations of traces to be extended
     * @param {number=} maxPoints
     *  number of points for trace window after lengthening.
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the asynchronous plot update that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_api.js|plotly.js source}
     */
    prependTraces: function (update, indices, maxPoints) {
      var self = this;

      return Plotly.prependTraces(self.getPlot(), update, indices, maxPoints)
        .then(function (plotDiv) {
          // Update the Polymer properties to reflect the updated data without
          // triggering any new relayout calls.
          return self._safeUpdateProps(function () {
            self.data = plotDiv.data;
          });
        });
    },

    /**
     * Clear all plots and snapshots.
     *
     * @returns {Polymer.Base} the current element
     *
     * @returns {Promise<Polymer.Base>}
     *  a Promise for the purge that resolves to the
     *  Polymer element.
     *
     * @see the {@link https://plot.ly/javascript/plotlyjs-function-reference/|plotly.js function reference}
     */
    purge: function () {
      var self = this;

      return Promise.resolve(
        Plotly.purge(self.getPlot())
      ).then(function () {
        // Safely clear all the properties
        return self._safeUpdateProps(function () {
          self.getPlot().data = [];
          self.data = [];

          self.getPlot().layout = {};
          self.layout = {};
        });
      });
    },


    // Image rendering

    /**
     * Render the plot as an image, via a data URL
     *
     * @param {Object} opts option object
     * @param {string} opts.format 'jpeg' | 'png' | 'webp' | 'svg'
     * @param {number} opts.width width of snapshot in px
     * @param {number} opts.height height of snapshot in px
     *
     * @returns {Promise<string>}
     *  promise that resolves to the dataUrl of the resulting image when the
     *  rendering is finished
     *
     * @see the {@link https://plot.ly/javascript/plotlyjs-function-reference/|plotly.js function reference}
     */
    toImage: function (opts) {
      return Plotly.toImage(this.getPlot(), opts);
    },

    /**
     * Render the plot as an image and prompt to download it
     *
     * @param {Object} opts option object
     * @param {string} opts.format 'jpeg' | 'png' | 'webp' | 'svg'
     * @param {number} opts.width width of snapshot in px
     * @param {number} opts.height height of snapshot in px
     *
     * @returns {Promise<string>}
     *  promise that resolves to the dataUrl of the resulting image when the
     *  rendering is finished
     *
     * @see the {@link https://plot.ly/javascript/plotlyjs-function-reference/|plotly.js function reference}
     */
    downloadImage: function (opts) {
      return Plotly.downloadImage(this.getPlot(), opts);
    },


    // Validation

    /**
     * @typedef {Object} ValidationError
     * @property {string} code
     *  error code ('object', 'array', 'schema', 'unused', 'invisible' or 'value')
     * @property {string} container
     *  container where the error occurs ('data' or 'layout')
     * @property {number} trace
     *  trace index of the 'data' container where the error occurs
     * @property {array} path
     *  nested path to the key that causes the error
     * @property {string} astr
     *  attribute string variant of 'path' compatible with Plotly.restyle and
     *  Plotly.relayout.
     * @property {string} msg
     *  error message (shown in console if 'logger' config argument is enabled)
     */

    /**
     * Validate the provided layout and data properties, defaulting to those
     * of the of the plot element if none are provided. Does not change the
     * properties of the plot.
     *
     * @param {Array<Object>=} data
     *  the data that would go in the `data` property; if falsey, use the
     *  plot's data property
     * @param {Object=} layout
     *  the data that would go in the `layout` property; if falsey, use the
     *  plot's data property
     *
     * @returns {Array<ValidationError>|undefined}
     *  an array of error objects; undefined if no errors found
     *
     * @see the {@link https://github.com/plotly/plotly.js/blob/master/src/plot_api/validate.js#L42|plotly.js source}
     */
    validate: function (data, layout) {
      return Plotly.validate(data || this.data, layout || this.layout);
    },
  }];

  return exports;
});
