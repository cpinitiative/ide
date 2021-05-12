/* eslint-disable */

/*!
 * Firepad is an open-source, collaborative code and text editor. It was designed
 * to be embedded inside larger applications. Since it uses Firebase as a backend,
 * it requires no server-side code and can be added to any web app simply by
 * including a couple JavaScript files.
 *
 * Firepad 0.0.0
 * http://www.firepad.io/
 * License: MIT
 * Copyright: 2014 Firebase
 * With code from ot.js (Copyright 2012-2013 Tim Baumann)
 */

var firepad = firepad || {};
firepad.utils = {};

firepad.utils.makeEventEmitter = function (clazz, opt_allowedEVents) {
  clazz.prototype.allowedEvents_ = opt_allowedEVents;

  clazz.prototype.on = function (eventType, callback, context) {
    this.validateEventType_(eventType);
    this.eventListeners_ = this.eventListeners_ || {};
    this.eventListeners_[eventType] = this.eventListeners_[eventType] || [];
    this.eventListeners_[eventType].push({
      callback: callback,
      context: context,
    });
  };

  clazz.prototype.off = function (eventType, callback) {
    this.validateEventType_(eventType);
    this.eventListeners_ = this.eventListeners_ || {};
    var listeners = this.eventListeners_[eventType] || [];
    for (var i = 0; i < listeners.length; i++) {
      if (listeners[i].callback === callback) {
        listeners.splice(i, 1);
        return;
      }
    }
  };

  clazz.prototype.trigger = function (eventType /*, args ... */) {
    this.eventListeners_ = this.eventListeners_ || {};
    var listeners = this.eventListeners_[eventType] || [];
    for (var i = 0; i < listeners.length; i++) {
      listeners[i].callback.apply(
        listeners[i].context,
        Array.prototype.slice.call(arguments, 1)
      );
    }
  };

  clazz.prototype.validateEventType_ = function (eventType) {
    if (this.allowedEvents_) {
      var allowed = false;
      for (var i = 0; i < this.allowedEvents_.length; i++) {
        if (this.allowedEvents_[i] === eventType) {
          allowed = true;
          break;
        }
      }
      if (!allowed) {
        throw new Error('Unknown event "' + eventType + '"');
      }
    }
  };
};

firepad.utils.elt = function (tag, content, attrs) {
  var e = document.createElement(tag);
  if (typeof content === 'string') {
    firepad.utils.setTextContent(e, content);
  } else if (content) {
    for (var i = 0; i < content.length; ++i) {
      e.appendChild(content[i]);
    }
  }
  for (var attr in attrs || {}) {
    e.setAttribute(attr, attrs[attr]);
  }
  return e;
};

firepad.utils.setTextContent = function (e, str) {
  e.innerHTML = '';
  e.appendChild(document.createTextNode(str));
};

firepad.utils.on = function (emitter, type, f, capture) {
  if (emitter.addEventListener) {
    emitter.addEventListener(type, f, capture || false);
  } else if (emitter.attachEvent) {
    emitter.attachEvent('on' + type, f);
  }
};

firepad.utils.off = function (emitter, type, f, capture) {
  if (emitter.removeEventListener) {
    emitter.removeEventListener(type, f, capture || false);
  } else if (emitter.detachEvent) {
    emitter.detachEvent('on' + type, f);
  }
};

firepad.utils.preventDefault = function (e) {
  if (e.preventDefault) {
    e.preventDefault();
  } else {
    e.returnValue = false;
  }
};

firepad.utils.stopPropagation = function (e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  } else {
    e.cancelBubble = true;
  }
};

firepad.utils.stopEvent = function (e) {
  firepad.utils.preventDefault(e);
  firepad.utils.stopPropagation(e);
};

firepad.utils.stopEventAnd = function (fn) {
  return function (e) {
    fn(e);
    firepad.utils.stopEvent(e);
    return false;
  };
};

firepad.utils.trim = function (str) {
  return str.replace(/^\s+/g, '').replace(/\s+$/g, '');
};

firepad.utils.stringEndsWith = function (str, suffix) {
  var list = typeof suffix == 'string' ? [suffix] : suffix;
  for (var i = 0; i < list.length; i++) {
    var suffix = list[i];
    if (str.indexOf(suffix, str.length - suffix.length) !== -1) return true;
  }
  return false;
};

firepad.utils.assert = function assert(b, msg) {
  if (!b) {
    throw new Error(msg || 'assertion error');
  }
};

firepad.utils.log = function () {
  if (typeof console !== 'undefined' && typeof console.log !== 'undefined') {
    var args = ['Firepad:'];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(console, args);
  }
};

var firepad = firepad || {};
firepad.Span = (function () {
  function Span(pos, length) {
    this.pos = pos;
    this.length = length;
  }

  Span.prototype.end = function () {
    return this.pos + this.length;
  };

  return Span;
})();

var firepad = firepad || {};

firepad.TextOp = (function () {
  var utils = firepad.utils;

  // Operation are essentially lists of ops. There are three types of ops:
  //
  // * Retain ops: Advance the cursor position by a given number of characters.
  //   Represented by positive ints.
  // * Insert ops: Insert a given string at the current cursor position.
  //   Represented by strings.
  // * Delete ops: Delete the next n characters. Represented by negative ints.
  function TextOp(type) {
    this.type = type;
    this.chars = null;
    this.text = null;
    this.attributes = null;

    if (type === 'insert') {
      this.text = arguments[1];
      utils.assert(typeof this.text === 'string');
      this.attributes = arguments[2] || {};
      utils.assert(typeof this.attributes === 'object');
    } else if (type === 'delete') {
      this.chars = arguments[1];
      utils.assert(typeof this.chars === 'number');
    } else if (type === 'retain') {
      this.chars = arguments[1];
      utils.assert(typeof this.chars === 'number');
      this.attributes = arguments[2] || {};
      utils.assert(typeof this.attributes === 'object');
    }
  }

  TextOp.prototype.isInsert = function () {
    return this.type === 'insert';
  };
  TextOp.prototype.isDelete = function () {
    return this.type === 'delete';
  };
  TextOp.prototype.isRetain = function () {
    return this.type === 'retain';
  };

  TextOp.prototype.equals = function (other) {
    return (
      this.type === other.type &&
      this.text === other.text &&
      this.chars === other.chars &&
      this.attributesEqual(other.attributes)
    );
  };

  TextOp.prototype.attributesEqual = function (otherAttributes) {
    for (var attr in this.attributes) {
      if (this.attributes[attr] !== otherAttributes[attr]) {
        return false;
      }
    }

    for (attr in otherAttributes) {
      if (this.attributes[attr] !== otherAttributes[attr]) {
        return false;
      }
    }

    return true;
  };

  TextOp.prototype.hasEmptyAttributes = function () {
    var empty = true;
    for (var attr in this.attributes) {
      empty = false;
      break;
    }

    return empty;
  };

  return TextOp;
})();

var firepad = firepad || {};

