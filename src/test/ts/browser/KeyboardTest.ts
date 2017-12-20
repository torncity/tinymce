import Assertions from 'ephox/agar/api/Assertions';
import FocusTools from 'ephox/agar/api/FocusTools';
import Guard from 'ephox/agar/api/Guard';
import Keyboard from 'ephox/agar/api/Keyboard';
import Keys from 'ephox/agar/api/Keys';
import Pipeline from 'ephox/agar/api/Pipeline';
import Step from 'ephox/agar/api/Step';
import Waiter from 'ephox/agar/api/Waiter';
import DomContainers from 'ephox/agar/test/DomContainers';
import { DomEvent } from '@ephox/sugar';
import { Element } from '@ephox/sugar';
import { Focus } from '@ephox/sugar';
import { UnitTest } from '@ephox/bedrock';

UnitTest.asynctest('KeyboardTest', function() {
  var success = arguments[arguments.length - 2];
  var failure = arguments[arguments.length - 1];

  var sAssertEvent = function (type, code, modifiers, raw) {
    return Assertions.sAssertEq(
     'Checking ' + type + ' event',
      {
        which: code,
        ctrlKey: modifiers.ctrl || false,
        shiftKey: modifiers.shift || false,
        altKey: modifiers.alt || false,
        metaKey: modifiers.meta || false,
        type: type
      }, {
        which: raw.which,
        ctrlKey: raw.ctrlKey,
        shiftKey: raw.shiftKey,
        altKey: raw.altKey,
        metaKey: raw.metaKey,
        type: raw.type
      }
    );
  };

  var listenOn = function (type, f, code, modifiers) {
    return Step.control(
      Step.stateful(function (value, next, die) {
        var listener = DomEvent.bind(value.container, type, function (event) {
          var raw = event.raw();
          listener.unbind();

          sAssertEvent(type, code, modifiers, raw)(value, next, die);          
        });

        f(Element.fromDom(document), code, modifiers)(value, function () { }, die);
      }),
      Guard.timeout('Key event did not fire in time: ' + type, 1000)
    );
  };

  var listenOnKeystroke = function (code, modifiers) {
    return Step.control(
      Step.stateful(function (value, next, die) {
        var keydownListener = DomEvent.bind(value.container, 'keydown', function (dEvent) {
          keydownListener.unbind();
          
          var keyupListener = DomEvent.bind(value.container, 'keyup', function (uEvent) {
            keyupListener.unbind();
            
            Pipeline.async({}, [
              sAssertEvent('keydown', code, modifiers, dEvent.raw()),
              sAssertEvent('keyup', code, modifiers, uEvent.raw())
            ], function () {
              next(value);
            }, die);
          });
        });

        Keyboard.sKeystroke(Element.fromDom(document), code, modifiers)(value, function () { }, die);
      }),
      Guard.timeout('keystroke (keydown + keyup) did not fire', 1000)
    );
  };

  Pipeline.async({}, [
    DomContainers.mSetup,
    Step.stateful(function (state, next, die) {
      Focus.focus(state.container);
      next(state);
    }),
    listenOn('keydown', Keyboard.sKeydown, Keys.space(), { }),
    listenOn('keyup', Keyboard.sKeyup, Keys.space(), { }),
    listenOn('keypress', Keyboard.sKeypress, Keys.space(), { }),

    // Test one of the fakeKeys direct calls
    listenOn('keydown', function (doc, code, modifiers) {
      return Step.sync(function () {
        var focused = Focus.active(doc).getOrDie();
        Keyboard.keydown(code, modifiers, focused);
      });
    }, Keys.space(), { ctrlKey: true }),

    listenOnKeystroke(Keys.space(), { }),
    DomContainers.mTeardown
  ], function () {
    success();
  }, failure);
});

