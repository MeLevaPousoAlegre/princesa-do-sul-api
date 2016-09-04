'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _request_bullshit = require('./request_bullshit.js');

var _request_bullshit2 = _interopRequireDefault(_request_bullshit);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BASE_URL = 'http://www.princesadosul.com.br/cmh/PrevisaoChegada.aspx';

exports.default = {
  getBusLines: function getBusLines() {
    return new _promise2.default(function (resolve, reject) {
      (0, _request2.default)(BASE_URL, function (error, response, body) {
        if (error) return reject(error);

        var $ = _cheerio2.default.load(body);

        var roadLines = $('select[name=ddLinhas] option').toArray().map(function (option) {
          var value = $(option).attr('value');
          // Ignore the first option
          if (value === '0') return null;

          return value;
        }).filter(function (roadLine) {
          return roadLine !== null;
        });

        resolve(roadLines);
      });
    });
  },
  getAllBusLineStops: function getAllBusLineStops(busLine) {
    return new _promise2.default(function (resolve, reject) {
      _request2.default.post({
        url: BASE_URL,
        form: (0, _assign2.default)(_request_bullshit2.default, {
          ddLinhas: busLine,
          chkEndereco: 'on',
          chkPontos: 'on'
        }),
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.82 Safari/537.36'
        }
      }, function (error, response, body) {
        var $ = _cheerio2.default.load(body);
        var directionsTables = $('#Ida_content table table');
        var stopWays = directionsTables.toArray().map(function (table) {
          return $(table).find('tr').toArray().map(function (tr) {
            var tds = $(tr).find('td[title]');

            return {
              address: tds.eq(0).text(),
              stopDescription: tds.eq(1).text(),
              isCurrentOne: $(tr).find('td img[src="Bus-Blink.gif"]').length !== 0
            };
          });
        });

        resolve({
          going: stopWays[0],
          coming: stopWays[1]
        });
      });
    });
  },
  getBusLineCurrentStops: function getBusLineCurrentStops(busLine) {
    return this.getAllBusLineStops(busLine).then(function (stops) {
      return {
        coming: _lodash2.default.find(stops.coming, { isCurrentOne: true }),
        going: _lodash2.default.find(stops.going, { isCurrentOne: true })
      };
    });
  }
};