firepad.TextOperation = (function () {
  'use strict';
  var TextOp = firepad.TextOp;
  var utils = firepad.utils;

  // Constructor for new operations.
  function TextOperation() {
    if (!this || this.constructor !== TextOperation) {
      // => function was called without 'new'
      return new TextOperation();
    }

    // When an operation is applied to an input string, you can think of this as
    // if an imaginary cursor runs over the entire string and skips over some
    // parts, deletes some parts and inserts characters at some positions. These
    // actions (skip/delete/insert) are stored as an array in the "ops" property.
    this.ops = [];
    // An operation's baseLength is the length of every string the operation
    // can be applied to.
    this.baseLength = 0;
    // The targetLength is the length of every string that results from applying
    // the operation on a valid input string.
    this.targetLength = 0;
  }

  TextOperation.prototype.equals = function (other) {
    if (this.baseLength !== other.baseLength) {
      return false;
    }
    if (this.targetLength !== other.targetLength) {
      return false;
    }
    if (this.ops.length !== other.ops.length) {
      return false;
    }
    for (var i = 0; i < this.ops.length; i++) {
      if (!this.ops[i].equals(other.ops[i])) {
        return false;
      }
    }
    return true;
  };

  // After an operation is constructed, the user of the library can specify the
  // actions of an operation (skip/insert/delete) with these three builder
  // methods. They all return the operation for convenient chaining.

  // Skip over a given number of characters.
  TextOperation.prototype.retain = function (n, attributes) {
    if (typeof n !== 'number' || n < 0) {
      throw new Error('retain expects a positive integer.');
    }
    if (n === 0) {
      return this;
    }
    this.baseLength += n;
    this.targetLength += n;
    attributes = attributes || {};
    var prevOp = this.ops.length > 0 ? this.ops[this.ops.length - 1] : null;
    if (prevOp && prevOp.isRetain() && prevOp.attributesEqual(attributes)) {
      // The last op is a retain op with the same attributes => we can merge them into one op.
      prevOp.chars += n;
    } else {
      // Create a new op.
      this.ops.push(new TextOp('retain', n, attributes));
    }
    return this;
  };

  // Insert a string at the current position.
  TextOperation.prototype.insert = function (str, attributes) {
    if (typeof str !== 'string') {
      throw new Error('insert expects a string');
    }
    if (str === '') {
      return this;
    }
    attributes = attributes || {};
    this.targetLength += str.length;
    var prevOp = this.ops.length > 0 ? this.ops[this.ops.length - 1] : null;
    var prevPrevOp = this.ops.length > 1 ? this.ops[this.ops.length - 2] : null;
    if (prevOp && prevOp.isInsert() && prevOp.attributesEqual(attributes)) {
      // Merge insert op.
      prevOp.text += str;
    } else if (prevOp && prevOp.isDelete()) {
      // It doesn't matter when an operation is applied whether the operation
      // is delete(3), insert("something") or insert("something"), delete(3).
      // Here we enforce that in this case, the insert op always comes first.
      // This makes all operations that have the same effect when applied to
      // a document of the right length equal in respect to the `equals` method.
      if (
        prevPrevOp &&
        prevPrevOp.isInsert() &&
        prevPrevOp.attributesEqual(attributes)
      ) {
        prevPrevOp.text += str;
      } else {
        this.ops[this.ops.length - 1] = new TextOp('insert', str, attributes);
        this.ops.push(prevOp);
      }
    } else {
      this.ops.push(new TextOp('insert', str, attributes));
    }
    return this;
  };

  // Delete a string at the current position.
  TextOperation.prototype['delete'] = function (n) {
    if (typeof n === 'string') {
      n = n.length;
    }
    if (typeof n !== 'number' || n < 0) {
      throw new Error('delete expects a positive integer or a string');
    }
    if (n === 0) {
      return this;
    }
    this.baseLength += n;
    var prevOp = this.ops.length > 0 ? this.ops[this.ops.length - 1] : null;
    if (prevOp && prevOp.isDelete()) {
      prevOp.chars += n;
    } else {
      this.ops.push(new TextOp('delete', n));
    }
    return this;
  };

  // Tests whether this operation has no effect.
  TextOperation.prototype.isNoop = function () {
    return (
      this.ops.length === 0 ||
      (this.ops.length === 1 &&
        this.ops[0].isRetain() &&
        this.ops[0].hasEmptyAttributes())
    );
  };

  TextOperation.prototype.clone = function () {
    var clone = new TextOperation();
    for (var i = 0; i < this.ops.length; i++) {
      if (this.ops[i].isRetain()) {
        clone.retain(this.ops[i].chars, this.ops[i].attributes);
      } else if (this.ops[i].isInsert()) {
        clone.insert(this.ops[i].text, this.ops[i].attributes);
      } else {
        clone['delete'](this.ops[i].chars);
      }
    }

    return clone;
  };

  // Pretty printing.
  TextOperation.prototype.toString = function () {
    // map: build a new array by applying a function to every element in an old
    // array.
    var map =
      Array.prototype.map ||
      function (fn) {
        var arr = this;
        var newArr = [];
        for (var i = 0, l = arr.length; i < l; i++) {
          newArr[i] = fn(arr[i]);
        }
        return newArr;
      };
    return map
      .call(this.ops, function (op) {
        if (op.isRetain()) {
          return 'retain ' + op.chars;
        } else if (op.isInsert()) {
          return "insert '" + op.text + "'";
        } else {
          return 'delete ' + op.chars;
        }
      })
      .join(', ');
  };

  // Converts operation into a JSON value.
  TextOperation.prototype.toJSON = function () {
    var ops = [];
    for (var i = 0; i < this.ops.length; i++) {
      // We prefix ops with their attributes if non-empty.
      if (!this.ops[i].hasEmptyAttributes()) {
        ops.push(this.ops[i].attributes);
      }
      if (this.ops[i].type === 'retain') {
        ops.push(this.ops[i].chars);
      } else if (this.ops[i].type === 'insert') {
        ops.push(this.ops[i].text);
      } else if (this.ops[i].type === 'delete') {
        ops.push(-this.ops[i].chars);
      }
    }
    // Return an array with /something/ in it, since an empty array will be treated as null by Firebase.
    if (ops.length === 0) {
      ops.push(0);
    }
    return ops;
  };

  // Converts a plain JS object into an operation and validates it.
  TextOperation.fromJSON = function (ops) {
    var o = new TextOperation();
    for (var i = 0, l = ops.length; i < l; i++) {
      var op = ops[i];
      var attributes = {};
      if (typeof op === 'object') {
        attributes = op;
        i++;
        op = ops[i];
      }
      if (typeof op === 'number') {
        if (op > 0) {
          o.retain(op, attributes);
        } else {
          o['delete'](-op);
        }
      } else {
        utils.assert(typeof op === 'string');
        o.insert(op, attributes);
      }
    }
    return o;
  };

  // Apply an operation to a string, returning a new string. Throws an error if
  // there's a mismatch between the input string and the operation.
  TextOperation.prototype.apply = function (str, oldAttributes, newAttributes) {
    var operation = this;
    oldAttributes = oldAttributes || [];
    newAttributes = newAttributes || [];
    if (str.length !== operation.baseLength) {
      throw new Error(
        "The operation's base length must be equal to the string's length."
      );
    }
    var newStringParts = [],
      j = 0,
      k,
      attr;
    var oldIndex = 0;
    var ops = this.ops;
    for (var i = 0, l = ops.length; i < l; i++) {
      var op = ops[i];
      if (op.isRetain()) {
        if (oldIndex + op.chars > str.length) {
          throw new Error(
            "Operation can't retain more characters than are left in the string."
          );
        }
        // Copy skipped part of the retained string.
        newStringParts[j++] = str.slice(oldIndex, oldIndex + op.chars);

        // Copy (and potentially update) attributes for each char in retained string.
        for (k = 0; k < op.chars; k++) {
          var currAttributes = oldAttributes[oldIndex + k] || {},
            updatedAttributes = {};
          for (attr in currAttributes) {
            updatedAttributes[attr] = currAttributes[attr];
            utils.assert(updatedAttributes[attr] !== false);
          }
          for (attr in op.attributes) {
            if (op.attributes[attr] === false) {
              delete updatedAttributes[attr];
            } else {
              updatedAttributes[attr] = op.attributes[attr];
            }
            utils.assert(updatedAttributes[attr] !== false);
          }
          newAttributes.push(updatedAttributes);
        }

        oldIndex += op.chars;
      } else if (op.isInsert()) {
        // Insert string.
        newStringParts[j++] = op.text;

        // Insert attributes for each char.
        for (k = 0; k < op.text.length; k++) {
          var insertedAttributes = {};
          for (attr in op.attributes) {
            insertedAttributes[attr] = op.attributes[attr];
            utils.assert(insertedAttributes[attr] !== false);
          }
          newAttributes.push(insertedAttributes);
        }
      } else {
        // delete op
        oldIndex += op.chars;
      }
    }
    if (oldIndex !== str.length) {
      throw new Error("The operation didn't operate on the whole string.");
    }
    var newString = newStringParts.join('');
    utils.assert(newString.length === newAttributes.length);

    return newString;
  };

  // Computes the inverse of an operation. The inverse of an operation is the
  // operation that reverts the effects of the operation, e.g. when you have an
  // operation 'insert("hello "); skip(6);' then the inverse is 'delete("hello ");
  // skip(6);'. The inverse should be used for implementing undo.
  TextOperation.prototype.invert = function (str) {
    var strIndex = 0;
    var inverse = new TextOperation();
    var ops = this.ops;
    for (var i = 0, l = ops.length; i < l; i++) {
      var op = ops[i];
      if (op.isRetain()) {
        inverse.retain(op.chars);
        strIndex += op.chars;
      } else if (op.isInsert()) {
        inverse['delete'](op.text.length);
      } else {
        // delete op
        inverse.insert(str.slice(strIndex, strIndex + op.chars));
        strIndex += op.chars;
      }
    }
    return inverse;
  };

  // Compose merges two consecutive operations into one operation, that
  // preserves the changes of both. Or, in other words, for each input string S
  // and a pair of consecutive operations A and B,
  // apply(apply(S, A), B) = apply(S, compose(A, B)) must hold.
  TextOperation.prototype.compose = function (operation2) {
    var operation1 = this;
    if (operation1.targetLength !== operation2.baseLength) {
      throw new Error(
        'The base length of the second operation has to be the target length of the first operation'
      );
    }

    function composeAttributes(first, second, firstOpIsInsert) {
      var merged = {},
        attr;
      for (attr in first) {
        merged[attr] = first[attr];
      }
      for (attr in second) {
        if (firstOpIsInsert && second[attr] === false) {
          delete merged[attr];
        } else {
          merged[attr] = second[attr];
        }
      }
      return merged;
    }

    var operation = new TextOperation(); // the combined operation
    var ops1 = operation1.clone().ops,
      ops2 = operation2.clone().ops;
    var i1 = 0,
      i2 = 0; // current index into ops1 respectively ops2
    var op1 = ops1[i1++],
      op2 = ops2[i2++]; // current ops
    var attributes;
    while (true) {
      // Dispatch on the type of op1 and op2
      if (typeof op1 === 'undefined' && typeof op2 === 'undefined') {
        // end condition: both ops1 and ops2 have been processed
        break;
      }

      if (op1 && op1.isDelete()) {
        operation['delete'](op1.chars);
        op1 = ops1[i1++];
        continue;
      }
      if (op2 && op2.isInsert()) {
        operation.insert(op2.text, op2.attributes);
        op2 = ops2[i2++];
        continue;
      }

      if (typeof op1 === 'undefined') {
        throw new Error(
          'Cannot compose operations: first operation is too short.'
        );
      }
      if (typeof op2 === 'undefined') {
        throw new Error(
          'Cannot compose operations: first operation is too long.'
        );
      }

      if (op1.isRetain() && op2.isRetain()) {
        attributes = composeAttributes(op1.attributes, op2.attributes);
        if (op1.chars > op2.chars) {
          operation.retain(op2.chars, attributes);
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          operation.retain(op1.chars, attributes);
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          operation.retain(op1.chars, attributes);
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }
      } else if (op1.isInsert() && op2.isDelete()) {
        if (op1.text.length > op2.chars) {
          op1.text = op1.text.slice(op2.chars);
          op2 = ops2[i2++];
        } else if (op1.text.length === op2.chars) {
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          op2.chars -= op1.text.length;
          op1 = ops1[i1++];
        }
      } else if (op1.isInsert() && op2.isRetain()) {
        attributes = composeAttributes(
          op1.attributes,
          op2.attributes,
          /*firstOpIsInsert=*/ true
        );
        if (op1.text.length > op2.chars) {
          operation.insert(op1.text.slice(0, op2.chars), attributes);
          op1.text = op1.text.slice(op2.chars);
          op2 = ops2[i2++];
        } else if (op1.text.length === op2.chars) {
          operation.insert(op1.text, attributes);
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          operation.insert(op1.text, attributes);
          op2.chars -= op1.text.length;
          op1 = ops1[i1++];
        }
      } else if (op1.isRetain() && op2.isDelete()) {
        if (op1.chars > op2.chars) {
          operation['delete'](op2.chars);
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          operation['delete'](op2.chars);
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          operation['delete'](op1.chars);
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }
      } else {
        throw new Error(
          "This shouldn't happen: op1: " +
            JSON.stringify(op1) +
            ', op2: ' +
            JSON.stringify(op2)
        );
      }
    }
    return operation;
  };

  function getSimpleOp(operation) {
    var ops = operation.ops;
    switch (ops.length) {
      case 1:
        return ops[0];
      case 2:
        return ops[0].isRetain() ? ops[1] : ops[1].isRetain() ? ops[0] : null;
      case 3:
        if (ops[0].isRetain() && ops[2].isRetain()) {
          return ops[1];
        }
    }
    return null;
  }

  function getStartIndex(operation) {
    if (operation.ops[0].isRetain()) {
      return operation.ops[0].chars;
    }
    return 0;
  }

  // When you use ctrl-z to undo your latest changes, you expect the program not
  // to undo every single keystroke but to undo your last sentence you wrote at
  // a stretch or the deletion you did by holding the backspace key down. This
  // This can be implemented by composing operations on the undo stack. This
  // method can help decide whether two operations should be composed. It
  // returns true if the operations are consecutive insert operations or both
  // operations delete text at the same position. You may want to include other
  // factors like the time since the last change in your decision.
  TextOperation.prototype.shouldBeComposedWith = function (other) {
    if (this.isNoop() || other.isNoop()) {
      return true;
    }

    var startA = getStartIndex(this),
      startB = getStartIndex(other);
    var simpleA = getSimpleOp(this),
      simpleB = getSimpleOp(other);
    if (!simpleA || !simpleB) {
      return false;
    }

    if (simpleA.isInsert() && simpleB.isInsert()) {
      return startA + simpleA.text.length === startB;
    }

    if (simpleA.isDelete() && simpleB.isDelete()) {
      // there are two possibilities to delete: with backspace and with the
      // delete key.
      return startB + simpleB.chars === startA || startA === startB;
    }

    return false;
  };

  // Decides whether two operations should be composed with each other
  // if they were inverted, that is
  // `shouldBeComposedWith(a, b) = shouldBeComposedWithInverted(b^{-1}, a^{-1})`.
  TextOperation.prototype.shouldBeComposedWithInverted = function (other) {
    if (this.isNoop() || other.isNoop()) {
      return true;
    }

    var startA = getStartIndex(this),
      startB = getStartIndex(other);
    var simpleA = getSimpleOp(this),
      simpleB = getSimpleOp(other);
    if (!simpleA || !simpleB) {
      return false;
    }

    if (simpleA.isInsert() && simpleB.isInsert()) {
      return startA + simpleA.text.length === startB || startA === startB;
    }

    if (simpleA.isDelete() && simpleB.isDelete()) {
      return startB + simpleB.chars === startA;
    }

    return false;
  };

  TextOperation.transformAttributes = function (attributes1, attributes2) {
    var attributes1prime = {},
      attributes2prime = {};
    var attr,
      allAttrs = {};
    for (attr in attributes1) {
      allAttrs[attr] = true;
    }
    for (attr in attributes2) {
      allAttrs[attr] = true;
    }

    for (attr in allAttrs) {
      var attr1 = attributes1[attr],
        attr2 = attributes2[attr];
      utils.assert(attr1 != null || attr2 != null);
      if (attr1 == null) {
        // Only modified by attributes2; keep it.
        attributes2prime[attr] = attr2;
      } else if (attr2 == null) {
        // only modified by attributes1; keep it
        attributes1prime[attr] = attr1;
      } else if (attr1 === attr2) {
        // Both set it to the same value.  Nothing to do.
      } else {
        // attr1 and attr2 are different. Prefer attr1.
        attributes1prime[attr] = attr1;
      }
    }
    return [attributes1prime, attributes2prime];
  };

  // Transform takes two operations A and B that happened concurrently and
  // produces two operations A' and B' (in an array) such that
  // `apply(apply(S, A), B') = apply(apply(S, B), A')`. This function is the
  // heart of OT.
  TextOperation.transform = function (operation1, operation2) {
    if (operation1.baseLength !== operation2.baseLength) {
      throw new Error('Both operations have to have the same base length');
    }

    var operation1prime = new TextOperation();
    var operation2prime = new TextOperation();
    var ops1 = operation1.clone().ops,
      ops2 = operation2.clone().ops;
    var i1 = 0,
      i2 = 0;
    var op1 = ops1[i1++],
      op2 = ops2[i2++];
    while (true) {
      // At every iteration of the loop, the imaginary cursor that both
      // operation1 and operation2 have that operates on the input string must
      // have the same position in the input string.

      if (typeof op1 === 'undefined' && typeof op2 === 'undefined') {
        // end condition: both ops1 and ops2 have been processed
        break;
      }

      // next two cases: one or both ops are insert ops
      // => insert the string in the corresponding prime operation, skip it in
      // the other one. If both op1 and op2 are insert ops, prefer op1.
      if (op1 && op1.isInsert()) {
        operation1prime.insert(op1.text, op1.attributes);
        operation2prime.retain(op1.text.length);
        op1 = ops1[i1++];
        continue;
      }
      if (op2 && op2.isInsert()) {
        operation1prime.retain(op2.text.length);
        operation2prime.insert(op2.text, op2.attributes);
        op2 = ops2[i2++];
        continue;
      }

      if (typeof op1 === 'undefined') {
        throw new Error(
          'Cannot transform operations: first operation is too short.'
        );
      }
      if (typeof op2 === 'undefined') {
        throw new Error(
          'Cannot transform operations: first operation is too long.'
        );
      }

      var minl;
      if (op1.isRetain() && op2.isRetain()) {
        // Simple case: retain/retain
        var attributesPrime = TextOperation.transformAttributes(
          op1.attributes,
          op2.attributes
        );
        if (op1.chars > op2.chars) {
          minl = op2.chars;
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          minl = op2.chars;
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          minl = op1.chars;
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }

        operation1prime.retain(minl, attributesPrime[0]);
        operation2prime.retain(minl, attributesPrime[1]);
      } else if (op1.isDelete() && op2.isDelete()) {
        // Both operations delete the same string at the same position. We don't
        // need to produce any operations, we just skip over the delete ops and
        // handle the case that one operation deletes more than the other.
        if (op1.chars > op2.chars) {
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }
        // next two cases: delete/retain and retain/delete
      } else if (op1.isDelete() && op2.isRetain()) {
        if (op1.chars > op2.chars) {
          minl = op2.chars;
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          minl = op2.chars;
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          minl = op1.chars;
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }
        operation1prime['delete'](minl);
      } else if (op1.isRetain() && op2.isDelete()) {
        if (op1.chars > op2.chars) {
          minl = op2.chars;
          op1.chars -= op2.chars;
          op2 = ops2[i2++];
        } else if (op1.chars === op2.chars) {
          minl = op1.chars;
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          minl = op1.chars;
          op2.chars -= op1.chars;
          op1 = ops1[i1++];
        }
        operation2prime['delete'](minl);
      } else {
        throw new Error("The two operations aren't compatible");
      }
    }

    return [operation1prime, operation2prime];
  };

  // convenience method to write transform(a, b) as a.transform(b)
  TextOperation.prototype.transform = function (other) {
    return TextOperation.transform(this, other);
  };

  return TextOperation;
})();

