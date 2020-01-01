"use strict";

const serialize = require("../serialize");

exports.implementation = class XMLSerializerImpl {
  constructor(globalObject) {
    this._globalObject = globalObject;
  }
  serializeToString(root) {
    return serialize(root, { requireWellFormed: false, exceptionConstructor: this._globalObject.DOMException });
  }
};
