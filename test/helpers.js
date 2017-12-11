'use strict';

const File = require('vinyl');
const sinonChai = require('sinon-chai');
const EventEmitter = require('events');

EventEmitter.defaultMaxListeners = 0;

const ORDINALS = [
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'nineth', 'tenth'
];

module.exports = function(chai, utils) {
  const Assertion = chai.Assertion;

  chai.use(sinonChai);

  function isSpy(obj) {
    return typeof obj === 'function' &&
      typeof obj.getCall === 'function' &&
      typeof obj.calledWithExactly === 'function';
  }

  function isCall(obj) {
    return typeof obj === 'object' &&
           typeof obj.callId === 'number' &&
           typeof obj.proxy === 'function';
  }

  function filterNthArgs(spy, n, match) {
    match = match || function(arg) { return typeof arg !== 'undefined'; };
    if (isSpy(spy.proxy)) {
      spy = spy.proxy;
    }
    const calls = spy.getCalls();
    return calls
      .map((call) => call.args[n])
      .filter(match);
  }

  function addChainableCallMethods(n) {
    const nth = ORDINALS[n];
    const Nth = nth[0].toUpperCase() + nth.substr(1);
    const s = (n === 1) ? '' : 's';

    function assertNthCalled() {
      const obj = this._obj;
      new Assertion(obj).to.have.been.called;
      const spy = (isSpy(obj.proxy)) ? obj.proxy : obj;
      this.assert(
        spy.getCalls().length >= n,
        `expected #{this} to have been called at least ${n} time${s}`,
        `expected #{this} to not have been called at least ${n} time${s}`);
    }

    function chainNthCall() {
      utils.flag(this, 'callNum', n);
      const obj = utils.flag(this, 'object');
      if (isSpy(obj)) {
        const spy = (isSpy(obj.proxy)) ? obj.proxy : obj;
        utils.flag(this, 'object', spy.getCall(n));
      }
    }

    Assertion.addChainableMethod(`${nth}Called`, assertNthCalled, chainNthCall);

    function assertWithNthArg(match) {
      const obj = this._obj;
      new Assertion(isCall(obj), 'is a spy call').to.be(true);

      if (typeof match !== 'undefined') {
        const matcher = function(arg) { return arg === match; };
        this.assert(
          filterNthArgs(this._obj, n, matcher).length > 0,
          `expected #{this} to have been called with a ${nth} argument equal to #{exp}`,
          `expected #{this} to never have been called with a ${nth} argument equal to #{exp}`,
          match);
      } else {
        this.assert(
          filterNthArgs(this._obj, n).length > 0,
          `expected #{this} to have been called with a defined ${nth} argument`,
          `expected #{this} to never have been called with a defined ${nth} argument`);
      }
    }

    function chainNthArg() {
      // debugger;
      utils.flag(this, 'callArg', n);
      const obj = utils.flag(this, 'object');
      if (isCall(obj)) {
        utils.flag(this, 'object', obj.args[n]);
      }
    }

    Assertion.addChainableMethod(`with${Nth}Arg`, assertWithNthArg, chainNthArg);
  }

  for (let n = 0; n < 10; n++) {
    addChainableCallMethods(n);
  }

  function transformIncludeOverride(_super) {
    return function transformInclude() {
      let obj = utils.flag(this, 'object');
      if (obj instanceof File) {
        utils.flag(this, 'object', obj.contents.toString());
      } else {
        _super.apply(this, arguments);
      }
    };
  }

  ['include', 'includes', 'contain', 'contains'].forEach((methodName) => {
    Assertion.overwriteChainableMethod(methodName, transformIncludeOverride, function(_super) {
      return _super;
    });
  });
};