var firepad = firepad || {};
firepad.Cursor = (function () {
  'use strict';

  // A cursor has a `position` and a `selectionEnd`. Both are zero-based indexes
  // into the document. When nothing is selected, `selectionEnd` is equal to
  // `position`. When there is a selection, `position` is always the side of the
  // selection that would move if you pressed an arrow key.
  function Cursor(position, selectionEnd) {
    this.position = position;
    this.selectionEnd = selectionEnd;
  }

  Cursor.fromJSON = function (obj) {
    return new Cursor(obj.position, obj.selectionEnd);
  };

  Cursor.prototype.equals = function (other) {
    return (
      this.position === other.position &&
      this.selectionEnd === other.selectionEnd
    );
  };

  // Return the more current cursor information.
  Cursor.prototype.compose = function (other) {
    return other;
  };

  // Update the cursor with respect to an operation.
  Cursor.prototype.transform = function (other) {
    function transformIndex(index) {
      var newIndex = index;
      var ops = other.ops;
      for (var i = 0, l = other.ops.length; i < l; i++) {
        if (ops[i].isRetain()) {
          index -= ops[i].chars;
        } else if (ops[i].isInsert()) {
          newIndex += ops[i].text.length;
        } else {
          newIndex -= Math.min(index, ops[i].chars);
          index -= ops[i].chars;
        }
        if (index < 0) {
          break;
        }
      }
      return newIndex;
    }

    var newPosition = transformIndex(this.position);
    if (this.position === this.selectionEnd) {
      return new Cursor(newPosition, newPosition);
    }
    return new Cursor(newPosition, transformIndex(this.selectionEnd));
  };

  return Cursor;
})();

var firepad = firepad || {};

