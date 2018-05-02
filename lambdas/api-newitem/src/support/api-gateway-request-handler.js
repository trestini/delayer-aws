/*
 * Copyright (c) 2018 ${company}
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

module.exports = {

  request(event, context) {
    const ret = Object.assign({}, event, context);
    if( ret.headers['Content-Type'] === 'application/json' ){
      ret.body = JSON.parse(ret.body);
    }
    return ret;
  },

  response(callback) {

    const responseHandler = (code) => {
      return (body, headers) => {
        const response = {
          statusCode: code
        };
        if( body ){
          response.body = JSON.stringify(body);
        }
        if( headers ) {
          response.headers = JSON.stringify(headers);
        }
        callback(null, response);
      };
    };

    const httpResponse = {
      ok:                               responseHandler(200),
      created:                          responseHandler(201),
      accepted:                         responseHandler(202),
      nonAuthoritativeInformation:      responseHandler(203),
      noContent:                        responseHandler(204),
      resetContent:                     responseHandler(205),
      partialContent:                   responseHandler(206),
      multiStatus:                      responseHandler(207),
      alreadyReported:                  responseHandler(208),
      IMUsed:                           responseHandler(226),
      multipleChoices:                  responseHandler(300),
      movedPermanently:                 responseHandler(301),
      found:                            responseHandler(302),
      seeOther:                         responseHandler(303),
      notModified:                      responseHandler(304),
      useProxy:                         responseHandler(305),
      temporaryRedirect:                responseHandler(307),
      permanentRedirect:                responseHandler(308),
      badRequest:                       responseHandler(400),
      unauthorized:                     responseHandler(401),
      paymentRequired:                  responseHandler(402),
      forbidden:                        responseHandler(403),
      notFound:                         responseHandler(404),
      methodNotAllowed:                 responseHandler(405),
      notAcceptable:                    responseHandler(406),
      proxyAuthenticationRequired:      responseHandler(407),
      requestTimeout:                   responseHandler(408),
      conflict:                         responseHandler(409),
      gone:                             responseHandler(410),
      lengthRequired:                   responseHandler(411),
      preconditionFailed:               responseHandler(412),
      payloadTooLarge:                  responseHandler(413),
      requestURITooLong:                responseHandler(414),
      unsupportedMediaType:             responseHandler(415),
      requestedRangeNotSatisfiable:     responseHandler(416),
      expectationFailed:                responseHandler(417),
      imATeapot:                        responseHandler(418),
      misdirectedRequest:               responseHandler(421),
      unprocessableEntity:              responseHandler(422),
      locked:                           responseHandler(423),
      failedDependency:                 responseHandler(424),
      upgradeRequired:                  responseHandler(426),
      preconditionRequired:             responseHandler(428),
      tooManyRequests:                  responseHandler(429),
      requestHeaderFieldsTooLarge:      responseHandler(431),
      connectionClosedWithoutResponse:  responseHandler(444),
      unavailableForLegalReasons:       responseHandler(451),
      clientClosedRequest:              responseHandler(499),
      internalServerError:              responseHandler(500),
      notImplemented:                   responseHandler(501),
      badGateway:                       responseHandler(502),
      serviceUnavailable:               responseHandler(503),
      gatewayTimeout:                   responseHandler(504),
      httpVersionNotSupported:          responseHandler(505),
      variantAlsoNegotiates:            responseHandler(506),
      insufficientStorage:              responseHandler(507),
      loopDetected:                     responseHandler(508),
      notExtended:                      responseHandler(510),
      networkAuthenticationRequired:    responseHandler(511),
      networkConnectTimeoutError:       responseHandler(599)
    };

    return httpResponse;
  }
};


