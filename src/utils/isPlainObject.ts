/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** `Object#toString` result references. */
const objectTag = "[object Object]"

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value: any): boolean {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  let result = false
  if (value != null && typeof value.toString != "function") {
    try {
      result = !!(value + "")
    } catch (e) {}
  }
  return result
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg<A1, A2, R1>(
  func: (arg: A2) => R1,
  transform: (arg: A1) => A2,
): (arg: A1) => R1 {
  return function (arg: A1): R1 {
    return func(transform(arg))
  }
}

/** Used for built-in method references. */
const funcProto = Function.prototype,
  objectProto = Object.prototype

/** Used to resolve the decompiled source of functions. */
const funcToString = funcProto.toString

/** Used to check objects for own properties. */
const hasOwnProperty = objectProto.hasOwnProperty

/** Used to infer the `Object` constructor. */
const objectCtorString = funcToString.call(Object)

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
const objectToString = objectProto.toString

/** Built-in value references. */
const getPrototype = overArg(Object.getPrototypeOf, Object)

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value: any): boolean {
  return !!value && typeof value == "object"
}

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
export function isPlainObject(value: any): boolean {
  if (
    !isObjectLike(value) ||
    objectToString.call(value) != objectTag ||
    isHostObject(value)
  ) {
    return false
  }
  const proto = getPrototype(value)
  if (proto === null) {
    return true
  }
  const Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor
  return (
    typeof Ctor == "function" &&
    Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString
  )
}