firepad.FirebaseAdapter = (function (global) {
  if (
    typeof firebase === 'undefined' &&
    typeof require === 'function' &&
    typeof Firebase !== 'function'
  ) {
    throw new Error('firebase should be loaded >:-(');
    // firebase = require('firebase/app');
    // require('firebase/database');
  }

  var TextOperation = firepad.TextOperation;
  var utils = firepad.utils;

  // Save a checkpoint every 100 edits.
  var CHECKPOINT_FREQUENCY = 100;

  function FirebaseAdapter(ref, userId, userColor) {
    this.ref_ = ref;
    this.ready_ = false;
    this.firebaseCallbacks_ = [];
    this.zombie_ = false;

    // We store the current document state as a TextOperation so we can write checkpoints to Firebase occasionally.
    // TODO: Consider more efficient ways to do this. (composing text operations is ~linear in the length of the document).
    this.document_ = new TextOperation();

    // The next expected revision.
    this.revision_ = 0;

    // This is used for two purposes:
    // 1) On initialization, we fill this with the latest checkpoint and any subsequent operations and then
    //      process them all together.
    // 2) If we ever receive revisions out-of-order (e.g. rev 5 before rev 4), we queue them here until it's time
    //    for them to be handled. [this should never happen with well-behaved clients; but if it /does/ happen we want
    //    to handle it gracefully.]
    this.pendingReceivedRevisions_ = {};

    var self = this;

    if (userId) {
      this.setUserId(userId);
      this.setColor(userColor);

      var connectedRef = ref.root.child('.info/connected');

      this.firebaseOn_(
        connectedRef,
        'value',
        function (snapshot) {
          if (snapshot.val() === true) {
            self.initializeUserData_();
          }
        },
        this
      );

      // Once we're initialized, start tracking users' cursors.
      this.on('ready', function () {
        self.monitorCursors_();
      });
    } else {
      this.userId_ = ref.push().key;
    }

    // Avoid triggering any events until our callers have had a chance to attach their listeners.
    setTimeout(function () {
      self.monitorHistory_();
    }, 0);
  }
  utils.makeEventEmitter(FirebaseAdapter, [
    'ready',
    'cursor',
    'operation',
    'ack',
    'retry',
  ]);

  FirebaseAdapter.prototype.dispose = function () {
    var self = this;
    this.removeFirebaseCallbacks_();
    this.handleInitialRevisions_ = () => {};

    if (!this.ready_) {
      this.on('ready', function () {
        self.dispose();
      });
      return;
    }

    if (this.userRef_) {
      this.userRef_.child('cursor').remove();
      this.userRef_.child('color').remove();
    }

    this.ref_ = null;
    this.document_ = null;
    this.zombie_ = true;
  };

  FirebaseAdapter.prototype.setUserId = function (userId) {
    if (this.userRef_) {
      // Clean up existing data.  Avoid nuking another user's data
      // (if a future user takes our old name).
      this.userRef_.child('cursor').remove();
      this.userRef_.child('cursor').onDisconnect().cancel();
      this.userRef_.child('color').remove();
      this.userRef_.child('color').onDisconnect().cancel();
    }

    this.userId_ = userId;
    this.userRef_ = this.ref_.child('users').child(userId);

    this.initializeUserData_();
  };

  FirebaseAdapter.prototype.isHistoryEmpty = function () {
    assert(this.ready_, 'Not ready yet.');
    return this.revision_ === 0;
  };

  /*
   * Send operation, retrying on connection failure. Takes an optional callback with signature:
   * function(error, committed).
   * An exception will be thrown on transaction failure, which should only happen on
   * catastrophic failure like a security rule violation.
   */
  FirebaseAdapter.prototype.sendOperation = function (operation, callback) {
    var self = this;

    // If we're not ready yet, do nothing right now, and trigger a retry when we're ready.
    if (!this.ready_) {
      this.on('ready', function () {
        self.trigger('retry');
      });
      return;
    }

    // Sanity check that this operation is valid.
    assert(
      this.document_.targetLength === operation.baseLength,
      'sendOperation() called with invalid operation.'
    );

    // Convert revision into an id that will sort properly lexicographically.
    var revisionId = revisionToId(this.revision_);

    function doTransaction(revisionId, revisionData) {
      self.ref_
        .child('history')
        .child(revisionId)
        .transaction(
          function (current) {
            if (current === null) {
              return revisionData;
            }
          },
          function (error, committed, snapshot) {
            if (error) {
              if (error.message === 'disconnect') {
                if (self.sent_ && self.sent_.id === revisionId) {
                  // We haven't seen our transaction succeed or fail.  Send it again.
                  setTimeout(function () {
                    doTransaction(revisionId, revisionData);
                  }, 0);
                } else if (callback) {
                  callback(error, false);
                }
              } else {
                utils.log('Transaction failure!', error);
                throw error;
              }
            } else {
              if (callback) callback(null, committed);
            }
          },
          /*applyLocally=*/ false
        );
    }

    this.sent_ = { id: revisionId, op: operation };
    doTransaction(revisionId, {
      a: self.userId_,
      o: operation.toJSON(),
      t: firebase.database.ServerValue.TIMESTAMP,
    });
  };

  FirebaseAdapter.prototype.sendCursor = function (obj) {
    this.userRef_.child('cursor').set(obj);
    this.cursor_ = obj;
  };

  FirebaseAdapter.prototype.setColor = function (color) {
    this.userRef_.child('color').set(color);
    this.color_ = color;
  };

  FirebaseAdapter.prototype.getDocument = function () {
    return this.document_;
  };

  FirebaseAdapter.prototype.registerCallbacks = function (callbacks) {
    for (var eventType in callbacks) {
      this.on(eventType, callbacks[eventType]);
    }
  };

  FirebaseAdapter.prototype.initializeUserData_ = function () {
    this.userRef_.child('cursor').onDisconnect().remove();
    this.userRef_.child('color').onDisconnect().remove();

    this.sendCursor(this.cursor_ || null);
    this.setColor(this.color_ || null);
  };

  FirebaseAdapter.prototype.monitorCursors_ = function () {
    var usersRef = this.ref_.child('users'),
      self = this;

    function childChanged(childSnap) {
      var userId = childSnap.key;
      var userData = childSnap.val();
      self.trigger('cursor', userId, userData.cursor, userData.color);
    }

    this.firebaseOn_(usersRef, 'child_added', childChanged);
    this.firebaseOn_(usersRef, 'child_changed', childChanged);

    this.firebaseOn_(usersRef, 'child_removed', function (childSnap) {
      var userId = childSnap.key;
      self.trigger('cursor', userId, null);
    });
  };

  FirebaseAdapter.prototype.monitorHistory_ = function () {
    var self = this;
    // Get the latest checkpoint as a starting point so we don't have to re-play entire history.
    this.ref_.child('checkpoint').once('value', function (s) {
      if (self.zombie_) {
        return;
      } // just in case we were cleaned up before we got the checkpoint data.
      var revisionId = s.child('id').val(),
        op = s.child('o').val(),
        author = s.child('a').val();
      if (op != null && revisionId != null && author !== null) {
        self.pendingReceivedRevisions_[revisionId] = { o: op, a: author };
        self.checkpointRevision_ = revisionFromId(revisionId);
        self.monitorHistoryStartingAt_(self.checkpointRevision_ + 1);
      } else {
        self.checkpointRevision_ = 0;
        self.monitorHistoryStartingAt_(self.checkpointRevision_);
      }
    });
  };

  FirebaseAdapter.prototype.monitorHistoryStartingAt_ = function (revision) {
    var historyRef = this.ref_
      .child('history')
      .startAt(null, revisionToId(revision));
    var self = this;

    setTimeout(function () {
      self.firebaseOn_(historyRef, 'child_added', function (revisionSnapshot) {
        var revisionId = revisionSnapshot.key;
        self.pendingReceivedRevisions_[revisionId] = revisionSnapshot.val();
        if (self.ready_) {
          self.handlePendingReceivedRevisions_();
        }
      });

      historyRef.once('value', function () {
        self.handleInitialRevisions_();
      });
    }, 0);
  };

  FirebaseAdapter.prototype.handleInitialRevisions_ = function () {
    assert(!this.ready_, 'Should not be called multiple times.');

    // Compose the checkpoint and all subsequent revisions into a single operation to apply at once.
    this.revision_ = this.checkpointRevision_;
    var revisionId = revisionToId(this.revision_),
      pending = this.pendingReceivedRevisions_;
    while (pending[revisionId] != null) {
      var revision = this.parseRevision_(pending[revisionId]);
      if (!revision) {
        // If a misbehaved client adds a bad operation, just ignore it.
        utils.log(
          'Invalid operation.',
          this.ref_.toString(),
          revisionId,
          pending[revisionId]
        );
      } else {
        this.document_ = this.document_.compose(revision.operation);
      }

      delete pending[revisionId];
      this.revision_++;
      revisionId = revisionToId(this.revision_);
    }

    this.trigger('operation', this.document_);

    this.ready_ = true;
    var self = this;
    setTimeout(function () {
      self.trigger('ready');
    }, 0);
  };

  FirebaseAdapter.prototype.handlePendingReceivedRevisions_ = function () {
    var pending = this.pendingReceivedRevisions_;
    var revisionId = revisionToId(this.revision_);
    var triggerRetry = false;
    while (pending[revisionId] != null) {
      this.revision_++;

      var revision = this.parseRevision_(pending[revisionId]);
      if (!revision) {
        // If a misbehaved client adds a bad operation, just ignore it.
        utils.log(
          'Invalid operation.',
          this.ref_.toString(),
          revisionId,
          pending[revisionId]
        );
      } else {
        this.document_ = this.document_.compose(revision.operation);
        if (this.sent_ && revisionId === this.sent_.id) {
          // We have an outstanding change at this revision id.
          if (
            this.sent_.op.equals(revision.operation) &&
            revision.author === this.userId_
          ) {
            // This is our change; it succeeded.
            if (this.revision_ % CHECKPOINT_FREQUENCY === 0) {
              this.saveCheckpoint_();
            }
            this.sent_ = null;
            this.trigger('ack');
          } else {
            // our op failed.  Trigger a retry after we're done catching up on any incoming ops.
            triggerRetry = true;
            this.trigger('operation', revision.operation);
          }
        } else {
          this.trigger('operation', revision.operation);
        }
      }
      delete pending[revisionId];

      revisionId = revisionToId(this.revision_);
    }

    if (triggerRetry) {
      this.sent_ = null;
      this.trigger('retry');
    }
  };

  FirebaseAdapter.prototype.parseRevision_ = function (data) {
    // We could do some of this validation via security rules.  But it's nice to be robust, just in case.
    if (typeof data !== 'object') {
      return null;
    }
    if (typeof data.a !== 'string' || typeof data.o !== 'object') {
      return null;
    }
    var op = null;
    try {
      op = TextOperation.fromJSON(data.o);
    } catch (e) {
      return null;
    }

    if (op.baseLength !== this.document_.targetLength) {
      return null;
    }
    return { author: data.a, operation: op };
  };

  FirebaseAdapter.prototype.saveCheckpoint_ = function () {
    // delete [-200, -100) before this point
    let updateObject = {};
    for (let idx = this.revision_ - 200; idx < this.revision_ - 100; idx++) {
      if (idx >= 0) {
        updateObject[revisionToId(idx)] = null;
      }
    }
    if (Object.keys(updateObject).length > 0) {
      this.ref_.child('history').update(updateObject);
    }

    this.ref_.child('checkpoint').set({
      a: this.userId_,
      o: this.document_.toJSON(),
      id: revisionToId(this.revision_ - 1), // use the id for the revision we just wrote.
    });
  };

  FirebaseAdapter.prototype.firebaseOn_ = function (
    ref,
    eventType,
    callback,
    context
  ) {
    this.firebaseCallbacks_.push({
      ref: ref,
      eventType: eventType,
      callback: callback,
      context: context,
    });
    ref.on(eventType, callback, context);
    return callback;
  };

  FirebaseAdapter.prototype.firebaseOff_ = function (
    ref,
    eventType,
    callback,
    context
  ) {
    ref.off(eventType, callback, context);
    for (var i = 0; i < this.firebaseCallbacks_.length; i++) {
      var l = this.firebaseCallbacks_[i];
      if (
        l.ref === ref &&
        l.eventType === eventType &&
        l.callback === callback &&
        l.context === context
      ) {
        this.firebaseCallbacks_.splice(i, 1);
        break;
      }
    }
  };

  FirebaseAdapter.prototype.removeFirebaseCallbacks_ = function () {
    for (var i = 0; i < this.firebaseCallbacks_.length; i++) {
      var l = this.firebaseCallbacks_[i];
      l.ref.off(l.eventType, l.callback, l.context);
    }
    this.firebaseCallbacks_ = [];
  };

  // Throws an error if the first argument is falsy. Useful for debugging.
  function assert(b, msg) {
    if (!b) {
      throw new Error(msg || 'assertion error');
    }
  }

  // Based off ideas from http://www.zanopha.com/docs/elen.pdf
  var characters =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  function revisionToId(revision) {
    if (revision === 0) {
      return 'A0';
    }

    var str = '';
    while (revision > 0) {
      var digit = revision % characters.length;
      str = characters[digit] + str;
      revision -= digit;
      revision /= characters.length;
    }

    // Prefix with length (starting at 'A' for length 1) to ensure the id's sort lexicographically.
    var prefix = characters[str.length + 9];
    return prefix + str;
  }

  function revisionFromId(revisionId) {
    assert(
      revisionId.length > 0 &&
        revisionId[0] === characters[revisionId.length + 8]
    );
    var revision = 0;
    for (var i = 1; i < revisionId.length; i++) {
      revision *= characters.length;
      revision += characters.indexOf(revisionId[i]);
    }
    return revision;
  }

  return FirebaseAdapter;
})();

