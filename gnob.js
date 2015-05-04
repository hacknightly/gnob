'use strict';
// Thanks Mozilla! https://developer.mozilla.org/en-US/docs/Web/Events/wheel
(function(window, document) {
  'use strict';

  var prefix = '',
    _addEventListener, onwheel, support;

  // detect event model
  if (window.addEventListener) {
    _addEventListener = 'addEventListener';
  } else {
    _addEventListener = 'attachEvent';
    prefix = 'on';
  }

  // detect available wheel event
  support = 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support 'wheel'
    document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least 'mousewheel'
    'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox

  window.addWheelListener = function(elem, callback, useCapture) {
    _addWheelListener(elem, support, callback, useCapture);

    // handle MozMousePixelScroll in older Firefox
    if (support == 'DOMMouseScroll') {
      _addWheelListener(elem, 'MozMousePixelScroll', callback, useCapture);
    }
  };

  function _addWheelListener(elem, eventName, callback, useCapture) {
    elem[_addEventListener](prefix + eventName, support == 'wheel' ? callback : function(originalEvent) {
      !originalEvent && (originalEvent = window.event);

      // create a normalized event object
      var event = {
        // keep a ref to the original event object
        originalEvent: originalEvent,
        target: originalEvent.target || originalEvent.srcElement,
        type: 'wheel',
        deltaMode: originalEvent.type == 'MozMousePixelScroll' ? 0 : 1,
        deltaX: 0,
        deltaZ: 0,
        preventDefault: function() {
          originalEvent.preventDefault ?
            originalEvent.preventDefault() :
            originalEvent.returnValue = false;
        }
      };

      // calculate deltaY (and deltaX) according to the event
      if (support == 'mousewheel') {
        event.deltaY = -1 / 40 * originalEvent.wheelDelta;
        // Webkit also support wheelDeltaX
        originalEvent.wheelDeltaX && (event.deltaX = -1 / 40 * originalEvent.wheelDeltaX);
      } else {
        event.deltaY = originalEvent.detail;
      }

      // it's time to fire the callback
      return callback(event);

    }, useCapture || false);
  }
})(window, document);
// END Mozilla wheel plugin

var NATURAL_OFF_DEG = -190;
var NATURAL_MAX_DEG = 100;

var Gnob = function(rangeElem) {
  this.settings  = this.getSettings(rangeElem);
  this.min       = (this.settings.min || 0);
  this.max       = this.settings.max ? this.settings.max:10;
  this.step      = (this.settings.step || 1);
  this.initial   = (this.settings.initial || 0);
  this.diameter  = (this.settings.diameter || 100);
  this.size      = (this.settings.size || 'medium');
  this.degrees   = NATURAL_OFF_DEG;
  this.precision = 0;

  if (this.settings.step.toString().indexOf('.') > -1) {
    this.precision =  this.settings.step
      .toString()
      .match(/\.+\d+/)[0]
      .replace('.', '').length;
  }

  this.ticks = this.getTicks();

  this.createKnob(rangeElem);

  this.setValue(this.initial);
};

Gnob.prototype.createKnob = function(rangeElem) {
  var knob         = document.createElement('div');
  var inner        = document.createElement('div');
  var indicator    = document.createElement('div');
  var popover      = document.createElement('div');
  var popoverInput = document.createElement('input');

  rangeElem.setAttribute('min', this.min);
  rangeElem.setAttribute('max', this.max);
  rangeElem.setAttribute('step', this.step);

  this.rangeElem = rangeElem;

  knob.classList.add(this.size);
  knob.classList.add('gnob');
  inner.classList.add('inner');
  indicator.classList.add('indicator');
  popover.classList.add('popover');
  popoverInput.setAttribute('type', 'text');
  popover.appendChild(popoverInput);
  inner.appendChild(indicator);
  knob.appendChild(inner);
  knob.appendChild(popover);

  if (this.settings.indicator) {
    indicator.style.background = this.settings.indicator;
    indicator.style.boxShadow  = '0px 0px 8px ' +   this.settings.indicator;
  }

  this.inner = inner;
  this.knobElem = knob;
  this.popover = popover;
  this.input = popoverInput;

  this.setRotation(NATURAL_OFF_DEG);

  this.bindEvents(knob);

  rangeElem.parentNode.replaceChild(knob, rangeElem);
};

