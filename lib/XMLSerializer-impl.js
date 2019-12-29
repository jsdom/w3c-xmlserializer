"use strict";

const serialize = require("../serialize.js");

exports.implementation = class XMLSerializerImpl {
  constructor(globalObject) {
    this._globalObject = globalObject;
  }
  serializeToString(root) {
    return serialize(root, { requireWellFormed: false, exceptionConstructor: this._globalObject.DOMException });
  }
};