var firepad = firepad || {};
firepad.WrappedOperation = (function (global) {
  'use strict';

  // A WrappedOperation contains an operation and corresponing metadata.
  function WrappedOperation(operation, meta) {
    this.wrapped = operation;
    this.meta = meta;
  }

  WrappedOperation.prototype.apply = function () {
    return this.wrapped.apply.apply(this.wrapped, arguments);
  };

  WrappedOperation.prototype.invert = function () {
    var meta = this.meta;
    return new WrappedOperation(
      this.wrapped.invert.apply(this.wrapped, arguments),
      meta && typeof meta === 'object' && typeof meta.invert === 'function'
        ? meta.invert.apply(meta, arguments)
        : meta
    );
  };

  // Copy all properties from source to target.
  function copy(source, target) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
  }

  function composeMeta(a, b) {
    if (a && typeof a === 'object') {
      if (typeof a.compose === 'function') {
        return a.compose(b);
      }
      var meta = {};
      copy(a, meta);
      copy(b, meta);
      return meta;
    }
    return b;
  }

  WrappedOperation.prototype.compose = function (other) {
    return new WrappedOperation(
      this.wrapped.compose(other.wrapped),
      composeMeta(this.meta, other.meta)
    );
  };

  function transformMeta(meta, operation) {
    if (meta && typeof meta === 'object') {
      if (typeof meta.transform === 'function') {
        return meta.transform(operation);
      }
    }
    return meta;
  }

  WrappedOperation.transform = function (a, b) {
    var pair = a.wrapped.transform(b.wrapped);
    return [
      new WrappedOperation(pair[0], transformMeta(a.meta, b.wrapped)),
      new WrappedOperation(pair[1], transformMeta(b.meta, a.wrapped)),
    ];
  };

  // convenience method to write transform(a, b) as a.transform(b)
  WrappedOperation.prototype.transform = function (other) {
    return WrappedOperation.transform(this, other);
  };

  return WrappedOperation;
})();

var firepad = firepad || {};

firepad.UndoManager = (function () {
  'use strict';

  var NORMAL_STATE = 'normal';
  var UNDOING_STATE = 'undoing';
  var REDOING_STATE = 'redoing';

  // Create a new UndoManager with an optional maximum history size.
  function UndoManager(maxItems) {
    this.maxItems = maxItems || 50;
    this.state = NORMAL_STATE;
    this.dontCompose = false;
    this.undoStack = [];
    this.redoStack = [];
  }

  // Add an operation to the undo or redo stack, depending on the current state
  // of the UndoManager. The operation added must be the inverse of the last
  // edit. When `compose` is true, compose the operation with the last operation
  // unless the last operation was alread pushed on the redo stack or was hidden
  // by a newer operation on the undo stack.
  UndoManager.prototype.add = function (operation, compose) {
    if (this.state === UNDOING_STATE) {
      this.redoStack.push(operation);
      this.dontCompose = true;
    } else if (this.state === REDOING_STATE) {
      this.undoStack.push(operation);
      this.dontCompose = true;
    } else {
      var undoStack = this.undoStack;
      if (!this.dontCompose && compose && undoStack.length > 0) {
        undoStack.push(operation.compose(undoStack.pop()));
      } else {
        undoStack.push(operation);
        if (undoStack.length > this.maxItems) {
          undoStack.shift();
        }
      }
      this.dontCompose = false;
      this.redoStack = [];
    }
  };

  function transformStack(stack, operation) {
    var newStack = [];
    var Operation = operation.constructor;
    for (var i = stack.length - 1; i >= 0; i--) {
      var pair = Operation.transform(stack[i], operation);
      if (typeof pair[0].isNoop !== 'function' || !pair[0].isNoop()) {
        newStack.push(pair[0]);
      }
      operation = pair[1];
    }
    return newStack.reverse();
  }

  // Transform the undo and redo stacks against a operation by another client.
  UndoManager.prototype.transform = function (operation) {
    this.undoStack = transformStack(this.undoStack, operation);
    this.redoStack = transformStack(this.redoStack, operation);
  };

  // Perform an undo by calling a function with the latest operation on the undo
  // stack. The function is expected to call the `add` method with the inverse
  // of the operation, which pushes the inverse on the redo stack.
  UndoManager.prototype.performUndo = function (fn) {
    this.state = UNDOING_STATE;
    if (this.undoStack.length === 0) {
      throw new Error('undo not possible');
    }
    fn(this.undoStack.pop());
    this.state = NORMAL_STATE;
  };

  // The inverse of `performUndo`.
  UndoManager.prototype.performRedo = function (fn) {
    this.state = REDOING_STATE;
    if (this.redoStack.length === 0) {
      throw new Error('redo not possible');
    }
    fn(this.redoStack.pop());
    this.state = NORMAL_STATE;
  };

  // Is the undo stack not empty?
  UndoManager.prototype.canUndo = function () {
    return this.undoStack.length !== 0;
  };

  // Is the redo stack not empty?
  UndoManager.prototype.canRedo = function () {
    return this.redoStack.length !== 0;
  };

  // Whether the UndoManager is currently performing an undo.
  UndoManager.prototype.isUndoing = function () {
    return this.state === UNDOING_STATE;
  };

  // Whether the UndoManager is currently performing a redo.
  UndoManager.prototype.isRedoing = function () {
    return this.state === REDOING_STATE;
  };

  return UndoManager;
})();

var firepad = firepad || {};
firepad.Client = (function () {
  'use strict';

  // Client constructor
  function Client() {
    this.state = synchronized_; // start state
  }

  Client.prototype.setState = function (state) {
    this.state = state;
  };

  // Call this method when the user changes the document.
  Client.prototype.applyClient = function (operation) {
    this.setState(this.state.applyClient(this, operation));
  };

  // Call this method with a new operation from the server
  Client.prototype.applyServer = function (operation) {
    this.setState(this.state.applyServer(this, operation));
  };

  Client.prototype.serverAck = function () {
    this.setState(this.state.serverAck(this));
  };

  Client.prototype.serverRetry = function () {
    this.setState(this.state.serverRetry(this));
  };

  // Override this method.
  Client.prototype.sendOperation = function (operation) {
    throw new Error('sendOperation must be defined in child class');
  };

  // Override this method.
  Client.prototype.applyOperation = function (operation) {
    throw new Error('applyOperation must be defined in child class');
  };

  // In the 'Synchronized' state, there is no pending operation that the client
  // has sent to the server.
  function Synchronized() {}
  Client.Synchronized = Synchronized;

  Synchronized.prototype.applyClient = function (client, operation) {
    // When the user makes an edit, send the operation to the server and
    // switch to the 'AwaitingConfirm' state
    client.sendOperation(operation);
    return new AwaitingConfirm(operation);
  };

  Synchronized.prototype.applyServer = function (client, operation) {
    // When we receive a new operation from the server, the operation can be
    // simply applied to the current document
    client.applyOperation(operation);
    return this;
  };

  Synchronized.prototype.serverAck = function (client) {
    throw new Error('There is no pending operation.');
  };

  Synchronized.prototype.serverRetry = function (client) {
    throw new Error('There is no pending operation.');
  };

  // Singleton
  var synchronized_ = new Synchronized();

  // In the 'AwaitingConfirm' state, there's one operation the client has sent
  // to the server and is still waiting for an acknowledgement.
  function AwaitingConfirm(outstanding) {
    // Save the pending operation
    this.outstanding = outstanding;
  }
  Client.AwaitingConfirm = AwaitingConfirm;

  AwaitingConfirm.prototype.applyClient = function (client, operation) {
    // When the user makes an edit, don't send the operation immediately,
    // instead switch to 'AwaitingWithBuffer' state
    return new AwaitingWithBuffer(this.outstanding, operation);
  };

  AwaitingConfirm.prototype.applyServer = function (client, operation) {
    // This is another client's operation. Visualization:
    //
    //                   /\
    // this.outstanding /  \ operation
    //                 /    \
    //                 \    /
    //  pair[1]         \  / pair[0] (new outstanding)
    //  (can be applied  \/
    //  to the client's
    //  current document)
    var pair = this.outstanding.transform(operation);
    client.applyOperation(pair[1]);
    return new AwaitingConfirm(pair[0]);
  };

  AwaitingConfirm.prototype.serverAck = function (client) {
    // The client's operation has been acknowledged
    // => switch to synchronized state
    return synchronized_;
  };

  AwaitingConfirm.prototype.serverRetry = function (client) {
    client.sendOperation(this.outstanding);
    return this;
  };

  // In the 'AwaitingWithBuffer' state, the client is waiting for an operation
  // to be acknowledged by the server while buffering the edits the user makes
  function AwaitingWithBuffer(outstanding, buffer) {
    // Save the pending operation and the user's edits since then
    this.outstanding = outstanding;
    this.buffer = buffer;
  }
  Client.AwaitingWithBuffer = AwaitingWithBuffer;

  AwaitingWithBuffer.prototype.applyClient = function (client, operation) {
    // Compose the user's changes onto the buffer
    var newBuffer = this.buffer.compose(operation);
    return new AwaitingWithBuffer(this.outstanding, newBuffer);
  };

  AwaitingWithBuffer.prototype.applyServer = function (client, operation) {
    // Operation comes from another client
    //
    //                       /\
    //     this.outstanding /  \ operation
    //                     /    \
    //                    /\    /
    //       this.buffer /  \* / pair1[0] (new outstanding)
    //                  /    \/
    //                  \    /
    //          pair2[1] \  / pair2[0] (new buffer)
    // the transformed    \/
    // operation -- can
    // be applied to the
    // client's current
    // document
    //
    // * pair1[1]
    var pair1 = this.outstanding.transform(operation);
    var pair2 = this.buffer.transform(pair1[1]);
    client.applyOperation(pair2[1]);
    return new AwaitingWithBuffer(pair1[0], pair2[0]);
  };

  AwaitingWithBuffer.prototype.serverRetry = function (client) {
    // Merge with our buffer and resend.
    var outstanding = this.outstanding.compose(this.buffer);
    client.sendOperation(outstanding);
    return new AwaitingConfirm(outstanding);
  };

  AwaitingWithBuffer.prototype.serverAck = function (client) {
    // The pending operation has been acknowledged
    // => send buffer
    client.sendOperation(this.buffer);
    return new AwaitingConfirm(this.buffer);
  };

  return Client;
})();

