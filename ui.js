// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
// This is a specialised implementation of a System module loader.
"use strict"; // @ts-nocheck

/* eslint-disable */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.training = exports.continuousTraining = exports.weightsAndBiases = exports.importWeightsAndBiasesFromFile = exports.updateTheory = exports.eraseCurrentNetwork = void 0;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest(); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var System, __instantiateAsync, _instantiate;

(function () {
  var r = new Map();
  System = {
    register: function register(id, d, f) {
      r.set(id, {
        d: d,
        f: f,
        exp: {}
      });
    }
  };

  function dI(_x, _x2) {
    return _dI.apply(this, arguments);
  }

  function _dI() {
    _dI = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(mid, src) {
      var id, _id$split$reverse, _id$split$reverse2, o, ia, _src$split$reverse, _src$split$reverse2, sa, oa, s, i;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              id = mid.replace(/\.\w+$/i, "");

              if (!id.includes("./")) {
                _context2.next = 18;
                break;
              }

              _id$split$reverse = id.split("/").reverse(), _id$split$reverse2 = _toArray(_id$split$reverse), o = _id$split$reverse2[0], ia = _id$split$reverse2.slice(1), _src$split$reverse = src.split("/").reverse(), _src$split$reverse2 = _toArray(_src$split$reverse), sa = _src$split$reverse2.slice(1), oa = [o];
              s = 0;

            case 4:
              if (!(i = ia.shift())) {
                _context2.next = 16;
                break;
              }

              if (!(i === "..")) {
                _context2.next = 9;
                break;
              }

              s++;
              _context2.next = 14;
              break;

            case 9:
              if (!(i === ".")) {
                _context2.next = 13;
                break;
              }

              return _context2.abrupt("break", 16);

            case 13:
              oa.push(i);

            case 14:
              _context2.next = 4;
              break;

            case 16:
              if (s < sa.length) oa.push.apply(oa, _toConsumableArray(sa.slice(s)));
              id = oa.reverse().join("/");

            case 18:
              return _context2.abrupt("return", r.has(id) ? gExpA(id) : Promise.resolve("".concat(mid)).then(function (s) {
                return _interopRequireWildcard(require(s));
              }));

            case 19:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));
    return _dI.apply(this, arguments);
  }

  function gC(id, main) {
    return {
      id: id,
      "import": function _import(m) {
        return dI(m, id);
      },
      meta: {
        url: id,
        main: main
      }
    };
  }

  function gE(exp) {
    return function (id, v) {
      v = typeof id === "string" ? _defineProperty({}, id, v) : id;

      for (var _i = 0, _Object$entries = Object.entries(v); _i < _Object$entries.length; _i++) {
        var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
            _id = _Object$entries$_i[0],
            value = _Object$entries$_i[1];

        Object.defineProperty(exp, _id, {
          value: value,
          writable: true,
          enumerable: true
        });
      }
    };
  }

  function rF(main) {
    var _iterator = _createForOfIteratorHelper(r.entries()),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _step$value = _slicedToArray(_step.value, 2),
            id = _step$value[0],
            m = _step$value[1];

        var f = m.f,
            exp = m.exp;

        var _f = f(gE(exp), gC(id, id === main)),
            e = _f.execute,
            s = _f.setters;

        delete m.f;
        m.e = e;
        m.s = s;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  function gExpA(_x3) {
    return _gExpA.apply(this, arguments);
  }

  function _gExpA() {
    _gExpA = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id) {
      var m, d, e, s, i, _r;

      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (r.has(id)) {
                _context3.next = 2;
                break;
              }

              return _context3.abrupt("return");

            case 2:
              m = r.get(id);

              if (!m.s) {
                _context3.next = 22;
                break;
              }

              d = m.d, e = m.e, s = m.s;
              delete m.s;
              delete m.e;
              i = 0;

            case 8:
              if (!(i < s.length)) {
                _context3.next = 18;
                break;
              }

              _context3.t0 = s;
              _context3.t1 = i;
              _context3.next = 13;
              return gExpA(d[i]);

            case 13:
              _context3.t2 = _context3.sent;

              _context3.t0[_context3.t1].call(_context3.t0, _context3.t2);

            case 15:
              i++;
              _context3.next = 8;
              break;

            case 18:
              _r = e();

              if (!_r) {
                _context3.next = 22;
                break;
              }

              _context3.next = 22;
              return _r;

            case 22:
              return _context3.abrupt("return", m.exp);

            case 23:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));
    return _gExpA.apply(this, arguments);
  }

  function gExp(id) {
    if (!r.has(id)) return;
    var m = r.get(id);

    if (m.s) {
      var d = m.d,
          e = m.e,
          s = m.s;
      delete m.s;
      delete m.e;

      for (var i = 0; i < s.length; i++) {
        s[i](gExp(d[i]));
      }

      e();
    }

    return m.exp;
  }

  __instantiateAsync = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(m) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              System = __instantiateAsync = _instantiate = undefined;
              rF(m);
              return _context.abrupt("return", gExpA(m));

            case 3:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function __instantiateAsync(_x4) {
      return _ref2.apply(this, arguments);
    };
  }();

  _instantiate = function __instantiate(m) {
    System = __instantiateAsync = _instantiate = undefined;
    rF(m);
    return gExp(m);
  };
})();

