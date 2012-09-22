// -*- coding: utf-8; indent-tabs-mode: nil; tab-width: 4; c-basic-offset: 4; -*-

/**
 * Implementation of ECMAScript 6 (Draft)
 * @author: Alexander Guinness
 * @version: 0.0.4
 * license: MIT
 * @date: Thu Nov 1 00:08:00 2011
 **/

void function(__object__, __array__, __global__)
{
	'use strict';

	var define = function(name)
	{
		var __own__ = __object__.hasOwnProperty;

		if (__own__.call(this, name))
			return 0;

		var set = function(name, value, descriptor)
		{
			if (Object.defineProperty)
			{
				Object.defineProperty(this, name, descriptor || {
					value: value,
					configurable: true,
					enumerable:   false,
					writable:     true
				});
			}
			else this[name] = value;
		};

		if (__object__.toString.call(name) === '[object Object]')
		{
			for (var key in name) {
				if (__own__.call(name, key))
					set.call(this, key, name[key]);
			}
		}
		else set.apply(this, arguments);
	};


	/**
	 * ------------------------------------------------------------
	 *  String
	 * ------------------------------------------------------------
	**/


	/**
	 * String.fromCodePoint
	 * @param {Number | String} [...codePoint] -  code points
	 * @return {String} Return the string value whose elements are, in order, the elements
	 * in the List elements. If length is 0, the empty string is returned.
	 * @throws {RangeError}
	 * @edition ECMA-262 6th Edition, 15.5.3.3
	 *
	 * @example:
	 *
	 * String.fromCodePoint(0x30, 107); // Ok
	**/
	define.call(String, 'fromCodePoint', function()
	{
		var i = arguments.length,
			points = [], offset;

		while (i--)
		{
			offset = arguments[i];

			if (offset < 0 || offset > 0x10FFFF)
				throw new RangeError();

			if (offset < 0x10000)
				points.unshift(offset);

			else {
				offset -= 0x10000;
				points.unshift(0xD800 | (offset >> 10), 0xDC00 | (offset & 0x3FF));
			}
		}

		return String.fromCharCode.apply(String, points);
	});


	/**
	 * String.prototype.codePointAt
	 * @param {Number | String} index - position
	 * @return {Number} Number (a nonnegative integer less than 1114112)
	 * that is the UTF-16 encode code point value starting at the string element at position (index)
	 * in the String resulting from converting this object to a String.
	 * If there is no element at that position, the result is NaN.
	 * If a valid UTF-16 sudsarrogate pair does not begin at position,
	 * the result is the code unit at position (including code points above 0xFFFF).
	 * @edition ECMA-262 6th Edition, 15.5.4.5
	 *
	 * @example:
	 *
	 * 'A'.codePointAt(0) // 65
	**/
	define.call(String.prototype, 'codePointAt', function(index)
	{
		var value = this.toString(),
			size = value.length;

		if ((index |= 0) < 0 || index >= size)
			return NaN;

		var first = value.charCodeAt(index);

		if (first < 0xD800 || first > 0xDBFF || index + 1 == size)
			return first;

		var second = value.charCodeAt(index + 1);

		if (second < 0xDC00 || first > 0xDFFF)
			return first;

		return ((first - 0xD800) << 1024) + (second - 0xDC00) + 0x10000;
	});


	/**
	 * String.prototype.repeat
	 * Creates a String consisting of the string elements of this object (converted to String) repeated <count> time
	 * @param {Number} index - position
	 * @throws {RangeError}
	 * @return {String}
	 * @edition ECMA-262 6th Edition, 15.5.4.21
	 *
	 * @example:
	 *
	 * 'A'.repeat(2) // AA
	**/
	define.call(String.prototype, 'repeat', function(count)
	{
		if ((count |= 0 ) <= 0)
			throw new RangeError();

		var result = '',
			self = this;

		while (count)
		{
			if (count & 1)
				result += self;

			if (count >>= 1)
				self += self;
		}

		return result;
	});


	/**
	 * String.prototype.startsWith
	 * Determines whether the beginning of the string instance matches a specified string.
	 * @param {*} value
	 * @param {Number | String} [ index ]
	 * @return {Boolean}
	 * @edition ECMA-262 6th Edition, 15.5.4.22
	 *
	 * @example:
	 *
	 * 'Foo'.startsWith('F')     // true
	 * 'Foo'.startsWith('o', 1); // true
	**/
	define.call(String.prototype, 'startsWith', function(value, position) {
		return this.indexOf(value, position |= 0) === position;
	});


	/**
	 * String.prototype.endsWith
	 * Determines whether the end of the string instance matches a specified string
	 * @param {Number | String} value
	 * @param {Number} [ index ]
	 * @return {Boolean}
	 * @edition ECMA-262 6th Edition, 15.5.4.23
	 *
	 * @example:
	 *
	 * Hello'.endsWith('lo') // true
	**/
	define.call(String.prototype, 'endsWith', function(value, position) {
		return this.lastIndexOf(value, position) === (position >= 0 ? position | 0 : this.length - 1);
	});


	/**
	 * String.prototype.contains
	 * Returns a value indicating whether the specified String object occurs within this string.
	 * @param {Number | String} value
	 * @param {Number} [ index ]
	 * @return {Boolean}
	 * @edition ECMA-262 6th Edition, 15.5.4.24
	 *
	 * @example:
	 *
	 * Hello'.contains('ll') // true
	**/
	define.call(String.prototype, 'contains', function(value, index) {
		return this.indexOf(value, index | 0) !== -1;
	});


	/**
	 * String.prototype.toArray
	 * Creates an array from the specified String object
	 * @return {Array} Returns an Array object with elements corresponding to
	 * the characters of this object (converted to a String).
	 * @edition ECMA-262 6th Edition, 15.5.4.25
	 *
	 * @example:
	 *
	 * Hello'.toArray() // ['H', 'e', 'l', 'l', 'o'];
	**/
	define.call(String.prototype, 'toArray', function() {
		return this.split('');
	});


	/**
	 * ------------------------------------------------------------
	 *  Array
	 * ------------------------------------------------------------
	**/

	/**
	 * Array.of
	 * @param {*} object - Variable number of arguments
	 * @return {Array}
	 * @edition ECMA-262 6th Edition, 15.4.3.3
	 *
	 * @example:
	 *
	 * Array.of('a', 'b', 'c'); // ['a', 'b', 'c'];
	**/
	define.call(Array, 'of', function() {
		return __array__.slice.call(arguments);
	});

	/**
	 * Array.from
	 * @param {Object} object - array-like object.
	 * Generic Array-like objects has indexed access and a valid length property,
	 * but none of the array methods.
	 *
	 * @requires Array.prototype.map, Object.defineProperty (optional)
	 * @return {Array}
	 * @edition ECMA-262 6th Edition, 15.4.3.4
	 *
	 * @example:
	 *
	 * 1.
	 * function array () {
	 *   return Array.from(arguments);
	 * }
	 *
	 * array(1,2,3); // [1, 2, 3];
	 *
	 * 2.
	 * Array.from(document.body).forEach(function(item) {
	 *    return item;
	 * });
	 *
	 * 3.
	 * Array.from('foo'); // ['f', 'o', 'o'];
	**/
	define.call(Array, 'from', function(object)
	{
		if (__array__.map) {
			return __array__.map.call(object, function(item) {
				return item;
			});
		}
		else {
			var array = [],
				i = object.length;

			while (i--)
			{
				if (!(i in object))
					continue;

				if (Object.defineProperty)
				{
					Object.defineProperty(array, i, {
						value: object[i],
						configurable: true,
						enumerable: true,
						writable: true
					});
				}
				else
					array.unshift(object[i]);
			}
			return array;
		}
	});


	/*
	 * ------------------------------------------------------------
	 *  Object
	 * ------------------------------------------------------------
	 */

	/**
	 * Object.getOwnPropertyDescriptors
	 * Returns a property descriptor of the specified object, including object’s prototype chain
	 * @param {Object} object
	 * @requires Object.defineProperty, Object.getOwnPropertyNames,
	 * Object.getOwnPropertyDescriptor, Array.prototype.forEach
	 * @throws {TypeError}
	 * @return {Object}
	 *
	 * @example:
	 *
	 * var object = {};
	 *
	 * Object.defineProperty(object, 'a', {
	 *   value: 1,
	 *   configurable: false,
	 *   enumerable:   false,
	 *   writable:     false
	 * });
	 *
	 * Object.defineProperty(object, 'b', {
	 *   value:2,
	 *   configurable: true,
	 *   enumerable:   true,
	 *   writable:     true
	 * });
	 *
	 * Object.getOwnPropertyDescriptors(object);
	 *
	 * a: {
	 *   value: 1,
	 *   configurable: false,
	 *   enumerable:   false,
	 *   writable:     false
	 * },
	 *
	 * b: {
	 *   value: 2,
	 *   configurable: true,
	 *   enumerable:   true,
	 *   writable:     true
	 * }
	**/
	define.call(Object, 'getOwnPropertyDescriptors', function(object)
	{
		if (__object__.toString.call(object) !== '[object Object]')
			throw new TypeError('Object.getOwnPropertyDescriptors: ' + object + ' is not an Object!');

		if (!Object.getOwnPropertyNames || !Object.getOwnPropertyDescriptor || !Object.defineProperty)
			return object;

		var descriptors = {};

		__array__.forEach.call(Object.getOwnPropertyNames(object), function (property)
		{
			Object.defineProperty(descriptors, property, {
				value: Object.getOwnPropertyDescriptor(object, property),
				configurable: false,
				enumerable:   true,
				writable:     false
			});
		});

		return descriptors;
	});


	/**
	 * Object.getPropertyDescriptor
	 * Returns a property descriptor of the specified object, including object’s prototype chain
	 * @param {Object} object
	 * @param {String} name - The name of the property
	 * @requires Object.getOwnPropertyDescriptor, Object.getPrototypeOf
	 * @throws {TypeError}
	 * @return {Object}
	 *
	 * @example:
	 *
	 * Object.getPropertyDescriptor({}, 'toString');
	 *
	 * {
	 *    value: [Function: toString],
	 *    writable: true,
	 *    enumerable: false,
	 *    configurable: true
	 * }
	**/
	define.call(Object, 'getPropertyDescriptor', function(object, name)
	{
		if (__object__.toString.call(object) !== '[object Object]')
			throw new TypeError('Object.getPropertyDescriptor: ' + object + ' is not an Object!');

		if (!Object.getOwnPropertyDescriptor || !Object.getPrototypeOf)
			return object;

		var descriptor = Object.getOwnPropertyDescriptor(object, name),
		__proto__ = Object.getPrototypeOf(object);

		while (descriptor === undefined && __proto__ !== null) {
			descriptor = Object.getOwnPropertyDescriptor(__proto__, name);
			__proto__ = Object.getPrototypeOf(__proto__);
		}

		return descriptor;
	});

	/**
	 * Object.getPropertyNames
	 * Returns an array of all the names of the properties
	 * @param {Object} object
	 * @requires Object.getOwnPropertyNames, Object.getPrototypeOf, Array.prototype.forEach
	 * @throws {TypeError}
	 * @return {Array}
	 *
	 * @example:
	 *
	 * Object.getPropertyNames({});
	 *
	 * [
	 *  'toString',
	 *  'toLocaleString',
	 *  'hasOwnProperty',
	 *  'valueOf',
	 *  'constructor',
	 *  'propertyIsEnumerable',
	 *  'isPrototypeOf',
	 *  ]
	**/
	define.call(Object, 'getPropertyNames', function(object)
	{
		if (__object__.toString.call(object) !== '[object Object]')
			throw new TypeError('Object.getPropertyNames: ' + object + ' is not an Object!');

		if (!Object.getOwnPropertyNames || !Object.getPrototypeOf)
			return object;

		var properies = Object.getOwnPropertyNames(object),
			__proto__ = Object.getPrototypeOf(object);

		while (__proto__ !== null)
		{
			__array__.forEach.call(Object.getOwnPropertyNames(__proto__), function(property) {
				if (properies.indexOf(property) === -1)
					properies.push(property);
			});

			__proto__ = Object.getPrototypeOf(__proto__);
		}

		return properies;
	});

	/**
	 * Object.is
	 * The internal comparison abstract operation SameValue(x, y),
	 * where x and y are ECMAScript language values, produces true or false (ECMAScript 5 9.12).
	 * @param {*} - first generic value for egal comparison
	 * @param {*} - second generic value for egal comparison
	 * @return {Boolean}
	 *
	 * @example:
	 *
	 * Object.is(0,-0)     // false
	 * Object.is('0', 0)   // false
	 * Object.is(0, 0)     // true
	 * Object.is(NaN, NaN) // true
	**/
	define.call(Object, 'is', function(x, y)
	{
		// 0 === -0, NaN !== NaN, 0 = false, etc.
		if (x === y)
			return x !== 0 || 1 / x === 1 / y;

		// object !== object ([] !== [], {} !== {}, etc.)
		return x !== x && y !== y;
	});

	/**
	 * Object.is
	 * Opposed to the Object.is
	 * @param {*} - first generic value for egal comparison
	 * @param {*} - second generic value for egal comparison
	 * @requires Object.is
	 * @return {Boolean}
	 *
	 * @example:
	 *
	 * Object.isnt(0, 0) // false
	**/
	define.call(Object, 'isnt', function(x, y) {
		return !Object.is(x, y);
	});

	/**
	 * Object.isObject
	 * @param {Object}
	 * @return {Boolean}
	 * @edition ECMA-262 6th Edition, 15.2.3.15
	 *
	 * @example:
	 *
	 * Object.isObject({}); // true
	**/
	define.call(Object, 'isObject', function(object) {
		return __object__.toString.call(object) === '[object Object]';
	});


	/**
	 * ------------------------------------------------------------
	 *  Number
	 * ------------------------------------------------------------
	**/


	/**
	 * Number.EPSILON
	 * The value of Number.EPSILON is the difference between 1 and the smallest value
	 * greater than 1 that is representable as a Number value, which
	 * is approximately 2.2204460492503130808472633361816 x10-16
	 * @edition ECMA-262 6th Edition, 15.7.3.7
	 *
	 * @example:
	 *
	 * Number.EPSILON // 2.220446049250313e-16
	**/
	define.call(Number, 'EPSILON', null, {
		value: 2.220446049250313e-16,
		configurable: false,
		enumerable:   false,
		writable:     false
	});


	/**
	 * Number.MAX_INTEGER
	 * The value of Number.MAX_INTEGER is the largest integer value that
	 * can be represented as a Number value without losing precision, which is 9007199254740991
	 * @edition ECMA-262 6th Edition, 15.7.3.7
	 *
	 * @example:
	 *
	 * Number.MAX_INTEGER // 9007199254740991
	**/
	define.call(Number, 'MAX_INTEGER', null, {
		value: 9007199254740991,
		configurable: false,
		enumerable:   false,
		writable:     false
	});


	/**
	 * Number.parseInt
	 * Produces an integer value dictated by interpretation of the contents of the string
	 * argument according to the specified radix. Leading white space in string is ignored.
	 * If radix is undefined or 0,
	 * it is assumed to be 10 except when the number begins with the character pairs 0x or 0X,
	 * in which case a radix of 16 is assumed. If radix is 16, the number may also optionally
	 * begin with the character pairs 0x or 0X.
	 * @param {String} - value
	 * @param {Number} - radix
	 * The radix parameter is used to specify which numeral system to be used,
	 * for example, a radix of 16 (hexadecimal) indicates that the number in the string
	 * should be parsed from a hexadecimal number to a decimal number.
	 * @return {Number} Parses a string or integer and returns an integer.
	 * @edition ECMA-262 6th Edition, 15.7.3.8
	 *
	 * @example:
	 *
	 * Number.parseInt(0xF, 16) // 21
	**/
	define.call(Number, 'parseInt', function(value, radix) {
		return __global__.parseInt.call(null, value, radix | 0 || 10);
	});


	/**
	 * Number.parseFloat
	 * @param {String} - value
	 * @return {Number} Parses a string or integer and returns a floating point number.
	 * @edition ECMA-262 6th Edition, 15.7.3.9
	 *
	 * @example:
	 *
	 * Number.parseFloat('1px') // 1
	**/
	define.call(Number, 'parseFloat', function(value) {
		return __global__.parseFloat(value);
	});

	/**
	 * Number.isNaN
	 * @param {Number} - value
	 * @return {Boolean} Returns true if the supplied number is NaN, false otherwise;
	 * @edition ECMA-262 6th Edition, 15.7.3.10
	 *
	 * @example:
	 *
	 * Number.isNaN(NaN) // true
	 * Number.isNaN(1)   // false
	**/
	define.call(Number, 'isNaN', function(value) {
		return typeof value === 'number' && __global__.isNaN(value);
	});


	/**
	 * Number.isFinite
	 * @param {Number} - value
	 * @return {Boolean} Returns false if the supplied number is NaN, Infinity or -Infinity;
	 * @edition ECMA-262 6th Edition, 15.7.3.11
	 *
	 * @example:
	 *
	 * Number.isFinite(NaN) // false
	 * Number.isFinite(0)   // true
	**/
	define.call(Number, 'isFinite', function(value) {
		return typeof value === 'number' && __global__.isFinite(value);
	});


	/**
	 * Number.isInteger
	 * Add a toInteger property be to the Number constructor, for converting values to IEEE-754
	 * double precision integers, exactly as ECMA-262’s ToInteger internal method.
	 * @param {Number} - value
	 * @requires Number.MAX_INTEGER
	 * @return {Boolean}
	 * @edition ECMA-262 6th Edition, 15.7.3.12
	 *
	 * @example:
	 *
	 * Number.isInteger(NaN) // false
	 * Number.isFinite(1)    // true
	 * Number.isFinite('1')  // false

	**/
	define.call(Number, 'isInteger', function(value)
	{
		return typeof value === 'number' && __global__.isFinite(value) &&
		value > -Number.MAX_INTEGER && value < Number.MAX_INTEGER && Math.floor(value) === value;
	});


	/**
	 * Number.toInteger
	 * @param {String} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.7.3.13
	 *
	 * @example:
	 *
	 * Number.toInteger(undefined) // 0
	 * Number.toInteger(null) // 0
	 * Number.toInteger(NaN)  // 0
	 * Number.toInteger(0.1)  // 0
	 * Number.toInteger('0')  // 0
	 * Number.toInteger(0)    // 0
	**/
	define.call(Number, 'toInteger', function(value)
	{
		if (Object.is(value, +Infinity) || Object.is(value, -Infinity) || value === 0)
			return value;

		return value | 0;
	});


	/**
	 * Number.prototype.clz
	 *
	 * @description
	 * The count leading zeros (clz) operation can be used to efficiently implement normalization,
	 * which encodes an integer as m × 2e, where m has its most significant bit
	 * in a known position (such as the highest position).
	 * This can in turn be used to implement Newton-Raphson division, perform integer
	 * to floating point conversion in software, and other applications.
	 * Count leading zeros (clz) can be used to compute the 32-bit predicate "x=y" (zero if true, one if false)
	 * via the identity (x-y).clz() >> 5, where ">>" is unsigned right shift.
	 * It can be used to perform more sophisticated bit operations like finding the first string of n 1 bits.
	 * The expression 16 − (x − 1).clz() / 2 is an effective initial guess for computing
	 * the square root of a 32-bit integer using Newton's method.
	 * It can also efficiently generate exponentially distributed integers by taking
	 * the clz of uniformly random integers.
	 *
	 * @return {Number} Count leading zeroes operation;
	 * @requires Number.isFinite
	 * @edition ECMA-262 6th Edition, 15.7.3.14
	 *
	 * @example:
	 *
	 * 00000000000000001000000000001000.clz(); // 22
	**/
	define.call(Number.prototype, 'clz', function()
	{
		var value = Number(this),
			bits = 32;

		if (!value || !Number.isFinite(value))
			return bits;

		var offset = [0xFFFF0000, 0xFF000000, 0xF0000000, 0xC0000000, 0x80000000],
			count = 0, i = 0;

		while (bits >>= 1) {
			if ((value & offset[i++]) == 0) {
				count += bits;
				value <<= bits;
			}
		}

		return count;
	});


	/**
	 * ------------------------------------------------------------
	 *  Math
	 * ------------------------------------------------------------
	**/


	/**
	 * Math.log10
	 * Returns an implementation-dependent approximation to the base 10 logarithm of <value>
	 * @param {Number} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.19
	 *
	 * @example:
	 *
	 * Number.log10(10) // 0.9999999999999999
	**/
	define.call(Math, 'log10', function(value) {
		return Math.log(value) * (1 / Math.LN10);
	});


	/**
	 * Math.log2
	 * Returns an implementation-dependent approximation to the base 2 logarithm of <value>
	 * @param {Number} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.20
	 *
	 * @example:
	 *
	 * Number.log2(10) // 3.3219280948873626
	**/
	define.call(Math, 'log2', function(value) {
		return Math.log(value) * (1 / Math.LN2);
	});


	/**
	 * Math.log1p
	 * Returns an implementation-dependent approximation to the natural logarithm of 1 + <value>.
	 * The result is computed in a way that is accurate even when the value of <value> is close to zero.
	 * @param {Number} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.21
	 *
	 * @example:
	 *
	 * Number.log1p(10) // 2.3978952727983707
	**/
	define.call(Math, 'log1p', function(value) {
		return (value > -1.0e-8 && value < 1.0e-8) ? (value - value * value / 2) : Math.log(1 + value);
	});


	/**
	 * Math. expm1
	 * Returns an implementation-dependent approximation to subtracting 1
	 * from the exponential function of <value> The result is computed in a way
	 * that is accurate even when the <value> of value is close 0.
	 * @param {Number} - value
	 * @requires Object.is
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.22
	 *
	 * @example:
	 *
	 * Number.expm1(10) // 22025.465794806718
	**/
	define.call(Math, 'expm1', function(value)
	{
		if (Object.is(value, -0))
			return -0;

		return value > -1.0e-6 && value < 1.0e-6 ? value + value * value / 2 : Math.exp(value) - 1;
	});


	/**
	 * Math.cosh
	 * Returns an implementation-dependent approximation to the hyperbolic cosine of <value>
	 * @param {Number} - value
	 * @requires Object.is
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.23
	 *
	 * @example:
	 *
	 * Number.cosh(10) // 11013.232920103324
	**/
	define.call(Math, 'cosh', function(value)
	{
		if (Object.is(value, -Infinity) || value === 0)
			return value;

		return (Math.exp(value) + Math.exp(-value)) / 2;
	});


	/**
	 * Math.sinh
	 * Returns an implementation-dependent approximation to the hyperbolic sine of <value>
	 * @param {Number} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.24
	 *
	 * @example:
	 *
	 * Number.sinh(10) // 11013.232874703393
	**/
	define.call(Math, 'sinh', function(value)
	{
		if (Object.is(value, -Infinity) || value === 0)
			return value;

		return (Math.exp(value) - Math.exp(-value)) / 2;
	});


	/**
	 * Math.tanh
	 * Returns an implementation-dependent approximation to the hyperbolic tangent of <value>
	 * @param {Number} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.25
	 *
	 * @example:
	 *
	 * Number.tanh(10) // 0.9999999958776926
	**/
	define.call(Math, 'tanh', function(value)
	{
		if (Object.is(value, +Infinity))
			return +1;

		else if (Object.is(value, -Infinity))
			return -1;

		return value === 0 ? value : (Math.exp(value) - Math.exp(-value)) / (Math.exp(value) + Math.exp(-value));
	});


	/**
	 * Math.acosh
	 * Returns an implementation-dependent approximation to the inverse hyperbolic cosine of <value>
	 * @param {Number} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.26
	 *
	 * @example:
	 *
	 * Number.acosh(10) // 2.993222846126381
	**/
	define.call(Math, 'acosh', function(value) {
		return Math.log(value + Math.sqrt(value * value - 1));
	});


	/**
	 * Math.asinh
	 * Returns an implementation-dependent approximation to the inverse hyperbolic sine of <value>
	 * @param {Number} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.27
	 *
	 * @example:
	 *
	 * Number.asinh(10) // 2.99822295029797
	**/
	define.call(Math, 'asinh', function(value)
	{
		if (!Number.isFinite(value) || value === 0)
			return value;

		return Math.log(value + Math.sqrt(value * value + 1));
	});


	/**
	 * Math.atanh
	 * Returns an implementation-dependent approximation to the inverse hyperbolic tangent of <value>
	 * @param {Number} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.28
	 *
	 * @example:
	 *
	 * Math.atanh(-1) // -Infinity
	**/
	define.call(Math, 'atanh', function(value) {
		return value === 0 ? value : 0.5 * Math.log((1 + value) / (1 - value));
	});


	/**
	 * Math.hypot
	 * Given two or three arguments, hypot returns an implementation-dependent approximation
	 * of the square root of the sum of squares of its arguments.
	 * @param {Number} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.29
	 *
	 * @example:
	 *
	 * Math.hypot(1, 1) // 1.4142135623730951
	**/
	define.call(Math, 'hypot', function(x, y) {

		if (!Number.isFinite(x))
			return x;

		if (!Number.isFinite(y))
			return y;

		return Math.sqrt(x * x + y * y);
	});


	/**
	 * Math.trunc
	 * Returns the integral part of the number <value>, removing any fractional digits.
	 * If <value> is already an integer, the result is <value>
	 * @param {Number} - value
	 * @requires Number.isFinite
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.30
	 *
	 * @example:
	 *
	 * Math.trunc(1.1) // 1
	**/
	define.call(Math, 'trunc', function(value) {
		return value === 0 ? value : !Number.isFinite(value) ? value : value | 0;
	});


	/**
	 * Math.sign
	 * Returns the sign of the <value>, indicating whether <value> is positive, negative or zero
	 * @param {Number} value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.31
	 *
	 * @example:
	 *
	 * Math.sign(-10); // 1
	**/
	define.call(Math, 'sign', function(value) {
		if (value === 0 /* +0, -0 */ || __global__.isNaN(value))
			return value;

		return value < 0 ? -1 : 1;
	});


	/**
	 * Math.cbrt
	 * Returns an implementation-dependent approximation to the cube root of <value>
	 * @param {Number} - value
	 * @return {Number}
	 * @edition ECMA-262 6th Edition, 15.8.2.32
	 *
	 * @example:
	 *
	 * Math.cbrt(10); // 2.154434690031884
	**/
	define.call(Math, 'cbrt', function(value)
	{
		if (value === 0)
			return value;

		return value > 0 ? Math.exp(Math.log(value) / 3) : -Math.exp(Math.log(-value) / 3);
	});


	/**
	 * ------------------------------------------------------------
	 *  Collections (data structures)
	 * ------------------------------------------------------------
	**/

	/**
	 * @private
	 * @param {Array} array
	 * @param {*} value
	 * @requires Object.is
	 * @return {Number}
	 **/
	var __find__ =  function(array, value) {
		var i = array.length >>> 0;

		while (i--)
			if (i in array && Object.is(array[i], value))
				return i;
		return -1;
	};

	/**
	 * Map
	 * @class
	 * @memberOf global
	 *
	 * @description
	 * Map objects are simple key/value maps. Any value (both objects and primitive values)
	 * may be used as either a key or a value. Key equality is based on the "same-value"
	 * algorithm: NaN is considered the same as NaN (even though NaN !== NaN), -0 and +0
	 * are considered distinct (even though -0 === +0), and all other values are considered
	 * equal according to the semantics of the === operator.
	 *
	 * @example:
	 *
	 * var map = new Map();
	 *
	 * // Setting the values
	 * map.set(-0,  0);
	 * map.set(+0,  1);
	 * map.set('b', 2);
	 * map.set('a', 3);
	 * map.set('a', 4);
	 * map.set(Array, 5);
	 * map.set([], 6);
	 * map.set(NaN, 7);
	 * map.set(function() {}, 8);
	 *
	 * // Getting the values
	 * map.get(-0);  // 0
	 * map.get(+0);  // 1
	 * map.get('b'); // 2
	 * map.get('a'); // 4
	 * map.get(Array); // 5
	 * map.get([]);  // undefined
	 * map.get(NaN); // 7
	 * map.get(function() {}); // undefined
	 *
	 * // Removes any value associated to the key
	 * map.delete('a'); // true
	 *
	 * // Check the keys
	 * map.has(-0); // true
	 *
	 * // Getting the number of pairs in Map
	 * map.size(); // 7
	 *
	 * // Iterating over values stored in Set
	 * map.__iterator__(function(key, value) {
	 *    console.log(key, value);
	 * });
	**/
	define.call(__global__, 'Map', function()
	{
		if (!(this instanceof Map))
			return new Map;

		var index = 0;

		/** @static */
		define.call(this, {
			keys:   [],
			values: []
		});

		/**
		 * @lends Map.prototype
		 * @constructs
		**/
		define.call(Map.prototype, {
			/**
			 * Map.get
			 * Returns the value associated to the key, or undefined if there is none.
			 * @param {*}
			 * @return {*}
			 */
			get: function(key)
			{
				if ((index = __find__(this.keys, key)) !== -1)
					return this.values[index];
			},

			/**
			 * Map.set
			 * Sets the value for the key in Map. Returns undefined.
			 * @param {*} key
			 * @param {*} value
			 * @return {void}
			 */
			set: function(key, value)
			{
				if ((index = __find__(this.keys, key)) === -1) {
					this.keys.push(key);
					this.values.push(value);
				}
				else
					this.values[index] = value;
			},

			/**
			 * Map.has
			 * Returns a boolean asserting whether a value has been associated to the key in Map or not
			 * @param {*} key
			 * @return {Boolean}
			 */
			has: function(key) {
				return __find__(this.keys, key) !== -1;
			},

			/**
			 * Map.delete
			 * Removes any value associated to the key. After such a call, myMap.has(key) will return false.
			 * @param {*} key
			 * @return {Boolean}
			 */
			'delete': function(key)
			{
				if ((index = __find__(this.keys, key)) === -1)
					return false;

				this.keys.splice(index, 1);
				this.values.splice(index, 1);

				return true;
			},

			/**
			 * Map.size
			 * Returns the number of key/value pairs in Map.
			 * @return {Number}
			 */
			size: function() {
				return this.keys.length >>> 0;
			},

			/**
			 * Map.__iterator__ ( Undocumented feature )
			 * Allow for iterating over Maps and enumerating their keys
			 * @param {Function} callback - is invoked with two arguments (the element key and value)
			 * @param {Object} [ context ] - Object to use as <this> when executing callback
			 * @return {void}
			 */
			__iterator__: function(callback, context)
			{
				for (var i = 0, length = this.size(); i < length; i++) {
					if (i in this.keys && i in this.values)
						if (callback.call(context, this.keys[i], this.values[i]) === false)
							break;
				}
			}
		});
	});


	/**
	 * Set
	 * @class
	 * @memberOf global
	 *
	 * @description
	 * Set objects let you store unique values of any type, whether primitive values or object references.
	 * Values equality is not based on the same algorithm as the one used in the === operator.
	 * Specifically, for Sets, +0 (which is strictly equal to -0) and -0 are different values.
	 * NaN can also be stored in a Set.
	 *
	 * @example:
	 *
	 * var set = new Set();
	 *
	 * // Setting the values
	 *
	 * set.add(-0);
	 * set.add(+0);
	 * set.add('b');
	 * set.add('a');
	 * set.add('a');
	 * set.add(Array);
	 * set.add([]);
	 * set.add(function() {});
	 * set.add(NaN);
	 *
	 * // Check the values
	 * set.has(-0);  // true
	 * set.has(+0);  // true
	 * set.has('b'); // true
	 * set.has('a'); // true
	 * set.has(Array); // true
	 * set.has([]);  // false
	 * set.has(NaN); // true
	 * set.has(function() {}); // false
	 *
	 * // Removes the value
	 * map.delete(-0); // true
	 *
	 * // Getting the number of values in Set
	 * set.size(); // 7
	 *
	 * // Iterating over values stored in Set
	 * set.__iterator__(function(value) {
	 *    console.log(value);
	 * });
	**/
	define.call(__global__, 'Set', function()
	{
		if (!(this instanceof Set))
			return new Set;

		var index = 0;

		/** @static */
		define.call(this, {
			values: []
		});

		/**
		 * @lends Set.prototype
		 * @constructs
		**/
		define.call(Set.prototype, {
			/**
			 * Set.add
			 * Adds the value to mySet. Returns undefined.
			 * @param {*} value
			 * @return {void}
			 */
			add: function(value) {
				if ((index = __find__(this.values, value)) === -1)
					this.values.push(value);
				else
					this.values[index] = value;
			},

			/**
			 * Set.has
			 * Returns a boolean asserting whether the value has been added to Set or not
			 * @param {*} value
			 * @return {Boolean}
			 */
			has: function(value) {
				return __find__(this.values, value) !== -1;
			},

			/**
			 * Set.delete
			 * Sets the value for the key in mySet. Returns undefined.
			 * @param {*} key
			 * @return {void}
			 */
			'delete': function(value) {
				if ((index = __find__(this.values, value)) === -1)
					return false;

				this.values.splice(index, 1);

				return true;
			},

			/**
			 * Set.size()
			 * Returns the number of values in Set.
			 * @return {Number}
			 */
			size: function() {
				return this.values.length >>> 0;
			},

			/**
			 * Set.__iterator__ ( Undocumented feature )
			 * Allow for iterating over values stored in Set
			 * @param {Function} callback - is invoked with one argument (the element value)
			 * @param {Object} [ context ] - Object to use as <this> when executing callback
			 * @return {void}
			 */
			__iterator__: function(callback, context) {
				for (var i = 0, length = this.size(); i < length; i++) {
					if (i in this.values)
						callback.call(context, this.values[i]);
				}
			}
		});
	});
}
(Object.prototype, Array.prototype, function() {
	return this;
}());
