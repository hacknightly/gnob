# Gnob
Simple, mouse-wheelable, text-input-changeable, dependency-free knob

  bower install gnob;
  npm install gnob;

[demo](http://codepen.io/hacknightly/full/ZGGWbw/)

# Vanilla
    <input id="range" type="range" data-gnob/>

    var ranges = document.querySelectorAll('[data-gnob]');

    Array.prototype.slice.call(ranges).forEach(function(range) {
      new Gnob(range);
    });

    document.getElementById('range').onchange = function(value) { console.log(value); }

# React
    <Gnob min={0} max={10} onChange={React.PropTypes.func.isRequired} />

# Usage
* Scroll wheel to change value
* Double click a gnob to input value (supports up and down arrows)

#Options
* (data-gnob-)max: The max value of the knob (default 0)
* (data-gnob-)min: The min value of the knob (default 10)
* (data-gnob-)initial: The initial value of the knob (default 0)
* (data-gnob-)size: The size of the knob as small, medium, or large (default medium)
* (data-gnob-)indicator: The CSS color of the indicator (default #E8E15A)

# TODO
* Support stepping by any number. Currently only steps by 1.
* Angular.js directive
* Different theming options (light, dark, gray, custom css?)
