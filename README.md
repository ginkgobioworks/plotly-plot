# plotly-plot

Polymer element for the [plotly.js](https://plot.ly/javascript/) library.

[![Build Status](https://travis-ci.org/ginkgobioworks/plotly-plot.svg?branch=master)](https://travis-ci.org/ginkgobioworks/plotly-plot)

`<plotly-plot>` provides a thin, fully-functional interface to the core of the
library. The key properties of the plot, `data`, `layout`, and `config`, are
all exposed as Polymer properties; updates to these properties via `.set` will
automatically trigger redrawing.

All of the update methods provided with plotly.js have been exposed:
`redraw`, `restyle`, and `relayout`. The other methods are also
available for dynamic updates: `addTraces`, `deleteTraces`, and `moveTraces`.

Finally, the custom plotly-specific events are also replicated as Polymer
events.

For thorough documentation, visit the
[project homepage](https://ginkgobioworks.github.io/plotly-plot).

## Using plotly-plot

Install the element with Bower by adding it to your project's dependencies in
`bower.json`, or install via NPM/Yarn by adding it to your `package.json`. If
you install over NPM, make sure your dependencies are flat, as Polymer HTML
imports require it.

Import the element into your project by using an HTML import:

```html
<link rel="import" href="../plotly-plot/plotly-plot.html">
```

### Extending the functionality in your own elements

There are two common ways to use `<plotly-plot>` to extend your own elements.

#### Embedding
The best way to customize plotly-plot functionality for your own specific
components is to embed `<plotly-plot>` elements inside them. From there, your
components can dicate their own APIs, which won't need to be as generic as the
complete Plotly API provided by `plotly-plot`. For example, if you want to have
an element that makes a pie chart, it might look like this:

```html
<dom-module id="my-pie-chart">
  <template>
    <plotly-plot id="pp"></plotly-plot>
  </template>

  <script>
    Polymer({
      is: 'my-pie-chart',
      properties: {
        values: Array,
        labels: Array,
        title: String,
      },
      observers: [
        'draw(values.*,labels.*,title)'
      ],
      draw: function () {
        var data = [{ values: this.values, labels: this.labels, type: 'pie' }];
        var layout = { title: this.title };
        this.$.pp.update(data, layout);
      },
    });
  </script>
</dom-module>
```

#### Behavior
However, If you want to write your own generic element that behaves like
`plotly-plot`, exposing the same generic API but changing defaults or adding
additional customization features, you can use the `PlotlyPlotBehavior`
exposed in `plotly-plot-behavior.html`. Just make sure your local DOM contains
an element that will contain the plot itself. By default, the behavior expects
this tag to have the id `#plot`, but you can change that criterion by overriding
the `getPlot()` method. It might look something like this:

```html
<dom-module id="my-plotly-plot">
  <template>
    <div id="plot" data=[[data]], config="[[config]]" layout="[[layout]]">
    </div>
  </template>

  <script>
    Polymer({
      is: 'my-plotly-plot',
      behaviors: [PlotlyPlot.PlotlyPlotBehavior],
      // override and add methods here
    });
  </script>
</dom-module>
```

### NOTE: The plotly.js library is incompatible with shadow DOM

Polymer elements, and web components in general, depend on being able to "hide"
their inner DOM from the rest of the page. This is accomplished through a
set of functionality known as the "shadow DOM."

Polymer has two kinds of shadow DOM implementations: native shadow DOM, and a
shim called "shady DOM." Native shadow DOM is newer and yields improved
performance, but it has incomplete support in browsers outside the newest Chrome
and can often cause problems with existing code. For this reason, shady DOM is
still the default implementation in Polymer 1.x.

Unfortunately, native shadow DOM is currently incompatible with plotly.js. The
icon toolbar layout code in the plotly.js library fails for all plotly plots
rendered inside a shadow DOM, whether by Polymer or any other means. The
element cannot tell that the library code has misrendered. It acts as if it
rendered correctly and responds to JavaScript normally.

This is a library-level issue between plotly.js and the DOM. It does not have
to do with this element itself, and `<plotly-plot>` can't do anything about it
until either plotly.js or the shadow DOM code change to accommodate one another.

In the mean time, if you're using `<plotly-plot>`, make sure you
_do not have `Polymer.dom = 'shadow'` in the global Polymer settings of your
project_.


## Developing/contributing to `plotly-plot`

### Installing Dependencies

Element dependencies are managed via [Bower](http://bower.io/) for the
front-end/Polymer components, and [NPM](https://www.npmjs.com) for everything
else.

Installing NPM dependencies:

```bash
    $ npm install
```

Installing / updating Bower dependencies:

```bash
    $ npm run bower:install
    $ npm run bower:update
```

### Linting

#### Polylint
[Polylint](https://github.com/PolymerLabs/polylint) can be used to lint the
HTML/JS to account for common Polymer gotchas

```bash
    $ npm run polylint
```

Polylint [documentation](https://github.com/PolymerLabs/polylint#polylint).

#### ESLint
[ESLint](http://eslint.org/) is used to lint the JavaScript.

```bash
    $ npm run eslint
```

Both linters can be run together:

```bash
    $ npm run lint
```

### Dev server

[Polyserve](https://github.com/PolymerLabs/polyserve) makes it easy to use the
element along with its Bower dependencies without having to move or copy files.
It works well as a development server. Running Polyserve:

```bash
    $ npm start
```

Once running, `http://localhost:8080/components/plotly-plot/` shows the index
page of the element.

### Testing

Navigate to `http://localhost:8080/components/plotly-plot/test/` (as served
by Polyserve) to run the tests.

#### web-component-tester (WCT)
The tests are implemented with
[web-component-tester](https://github.com/Polymer/web-component-tester) (WCT).
WCT comes with a script that lets you run the tests in a terminal using
Selenium:

```bash
    $ npm test
```

#### WCT Tips
- `npm test -- -l chrome` will only run tests in chrome.
- `npm test -- -p` will keep the browsers alive after test runs (refresh to re-run).
- `npm test -- test/some-file.html` will test only the files you specify.
- `wct.conf.json` configures plugins and options for WCT
- Running WCT inside a Docker container is tricky:
   - Chrome must be run with `--no-sandbox`, or the container must have elevated
     privileges
   - Browsers must connect to a headless X server (Xvfb) to run.
   - WCT does not really give you control over command line args to chrome, and
     does not transfer all environmenet variables, so you have to write a
     wrapper script that calls `xvfb-run chrome --no-sandbox "$@" ...`. You can
     get WCT to use that script by setting the `LAUNCHPAD_CHROME` environment
     variable to point to it.

### Continuous Integration: Travis CI

On every merge request in this repo, linting and tests will automatically be
performed by [Travis CI](https://travis-ci.org/ginkgobioworks/plotly-plot).
Tagged versions in the `master` branch are automatically released to NPM and
Bower, and automatically update the documentation on the element homepage.
