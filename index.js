"use strict";

const XMLSerializer = require("./webidl2js-wrapper");
const DOMException = require("domexception");

const sharedGlobalObject = { DOMException };
XMLSerializer.install(sharedGlobalObject);

module.exports = sharedGlobalObject.XMLSerializer;