var firepad = firepad || {};

firepad.EditorClient = (function () {
  'use strict';

  var Client = firepad.Client;
  var Cursor = firepad.Cursor;
  var UndoManager = firepad.UndoManager;
  var WrappedOperation = firepad.WrappedOperation;

  function SelfMeta(cursorBefore, cursorAfter) {
    this.cursorBefore = cursorBefore;
    this.cursorAfter = cursorAfter;
  }

  SelfMeta.prototype.invert = function () {
    return new SelfMeta(this.cursorAfter, this.cursorBefore);
  };

  SelfMeta.prototype.compose = function (other) {
    return new SelfMeta(this.cursorBefore, other.cursorAfter);
  };

  SelfMeta.prototype.transform = function (operation) {
    return new SelfMeta(
      this.cursorBefore ? this.cursorBefore.transform(operation) : null,
      this.cursorAfter ? this.cursorAfter.transform(operation) : null
    );
  };

  function OtherClient(id, editorAdapter) {
    this.id = id;
    this.editorAdapter = editorAdapter;
  }

  OtherClient.prototype.setColor = function (color) {
    this.color = color;
  };

  OtherClient.prototype.updateCursor = function (cursor) {
    this.removeCursor();
    this.cursor = cursor;
    this.mark = this.editorAdapter.setOtherCursor(cursor, this.color, this.id);
  };

  OtherClient.prototype.removeCursor = function () {
    if (this.mark) {
      this.mark.clear();
    }
  };

  function EditorClient(serverAdapter, editorAdapter) {
    Client.call(this);
    this.serverAdapter = serverAdapter;
    this.editorAdapter = editorAdapter;
    this.undoManager = new UndoManager();

    this.clients = {};

    var self = this;

    this.editorAdapter.registerCallbacks({
      change: function (operation, inverse) {
        self.onChange(operation, inverse);
      },
      cursorActivity: function () {
        self.onCursorActivity();
      },
      blur: function () {
        self.onBlur();
      },
      focus: function () {
        self.onFocus();
      },
    });
    this.editorAdapter.registerUndo(function () {
      self.undo();
    });
    this.editorAdapter.registerRedo(function () {
      self.redo();
    });

    this.serverAdapter.registerCallbacks({
      ack: function () {
        self.serverAck();
        if (self.focused && self.state instanceof Client.Synchronized) {
          self.updateCursor();
          self.sendCursor(self.cursor);
        }
        self.emitStatus();
      },
      retry: function () {
        self.serverRetry();
      },
      operation: function (operation) {
        self.applyServer(operation);
      },
      cursor: function (clientId, cursor, color) {
        if (
          self.serverAdapter.userId_ === clientId ||
          !(self.state instanceof Client.Synchronized)
        ) {
          return;
        }
        var client = self.getClientObject(clientId);
        if (cursor) {
          if (color) client.setColor(color);
          client.updateCursor(Cursor.fromJSON(cursor));
        } else {
          client.removeCursor();
        }
      },
    });
  }

  inherit(EditorClient, Client);

  EditorClient.prototype.getClientObject = function (clientId) {
    var client = this.clients[clientId];
    if (client) {
      return client;
    }
    return (this.clients[clientId] = new OtherClient(
      clientId,
      this.editorAdapter
    ));
  };

  EditorClient.prototype.applyUnredo = function (operation) {
    this.undoManager.add(this.editorAdapter.invertOperation(operation));
    this.editorAdapter.applyOperation(operation.wrapped);
    this.cursor = operation.meta.cursorAfter;
    if (this.cursor) this.editorAdapter.setCursor(this.cursor);
    this.applyClient(operation.wrapped);
  };

  EditorClient.prototype.undo = function () {
    var self = this;
    if (!this.undoManager.canUndo()) {
      return;
    }
    this.undoManager.performUndo(function (o) {
      self.applyUnredo(o);
    });
  };

  EditorClient.prototype.redo = function () {
    var self = this;
    if (!this.undoManager.canRedo()) {
      return;
    }
    this.undoManager.performRedo(function (o) {
      self.applyUnredo(o);
    });
  };

  EditorClient.prototype.onChange = function (textOperation, inverse) {
    var cursorBefore = this.cursor;
    this.updateCursor();

    var compose =
      this.undoManager.undoStack.length > 0 &&
      inverse.shouldBeComposedWithInverted(
        last(this.undoManager.undoStack).wrapped
      );
    var inverseMeta = new SelfMeta(this.cursor, cursorBefore);
    this.undoManager.add(new WrappedOperation(inverse, inverseMeta), compose);
    this.applyClient(textOperation);
  };

  EditorClient.prototype.updateCursor = function () {
    this.cursor = this.editorAdapter.getCursor();
  };

  EditorClient.prototype.onCursorActivity = function () {
    var oldCursor = this.cursor;
    this.updateCursor();
    if (!this.focused || (oldCursor && this.cursor.equals(oldCursor))) {
      return;
    }
    this.sendCursor(this.cursor);
  };

  EditorClient.prototype.onBlur = function () {
    this.cursor = null;
    this.sendCursor(null);
    this.focused = false;
  };

  EditorClient.prototype.onFocus = function () {
    this.focused = true;
    this.onCursorActivity();
  };

  EditorClient.prototype.sendCursor = function (cursor) {
    if (this.state instanceof Client.AwaitingWithBuffer) {
      return;
    }
    this.serverAdapter.sendCursor(cursor);
  };

  EditorClient.prototype.sendOperation = function (operation) {
    this.serverAdapter.sendOperation(operation);
    this.emitStatus();
  };

  EditorClient.prototype.applyOperation = function (operation) {
    this.editorAdapter.applyOperation(operation);
    this.updateCursor();
    this.undoManager.transform(new WrappedOperation(operation, null));
  };

  EditorClient.prototype.emitStatus = function () {
    var self = this;
    setTimeout(function () {
      self.trigger('synced', self.state instanceof Client.Synchronized);
    }, 0);
  };

  // Set Const.prototype.__proto__ to Super.prototype
  function inherit(Const, Super) {
    function F() {}
    F.prototype = Super.prototype;
    Const.prototype = new F();
    Const.prototype.constructor = Const;
  }

  function last(arr) {
    return arr[arr.length - 1];
  }

  return EditorClient;
})();

firepad.utils.makeEventEmitter(firepad.EditorClient, ['synced']);

('use strict');

function _nonIterableSpread() {
  throw new TypeError(
    'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
  );
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === 'Object' && o.constructor) n = o.constructor.name;
  if (n === 'Map' || n === 'Set') return Array.from(n);
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== 'undefined' && Symbol.iterator in Object(iter))
    return Array.from(iter);
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}

('use strict');

/**
 * @function getCSS - For Internal Usage Only
 * @param {String} clazz - CSS Class Name
 * @param {String} bgColor - Background Color
 * @param {String} color - Font Color
 * @returns CSS Style Rules according to Parameters
 */
var getCSS = function getCSS(clazz, bgColor, color) {
  return (
    '.' +
    clazz +
    ' {\n  position: relative;\n' +
    'background-color: ' +
    bgColor +
    ';\n' +
    'border-left: 2px solid ' +
    color +
    ';\n}'
  );
};

/**
 * @function addStyleRule - For Internal Usage Only
 * @desc Creates style element in document head and pushed all the style rules
 * @param {String} clazz - CSS Class Name
 * @param {String} css - CSS Style Rules
 */
var addStyleRule = function addStyleRule(clazz, css) {
  /** House Keeping */
  if (typeof document === 'undefined' || document === null) {
    return false;
  }

  /** Add style rules only once */
  if (this.addedStyleRules.indexOf(clazz) === -1) {
    var styleElement = document.createElement('style');
    var styleSheet = document.createTextNode(css);
    styleElement.appendChild(styleSheet);
    document.head.appendChild(styleElement);
    this.addedStyleRules.push(clazz);
  }
};

/**
 * Monaco Adapter
 * Create Pipe between Firebase and Monaco Text Editor
 */
