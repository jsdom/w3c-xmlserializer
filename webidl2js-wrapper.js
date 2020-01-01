"use strict";

// It would be nice if webidl2js coudl generate XMLSerializer.js here directly, with the desired name of
// webidl2js-wrapper.js. But, that isn't currently possible. Alternatives like a postprocessing step that renames
// would have to rewrite the `require("./utils.js")`, which seems messy, so until webidl2js gets more flexible, we'll
// just use this as a wrapper file.
module.exports = require("./lib/XMLSerializer");
