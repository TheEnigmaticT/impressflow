/**
 * Embedded impress.js library (minified)
 *
 * This is a simplified version of impress.js for embedding.
 * For the full library, see: https://github.com/impress/impress.js
 */
export const IMPRESS_JS_SOURCE = `
/**
 * impress.js
 *
 * Copyright 2011-2024 Bartek Szopka (@bartaz)
 * Released under the MIT license.
 */
(function(document, window) {
  'use strict';

  var pfx = (function() {
    var style = document.createElement('dummy').style,
        prefixes = 'Webkit Moz O ms Khtml'.split(' '),
        memory = {};
    return function(prop) {
      if (typeof memory[prop] === 'undefined') {
        var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1),
            props = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');
        memory[prop] = null;
        for (var i in props) {
          if (style[props[i]] !== undefined) {
            memory[prop] = props[i];
            break;
          }
        }
      }
      return memory[prop];
    };
  })();

  var body = document.body;
  var impressSupported = (pfx('perspective') !== null) && (body.classList) && (body.dataset);

  var roots = {};
  var defaults = {
    width: 1024,
    height: 768,
    maxScale: 1,
    minScale: 0,
    perspective: 1000,
    transitionDuration: 1000
  };

  var empty = function() { return false; };

  var impress = window.impress = function(rootId) {
    rootId = rootId || 'impress';

    if (roots['impress-root-' + rootId]) {
      return roots['impress-root-' + rootId];
    }

    var stepsData = {};
    var activeStep = null;
    var currentState = null;
    var steps = null;
    var config = null;
    var windowScale = null;
    var root = document.getElementById(rootId);
    var canvas = document.createElement('div');
    var initialized = false;
    var lastEntered = null;

    var computeWindowScale = function(config) {
      var hScale = window.innerHeight / config.height,
          wScale = window.innerWidth / config.width,
          scale = hScale > wScale ? wScale : hScale;
      if (config.maxScale && scale > config.maxScale) {
        scale = config.maxScale;
      }
      if (config.minScale && scale < config.minScale) {
        scale = config.minScale;
      }
      return scale;
    };

    var css = function(el, props) {
      var key, pkey;
      for (key in props) {
        if (props.hasOwnProperty(key)) {
          pkey = pfx(key);
          if (pkey !== null) {
            el.style[pkey] = props[key];
          }
        }
      }
      return el;
    };

    var translate = function(t) {
      return ' translate3d(' + t.x + 'px,' + t.y + 'px,' + t.z + 'px) ';
    };

    var rotate = function(r) {
      var rX = ' rotateX(' + r.x + 'deg) ',
          rY = ' rotateY(' + r.y + 'deg) ',
          rZ = ' rotateZ(' + r.z + 'deg) ';
      return rX + rY + rZ;
    };

    var scale = function(s) {
      return ' scale(' + s + ') ';
    };

    var perspective = function(p) {
      return ' perspective(' + p + 'px) ';
    };

    var getElementFromHash = function() {
      return document.getElementById(window.location.hash.replace(/^#\\/?/, ''));
    };

    var triggerEvent = function(el, eventName, detail) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(eventName, true, true, detail);
      el.dispatchEvent(event);
    };

    var initStep = function(el, idx) {
      var data = el.dataset,
          step = {
            translate: {
              x: Number(data.x) || 0,
              y: Number(data.y) || 0,
              z: Number(data.z) || 0
            },
            rotate: {
              x: Number(data.rotateX) || 0,
              y: Number(data.rotateY) || 0,
              z: Number(data.rotateZ) || Number(data.rotate) || 0
            },
            scale: Number(data.scale) || 1,
            el: el
          };

      if (!el.id) {
        el.id = 'step-' + (idx + 1);
      }

      stepsData['impress-' + el.id] = step;

      css(el, {
        position: 'absolute',
        transform: 'translate(-50%,-50%)' +
                  translate(step.translate) +
                  rotate(step.rotate) +
                  scale(step.scale),
        transformStyle: 'preserve-3d'
      });
    };

    var init = function() {
      if (initialized) { return; }

      body.classList.remove('impress-not-supported');
      body.classList.add('impress-supported');

      root.style.position = 'absolute';
      root.style.overflow = 'hidden';
      root.style.left = '50%';
      root.style.top = '50%';

      config = {
        width: Number(root.dataset.width) || defaults.width,
        height: Number(root.dataset.height) || defaults.height,
        maxScale: Number(root.dataset.maxScale) || defaults.maxScale,
        minScale: Number(root.dataset.minScale) || defaults.minScale,
        perspective: Number(root.dataset.perspective) || defaults.perspective,
        transitionDuration: Number(root.dataset.transitionDuration) || defaults.transitionDuration
      };

      windowScale = computeWindowScale(config);

      css(root, {
        transform: perspective(config.perspective / windowScale) + scale(windowScale),
        transformStyle: 'preserve-3d',
        transformOrigin: '0 0'
      });

      canvas.id = 'impress-canvas';
      while (root.firstChild) {
        canvas.appendChild(root.firstChild);
      }
      root.appendChild(canvas);

      css(canvas, {
        position: 'absolute',
        transformOrigin: '0 0',
        transformStyle: 'preserve-3d',
        transition: 'all ' + (config.transitionDuration / 1000) + 's ease-in-out'
      });

      steps = canvas.querySelectorAll('.step');
      steps.forEach(initStep);

      currentState = {
        translate: { x: 0, y: 0, z: 0 },
        rotate: { x: 0, y: 0, z: 0 },
        scale: 1
      };

      initialized = true;

      triggerEvent(root, 'impress:init', { api: roots['impress-root-' + rootId] });
    };

    var getStep = function(step) {
      if (typeof step === 'number') {
        step = step < 0 ? steps[steps.length + step] : steps[step];
      } else if (typeof step === 'string') {
        step = document.getElementById(step);
      }
      return (step && step.id && stepsData['impress-' + step.id]) ? step : null;
    };

    var goto = function(el) {
      if (!initialized || !(el = getStep(el))) {
        return false;
      }

      if (activeStep) {
        activeStep.classList.remove('active');
        body.classList.remove('impress-on-' + activeStep.id);
      }

      el.classList.add('active');
      body.classList.add('impress-on-' + el.id);

      var step = stepsData['impress-' + el.id];
      currentState = {
        translate: {
          x: -step.translate.x,
          y: -step.translate.y,
          z: -step.translate.z
        },
        rotate: {
          x: -step.rotate.x,
          y: -step.rotate.y,
          z: -step.rotate.z
        },
        scale: 1 / step.scale
      };

      windowScale = computeWindowScale(config);

      css(root, {
        transform: perspective(config.perspective / windowScale) + scale(windowScale * currentState.scale),
        transitionDuration: config.transitionDuration + 'ms'
      });

      css(canvas, {
        transform: rotate(currentState.rotate) + translate(currentState.translate),
        transitionDuration: config.transitionDuration + 'ms'
      });

      if (activeStep !== el) {
        if (lastEntered) {
          triggerEvent(lastEntered, 'impress:stepleave', {});
        }
        // Reset substeps when entering a new step
        resetSubsteps(el);
        triggerEvent(el, 'impress:stepenter', {});
        lastEntered = el;
      }

      activeStep = el;
      window.location.hash = '#/' + el.id;

      return el;
    };

    // Substep support for word-level animations
    var getSubsteps = function(step) {
      return step ? Array.from(step.querySelectorAll('.substep')) : [];
    };

    var getActiveSubsteps = function(step) {
      return step ? Array.from(step.querySelectorAll('.substep.substep-active')) : [];
    };

    var getInactiveSubsteps = function(step) {
      return step ? Array.from(step.querySelectorAll('.substep:not(.substep-active)')) : [];
    };

    var activateNextSubstep = function() {
      var inactive = getInactiveSubsteps(activeStep);
      if (inactive.length > 0) {
        inactive[0].classList.add('substep-active');
        return true;
      }
      return false;
    };

    var deactivateLastSubstep = function() {
      var active = getActiveSubsteps(activeStep);
      if (active.length > 0) {
        active[active.length - 1].classList.remove('substep-active');
        return true;
      }
      return false;
    };

    var resetSubsteps = function(step) {
      getSubsteps(step).forEach(function(el) {
        el.classList.remove('substep-active');
      });
    };

    var prev = function() {
      // First try to deactivate a substep
      if (deactivateLastSubstep()) {
        return activeStep;
      }
      // Then go to previous slide
      var prev = steps.indexOf(activeStep) - 1;
      prev = prev >= 0 ? steps[prev] : steps[steps.length - 1];
      return goto(prev);
    };

    var next = function() {
      // First try to activate a substep
      if (activateNextSubstep()) {
        return activeStep;
      }
      // Then go to next slide
      var next = steps.indexOf(activeStep) + 1;
      next = next < steps.length ? steps[next] : steps[0];
      return goto(next);
    };

    if (!impressSupported) {
      body.classList.add('impress-not-supported');
      return;
    }

    root.addEventListener('impress:init', function() {
      steps = Array.from(steps);
      var target = getElementFromHash() || steps[0];
      goto(target);
    }, false);

    window.addEventListener('hashchange', function() {
      var target = getElementFromHash();
      if (target && target !== activeStep) {
        goto(target);
      }
    }, false);

    window.addEventListener('resize', function() {
      windowScale = computeWindowScale(config);
      css(root, {
        transform: perspective(config.perspective / windowScale) + scale(windowScale * currentState.scale)
      });
    }, false);

    document.addEventListener('keydown', function(e) {
      if (e.keyCode === 9 || (e.keyCode >= 32 && e.keyCode <= 40)) {
        switch (e.keyCode) {
          case 33: // pg up
          case 37: // left
          case 38: // up
            prev();
            break;
          case 9:  // tab
          case 32: // space
          case 34: // pg down
          case 39: // right
          case 40: // down
            next();
            break;
        }
        e.preventDefault();
      }
    }, false);

    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target !== document.documentElement) {
        if (target.classList.contains('step')) {
          if (target !== activeStep) {
            goto(target);
          }
          break;
        }
        target = target.parentNode;
      }
    }, false);

    roots['impress-root-' + rootId] = {
      init: init,
      goto: goto,
      next: next,
      prev: prev
    };

    return roots['impress-root-' + rootId];
  };

})(document, window);
`;