var MonacoAdapter = (function () {
  /**
   * @constructor MonacoEditor
   * @param {MonacoEditor} monacoInstance - Editor Instance
   * @prop {MonacoEditor} monaco - Monaco Instance passed as Parameter
   * @prop {MonacoITextModel} monacoModel - Data Model of the Monaco Instance
   * @prop {string[]} lastDocLines - Text for all Lines in the Editor
   * @prop {MonacoSelection} lastCursorRange - Primary Selection of the Editor
   * @prop {function} onChange - Change Event Handler bound Local Object
   * @prop {function} onBlur - Blur Event Handler bound Local Object
   * @prop {function} onFocus - Focus Event Handler bound Local Object
   * @prop {function} onCursorActivity - Cursor Activity Handler bound Local Object
   * @prop {Boolean} ignoreChanges - Should Avoid OnChange Event Handling
   * @prop {MonacoIDisposable} changeHandler - Event Handler for Model Content Change
   * @prop {MonacoIDisposable} didBlurHandler - Event Handler for Focus Lost on Editor Text/Widget
   * @prop {MonacoIDisposable} didFocusHandler - Event Handler for Focus Gain on Editor Text/Widget
   * @prop {MonacoIDisposable} didChangeCursorPositionHandler - Event Handler for Cursor Position Change
   */
  function MonacoAdapter(monacoInstance) {
    /** House Keeping */

    // Make sure this looks like a valid monaco instance.
    if (!monacoInstance || typeof monacoInstance.getModel !== 'function') {
      throw new Error(
        'MonacoAdapter: Incorrect Parameter Recieved in constructor, ' +
          'expected valid Monaco Instance'
      );
    }

    /** Monaco Member Variables */
    this.monaco = monacoInstance;
    this.monacoModel = this.monaco.getModel();
    this.lastDocLines = this.monacoModel.getLinesContent();
    this.lastCursorRange = this.monaco.getSelection();

    /** Monaco Editor Configurations */
    this.callbacks = {};
    this.otherCursors = [];
    this.addedStyleRules = [];
    this.ignoreChanges = false;

    /** Adapter Callback Functions */
    this.onChange = this.onChange.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onCursorActivity = this.onCursorActivity.bind(this);

    /** Editor Callback Handler */
    this.changeHandler = this.monaco.onDidChangeModelContent(this.onChange);
    this.didBlurHandler = this.monaco.onDidBlurEditorWidget(this.onBlur);
    this.didFocusHandler = this.monaco.onDidFocusEditorWidget(this.onFocus);
    this.didChangeCursorPositionHandler = this.monaco.onDidChangeCursorPosition(
      this.onCursorActivity
    );
  }

  /**
   * @method detach - Clears an Instance of Editor Adapter
   */
  MonacoAdapter.prototype.detach = function detach() {
    this.changeHandler.dispose();
    this.didBlurHandler.dispose();
    this.didFocusHandler.dispose();
    this.didChangeCursorPositionHandler.dispose();
  };

  /**
   * @method getCursor - Get current cursor position
   * @returns Firepad Cursor object
   */
  MonacoAdapter.prototype.getCursor = function getCursor() {
    var selection = this.monaco.getSelection();

    /** Fallback to last cursor change */
    if (typeof selection === 'undefined' || selection === null) {
      selection = this.lastCursorRange;
    }

    /** Obtain selection indexes */
    var startPos = selection.getStartPosition();
    var endPos = selection.getEndPosition();
    var start = this.monacoModel.getOffsetAt(startPos);
    var end = this.monacoModel.getOffsetAt(endPos);

    /** If Selection is Inversed */
    if (start > end) {
      var _ref = [end, start];
      start = _ref[0];
      end = _ref[1];
    }

    /** Return cursor position */
    return new firepad.Cursor(start, end);
  };

  /**
   * @method setCursor - Set Selection on Monaco Editor Instance
   * @param {Object} cursor - Cursor Position (start and end)
   * @param {Number} cursor.position - Starting Position of the Cursor
   * @param {Number} cursor.selectionEnd - Ending Position of the Cursor
   */
  MonacoAdapter.prototype.setCursor = function setCursor(cursor) {
    var position = cursor.position;
    var selectionEnd = cursor.selectionEnd;
    var start = this.monacoModel.getPositionAt(position);
    var end = this.monacoModel.getPositionAt(selectionEnd);

    /** If selection is inversed */
    if (position > selectionEnd) {
      var _ref = [end, start];
      start = _ref[0];
      end = _ref[1];
    }

    /** Create Selection in the Editor */
    this.monaco.setSelection(
      new monaco.Range(
        start.lineNumber,
        start.column,
        end.lineNumber,
        end.column
      )
    );
  };

  /**
   * @method setOtherCursor - Set Remote Selection on Monaco Editor
   * @param {Number} cursor.position - Starting Position of the Selection
   * @param {Number} cursor.selectionEnd - Ending Position of the Selection
   * @param {String} color - Hex Color codes for Styling
   * @param {any} clientID - ID number of the Remote Client
   */
  MonacoAdapter.prototype.setOtherCursor = function setOtherCursor(
    cursor,
    color,
    clientID
  ) {
    /** House Keeping */
    if (
      typeof cursor !== 'object' ||
      typeof cursor.position !== 'number' ||
      typeof cursor.selectionEnd !== 'number'
    ) {
      return false;
    }

    if (typeof color !== 'string' || !color.match(/^#[a-fA-F0-9]{3,6}$/)) {
      return false;
    }

    /** Extract Positions */
    var position = cursor.position;
    var selectionEnd = cursor.selectionEnd;

    if (position < 0 || selectionEnd < 0) {
      return false;
    }

    /** Fetch Client Cursor Information */
    var otherCursor = this.otherCursors.find(function (cursor) {
      return cursor.clientID === clientID;
    });

    /** Initialize empty array, if client does not exist */
    if (!otherCursor) {
      otherCursor = {
        clientID: clientID,
        decoration: [],
      };
      this.otherCursors.push(otherCursor);
    }

    /** Remove Earlier Decorations, if any, or initialize empty decor */
    otherCursor.decoration = this.monaco.deltaDecorations(
      otherCursor.decoration,
      []
    );
    var clazz = 'other-client-selection-' + color.replace('#', '');
    var css, ret;

    if (position === selectionEnd) {
      /** Show only cursor */
      clazz = clazz.replace('selection', 'cursor');

      /** Generate Style rules and add them to document */
      css = getCSS(clazz, 'transparent', color);
      ret = addStyleRule.call(this, clazz, css);
    } else {
      /** Generate Style rules and add them to document */
      css = getCSS(clazz, color, color);
      ret = addStyleRule.call(this, clazz, css);
    }

    /** Return if failed to add css */
    if (ret == false) {
      console.log(
        'Monaco Adapter: Failed to add some css style.\n' +
          "Please make sure you're running on supported environment."
      );
    }

    /** Get co-ordinate position in Editor */
    var start = this.monacoModel.getPositionAt(position);
    var end = this.monacoModel.getPositionAt(selectionEnd);

    /** Selection is inversed */
    if (position > selectionEnd) {
      var _ref = [end, start];
      start = _ref[0];
      end = _ref[1];
    }

    const otherCursorName =
      (window.firepadUsers &&
        window.firepadUsers.find(user => user.id === clientID).name) ||
      'Unknown User';

    /** Add decoration to the Editor */
    otherCursor.decoration = this.monaco.deltaDecorations(
      otherCursor.decoration,
      [
        {
          range: new monaco.Range(
            start.lineNumber,
            start.column,
            end.lineNumber,
            end.column
          ),
          options: {
            className: clazz,
            hoverMessage: {
              value: otherCursorName,
            },
          },
        },
      ]
    );

    /** Clear cursor method */
    var _this = this;
    return {
      clear: function clear() {
        otherCursor.decoration = _this.monaco.deltaDecorations(
          otherCursor.decoration,
          []
        );
      },
    };
  };

  /**
   * @method registerCallbacks - Assign callback functions to internal property
   * @param {function[]} callbacks - Set of callback functions
   */
  MonacoAdapter.prototype.registerCallbacks = function registerCallbacks(
    callbacks
  ) {
    this.callbacks = Object.assign({}, this.callbacks, callbacks);
  };

  /**
   * @method registerUndo
   * @param {function} callback - Callback Handler for Undo Event
   */
  MonacoAdapter.prototype.registerUndo = function registerUndo(callback) {
    if (typeof callback === 'function') {
      this.callbacks.undo = callback;
    } else {
      throw new Error(
        'MonacoAdapter: registerUndo method expects a ' +
          'callback function in parameter'
      );
    }
  };

  /**
   * @method registerRedo
   * @param {function} callback - Callback Handler for Redo Event
   */
  MonacoAdapter.prototype.registerRedo = function registerRedo(callback) {
    if (typeof callback === 'function') {
      this.callbacks.redo = callback;
    } else {
      throw new Error(
        'MonacoAdapter: registerRedo method expects a ' +
          'callback function in parameter'
      );
    }
  };

  /**
   * @method operationFromMonacoChanges - Convert Monaco Changes to OT.js Ops
   * @param {Object} change - Change in Editor
   * @param {string} content - Last Editor Content
   * @param {Number} offset - Offset between changes of same event
   * @returns Pair of Operation and Inverse
   * Note: OT.js Operation expects the cursor to be at the end of content
   */
  MonacoAdapter.prototype.operationFromMonacoChanges = function operationFromMonacoChanges(
    change,
    content,
    offset
  ) {
    /** Change Informations */
    var text = change.text;
    var rangeLength = change.rangeLength;
    var rangeOffset = change.rangeOffset;

    /** Additional SEEK distance */
    var restLength = content.length + offset - rangeOffset;

    /** Declare OT.js Operation Variables */
    var change_op, inverse_op, replaced_text;

    if (text.length === 0 && rangeLength > 0) {
      /** Delete Operation */
      replaced_text = content.slice(rangeOffset, rangeOffset + rangeLength);

      change_op = new firepad.TextOperation()
        .retain(rangeOffset)
        .delete(rangeLength)
        .retain(restLength - rangeLength);

      inverse_op = new firepad.TextOperation()
        .retain(rangeOffset)
        .insert(replaced_text)
        .retain(restLength - rangeLength);
    } else if (text.length > 0 && rangeLength > 0) {
      /** Replace Operation */
      replaced_text = content.slice(rangeOffset, rangeOffset + rangeLength);

      change_op = new firepad.TextOperation()
        .retain(rangeOffset)
        .delete(rangeLength)
        .insert(text)
        .retain(restLength - rangeLength);

      inverse_op = new firepad.TextOperation()
        .retain(rangeOffset)
        .delete(text.length)
        .insert(replaced_text)
        .retain(restLength - rangeLength);
    } else {
      /** Insert Operation */
      change_op = new firepad.TextOperation()
        .retain(rangeOffset)
        .insert(text)
        .retain(restLength);

      inverse_op = new firepad.TextOperation()
        .retain(rangeOffset)
        .delete(text)
        .retain(restLength);
    }

    return [change_op, inverse_op];
  };

  /**
   * @method onChange - OnChange Event Handler
   * @param {Object} event - OnChange Event Delegate
   */
  MonacoAdapter.prototype.onChange = function onChange(event) {
    var _this = this;

    if (!this.ignoreChanges) {
      var content = this.lastDocLines.join(this.monacoModel.getEOL());
      var offset = 0;

      /** If no change information recieved */
      if (!event.changes) {
        var op = new firepad.TextOperation().retain(content.length);
        this.trigger('change', op, op);
      }

      /** Iterate through all changes */
      event.changes.forEach(function (change) {
        var pair = _this.operationFromMonacoChanges(change, content, offset);
        offset += pair[0].targetLength - pair[0].baseLength;

        _this.trigger.apply(_this, ['change'].concat(pair));
      });

      /** Update Editor Content */
      this.lastDocLines = this.monacoModel.getLinesContent();
    }
  };

  /**
   * @method trigger - Event Handler
   * @param {string} event - Event name
   * @param  {...any} args - Callback arguments
   */
  MonacoAdapter.prototype.trigger = function trigger(event) {
    if (!this.callbacks.hasOwnProperty(event)) {
      return;
    }

    var action = this.callbacks[event];

    if (!typeof action === 'function') {
      return;
    }

    var args = [];

    if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
    }

    action.apply(null, args);
  };

  /**
   * @method onBlur - Blur event handler
   */
  MonacoAdapter.prototype.onBlur = function onBlur() {
    if (this.monaco.getSelection().isEmpty()) {
      this.trigger('blur');
    }
  };

  /**
   * @method onFocus - Focus event handler
   */
  MonacoAdapter.prototype.onFocus = function onFocus() {
    this.trigger('focus');
  };

  /**
   * @method onCursorActivity - CursorActivity event handler
   */
  MonacoAdapter.prototype.onCursorActivity = function onCursorActivity() {
    var _this = this;

    setTimeout(function () {
      return _this.trigger('cursorActivity');
    }, 1);
  };

  /**
   * @method applyOperation
   * @param {Operation} operation - OT.js Operation Object
   */
  MonacoAdapter.prototype.applyOperation = function applyOperation(operation) {
    if (!operation.isNoop()) {
      this.ignoreChanges = true;
    }

    /** Get Operations List */
    var opsList = operation.ops;
    var index = 0;

    var _this = this;
    opsList.forEach(function (op) {
      /** Retain Operation */
      if (op.isRetain()) {
        index += op.chars;
      } else if (op.isInsert()) {
        /** Insert Operation */
        var pos = _this.monacoModel.getPositionAt(index);

        _this.monaco
          .getModel()
          .pushEditOperations(_this.monaco.getSelections(), [
            {
              range: new monaco.Range(
                pos.lineNumber,
                pos.column,
                pos.lineNumber,
                pos.column
              ),
              text: op.text,
              forceMoveMarkers: true,
            },
          ]);
        // _this.monaco.executeEdits('my-source', [{
        //   range: new monaco.Range(
        //     pos.lineNumber, pos.column,
        //     pos.lineNumber, pos.column
        //   ),
        //   text: op.text,
        //   forceMoveMarkers: true
        // }]);

        index += op.text.length;
      } else if (op.isDelete()) {
        /** Delete Operation */
        var from = _this.monacoModel.getPositionAt(index);
        var to = _this.monacoModel.getPositionAt(index + op.chars);

        _this.monaco
          .getModel()
          .pushEditOperations(_this.monaco.getSelections(), [
            {
              range: new monaco.Range(
                from.lineNumber,
                from.column,
                to.lineNumber,
                to.column
              ),
              text: '',
              forceMoveMarkers: true,
            },
          ]);
        // _this.monaco.executeEdits('my-source', [{
        //   range: new monaco.Range(
        //     from.lineNumber, from.column,
        //     to.lineNumber, to.column
        //   ),
        //   text: '',
        //   forceMoveMarkers: true
        // }]);
      }
    });

    /** Update Editor Content and Reset Config */
    this.lastDocLines = this.monacoModel.getLinesContent();
    this.ignoreChanges = false;
  };

  /**
   * @method invertOperation
   * @param {Operation} operation - OT.js Operation Object
   */
  MonacoAdapter.prototype.invertOperation = function invertOperation(
    operation
  ) {
    operation.invert(this.getValue());
  };

  return MonacoAdapter;
})(); /** Export Module */