Gnob.prototype.getSettings = function(rangeElem) {
  var options = {};

  Array.prototype.slice
    .call(rangeElem.attributes)
    .map(function(attr) {
      if (attr.name.indexOf('gnob') > -1) {
        var name = attr.name.replace(/data-gnob-?/, ''),
          intVal = parseFloat(attr.value, 10);
        if (name) {
          options[name] = (intVal || intVal === 0) ? intVal : attr.value;
        }
      }
    });

  return options;
};

Gnob.prototype.setValue = function(value) {
  if (value > this.max) {
    value = this.max;
  }
  else if (value < this.min) {
    value = this.min;
  }
  else if (!value && value !== 0) {
    return false;
  }

  this.rangeElem.value = value;
  this.input.value     = value;

  this.rangeElemOnChange(value);
};

Gnob.prototype.setRotation = function(value) {
  var inner = this.knobElem.children[0];

  inner.style.transform = 'rotate(' + value + 'deg)';
};

Gnob.prototype.rangeElemOnChange = function(value) {
  if (typeof this.rangeElem.onchange !== 'function') {
    console.log('Gnob Error: No onchange event found! Try adding an onchange event listener to the range element!');
  }
  else {
   this.rangeElem.onchange(value);
  }
};

Gnob.prototype.rotate = function(delta) {
  this.degrees += delta;

  if (this.degrees <= NATURAL_OFF_DEG) {
    this.degrees = NATURAL_OFF_DEG;
  } else if (this.degrees >= NATURAL_MAX_DEG) {
    this.degrees = NATURAL_MAX_DEG;
  }

  this.tick(this.degrees);
};

Gnob.prototype.getTicks = function() {
  var ticks          = {};
  var totalDegrees   = Math.abs(NATURAL_OFF_DEG) + NATURAL_MAX_DEG;
  var degreesPerTick = (this.step / totalDegrees);

  for (var i = 0; i < totalDegrees; i++) {
    var value = parseFloat((i * degreesPerTick).toFixed(this.precision), 10);

    ticks[i] = value;
  }

  return ticks;
};

Gnob.prototype.tick = function(degrees) {
  var distance = Math.floor(Math.abs(NATURAL_OFF_DEG - degrees));
  var value    = this.ticks[distance];

  if (degrees === NATURAL_OFF_DEG) { value = this.min; }
  else if (degrees === NATURAL_MAX_DEG) { value = this.max; }

  this.setRotation(degrees);
  this.setValue(value);
};

Gnob.prototype.bindEvents = function(knobElem) {
  var _this = this;

  window.addWheelListener(knobElem, function(e) {
    _this.rotate(e.deltaY ? e.deltaY : e.deltaX * -1);
    e.preventDefault();
  }, false);

  _this.input.onchange = function(e) {
    //_this.setValue(this.value);
    _this.popover.classList.remove('open');
  };

  _this.input.onblur = function() {
    _this.popover.classList.remove('open');
  };

  _this.inner.ondblclick = function() {
    _this.popover.classList.toggle('open');
    _this.input.focus();
  };

  _this.input.onkeydown = function(e) {
    var which = e.keyCode;

    if (which === 38) {
      _this.setValue(_this.degrees + (1 * _this.step));
    }
    else if (which === 40) {
      _this.setValue(_this.degrees - (1 * _this.step));
    }
    else if(which === 13) {
      _this.setValue(_this.degrees);
      _this.popover.classList.remove('open');
    }
  };
};

window.onload = function() {
  var ranges = document.querySelectorAll('[data-gnob]');

  Array.prototype.slice.call(ranges).forEach(function(range) {
    range.onchange = function(value) { console.log(value); }

    new Gnob(range);
  });
}
