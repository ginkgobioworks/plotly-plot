describe('<plotly-plot>', function () {
  'use strict';

  var hardcodedPlot;
  var emptyPlot;
  var sandbox;
  var timeout = 100;

  // Convenience method for throwing errors when promises reject
  function fail(err) { throw new Error(err); }

  hardcodedPlot = fixture('plotly-plot-fixture-hardcoded')
    .querySelector('#hard-coded-plot');
  emptyPlot = fixture('plotly-plot-fixture-empty');

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });


  describe('#redraw', function () {
    beforeEach(function () {
      hardcodedPlot = fixture('plotly-plot-fixture-hardcoded')
        .querySelector('#hard-coded-plot');
      emptyPlot = fixture('plotly-plot-fixture-empty');
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('does not throw an error for ' + polymerPlot.id, function () {
        expect(polymerPlot.redraw.bind(hardcodedPlot)).to.not.throw();
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('updates the data idempotently for ' + polymerPlot.id, function () {
        var values = [4, 11, 23, 14];
        polymerPlot.set('data.0.x', values);
        expect(polymerPlot.$.plot.data[0].x).to.deep.equal(values);
        polymerPlot.redraw();
        expect(polymerPlot.$.plot.data[0].x).to.deep.equal(values);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('redraws on data update for ' + polymerPlot.id, function (done) {
        var values = [4, 11, 23, 14];
        var redraw = sandbox.spy(polymerPlot, 'redraw');

        polymerPlot.set('data.0.x', values);
        setTimeout(function () {
          expect(redraw.called).to.be.ok;
          done();
        }, timeout);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('redraws on nested layout update for ' + polymerPlot.id, function (done) {
        var redraw = sandbox.spy(polymerPlot, 'redraw');
        polymerPlot.set('layout.title', 'New title');
        setTimeout(function () {
          expect(redraw.called).to.be.ok;
          done();
        }, timeout);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('redraws on nested config update for ' + polymerPlot.id, function (done) {
        var redraw = sandbox.spy(polymerPlot, 'redraw');
        polymerPlot.set('config.showLink', false);
        setTimeout(function () {
          expect(redraw.called).to.be.ok;
          done();
        }, timeout);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('does not redraw in manual mode for ' + polymerPlot.id, function () {
        var redraw;
        var values = [4, 11, 23, 14];
        polymerPlot.manual = true;
        redraw = sandbox.spy(polymerPlot, 'redraw');

        return new Promise(function (resolve) {
          polymerPlot.set('data.0.x', values);

          setTimeout(function () {
            expect(redraw.called).to.not.be.ok;
            resolve();
          }, timeout);
        }).then(function () {
          return new Promise(function (resolve) {
            polymerPlot.set('layout.title', 'New title');

            setTimeout(function () {
              expect(redraw.called).to.not.be.ok;
              resolve();
            }, timeout);
          });
        }).then(function () {
          return new Promise(function (resolve) {
            polymerPlot.set('config.showLink', false);

            setTimeout(function () {
              expect(redraw.called).to.not.be.ok;
              resolve();
            }, timeout);
          });
        }).catch(fail);
      });
    });
  });

  describe('#restyle', function () {
    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('updates all traces by default for ' + polymerPlot.id, function () {
        return polymerPlot.restyle({mode: 'lines'})
          .then(function (resolvedPolymerPlot) {
            _.forEach(resolvedPolymerPlot.data, function (trace) {
              expect(trace.mode).to.equal('lines');
            });
          }).catch(fail);
      });
    });

    it('updates specific traces by index', function () {
      return hardcodedPlot.restyle({mode: 'scatter'}, 0)
        .then(function (polymerPlot) {
          expect(polymerPlot.data[0].mode).to.equal('scatter');
          expect(polymerPlot.data[2].mode).to.not.equal('scatter');
        }).catch(fail);
    });

    it('updates specific traces by index list', function () {
      var traceIndices = [0, 2];

      return Promise.all([
        hardcodedPlot.restyle({mode: 'lines'}, traceIndices),
        hardcodedPlot.restyle({mode: 'markers'}, 1),
      ]).then(function (polymerPlots) {
        // Both elements of polymerPlots are the same element: hardcodedPlot

        _.forEach(traceIndices, function (traceIndex) {
          expect(polymerPlots[0].data[traceIndex].mode).to.equal('lines');
        });
        expect(polymerPlots[0].data[1].mode).to.equal('markers');
      }).catch(fail);
    });
  });

  describe('#relayout', function () {
    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('updates the layout property for ' + polymerPlot.id, function () {
        var newTitle = 'Some other new title';
        return polymerPlot.relayout({
          title: newTitle,
        }).then(function (resolvedPolymerPlot) {
          expect(resolvedPolymerPlot.layout.title).to.equal(newTitle);
        }).catch(fail);
      });
    });
  });

  describe('#resize', function () {
    beforeEach(function () {
      hardcodedPlot = fixture('plotly-plot-fixture-hardcoded')
        .querySelector('#hard-coded-plot');

      // Remove fixed size from layout properties
      hardcodedPlot.layout = {title: 'AutoResize Plot'};
    });

    it('changes the size when called', function () {
      expect(hardcodedPlot.layout.width).to.be.undefined;
      hardcodedPlot.parentNode.style.width = '1000px';
      expect(hardcodedPlot.parentNode.offsetWidth).to.equal(1000);

      expect(
        hardcodedPlot.$.plot
        .querySelector('div.svg-container').offsetWidth
      ).to.equal(480);

      return hardcodedPlot.resize().then(function () {
        expect(
          hardcodedPlot.$.plot
          .querySelector('div.svg-container').offsetWidth
        ).to.equal(1000);
      }).catch(fail);
    });

    it('changes the size when called via event', function (done) {
      expect(hardcodedPlot.layout.width).to.be.undefined;
      hardcodedPlot.parentNode.style.width = '1000px';
      expect(hardcodedPlot.parentNode.offsetWidth).to.equal(1000);

      expect(
        hardcodedPlot.$.plot
        .querySelector('div.svg-container').offsetWidth
      ).to.equal(480);

      hardcodedPlot.fire('iron-resize');

      // Call with setTimeout to put it in the event loop after the event
      // fires and its consequences are realized
      setTimeout(function () {
        expect(
          hardcodedPlot.$.plot
          .querySelector('div.svg-container').offsetWidth
        ).to.equal(1000);
        done();
      }, timeout);
    });
  });

  describe('#update', function () {
    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('does nothing with a null update for ' + polymerPlot.id, function () {
        return polymerPlot.update().then(function (resolvedPolymerPlot) {
          expect(resolvedPolymerPlot).to.be.ok;
        }).catch(fail);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('updates the layout and data properties for ' + polymerPlot.id, function () {
        var newTitle = 'Some other new title';
        return polymerPlot.update({
          mode: 'lines',
        }, {
          title: newTitle,
        }).then(function (resolvedPolymerPlot) {
          // Layout update
          expect(resolvedPolymerPlot.layout.title).to.equal(newTitle);

          // Trace style update
          _.forEach(resolvedPolymerPlot.data, function (trace) {
            expect(trace.mode).to.equal('lines');
          });
        }).catch(fail);
      });
    });
  });

  describe('#getPlotly', function () {
    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('returns direct properties for ' + polymerPlot.id, function () {
        expect(polymerPlot.getPlotly('redraw')).to.equal(Plotly.redraw);
        expect(polymerPlot.getPlotly('version')).to.equal(Plotly.version);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('returns nested properties for ' + polymerPlot.id, function () {
        expect(polymerPlot.getPlotly('Queue.undo')).to.equal(Plotly.Queue.undo);
        expect(polymerPlot.getPlotly('Icons.camera')).to.equal(Plotly.Icons.camera);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('returns undefined for nonexistand paths for ' + polymerPlot.id, function () {
        expect(polymerPlot.getPlotly('Tizzlemat')).to.be.undefined;
        expect(polymerPlot.getPlotly('Bazzlefruit.undo')).to.be.undefined;
        expect(polymerPlot.getPlotly('Miltafrozz.mcslavabarad')).to.be.undefined;
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('returns undefined for the null path for ' + polymerPlot.id, function () {
        expect(polymerPlot.getPlotly('')).to.be.undefined;
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('returns the Plotly object with no parameters for ' + polymerPlot.id, function () {
        expect(polymerPlot.getPlotly()).to.equal(Plotly);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('throws a type errow with non-string input for ' + polymerPlot.id, function () {
        expect(function () { polymerPlot.getPlotly(3); })
        .to.throw(TypeError);
      });
    });
  });

  describe('#call', function () {
    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('throws a ReferenceError if given something falsey for ' + polymerPlot.id, function () {
        expect(function () { polymerPlot.call(''); })
        .to.throw(ReferenceError, /non-empty/);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('throws a TypeError if given something besides a string or function for ' + polymerPlot.id, function () {
        expect(function () { polymerPlot.call(3); })
        .to.throw(TypeError, /Must pass a function/);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('throws a ReferenceError if given a nonexistent path for ' + polymerPlot.id, function () {
        expect(function () { polymerPlot.call('fsasfaa90nafa'); })
        .to.throw(ReferenceError, /No function with/);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('throws a TypeError if given a non-function path for ' + polymerPlot.id, function () {
        expect(function () { polymerPlot.call('Icons.camera'); })
        .to.throw(TypeError, /does not resolve to a function/);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('throws a TypeError if given a function that takes no params for ' + polymerPlot.id, function () {
        expect(function () { polymerPlot.call('toString'); })
        .to.throw(TypeError, /does not take a plot div/);
        expect(function () { polymerPlot.call(function () { return; }); })
        .to.throw(TypeError, /does not take a plot div/);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('passes the arguments and plot div to the function for ' + polymerPlot.id, function () {
        expect(polymerPlot.call(
          function (_gd) { return Array.prototype.slice.call(arguments); }, 1, 'b', 3
        )).to.deep.equal([polymerPlot.$.plot, 1, 'b', 3]);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('returns a simple value if the function returns one for ' + polymerPlot.id, function () {
        expect(polymerPlot.call(function (_gd) { return 'somevalue'; }))
        .to.equal('somevalue');

        expect(polymerPlot.call(function (_gd) { return ''; }))
        .to.equal('');

        expect(polymerPlot.call(function (_gd) { return null; }))
        .to.equal(null);

        expect(polymerPlot.call(function (_gd) { return; }))
        .to.be.undefined;
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('returns the plot element instead of the div for ' + polymerPlot.id, function () {
        expect(polymerPlot.call(function (gd) { return gd; }))
        .to.equal(polymerPlot);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('resolves to a simple value if the function resolves to one for ' + polymerPlot.id, function () {
        return Promise.all([
          polymerPlot.call(function (_gd) { return Promise.resolve('somevalue'); })
          .then(function (result) { expect(result).to.equal('somevalue'); }),
          polymerPlot.call(function (_gd) { return Promise.resolve(''); })
          .then(function (result) { expect(result).to.equal(''); }),
          polymerPlot.call(function (_gd) { return Promise.resolve(''); })
          .then(function (result) { expect(result).to.equal(''); }),
          polymerPlot.call(function (_gd) { return Promise.resolve(null); })
          .then(function (result) { expect(result).to.equal(null); }),
          polymerPlot.call(function (_gd) { return Promise.resolve(undefined); })
          .then(function (result) { expect(result).to.be.undefined; }),
        ]).catch(fail);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('resolves to the plot element instead of the div for ' + polymerPlot.id, function () {
        return polymerPlot.call(function (gd) { return Promise.resolve(gd); })
        .then(function (result) { expect(result).to.equal(polymerPlot); })
        .catch(fail);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('calls the intended function for ' + polymerPlot.id, function () {
        var deleteTraces = sandbox.spy(Plotly, 'restyle');
        return polymerPlot.call('restyle', 'marker.symbol', 'square').then(function () {
          expect(deleteTraces.withArgs(polymerPlot.$.plot, 'marker.symbol', 'square').calledOnce).to.be.ok;
        });
      });
    });
  });

  describe('#addTraces', function () {
    var newTrace;

    beforeEach(function () {
      newTrace = {
        x: [1, 2, 3, 4],
        y: [22, 9, 5, 11],
        mode: 'lines+markers',
        type: 'scatter',
      };
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('adds individual traces to the end by default for ' + polymerPlot.id, function () {
        return polymerPlot.addTraces(newTrace).then(function (resolvedPolymerPlot) {
          var data = resolvedPolymerPlot.data;
          expect(data[data.length - 1]).to.contain(newTrace);
        }).catch(fail);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('adds individual traces by index for ' + polymerPlot.id, function () {
        var oldHeadTrace = polymerPlot.data[0];
        return polymerPlot.addTraces(newTrace, 0).then(function (resolvedPolymerPlot) {
          var data = resolvedPolymerPlot.data;
          expect(data[0]).to.contain(newTrace);
          expect(data[1]).to.deep.equal(oldHeadTrace);
        }).catch(fail);
      });
    });

    _.forEach([hardcodedPlot, emptyPlot], function (polymerPlot) {
      it('adds lists of traces by index for ' + polymerPlot.id, function () {
        var addTraceIndices = [0, 1];
        var newTraces = [newTrace, newTrace];

        return polymerPlot.addTraces(newTraces, addTraceIndices)
          .then(function (resolvedPolymerPlot) {
            _.forEach(addTraceIndices, function (traceIndex, iterationIndex) {
              expect(resolvedPolymerPlot.data[traceIndex]).to.contain(newTraces[iterationIndex]);
            });
          }).catch(fail);
      });
    });
  });

  describe('#deleteTraces', function () {
    it('lowers the length of the data property', function () {
      var oldLength = hardcodedPlot.data.length;

      return hardcodedPlot.deleteTraces(0).then(function (polymerPlot) {
        expect(polymerPlot.data.length).to.equal(oldLength - 1);
      }).catch(fail);
    });

    it('deletes the trace from the data property', function () {
      var deletedTrace = hardcodedPlot.data[0];

      return hardcodedPlot.deleteTraces(0).then(function (polymerPlot) {
        _.forEach(polymerPlot.data, function (trace) {
          expect(trace).to.not.deep.equal(deletedTrace);
        });
      }).catch(fail);
    });

    it('calls low-level delete', function () {
      var deleteTraces = sandbox.spy(Plotly, 'deleteTraces');

      return hardcodedPlot.deleteTraces(0).then(function (polymerPlot) {
        expect(deleteTraces.withArgs(polymerPlot.$.plot, 0).calledOnce).to.be.ok;
      }).catch(fail);
    });
  });

  describe('#moveTraces', function () {
    beforeEach(function () {
      hardcodedPlot = fixture('plotly-plot-fixture-hardcoded')
        .querySelector('#hard-coded-plot');
    });

    it('does not change the length of the data property', function () {
      var oldLength = hardcodedPlot.data.length;

      return hardcodedPlot.moveTraces(0).then(function (polymerPlot) {
        expect(polymerPlot.data.length).to.equal(oldLength);
      }).catch(fail);
    });

    it('updates the data property', function () {
      var movedTraces = hardcodedPlot.data.slice(1);
      movedTraces.push(hardcodedPlot.data[0]);

      return hardcodedPlot.moveTraces(0).then(function (polymerPlot) {
        _.forEach(polymerPlot.data, function (trace, traceIndex) {
          expect(trace).to.deep.equal(movedTraces[traceIndex]);
        });
      }).catch(fail);
    });

    it('calls low-level move', function () {
      var moveTraces = sandbox.spy(Plotly, 'moveTraces');

      return hardcodedPlot.moveTraces(0).then(function (polymerPlot) {
        expect(moveTraces.withArgs(polymerPlot.$.plot, 0).calledOnce).to.be.ok;
      }).catch(fail);
    });
  });

  describe('#purge', function () {
    it('clears the data property', function () {
      return hardcodedPlot.purge().then(function (polymerPlot) {
        expect(polymerPlot.data).to.be.empty;
      }).catch(fail);
    });
  });
});