firepad.MonacoAdapter = MonacoAdapter;

var firepad = firepad || {};

/**
 * Helper to turn pieces of text into insertable operations
 */
firepad.textPiecesToInserts = function (atNewLine, textPieces) {
  var inserts = [];

  function insert(string, attributes) {
    if (string instanceof firepad.Text) {
      attributes = string.formatting.attributes;
      string = string.text;
    }

    inserts.push({ string: string, attributes: attributes });
    atNewLine = string[string.length - 1] === '\n';
  }

  function insertLine(line, withNewline) {
    // HACK: We should probably force a newline if there isn't one already.  But due to
    // the way this is used for inserting HTML, we end up inserting a "line" in the middle
    // of text, in which case we don't want to actually insert a newline.
    if (atNewLine) {
      insert(
        firepad.sentinelConstants.LINE_SENTINEL_CHARACTER,
        line.formatting.attributes
      );
    }

    for (var i = 0; i < line.textPieces.length; i++) {
      insert(line.textPieces[i]);
    }

    if (withNewline) insert('\n');
  }

  for (var i = 0; i < textPieces.length; i++) {
    if (textPieces[i] instanceof firepad.Line) {
      insertLine(textPieces[i], i < textPieces.length - 1);
    } else {
      insert(textPieces[i]);
    }
  }

  return inserts;
};

var firepad = firepad || {};

firepad.Firepad = (function (global) {
  var MonacoAdapter = firepad.MonacoAdapter;
  var FirebaseAdapter = firepad.FirebaseAdapter;
  var EditorClient = firepad.EditorClient;
  var utils = firepad.utils;
  var monaco = global.monaco;

  function Firepad(ref, place, options) {
    if (!(this instanceof Firepad)) {
      return new Firepad(ref, place, options);
    }

    if (!global.monaco) {
      throw new Error(
        "Couldn't find Monaco.  Did you forget to import monaco?"
      );
    }

    this.zombie_ = false;

    if (global.monaco && place && place instanceof global.monaco.constructor) {
      monaco = global.monaco;
      this.monaco_ = this.editor_ = place;
      var curValue = this.monaco_.getValue();
      if (curValue !== '') {
        throw new Error(
          "Can't initialize Firepad with a Monaco instance that already contains text."
        );
      }
    } else {
      throw new Error('Monaco not found (?) idk when this would run');
    }

    var editorWrapper = this.monaco_.getDomNode();

    // var editorWrapper = this.codeMirror_ ? this.codeMirror_.getWrapperElement() : this.ace_.container;
    this.firepadWrapper_ = utils.elt('div', null, { class: 'firepad' });
    editorWrapper.parentNode.replaceChild(this.firepadWrapper_, editorWrapper);
    this.firepadWrapper_.appendChild(editorWrapper);

    // Provide an easy way to get the firepad instance associated with this CodeMirror instance.
    this.editor_.firepad = this;

    this.options_ = options || {};

    var userId = this.getOption('userId', ref.push().key);
    var userColor = this.getOption('userColor', colorFromUserId(userId));

    this.firebaseAdapter_ = new FirebaseAdapter(ref, userId, userColor);
    this.editorAdapter_ = new MonacoAdapter(this.monaco_);
    this.client_ = new EditorClient(this.firebaseAdapter_, this.editorAdapter_);

    var self = this;
    this.firebaseAdapter_.on('cursor', function () {
      self.trigger.apply(self, ['cursor'].concat([].slice.call(arguments)));
    });

    this.firebaseAdapter_.on('ready', function () {
      self.ready_ = true;

      var defaultText = self.getOption('defaultText', null);
      if (defaultText && self.isHistoryEmpty()) {
        self.setText(defaultText);
      }

      self.trigger('ready');
    });

    this.client_.on('synced', function (isSynced) {
      self.trigger('synced', isSynced);
    });
  }
  utils.makeEventEmitter(Firepad);

  // For readability, these are the primary "constructors", even though right now they're just aliases for Firepad.
  Firepad.fromMonaco = Firepad;

  Firepad.prototype.dispose = function () {
    this.zombie_ = true; // We've been disposed.  No longer valid to do anything.

    // Unwrap the editor.
    // var editorWrapper = this.codeMirror_ ? this.codeMirror_.getWrapperElement() : this.ace_.container;
    var editorWrapper = this.monaco_.getDomNode();

    this.firepadWrapper_.removeChild(editorWrapper);
    this.firepadWrapper_.parentNode.replaceChild(
      editorWrapper,
      this.firepadWrapper_
    );

    this.editor_.firepad = null;

    this.firebaseAdapter_.dispose();
    this.editorAdapter_.detach();
  };

  Firepad.prototype.setUserId = function (userId) {
    this.firebaseAdapter_.setUserId(userId);
  };

  Firepad.prototype.setUserColor = function (color) {
    this.firebaseAdapter_.setColor(color);
  };

  Firepad.prototype.getText = function () {
    this.assertReady_('getText');
    return this.monaco_.getModel().getValue();
  };

  Firepad.prototype.setText = function (textPieces) {
    this.assertReady_('setText');
    return this.monaco_.getModel().setValue(textPieces);
  };

  Firepad.prototype.isHistoryEmpty = function () {
    this.assertReady_('isHistoryEmpty');
    return this.firebaseAdapter_.isHistoryEmpty();
  };

  Firepad.prototype.getOption = function (option, def) {
    return option in this.options_ ? this.options_[option] : def;
  };

  Firepad.prototype.assertReady_ = function (funcName) {
    if (!this.ready_) {
      throw new Error(
        'You must wait for the "ready" event before calling ' + funcName + '.'
      );
    }
    if (this.zombie_) {
      throw new Error(
        "You can't use a Firepad after calling dispose()!  [called " +
          funcName +
          ']'
      );
    }
  };

  function colorFromUserId(userId) {
    var a = 1;
    for (var i = 0; i < userId.length; i++) {
      a = (17 * (a + userId.charCodeAt(i))) % 360;
    }
    var hue = a / 360;

    return hsl2hex(hue, 0.75, 0.2);
  }

  function rgb2hex(r, g, b) {
    function digits(n) {
      var m = Math.round(255 * n).toString(16);
      return m.length === 1 ? '0' + m : m;
    }
    return '#' + digits(r) + digits(g) + digits(b);
  }

  function hsl2hex(h, s, l) {
    if (s === 0) {
      return rgb2hex(l, l, l);
    }
    var var2 = l < 0.5 ? l * (1 + s) : l + s - s * l;
    var var1 = 2 * l - var2;
    var hue2rgb = function (hue) {
      if (hue < 0) {
        hue += 1;
      }
      if (hue > 1) {
        hue -= 1;
      }
      if (6 * hue < 1) {
        return var1 + (var2 - var1) * 6 * hue;
      }
      if (2 * hue < 1) {
        return var2;
      }
      if (3 * hue < 2) {
        return var1 + (var2 - var1) * 6 * (2 / 3 - hue);
      }
      return var1;
    };
    return rgb2hex(hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3));
  }

  return Firepad;
})(window);

// Export Text classes
firepad.Firepad.TextOperation = firepad.TextOperation;

// Export adapters
firepad.Firepad.MonacoAdapter = firepad.MonacoAdapter;

export default firepad.Firepad;
