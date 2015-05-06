'use strict';

// Thanks Mozilla! https://developer.mozilla.org/en-US/docs/Web/Events/wheel
// creates a global 'addWheelListener' method
// example: addWheelListener( elem, function( e ) { console.log( e.deltaY ); e.preventDefault(); } );
(function(window, document) {
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

var React = require('react');

var NATURAL_OFF_POS = 0;
var NATURAL_OFF_DEG = -190;
var NATURAL_MAX_POS = 295;

var Gnob = React.createClass({
  propTypes: {
    min: React.PropTypes.number,
    max: React.PropTypes.number,
    initial: React.PropTypes.number,
    size: React.PropTypes.string,
    indicator: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired
  },

  getDefaultProps: function() {
    return {
      min: 0,
      max: 10,
      initial: 0,
      size: 'medium',
      indicator: '#E8E15A'
    }
  },

  getInitialState: function() {
    var initial = parseInt(this.props.initial, 10) || 0;

    return {
      position: initial,
      rotation: NATURAL_OFF_DEG + initial,
      value: initial
    };
  },

  componentDidMount: function() {
    var gnob = React.findDOMNode(this);

    this.ticks = this.getTicks();

    this.bindEvents(gnob);

    this.setValue(this.state.position);
  },

  getTicks: function() {
    var out          = [];
    var ticks        = NATURAL_MAX_POS - NATURAL_OFF_POS;
    var inclusiveMax = this.props.max + 1;
    var betweenTicks = ticks / this.props.max;

    for (var i = 0; i < inclusiveMax; i++) {
      out.push(i * betweenTicks);
    }

    out.pop();

    out.push(NATURAL_MAX_POS);

    return out;
  },

  setValue: function(value) {
    var degrees;
    var min = this.props.min ? this.props.min : 0;
    var max = this.props.max ? this.props.max : 10;

    value = parseInt(value, 10);

    if (value > max) {
      value = max;
    }
    else if (value < min) {
      value = min;
    }
    else if (!value && value !== 0) {
      return false;
    }

    degrees = NATURAL_OFF_DEG + (value > 0 ? this.ticks[value] : 0);

    this.setState({
      value: value,
      position: this.ticks[value],
      rotation: degrees
    });

    this._onChange(value);
  },

  rotate: function(delta) {
    var direction = delta > 0 ? 1 : -1;
    var step      = (this.props.step || 1) * direction;
    var rotation  = NATURAL_OFF_DEG + this.state.position + step;
    var position  = this.state.position + direction + delta;

    if (position <= NATURAL_OFF_POS) {
      position = NATURAL_OFF_POS;
    } else if (position >= NATURAL_MAX_POS) {
      position = NATURAL_MAX_POS;
    }

    this.state.position = position;
    this.state.rotation = rotation;

    this.tick(this.state.position);

    this.setState(this.state);
  },

  tick: function(position) {
    var firstTick     = this.ticks[0];
    var lastTick      = this.ticks[this.ticks.length - 1];
    var lastTickIndex = this.ticks.indexOf(lastTick);
    var outOfRange    = position >= lastTick;
    var isFirstTick   = position <= firstTick;

    if (outOfRange) {
      this.state.value = lastTickIndex;

      this.setState(this.state);
    } else if (isFirstTick) {
      this.state.value = position;

      this.setState(this.state);
    } else {
      var _this = this;

      this.ticks.forEach(function(tick, i) {
        var inTickRange = position > tick && position < _this.ticks[i + 1];

        if (inTickRange) {
          _this.state.value = i;

          _this.setState(_this.state);
        }
      });
    }

    this._onChange(this.state.value);
  },

  bindEvents: function(gnob) {
    var _this = this;

    window.addWheelListener(gnob, function(e) {
      _this.rotate(e.deltaY ? e.deltaY : e.deltaX * -1);
      e.preventDefault();
    }, false);
  },

  _onChange: function(value) {
    if (! this.props.onChange) {
      return false;
    }
    else {
      this.props.onChange(value);
    }
  },

  _onDoubleClick: function(e) {
    var input = e.target.nextSibling.querySelectorAll('input[type="text"]')[0];

    this.state.popoverOpen = true;

    setTimeout(function() { input.focus(); }, 0);

    this.setState(this.state);
  },

  _onInputBlur: function() {
    this.state.popoverOpen = false;

    this.setState(this.state);
  },

  _onInputChange: function(e) {
    this.setValue(e.target.value);
  },

  _onInputKeyDown: function(e) {
    var which = e.keyCode;
    var value = parseInt(e.target.value, 10);

    if (which === 38) {
      this.setValue(this.state.value + 1);
    }
    else if (which === 40) {
      this.setValue(this.state.value - 1);
    }
    else if(which === 13) {
      this.setValue(e.target.value);

      this.state.popoverOpen = false;

      this.setState(this.state);
    }
  },

  render: function() {
    var popoverOpenClass = this.state.popoverOpen ? 'open' : '';

    return (
      <div className={this.props.size + ' gnob'}>
        <div className='inner' onDoubleClick={this._onDoubleClick} style={{ transform: 'rotate(' + this.state.rotation + 'deg)'}}>
          <div className='indicator'></div>
        </div>
        <div className={'popover ' + popoverOpenClass + ' ' + this.props.popover}>
          <input type='text' value={this.state.value} onChange={this._onInputChange} onBlur={this._onInputBlur} onKeyDown={this._onInputKeyDown}/>
        </div>
      </div>
    );
  }
});

module.exports = Gnob;