System.register("network", [], function (exports_1, context_1) {
  "use strict";

  var activationFunctions, Neuron, InputNeuron, HiddenLayerNeuron, OutputNeuron, Network;

  var __moduleName = context_1 && context_1.id;

  return {
    setters: [],
    execute: function execute() {
      activationFunctions = {
        tanh: {
          apply: function apply(number) {
            return Math.tanh(number);
          },
          derivative: function derivative(number) {
            var result = activationFunctions.tanh.apply(number);
            return 1 - result * result;
          }
        },
        sigmoid: {
          apply: function apply(number) {
            return 1 / (1 + Math.exp(-number));
          },
          derivative: function derivative(number) {
            var result = activationFunctions.sigmoid.apply(number);
            return result * (1 - result);
          }
        },
        exponentialLinearUnit: {
          apply: function apply(number) {
            return number > 0 ? number : 15 * (Math.exp(number) - 1);
          },
          derivative: function derivative(number) {
            return number > 0 ? 1 : Math.exp(number);
          }
        },
        rectifiedLinearUnit: {
          apply: function apply(number) {
            return Math.max(number, 0);
          },
          derivative: function derivative(number) {
            return number > 0 ? 1 : 0;
          }
        }
      };

      Neuron = function Neuron(bias) {
        _classCallCheck(this, Neuron);

        this.bias = bias;
      };

      InputNeuron = /*#__PURE__*/function (_Neuron) {
        _inherits(InputNeuron, _Neuron);

        var _super = _createSuper(InputNeuron);

        function InputNeuron(execute, bias) {
          var _this;

          _classCallCheck(this, InputNeuron);

          _this = _super.call(this, bias);

          _this.process = function (input) {
            var combined = _this.execute(input);

            return combined + _this.bias;
          };

          _this.copy = function (bias) {
            return new InputNeuron(_this.execute, bias === undefined ? _this.bias : bias);
          };

          _this.toString = function () {
            return JSON.stringify({
              type: 'input',
              bias: _this.bias
            });
          };

          _this.execute = execute;
          _this.bias = bias;
          return _this;
        }

        return InputNeuron;
      }(Neuron);

      HiddenLayerNeuron = /*#__PURE__*/function (_Neuron2) {
        _inherits(HiddenLayerNeuron, _Neuron2);

        var _super2 = _createSuper(HiddenLayerNeuron);

        function HiddenLayerNeuron(weights, bias) {
          var _this2;

          _classCallCheck(this, HiddenLayerNeuron);

          _this2 = _super2.call(this, bias);

          _this2.process = function (input) {
            return _this2.compute(input);
          };

          _this2.copy = function (weights, bias) {
            return new HiddenLayerNeuron(weights === undefined ? _this2.weights : weights, bias === undefined ? _this2.bias : bias);
          };

          _this2.toString = function () {
            return JSON.stringify({
              type: 'normal',
              weights: _this2.weights.map(function (n, i) {
                return [{
                  num: i,
                  weight: n.number
                }];
              }),
              bias: _this2.bias
            });
          };

          _this2.weights = weights;
          return _this2;
        }

        _createClass(HiddenLayerNeuron, [{
          key: "compute",
          value: function compute(input) {
            var _this3 = this;

            var combined = input.reduce(function (acc, _ref3) {
              var neuron = _ref3.neuron,
                  number = _ref3.number;
              return acc + number * (_this3.weights.find(function (w) {
                return w.neuron === neuron;
              }) || {
                number: 0
              }).number;
            }, 0);
            return combined + this.bias;
          }
        }]);

        return HiddenLayerNeuron;
      }(Neuron);

      OutputNeuron = /*#__PURE__*/function (_HiddenLayerNeuron) {
        _inherits(OutputNeuron, _HiddenLayerNeuron);

        var _super3 = _createSuper(OutputNeuron);

        function OutputNeuron(weights, bias) {
          var _thisSuper, _this4;

          _classCallCheck(this, OutputNeuron);

          _this4 = _super3.call(this, weights, bias);

          _this4.process = function (input) {
            return _get((_thisSuper = _assertThisInitialized(_this4), _getPrototypeOf(OutputNeuron.prototype)), "compute", _thisSuper).call(_thisSuper, input);
          };

          _this4.copy = function (weights, bias) {
            return new OutputNeuron(weights === undefined ? _this4.weights : weights, bias === undefined ? _this4.bias : bias);
          };

          _this4.toString = function () {
            return JSON.stringify({
              type: 'output',
              weights: _this4.weights.map(function (n, i) {
                return [{
                  num: i,
                  weight: n.number
                }];
              }),
              bias: _this4.bias
            });
          };

          return _this4;
        }

        return OutputNeuron;
      }(HiddenLayerNeuron);

      Network = function Network(_ref4) {
        var _this5 = this;

        var name = _ref4.name,
            numberByLayer = _ref4.numberByLayer,
            parameters = _ref4.parameters,
            weightsAndBiases = _ref4.weightsAndBiases,
            trainings = _ref4.trainings,
            miniBatchLength = _ref4.miniBatchLength,
            activationFunction = _ref4.activationFunction,
            randomInit = _ref4.randomInit,
            afterEachNeuronTraining = _ref4.afterEachNeuronTraining;

        _classCallCheck(this, Network);

        this.process = function (input) {
          return _this5.neurons.slice(1).reduce(function (acc, layer) {
            return acc.concat([layer.map(function (n) {
              var rawValue = n.process(acc.slice(-1)[0]);
              return {
                neuron: n,
                rawValue: rawValue,
                number: activationFunctions[_this5.activationFunction].apply(rawValue)
              };
            })]);
          }, [_this5.neurons[0].map(function (n) {
            var rawValue = n.process(input);
            return {
              neuron: n,
              rawValue: rawValue,
              number: activationFunctions[_this5.activationFunction].apply(rawValue)
            };
          })]);
        };

        this.costSummaryOf = function (trainingDataFromInput) {
          var i = 0;

          var _ref5 = trainingDataFromInput.theory ? trainingDataFromInput : {
            inputs: trainingDataFromInput.inputs,
            theory: function theory() {
              return (trainingDataFromInput.expectedResults || [])[i++] || [];
            }
          },
              inputs = _ref5.inputs,
              theory = _ref5.theory;

          var costs = inputs.map(function (input) {
            var result = _this5.process(input).slice(-1)[0];

            var expectedResult = theory(input);
            var cost = result.reduce(function (acc, r, i) {
              return acc + Math.pow(r.number - expectedResult[i], 2);
            }, 0);
            return cost;
          });
          return {
            costs: costs,
            average: costs.reduce(function (a, b) {
              return a + b;
            }, 0) / inputs.length
          };
        };

        this.trainWithBackwardPropagation = function (trainingDataFromInput) {
          var forwardAndBackwardPropagation = function forwardAndBackwardPropagation(trainingDataFromInput) {
            var activationDerivative = activationFunctions[_this5.activationFunction].derivative;

            var trainingPartitions = _this5.partitionsOf(trainingDataFromInput);

            var partition = trainingPartitions[Math.floor(Math.random() * trainingPartitions.length)];
            return partition.inputs.map(function (input) {
              var resultTable = _this5.process(input);

              var result = resultTable.slice(-1)[0].map(function (r) {
                return r.number;
              });
              var expectedResult = partition.theory(input);
              var derivatives = Array(resultTable.length).fill(0).map(function (_, i) {
                return Array(resultTable[i].length).fill(0).map(function (_, j) {
                  return {
                    outputError: 0,
                    inputError: 0,
                    accumulatedFromInputError: 0,
                    numberOfAccumulatedErrors: 0,
                    linksDerivatives: !(_this5.neurons[i][j] instanceof HiddenLayerNeuron) ? [] : _this5.neurons[i][j].weights.map(function (weight) {
                      return {
                        neuron: weight.neuron,
                        outputError: 0,
                        accumulatedError: 0,
                        numberOfAccumulatedErrors: 0
                      };
                    })
                  };
                });
              });
              derivatives.slice(-1)[0].forEach(function (derivative, i) {
                derivative.outputError = result[i] - expectedResult[i];
              });
              resultTable.slice().reverse().forEach(function (layer, invI) {
                var i = resultTable.length - 1 - invI;
                layer.forEach(function (subResult, j) {
                  var error = derivatives[i][j];
                  var toCompensate = error.outputError * activationDerivative(subResult.rawValue);
                  Object.assign(error, {
                    inputError: toCompensate,
                    accumulatedFromInputError: error.accumulatedFromInputError + toCompensate,
                    numberOfAccumulatedErrors: error.numberOfAccumulatedErrors + 1
                  });
                });
                layer.forEach(function (_, j) {
                  var derivative = derivatives[i][j];
                  var neuron = _this5.neurons[i][j];

                  if (neuron instanceof HiddenLayerNeuron) {
                    neuron.weights.filter(function (weight) {
                      return !weight.dead;
                    }).forEach(function (weight) {
                      var resultOfSourceNeuron = resultTable[i - 1][_this5.neurons[i - 1].indexOf(weight.neuron)].number;

                      var outputError = derivative.inputError * resultOfSourceNeuron;
                      var linkDerivative = derivative.linksDerivatives.find(function (linkDerivative1) {
                        return linkDerivative1.neuron === weight.neuron;
                      });
                      Object.assign(linkDerivative, {
                        neuron: weight.neuron,
                        outputError: outputError,
                        accumulatedError: linkDerivative.accumulatedError + outputError,
                        numberOfAccumulatedErrors: linkDerivative.numberOfAccumulatedErrors + 1
                      });
                    });
                  }
                });
                (i > 1 ? derivatives[i - 1] : []).forEach(function (derivative, j) {
                  derivative.outputError = _this5.neurons[i].flatMap(function (n) {
                    var outputWeight = n.weights.find(function (w) {
                      return w.neuron === _this5.neurons[i - 1][j];
                    });
                    return {
                      weight: outputWeight === null || outputWeight === void 0 ? void 0 : outputWeight.number,
                      inputError: derivatives[i][_this5.neurons[i].indexOf(n)].inputError
                    };
                  }).reduce(function (acc, value) {
                    return acc + value.weight * value.inputError;
                  }, 0);
                });
              });
              return {
                input: input,
                derivatives: derivatives
              };
            });
          };

          var applyDerivatives = function applyDerivatives(listOfDerivatives) {
            var learningRate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.03;
            var regularizationRate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            var l1Regularization = function l1Regularization(w) {
              return w < 0 ? -1 : w > 0 ? 1 : 0;
            };

            var clone = _this5.clone();

            listOfDerivatives.forEach(function (derivatives) {
              return derivatives.forEach(function (derivativesLayer, i) {
                return derivativesLayer.forEach(function (derivative, j) {
                  clone.neurons[i][j].bias -= derivative.numberOfAccumulatedErrors === 0 ? 0 : learningRate * derivative.accumulatedFromInputError / derivative.numberOfAccumulatedErrors;
                  derivative.linksDerivatives.forEach(function (linkDerivative, k) {
                    var weight = clone.neurons[i][j].weights[k];
                    var diff = -(learningRate / linkDerivative.numberOfAccumulatedErrors) * linkDerivative.accumulatedError;
                    var regularization = learningRate * regularizationRate * (regularizationRate === 0 ? 0 : l1Regularization(weight.number));

                    if (Math.sign(weight.number - diff) !== Math.sign(weight.number - diff - regularization)) {
                      weight.dead = true;
                      weight.number = 0;
                    } else weight.number = weight.number - diff - regularization;
                  });
                });
              });
            });
            return clone;
          };

          var trainedNetwork = applyDerivatives(forwardAndBackwardPropagation(trainingDataFromInput).map(function (mapping) {
            return mapping.derivatives;
          }));
          var remainingCosts = trainedNetwork.costSummaryOf(_this5.partitionsOf(trainingDataFromInput)[0]);
          return {
            trainedNetwork: trainedNetwork,
            weightsAndBiases: trainedNetwork.getWeightsAndBiases(),
            remainingCost: remainingCosts.average,
            remainingCostList: remainingCosts.costs
          };
        };

        this.trainWithGradientDescent = function (trainingDataFromInput) {
          var adjust = function adjust(owner, fieldName, render) {
            var increment = 0.0000000002;
            var adjustment = 0;
            var lastAdustment = 0;

            while (increment > 0.0000000001) {
              var actualCost = render();
              owner[fieldName] -= increment;
              var leftNewCost = render();
              owner[fieldName] += increment * 2;
              var rightNewCost = render();
              owner[fieldName] -= increment;
              var direction = leftNewCost < rightNewCost && leftNewCost < actualCost ? -1 : rightNewCost < leftNewCost && rightNewCost < actualCost ? 1 : leftNewCost < rightNewCost && leftNewCost < actualCost ? -1 : rightNewCost < leftNewCost && rightNewCost < actualCost ? 1 : leftNewCost < actualCost ? -1 : rightNewCost < actualCost ? 1 : 0;
              owner[fieldName] += direction * increment;
              lastAdustment = adjustment;

              if (adjustment + direction * increment === lastAdustment) {
                return adjustment + direction * increment;
              }

              adjustment += direction * increment;
              increment = direction === 0 ? increment / 2 : increment * 2;
            }

            return adjustment;
          };

          var clone = _this5.clone();

          var weightsAndBiases = Array(trainingDataFromInput.rounds || 1).fill(0).reduce(function (_a, _b, round) {
            var trainingPartitions = _this5.partitionsOf(trainingDataFromInput);

            return clone.neurons.slice().reverse().map(function (layer, i, neurons) {
              return layer.map(function (neuron, j) {
                var iteration = neurons.slice(0, i).reduce(function (acc, value) {
                  return acc + value.length;
                }, 0) + j;
                var total = neurons.reduce(function (acc, value) {
                  return acc + value.length;
                }, 0);
                var result = {
                  weights: neuron instanceof HiddenLayerNeuron ? neuron.weights.map(function (weight) {
                    return adjust(weight, 'number', function () {
                      return clone.costSummaryOf(trainingPartitions[iteration % trainingPartitions.length]).average;
                    });
                  }) : [],
                  bias: adjust(neuron, 'bias', function () {
                    return clone.costSummaryOf(trainingPartitions[iteration % trainingPartitions.length]).average;
                  })
                };

                if (clone.afterEachNeuronTraining) {
                  clone.afterEachNeuronTraining(clone, round, iteration, total);
                }

                return result;
              });
            }).reverse();
          }, {});
          var remainingCosts = clone.costSummaryOf(_this5.partitionsOf(trainingDataFromInput)[0]);
          return {
            weightsAndBiases: weightsAndBiases,
            remainingCost: remainingCosts.average,
            remainingCostList: remainingCosts.costs,
            trainedNetwork: clone
          };
        };

        this.getWeightsAndBiases = function () {
          return _this5.neurons.map(function (l) {
            return l.map(function (n) {
              return {
                bias: n.bias,
                weights: (n.weights || []).map(function (w) {
                  return w.number;
                })
              };
            });
          });
        };

        this.getNeurons = function () {
          return _this5.neurons.map(function (l) {
            return l.map(function (n) {
              return n.copy();
            });
          });
        };

        this.apply = function (weightsAndBiases) {
          return new Network({
            name: "trained from '".concat(_this5.name, "'").substring(0, 100),
            numberByLayer: _this5.neurons.map(function (l) {
              return l.length;
            }),
            parameters: _this5.neurons[0].map(function (n) {
              return n.execute;
            }),
            miniBatchLength: _this5.miniBatchLength,
            activationFunction: _this5.activationFunction,
            afterEachNeuronTraining: _this5.afterEachNeuronTraining,
            randomInit: _this5.randomInit,
            weightsAndBiases: weightsAndBiases
          });
        };

        this.clone = function () {
          return new Network({
            name: "cloned from '".concat(_this5.name, "'").substring(0, 100),
            numberByLayer: _this5.neurons.map(function (l) {
              return l.length;
            }),
            parameters: _this5.neurons[0].map(function (n) {
              return n.execute;
            }),
            miniBatchLength: _this5.miniBatchLength,
            activationFunction: _this5.activationFunction,
            afterEachNeuronTraining: _this5.afterEachNeuronTraining,
            randomInit: _this5.randomInit,
            weightsAndBiases: _this5.getWeightsAndBiases()
          });
        };

        this.toString = function () {
          return "Network name : ".concat(_this5.name, " ").concat(_this5.neurons.map(function (layer, i) {
            return "layer ".concat(i, ": ").concat(layer);
          }).join('\n '));
        };

        this.partitionsOf = function (trainingData) {
          if (!_this5.miniBatchLength) return [trainingData];
          var associatedInputsAndResults = trainingData.inputs.map(function (input, i) {
            return {
              input: input,
              expectedResult: (trainingData.expectedResults || [])[i++] || []
            };
          }).sort(function () {
            return Math.random() - 0.5;
          });

          var numberOfPartitions = _this5.neurons.reduce(function (acc, value) {
            return acc + value.length;
          }, 0);

          return Array(numberOfPartitions).fill(0).map(function (_, i) {
            var counter = 0;
            var first = associatedInputsAndResults.length / numberOfPartitions * i;
            var last = Math.min(first + (_this5.miniBatchLength || associatedInputsAndResults.length), associatedInputsAndResults.length / numberOfPartitions * (i + 1) - 1);
            return {
              inputs: associatedInputsAndResults.slice(first, last).map(function (association) {
                return association.input;
              }),
              theory: trainingData.theory || function () {
                return (trainingData.expectedResults || []).slice(first, last)[counter++] || [];
              }
            };
          });
        };

        this.name = name || 'anonymous network';
        this.miniBatchLength = miniBatchLength;
        this.activationFunction = activationFunction || 'sigmoid';
        this.afterEachNeuronTraining = afterEachNeuronTraining;
        this.randomInit = randomInit;
        this.neurons = numberByLayer.map(function (n) {
          return Array(n).fill(0);
        }).reduce(function (acc, value, i) {
          return [].concat(_toConsumableArray(acc), [value.map(function (_, j) {
            var weightsAndBias = ((weightsAndBiases || [])[i] || [])[j] || {
              weights: []
            };
            return i === 0 ? new InputNeuron(parameters[j], weightsAndBias.bias || (randomInit !== false ? Math.random() : 0)) : i === numberByLayer.length - 1 ? new OutputNeuron(acc[i - 1].map(function (neuron2, k) {
              return {
                neuron: neuron2,
                number: (weightsAndBias.weights || [])[k] || (randomInit !== false ? Math.random() : 0)
              };
            }), weightsAndBias.bias || (randomInit !== false ? Math.random() : 0)) : new HiddenLayerNeuron(acc[i - 1].map(function (neuron2, k) {
              return {
                neuron: neuron2,
                number: (weightsAndBias.weights || [])[k] || (randomInit !== false ? Math.random() : 0)
              };
            }), weightsAndBias.bias || (randomInit !== false ? Math.random() : 0));
          })]);
        }, []);

        if (trainings && trainings.inputs.length) {
          var _weightsAndBiases = this.trainWithGradientDescent(trainings).weightsAndBiases;
          var trainedNetwork = this.apply(_weightsAndBiases);
          this.neurons.splice(0, this.neurons.length);
          Array.prototype.push.apply(this.neurons, trainedNetwork.neurons);
        }
      };

      exports_1("Network", Network);
    }
  };
});
System.register("ui", ["network"], function (exports_2, context_2) {
  "use strict";

  var network_ts_1, currentNetwork, continuousTrainingInterval, Grid, doc, theGrid, eraseCurrentNetwork, updateTheory, importWeightsAndBiasesFromFile, weightsAndBiases, continuousTraining, training, networkBuiltFromDOM, inputToNetworkConstructorParams, train;

  var __moduleName = context_2 && context_2.id;

  function getActivationBitmap(grid, network) {
    var sum = 0;
    if (!network) return Array(0);

    for (var x = grid.minX(); x <= grid.maxX(); x += 0.1) {
      for (var y = grid.minY(); y <= grid.maxY(); y += 0.1) {
        sum += network.process({
          x: x,
          y: y
        }).slice(-1)[0][0].number;
      }
    }

    var average = sum / ((grid.maxX() - grid.minX()) * 10 * (grid.maxY() - grid.minY()) * 10);
    return Array(Math.ceil((grid.maxX() - grid.minX()) * 10)).fill(Array(Math.ceil((grid.maxY() - grid.minY()) * 10)).fill(undefined)).map(function (row, i) {
      return row.map(function (cell, j) {
        var value = network.process({
          x: grid.minX() + i * 0.1,
          y: grid.minY() + j * 0.1
        }).slice(-1)[0][0].number;
        return {
          activated: value >= average && value > 1e-10,
          confidence: Math.min(255, Math.max(0, Math.floor(value * 256)))
        };
      });
    });
  }

  function getTheoryBitmap(grid, theory) {
    return Array(Math.ceil((grid.maxX() - grid.minX()) * 10)).fill(Array(Math.ceil((grid.maxY() - grid.minY()) * 10)).fill(undefined)).map(function (row, i) {
      return row.map(function (cell, j) {
        return theory({
          x: grid.minX() + i * 0.1,
          y: grid.minY() + j * 0.1
        })[0] >= 1;
      });
    });
  }

  function toJavascriptExpr(expr) {
    return expr.replace(/ <> /g, ' !== ').replace(/ = /g, ' === ').replace(/</g, ' < ').replace(/>/g, ' > ').replace(/([+*/-])/g, ' $1 ').replace(/([\s]+)(cos|sin|tan|sqrt)\(/g, '$1Math.$2(').replace(/e\^([^\s]+)/g, 'Math.exp($1)').replace(/\(([^)]+)\)\^([^\s]+)/g, 'Math.pow($1, $2)').replace(/([^\s]+)\^([^\s]+)/g, 'Math.pow($1, $2)').replace(/\|([^|]+)\|/g, 'Math.abs($1)');
  }

  return {
    setters: [function (network_ts_1_1) {
      network_ts_1 = network_ts_1_1;
    }],
    execute: function execute() {
      currentNetwork = [];
      continuousTrainingInterval = [];

      Grid = /*#__PURE__*/function () {
        function Grid(element, _ref6) {
          var width = _ref6.width,
              height = _ref6.height;

          _classCallCheck(this, Grid);

          var canvas = element;
          this.context = canvas.getContext('2d');
          this.zoom = 1 / 40;
          this.width = parseInt(width);
          this.height = parseInt(height);
          canvas.width = this.width;
          canvas.height = this.height;
        }

        _createClass(Grid, [{
          key: "clearRect",
          value: function clearRect() {
            this.context.clearRect(0, 0, this.width, this.height);
            return this;
          }
        }, {
          key: "maxX",
          value: function maxX() {
            return 1 / (this.zoom * 2);
          }
        }, {
          key: "minX",
          value: function minX() {
            return -1 / (this.zoom * 2);
          }
        }, {
          key: "maxY",
          value: function maxY() {
            return this.maxX() * this.height / this.width;
          }
        }, {
          key: "minY",
          value: function minY() {
            return this.minX() * this.height / this.width;
          }
        }, {
          key: "xCoords",
          value: function xCoords(x) {
            return (x - this.minX()) / (this.maxX() - this.minX()) * this.width;
          }
        }, {
          key: "yCoords",
          value: function yCoords(y) {
            return this.height - (y - this.minY()) / (this.maxY() - this.minY()) * this.height;
          }
        }, {
          key: "xTickDelta",
          value: function xTickDelta() {
            return 1;
          }
        }, {
          key: "yTickDelta",
          value: function yTickDelta() {
            return 1;
          }
        }, {
          key: "drawAxes",
          value: function drawAxes() {
            this.context.save();
            this.context.strokeStyle = '#000000';
            this.context.linewidth = 2; // +Y axis

            this.context.beginPath();
            this.context.moveTo(this.xCoords(0), this.yCoords(0));
            this.context.lineTo(this.xCoords(0), this.yCoords(this.maxY()));
            this.context.stroke();
            this.context.beginPath();
            this.context.moveTo(this.xCoords(0), this.yCoords(0));
            this.context.lineTo(this.xCoords(0), this.yCoords(this.minY()));
            this.context.stroke();
            var delta = this.yTickDelta();

            for (var _i2 = 1; _i2 * delta < this.maxY(); ++_i2) {
              this.context.beginPath();
              this.context.moveTo(this.xCoords(0) - 5, this.yCoords(_i2 * delta));
              this.context.lineTo(this.xCoords(0) + 5, this.yCoords(_i2 * delta));
              this.context.stroke();
            }

            delta = this.yTickDelta();

            for (var _i3 = 1; _i3 * delta > this.minY(); --_i3) {
              this.context.beginPath();
              this.context.moveTo(this.xCoords(0) - 5, this.yCoords(_i3 * delta));
              this.context.lineTo(this.xCoords(0) + 5, this.yCoords(_i3 * delta));
              this.context.stroke();
            }

            this.context.beginPath();
            this.context.moveTo(this.xCoords(0), this.yCoords(0));
            this.context.lineTo(this.xCoords(this.maxX()), this.yCoords(0));
            this.context.stroke();
            this.context.beginPath();
            this.context.moveTo(this.xCoords(0), this.yCoords(0));
            this.context.lineTo(this.xCoords(this.minX()), this.yCoords(0));
            this.context.stroke();
            delta = this.xTickDelta();

            for (var _i4 = 1; _i4 * delta < this.maxX(); ++_i4) {
              this.context.beginPath();
              this.context.moveTo(this.xCoords(_i4 * delta), this.yCoords(0) - 5);
              this.context.lineTo(this.xCoords(_i4 * delta), this.yCoords(0) + 5);
              this.context.stroke();
            }

            delta = this.xTickDelta();

            for (var i = 1; i * delta > this.minX(); --i) {
              this.context.beginPath();
              this.context.moveTo(this.xCoords(i * delta), this.yCoords(0) - 5);
              this.context.lineTo(this.xCoords(i * delta), this.yCoords(0) + 5);
              this.context.stroke();
            }

            this.context.restore();
            return this;
          }
        }, {
          key: "drawCircle",
          value: function drawCircle(x, y, radius, color) {
            this.context.strokeStyle = color;
            this.context.beginPath();
            this.context.arc(this.xCoords(x), this.yCoords(y), radius, 0, 2 * Math.PI, true);
            this.context.stroke();
            return this;
          }
        }, {
          key: "writeText",
          value: function writeText(text) {
            this.context.strokeStyle = '#000000';
            this.context.font = '20px Roboto';
            this.context.fillText(text, this.width - (text || '').length * 10, 15);
            return this;
          }
        }, {
          key: "redraw",
          value: function redraw(activation, theory, remainingCost) {
            this.clearRect();

            if (activation || theory) {
              for (var x = this.minX(); x <= this.maxX(); x += 0.1) {
                for (var y = this.minY(); y <= this.maxY(); y += 0.1) {
                  var indexX = Math.floor((x - this.minX()) * 10);
                  var indexY = Math.floor((y - this.minY()) * 10);

                  if (activation && activation[indexX][indexY] && activation[indexX][indexY].activated) {
                    var valueInHex = activation[indexX][indexY].confidence.toString(16).padStart(2, '0');
                    var invValueInHex = (256 - activation[indexX][indexY].confidence).toString(16).padStart(2, '0');
                    this.drawCircle(x, y, 1, "#".concat(invValueInHex).concat(valueInHex, "00"));
                  }

                  if (theory && theory[indexX][indexY]) {
                    this.drawCircle(x, y, 0.1, '#0000FF');
                  }
                }
              }
            }

            if (remainingCost) this.writeText("Remaining cost : ".concat(Math.round(remainingCost * 100) / 100));
            this.drawAxes();
            return this;
          }
        }]);

        return Grid;
      }();

      doc = window.document;
      theGrid = new Grid(doc.getElementById('canvas'), window.getComputedStyle(doc.getElementById('canvas'))).redraw();
      exports_2("eraseCurrentNetwork", eraseCurrentNetwork = function () {
        currentNetwork[0] = undefined;
      }.bind(this, currentNetwork));
      exports_2("updateTheory", updateTheory = function (grid) {
        var theoryAsJS = toJavascriptExpr(doc.getElementById('theory').value);
        var theoryFunction;

        try {
          theoryFunction = eval("({x,y}) => ".concat(theoryAsJS.trim() || 'false', " ? [1] : [0]"));
          doc.getElementById('actionTraining').disabled = false;
          doc.getElementById('actionOneTraining').disabled = false;
        } catch (e) {
          doc.getElementById('actionTraining').disabled = true;
          doc.getElementById('actionOneTraining').disabled = true;
        }

        grid.redraw(undefined, getTheoryBitmap(grid, theoryFunction));
      }.bind(this, theGrid));
      exports_2("importWeightsAndBiasesFromFile", importWeightsAndBiasesFromFile = function (grid, network) {
        if (!doc.getElementById('fileinput').files || !doc.getElementById('fileinput').files.length) return;
        var fileReader = new window.FileReader();

        fileReader.onload = function () {
          var _JSON$parse = JSON.parse(fileReader.result),
              weightsAndBiases = _JSON$parse.weightsAndBiases,
              parameters = _JSON$parse.parameters,
              theory = _JSON$parse.theory,
              layersLength = _JSON$parse.layersLength;

          doc.getElementById('parameter1').value = parameters && parameters[0] || '';
          doc.getElementById('parameter2').value = parameters && parameters[1] || '';
          doc.getElementById('parameter3').value = parameters && parameters[2] || '';
          doc.getElementById('parameter4').value = parameters && parameters[3] || '';
          doc.getElementById('theory').value = theory;
          doc.getElementById('layer1').value = layersLength.length > 2 ? "".concat(layersLength[1], " Neuron").concat(layersLength[1] > 1 ? 's' : '') : 'None';
          Array.from(doc.getElementById('layer1Choices').getElementsByTagName('li')).map(function (e, i) {
            var value = layersLength.length > 2 ? layersLength[1] === i : i === 0;
            e.dataset['selected'] = "".concat(value);
            e.selected = value;
            if (value) e.classList.add('selected');else e.classList.remove('selected');
          });
          Array.from(doc.getElementById('layer2Choices').getElementsByTagName('li')).map(function (e, i) {
            var value = layersLength.length > 3 ? layersLength[2] === i : i === 0;
            e.dataset['selected'] = "".concat(value);
            e.selected = value;
            if (value) e.classList.add('selected');else e.classList.remove('selected');
          });
          doc.getElementById('layer2').value = layersLength.length > 3 ? "".concat(layersLength[2], " Neuron").concat(layersLength[2] > 1 ? 's' : '') : 'None';
          network[0] = networkBuiltFromDOM().apply(weightsAndBiases);
          var theoryAsJS = toJavascriptExpr(theory);
          var theoryFunction = eval("({x,y}) => ".concat(theoryAsJS.trim() || 'false', " ? [1] : [0]"));
          grid.redraw(getActivationBitmap(grid, network[0]), getTheoryBitmap(grid, theoryFunction));
          doc.getElementById('actionWeightsAndBiases').disabled = false;
        };

        fileReader.readAsText(doc.getElementById('fileinput').files[0]);
        doc.getElementById('fileinput').value = '';
      }.bind(this, theGrid, currentNetwork));
      exports_2("weightsAndBiases", weightsAndBiases = function (network) {
        var weightsAndBiases = network[0].getWeightsAndBiases();
        var parameters = [doc.getElementById('parameter1').value, doc.getElementById('parameter2').value, doc.getElementById('parameter3').value, doc.getElementById('parameter4').value].filter(function (v) {
          return v;
        }).map(function (e) {
          return ' ' + e + ' ';
        });
        var theory = ' ' + doc.getElementById('theory').value + ' ';
        var layersLength = network[0].neurons.map(function (l) {
          return l.length;
        });
        var link = doc.createElement('a');
        link.style.display = 'none';
        link.href = "data:application/json,".concat(JSON.stringify({
          weightsAndBiases: weightsAndBiases,
          parameters: parameters,
          theory: theory,
          layersLength: layersLength
        }));
        link.download = 'weightsAndBiases.json';
        doc.body.appendChild(link);
        link.click();
      }.bind(this, currentNetwork));
      exports_2("continuousTraining", continuousTraining = function (interval) {
        if (interval[0]) {
          clearInterval(interval[0]);
          interval[0] = undefined;
          doc.getElementById('actionIconRowing').innerText = 'rowing';
          doc.getElementById('actionOneTraining').disabled = false;
          return;
        }

        doc.getElementById('actionIconRowing').innerText = 'stop';
        doc.getElementById('actionOneTraining').disabled = true;
        var inprogress = false;
        doc.getElementById('trainingSize').value = '100';
        interval[0] = setInterval(function () {
          if (!inprogress) {
            inprogress = true;
            training().then(function () {
              inprogress = false;
            });
          }
        }, 200);
      }.bind(this, continuousTrainingInterval));
      exports_2("training", training = function (grid, whereToSave) {
        doc.body.style.cursor = 'wait';
        return train(networkBuiltFromDOM(), ' ' + doc.getElementById('theory').value + ' ', doc.getElementById('trainingSize').value, doc.getElementById('variablesAmplitude').value).then(function (value) {
          var theory = value.theory,
              network = value.trainedNetwork,
              remainingCost = value.remainingCost;
          var activation = getActivationBitmap(grid, network);
          var theoryResult = getTheoryBitmap(grid, theory);
          whereToSave[0] = network;
          doc.getElementById('actionWeightsAndBiases').disabled = false;
          grid.redraw(activation, theoryResult, remainingCost || 1);
          doc.body.style.cursor = 'pointer';
        });
      }.bind(this, theGrid, currentNetwork));

      networkBuiltFromDOM = function networkBuiltFromDOM() {
        return new network_ts_1.Network(inputToNetworkConstructorParams([doc.getElementById('parameter1').value, doc.getElementById('parameter2').value, doc.getElementById('parameter3').value, doc.getElementById('parameter4').value].filter(function (v) {
          return v;
        }).map(function (e) {
          return ' ' + e + ' ';
        }), doc.getElementById('layer1').value, doc.getElementById('layer2').value, doc.getElementsByName('activation')[0].value));
      };

      inputToNetworkConstructorParams = function inputToNetworkConstructorParams(parametersAsExprs, layer1, layer2, activationFunction) {
        var parametersAsJS = parametersAsExprs.map(function (p) {
          return toJavascriptExpr(p);
        });
        var parameters = parametersAsJS.map(function (param, i) {
          return eval('({x,y}) => ' + parametersAsJS[i]);
        });
        var numberByLayer = [parameters.length].concat(layer1 && layer1 !== 'None' ? Array(1).fill(parseInt(layer1)) : []).concat(layer2 && layer2 !== 'None' ? Array(1).fill(parseInt(layer2)) : []).concat([1]);
        return {
          numberByLayer: numberByLayer,
          activationFunction: activationFunction,
          randomInit: true,
          parameters: parameters
        };
      };

      train = function (currentNetwork, networkBuiltFromDOM, theoryAsExpr, trainingSizeAsString, variablesAmplitudeAsString) {
        var variablesAmplitude = parseInt(variablesAmplitudeAsString);
        var theoryAsJS = toJavascriptExpr(theoryAsExpr);
        var theory = eval("({x,y}) => ".concat(theoryAsJS.trim() || 'false', " ? [1] : [0]"));
        var trainingSize = parseInt(trainingSizeAsString);
        var inputs = new Array(trainingSize).fill(undefined).map(function (_, i) {
          var amplitude = i < trainingSize / 3 ? 5 : i < trainingSize / 2 ? 10 : variablesAmplitude;
          return {
            x: Math.floor(Math.random() * amplitude * 100 - amplitude * 100 / 2) / 100,
            y: Math.floor(Math.random() * amplitude * 100 - amplitude * 100 / 2) / 100
          };
        }).sort(function () {
          return Math.random() - 0.5;
        });
        return new Promise(function (resolve) {
          var network = currentNetwork[0] || networkBuiltFromDOM;
          resolve(_objectSpread(_objectSpread({}, network.trainWithGradientDescent({
            inputs: inputs,
            theory: theory
          })), {}, {
            theory: theory
          }));
        });
      }.bind(this, currentNetwork);
    }
  };
});

var __exp = _instantiate("ui");

var eraseCurrentNetwork = __exp["eraseCurrentNetwork"];
exports.eraseCurrentNetwork = eraseCurrentNetwork;
var updateTheory = __exp["updateTheory"];
exports.updateTheory = updateTheory;
var importWeightsAndBiasesFromFile = __exp["importWeightsAndBiasesFromFile"];
exports.importWeightsAndBiasesFromFile = importWeightsAndBiasesFromFile;
var weightsAndBiases = __exp["weightsAndBiases"];
exports.weightsAndBiases = weightsAndBiases;
var continuousTraining = __exp["continuousTraining"];
exports.continuousTraining = continuousTraining;
var training = __exp["training"];
exports.training = training;

