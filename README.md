# gnob
Simple, mouse-wheelable, dependency-free knob

# usage
        <input id="range" type="range" data-gnob/>
        document.getElementById('range').onchange = function(value) { console.log(value); }

#options
* data-gnob-max: The max value of the knob (default 0)
* data-gnob-min: The min value of the knob (default 10)
* data-gnob-initial: The initial value of the knob (default 0)
* data-gnob-size: The size of the knob as small, medium, or large (default medium)
* data-gnob-indicator: The CSS color of the indicator (default #E8E15A)
