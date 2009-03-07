// Copyright 2008-2009 Kevin Reid, under the terms of the MIT X license
// found at http://www.opensource.org/licenses/mit-license.html ...............

// No longer used, but kept around for occasional debugging use
function e_js_write(text) {
  document.getElementById("output").appendChild(document.createTextNode(text))
}
function e_js_writebreak() {
  document.getElementById("output").appendChild(document.createElement('br'))
}

// To avoid incoherent behavior, we decide on whether we run in Cajita-interop style only once.
var e_cajitaMode = !!window.cajita

// Stub for Cajita facilities if Cajita isn't loaded
var e_cajita = e_cajitaMode ? cajita : {
  "snapshot": function (obj) {
    if (obj instanceof Array) {
      // without Cajita we consider all Arrays frozen
      return obj
    } else {
      throw new Error("e_cajita.snapshot not implemented in general (" + obj + ")")
    }
  },
  "freeze": function (obj) { return e_cajita.snapshot(obj) },
}

// This variable contains every noun which is globally defined in JS and should be made part of the safeEnv.
var e_safeEnvNames = []

// --- core - message dispatch facilities ---

function e_noSuchMethod(r, v, a) {
  var ty = typeof(r)
  if (ty === "object") {
    ty = r.constructor.toString().split("\n")[0]
  }
  throw new Error("no such method: " + ty + " " + r + "." + v + "(" + a + ")")
}

// called whenever an E-called object doesn't have an appropriately named JS method
function e_NoJsMethod(r, verb, args) {
  if (r.emsg !== undefined) { // will throw if r is undefined or null, this is fine as they are considered broken refs
    // If r has an emsg method, 
    return r.emsg(verb, e_cajita.freeze(args))
  } else {
    if (!e_cajitaMode) {
      return e_noSuchMethod(r, verb, args)
    } else if (verb === "get" && args.length === 1) { // Cajita
      var propName = e_string_guard.emsg_coerce_2(args[0], e_throw)
      return cajita.readPub(r, propName)
    } else if (verb === "put" && args.length === 2) { // Cajita
      var propName = e_string_guard.emsg_coerce_2(args[0], e_throw)
      cajita.setPub(r, propName, args[1])
      return e_null
    } else if (verb === "run") { // Cajita
      return cajita.callPub(r, "call", [cajita.USELESS, args])
    } else {
      if (verb[0] === ".") { // dot escapes special verbs, has no other meaning
        verb = verb.slice(1)
      }
      var method = cajita.readPub(r, verb)
      if (method === undefined) {
        return e_noSuchMethod(r, verb, args)
      } else {
        return cajita.callPub(method, "apply", [r, args])
      }
    }
  }
}

// dynamic call operation
function e_call(r, v, a) {
  //e_js_write("" + r + "." + v.toString() + "/" + a.length + "(" + a.toString() + ")")
  //e_js_writebreak()
  // XXX coerce verb and args, or don't use this from e_e beow
  var verb = "emsg_" + v + "_" + a.length
  var jsmethod = r[verb]
  if (jsmethod === undefined) {
    return e_NoJsMethod(r, v, a)
  } else {
    return jsmethod.apply(r, a)
  }
}

var e_null = {
  emsg___printOn_1: function (out) { e_call(out, "write", ["null"]) },
  toString: function () { return "<E null>" },
}

// --- ejectors ---
function e_Ejection(ejector, value) {
  this.e_Ejector = ejector
  this.e_RetVal = value
}
e_Ejection.toString = function () { return "<ejection with " + this.e_RetVal + " to " + this.e_Ejector + ">" }

function e_Ejector() { // constructor
  var ejector = this;
  this.emsg_run_1 = function (value) {
    throw new e_Ejection(ejector, value)
  }
  this.emsg_run_0 = function () { this.emsg_run_1(e_null) }
}
e_Ejector.toString = function () { return "<ejector>" }

// --- ref primitives ---

function e_refShorten(ref) { // used only by RefAuthor so far
  return ref // XXX stub.
}

function e_refState(ref) { // used only by RefAuthor so far
  if (ref === null || ref === undefined) {
    return "BROKEN"
  } else {
    return "NEAR"
  }
}

function e_refOptProblem(ref) { // used only by RefAuthor so far
  if (ref === null || ref === undefined) {
    try { ref.helloworld() } catch (p) { return p }
    return "can't happen"
  } else {
    return null
  }
}

function e_refIsResolved(ref) { // used only by RefAuthor so far
  return true // xxx stub
}

function e_makeUnconnectedRef(problem) { // used only by RefAuthor so far
  return null // XXX stub
}

function e_refOptSealedDispatch(recip, brand) { // used only by RefAuthor so far
  return e_call(recip, "__optSealedDispatch", [brand])
}

// --- 2nd level core --- 

// For use as a __printOn/1 implementation
function e_toStringPrint(out) {
  e_call(out, "write", [this.toString()])
}

function e_NativeGuard(typeStr, eNameStr) {
  this.typeStr = typeStr
  this.eNameStr = eNameStr
}
e_NativeGuard.prototype.emsg___printOn_1 = function (out) {
  e_call(out, "write", [this.eNameStr])
}
e_NativeGuard.prototype.emsg_coerce_2 = function (specimen, ejector) {
  if (typeof(specimen) === "object") {
    specimen = specimen.valueOf()
  }
  if (typeof(specimen) === this.typeStr) {
    return specimen
  } else { // XXX miranda coerce
    throw new Error("E coercion error: " + specimen + " a " + specimen.constructor + " is not a " + this.typeStr)
  }
}

function e_ObjectGuard(constr) {
  this.constr = constr
}
e_ObjectGuard.prototype.emsg_coerce_2 = function (specimen, ejector) {
  // Note that JavaScript code can create 'subclasses' of existing constructors, and create instances from existing constructors with arbitrarily modified properties/methods. HOWEVER, Cajita code can do neither, so checking instanceofs is sufficient in a world of Cajita code and relied-upon JavaScript code.
  if (specimen instanceof this.constr) {
    return specimen
  } else { // XXX miranda coerce
    throw new Error("E coercion error: " + specimen + " a " + specimen.constructor + " is not a " + (this.constr.toString().split("\n")[0])) // kluge
  }
}

var e_any_guard = {
  toString: function () { "<e_any_guard>" },
  emsg_coerce_2: function (specimen, ejector) { return specimen },
}

var e_boolean_guard = new e_NativeGuard("boolean", "Boolean")
var e_number_guard  = new e_NativeGuard("number", "Float64")
var e_string_guard  = new e_NativeGuard("string", "String")

// used by compiler
function e_kernel_coerceBoolean(specimen) {
  return e_boolean_guard.emsg_coerce_2(specimen, e_throw)
}

var e_int_guard = e_number_guard // XXX constrain to integers or make Integer wrapper

function e_getObjectGuard(constr) {
  var guard = constr.e_guard
  if (guard === undefined) {
    guard = constr.e_guard = new e_ObjectGuard(constr)
  }
  return guard
}

var e_array_guard  = e_getObjectGuard(Array)

var e_ConstList_guard = {
  toString: function () { "<ConstList>" },
  emsg_coerce_2: function (specimen, ejector) {
    specimen = e_array_guard.emsg_coerce_2(specimen, ejector)
    // XXX kludge -- a later Cajita will have cajita.isFrozen; then we can just write that instead of mentioning ___
    if (!e_cajitaMode || ___.isFrozen(specimen)) {
      return specimen
    } else {
      throw new Error("list is not const: " + specimen)
    }
  },
}

var e_fqnTable = {} // XXX this doesn't actually do the right thing since tables are not keyed by objects in JS
var e_sugarCache = {}
function e_sugarHandler(verb, args) {
  return e_sugarCall(e_fqnTable[this.constructor] + "Sugar", this, verb, args)
}
function e_sugarCall(fqn, self, verb, args) {
  // XXX when import caching works, drop this
  if (e_sugarCache[fqn] === undefined) {
    e_sugarCache[fqn] = e_import(fqn)
  }
  var sugarArgs = args.slice()
  sugarArgs.unshift(self) // XXX better technique?
  return e_call(e_sugarCache[fqn], "instance_" + verb, sugarArgs)
}

function e_slotVarName(noun) {
  return "e_slot_" + noun // XXX match escaping compiler uses
}

// --- library --- 

function e_wrapJsFunction(jsFunction) {
  if (!e_cajitaMode) {
    return {
      emsg: function (verb, args) {
        if (verb === "run") {
          return jsFunction(args)
        } else {
          e_noSuchMethod(this, verb, args) // XXX miranda?
        }
      },
      toString: function () { return jsFunction.toString() + " as E function" },
    }
  } else {
    return ___.func(jsFunction)
  }
}

var e_e = {
  emsg_call_3: e_call,
  emsg_callWithPair_2: function (target, msg) {
    // XXX coerce msg
    return e_call(target, msg[0], msg[1])
  },
  emsg_send_3: function (r, v, a) {
    // XXX return value
    setTimeout(function () { e_call(r, v, a) }, 0)
  },
  emsg_toString_1: function (what) { 
    var tb = e_call(e_import("org.erights.e.elib.oldeio.makeTextWriter"), "makeBufferingPair", [])
    e_call(tb[0], "print", [what])
    return e_call(tb[1], "snapshot", [])
  },
  emsg_toQuote_1: function (what) { 
    var tb = e_call(e_import("org.erights.e.elib.oldeio.makeTextWriter"), "makeBufferingPair", [])
    e_call(tb[0], "quote", [what])
    return e_call(tb[1], "snapshot", [])
  },
  toString: function () { return "<E>" },
}

// constructor for character object wrappers
function e_Character(charString) {
  this.string = charString
}
e_Character.prototype.emsg___printOn_1 = function (out) {
  e_call(out, "write", ["'"])
  // XXX escaping
  e_call(out, "write", [this.string])
  e_call(out, "write", ["'"])
}
e_Character.prototype.toString = function () {
  return "<E character '" + this.string + "'>"
}
// XX character methods

function e_ForwardingRef(target) {
  this.target = target
}

function e_makePromise() {
  var promise = {
    toString: function () { return "<promise>" },
  }
  var resolver = {
    emsg_resolve_1: function (target) {
      promise.target = target
      promise.__proto__ = e_ForwardingRef.prototype
      promise.constructor = e_ForwardingRef
    },
    toString: function () { return "<resolver>" },
  }
  return e_cajita.freeze([promise, resolver])
}

var e_throw = {
  emsg_run_1: function (problem) {
    // XXX should coerce problem
    throw problem
  },
  emsg_eject_2: function (ejector, problem) {
    // XXX should coerce problem?
    e_call(ejector, "run", [problem])
    throw new Error("ejector returned") // XXX more specific error
  },
  toString: function () { return "<E throw>" },
}

var e_equalizer = {
  toString: function () { return "<Equalizer>" },
  
}

function e_makeFinalSlot(value) {
  return {emsg_get_0: function () {return value},
          toString: function () { return "<E final slot "+ value + ">" }, }}
function e_makeVarSlot(value) {
  return {emsg_get_0: function () {return value},
          emsg_put_1: function (v) {value = v},
          toString: function () { return "<E var slot "+ value + ">" },}}

function e_magicLazySlot(thunk) {
  var got = false
  var value
  return {
    emsg_get_0: function () {
      if (got) {
        return value
      } else {
        value = thunk()
        got = true
        return value
      }
    },
    toString: function () { return "<E lazy slot>" },
  }
}

function makeFlexList() {
  return {toString: function () { return "<flexList>" }}
}

// ConstMap constructor
function e_ConstMap(keys, values) {
  // XXX implement this require(keys.length === values.length)
  this.keys = keys
  this.values = values
  this.table = {}
  var l = keys.length
  for (var i = 0; i < l; i++) {
    this.table[keys[i]] = i
  }
}
e_fqnTable[e_ConstMap] = "org.erights.e.elib.tables.constMap"
e_ConstMap.prototype.toString = function () { return "<const" + "Map>" }
e_ConstMap.prototype.emsg_size_0 = function () { return this.keys.length }
e_ConstMap.prototype.emsg_iterate_1 = function (f) {
  var i
  var l = this.keys.length
  for (i = 0; i < l; i++)
    e_call(f, "run", [this.keys[i], this.values[i]])
}
e_ConstMap.prototype.emsg_fetch_2 = function (k, f) {
  var index = this.table[k]
  if (index === undefined) {
    return f()
  } else {
    return this.values[index]
  }
}
e_ConstMap.prototype.emsg = e_sugarHandler

e_makeMap = {
    emsg_fromPairs_1: function (pairs) {
      pairs = e_ConstList_guard.emsg_coerce_2(pairs, e_throw)
      var keys = []
      var values = []
      for (var i = 0; i < pairs.length; i++) {
        var pair = e_ConstList_guard.emsg_coerce_2(pairs[i], e_throw)
        keys.push(pair[0])
        values.push(pair[1])
      }
      return new e_ConstMap(keys, values)
    },
    emsg_fromIteratable_3: function (iteratable, strict, ejector) {
      strict = e_boolean_guard.emsg_coerce_2(strict, e_throw)
      var keys = []
      var values = []
      e_call(iteratable, "iterate", [{ emsg_run_2: function (key, value) {
        // XXX check for duplicates, build table
        keys.push(key)
        values.push(value)
      }}])
      // .slice() to diverge from what can be altered by the iterate callback
      return new e_ConstMap(keys.slice(), values.slice())
    },
    toString: function () { return "<E makeMap>" },
}

Array.prototype.emsg = function (verb, args) {
  return e_sugarCall("org.erights.e.elib.tables.listSugar", this, verb, args)
}
Array.prototype.emsg___printOn_1 = function (out) {
  if (!e_cajitaMode || ___.isFrozen(this)) {
    e_call(this, "printOn", ["[", ", ", "]", out])
  } else {
    e_call(out, "write", ["<JS array>"])
  }
}
Array.prototype.emsg_multiply_1 = function (times) {
  other = e_number_guard.emsg_coerce_2(times, e_throw)
  var res = []
  for (var i = 0; i < times; i++) {
    res = res.concat(this)
  }
  return e_cajita.freeze(res)
}
Array.prototype.emsg_size_0 = function () {
  return this.length
}
Array.prototype.emsg_get_1 = function (index) {
  return this[e_int_guard.emsg_coerce_2(index, e_throw)]
}
Array.prototype.emsg_snapshot_0 = function () {
  return e_cajita.snapshot(this)
}
Array.prototype.emsg_diverge_1 = function (guard) {
  return e_call(e_import("org.erights.e.elib.tables.makeFlexList"), "diverge", [this, guard])
}

Number.prototype.emsg___printOn_1 = e_toStringPrint
Number.prototype.emsg_op__cmp_1 = function (other) {
  other = e_number_guard.emsg_coerce_2(other, e_throw)
  if (this < other) {
    return -1.0
  } else if (this > other) {
    return 1.0
  } else {
    return 0.0
  }
}

Number.prototype.emsg_max_1 = function (other) {
  other = e_number_guard.emsg_coerce_2(other, e_throw)
  return this < other ? other : this.valueOf()
}
Number.prototype.emsg_belowZero_0   = function () { return this <   0 }
Number.prototype.emsg_atMostZero_0  = function () { return this <=  0 }
Number.prototype.emsg_isZero_0      = function () { return this === 0 }
Number.prototype.emsg_atLeastZero_0 = function () { return this >=  0 }
Number.prototype.emsg_aboveZero_0   = function () { return this >   0 }
Number.prototype.emsg_negate_0      = function () { return -this }
Number.prototype.emsg_add_1 = function (other) {
  return this + e_number_guard.emsg_coerce_2(other, e_throw)
}
Number.prototype.emsg_subtract_1 = function (other) {
  return this - e_number_guard.emsg_coerce_2(other, e_throw)
}
Number.prototype.emsg_multiply_1 = function (other) {
  return this * e_number_guard.emsg_coerce_2(other, e_throw)
}
Number.prototype.emsg_approxDivide_1 = function (other) {
  return this / e_number_guard.emsg_coerce_2(other, e_throw)
}
Number.prototype.emsg_floorDivide_1 = function (other) {
  return Math.floor(this / e_number_guard.emsg_coerce_2(other, e_throw))
};

(function () {
  var mathCopy0 = ["abs", "sin", "cos", "tan", "floor", "ceil"] // XXX complete this list
  for (var i = 0; i < mathCopy0.length; i++) {
    (function (mathFn) {
      Number.prototype["emsg_" + mathCopy0[i] + "_0"] = function () {
        return mathFn.call(Math, this)
      }
    })(Math[mathCopy0[i]])
  }
})();

Boolean.prototype.emsg___printOn_1 = e_toStringPrint
Boolean.prototype.emsg_not_0 = function () { return !(this.valueOf()) }
Boolean.prototype.emsg_and_1 = function (other) { 
  return this.valueOf() && e_boolean_guard.emsg_coerce_2(other, e_throw)
}
Boolean.prototype.emsg_or_1 = function (other) { 
  return this.valueOf() || e_boolean_guard.emsg_coerce_2(other, e_throw)
}
Boolean.prototype.emsg_xor_1 = function (other) { 
  return this.valueOf() != e_boolean_guard.emsg_coerce_2(other, e_throw)
}
Boolean.prototype.emsg_pick_2 = function (ifTrue, ifFalse) { 
  return this.valueOf() ? ifTrue : ifFalse
}

String.prototype.emsg___printOn_1 = function (out) {
  e_call(out, "write", ['"'])
  // XXX escaping
  e_call(out, "write", [this])
  e_call(out, "write", ['"'])
}
String.prototype.emsg_add_1 = function (other) {
  return this + e_string_guard.emsg_coerce_2(other, e_throw)
}
String.prototype.emsg_rjoin_1 = function (items) {
  return e_ConstList_guard.emsg_coerce_2(items, e_throw).join(this)
}

var e_slot_throw = e_makeFinalSlot(e_throw)
var e_slot_E = e_makeFinalSlot(e_e)
var e_slot_true = e_makeFinalSlot(true)
var e_slot_false = e_makeFinalSlot(false)
var e_slot_null = e_makeFinalSlot(e_null)
var e_slot_NaN = e_makeFinalSlot(NaN)
var e_slot_Infinity = e_makeFinalSlot(Infinity)
var e_slot_any = e_makeFinalSlot(e_any_guard)
e_safeEnvNames.push("throw")
e_safeEnvNames.push("E")
e_safeEnvNames.push("true")
e_safeEnvNames.push("false")
e_safeEnvNames.push("null")
e_safeEnvNames.push("NaN")
e_safeEnvNames.push("Infinity")
e_safeEnvNames.push("any")
var e_slot___makeList = e_makeFinalSlot({
  emsg: function (verb, args) { 
    if (verb === "run") {
      return e_cajita.freeze(args)
    } else {
      return e_noSuchMethod(this, verb, args)
    }
  },
})
e_safeEnvNames.push("__makeList")
var e_slot___makeMap = e_makeFinalSlot(e_makeMap)
e_safeEnvNames.push("__makeMap")
var e_slot___loop = e_makeFinalSlot({
  emsg_run_1: function (body) {
    while (e_boolean_guard.emsg_coerce_2(e_call(body, "run", []), e_throw));
  },
})
e_safeEnvNames.push("__loop")
var e_slot___makeInt = e_makeFinalSlot({
    emsg_run_1: function (str) {
        // XXX handle errors correctly
        return parseInt(e_string_guard.emsg_coerce_2(str, e_throw)); }})
e_safeEnvNames.push("__makeInt")

function e_import(what) {
  what = e_string_guard.emsg_coerce_2(what, e_throw)
  
  // XXX inadequate escaping
  var compiledFn = window["e_maker_" + what.split("_").join("_u").split(".").join("_$")]
  if (compiledFn === undefined) {
      throw new Error("Import not found: " + what)
  } else {
    return compiledFn()
  }
}

var e_slot_import__uriGetter = e_makeFinalSlot({
  emsg_get_1: e_import,
  toString: function () { return "<import:*>" },
})
e_safeEnvNames.push("import__uriGetter")


e_slot_Ref = e_magicLazySlot(function () {
  return e_call(e_import("org.erights.e.elib.ref.RefAuthor"), "run",
           [e_wrapJsFunction(e_makePromise),
            e_wrapJsFunction(e_refShorten), 
            e_wrapJsFunction(e_refState), e_wrapJsFunction(e_refIsResolved),
            e_wrapJsFunction(e_makeUnconnectedRef),
            e_wrapJsFunction(e_refOptProblem),
            e_wrapJsFunction(e_refOptSealedDispatch),
            "BROKEN", "NEAR", "EVENTUAL", "Bogus DeepFrozenStamp"])
})
e_safeEnvNames.push("Ref")

function e_addImportToSafe(noun, fqn) {
  window[e_slotVarName(noun)] = e_magicLazySlot(function () {
    return e_import(fqn)
  })
  e_safeEnvNames.push(noun)
}

// - All safeEnv members which are imports
e_addImportToSafe("all", "org.erights.e.elib.slot.makeIntersectionGuard")
e_addImportToSafe("Data", "org.erights.e.elib.serial.Data")
e_addImportToSafe("DeepFrozen", "org.erights.e.elib.serial.DeepFrozen")
e_addImportToSafe("EIO", "org.erights.e.elib.eio.EIO")
e_addImportToSafe("elang__uriGetter", "org.erights.e.elang.*")
e_addImportToSafe("elib__uriGetter", "org.erights.e.elib.*")
e_addImportToSafe("epatt__quasiParser", "org.erights.e.elang.syntax.epatt__quasiParser")
e_addImportToSafe("e__quasiParser", "org.erights.e.elang.syntax.e__quasiParser")
e_addImportToSafe("Guard", "org.erights.e.elib.slot.Guard")
e_addImportToSafe("help", "org.erights.e.elang.interp.help")
e_addImportToSafe("Map", "org.erights.e.elib.slot.Map") // XXX inappropriate fqn?
e_addImportToSafe("near", "org.erights.e.elib.slot.near")
e_addImportToSafe("Not", "org.erights.e.elib.slot.makeNegatedGuard")
e_addImportToSafe("notNull", "org.erights.e.elang.interp.notNull") // XXX inappropriate fqn?
e_addImportToSafe("nullOk", "org.erights.e.elib.slot.nullOk")
e_addImportToSafe("opaque__uriGetter", "org.erights.e.elib.serial.opaque__uriGetter")
e_addImportToSafe("PassByCopy", "org.erights.e.elib.serial.PassByCopy")
e_addImportToSafe("promiseAllFulfilled", "org.erights.e.elang.interp.promiseAllFulfilled")
e_addImportToSafe("rcvr", "org.erights.e.elang.interp.rcvr") // XXX inappropriate fqn?
e_addImportToSafe("require", "org.erights.e.elang.interp.require")
e_addImportToSafe("rx__quasiParser", "org.erights.e.elang.interp.makePerlMatchMaker")
e_addImportToSafe("Set", "org.erights.e.elib.tables.Set")
e_addImportToSafe("simple__quasiParser", "org.quasiliteral.text.simple__quasiParser")
e_addImportToSafe("Tuple", "org.erights.e.elib.slot.Tuple")
e_addImportToSafe("void", "org.erights.e.elib.slot.void")
e_addImportToSafe("vow", "org.erights.e.elang.interp.vow") // XXX inappropriate fqn?
e_addImportToSafe("__bind"         , "org.erights.e.elang.expand.__bind")
e_addImportToSafe("__booleanFlow"  , "org.erights.e.elang.expand.booleanFlow") // XXX EoCL's expander only
e_addImportToSafe("__comparer"     , "org.erights.e.elang.expand.comparer")
e_addImportToSafe("__makeOrderedSpace", "org.erights.e.elang.coord.makeOrderedSpace")
e_addImportToSafe("__makeVerbFacet", "org.erights.e.elang.expand.__makeVerbFacet")
e_addImportToSafe("__mapEmpty"     , "org.erights.e.elang.expand.viaEmptyMap")
e_addImportToSafe("__mapExtract"   , "org.erights.e.elang.expand.makeViaExtractor")
e_addImportToSafe("__matchSame"    , "org.erights.e.elang.expand.makeViaSame")
e_addImportToSafe("__quasiMatcher" , "org.erights.e.elang.expand.makeViaQuasi")
e_addImportToSafe("__slotToBinding", "org.erights.e.elang.expand.slotToBinding")
e_addImportToSafe("__splitList"    , "org.erights.e.elang.expand.__splitList")
e_addImportToSafe("__suchThat"     , "org.erights.e.elang.expand.suchThat")
e_addImportToSafe("__switchFailed" , "org.erights.e.elang.expand.__switchFailed")
e_addImportToSafe("__Test"         , "org.erights.e.elang.expand.__Test") // XXX EoJ's expander only


e_slot_List       = e_makeFinalSlot(e_ConstList_guard)
e_slot_int        = e_makeFinalSlot(e_int_guard)
e_slot_float64    = e_makeFinalSlot(e_number_guard)
e_slot_String     = e_makeFinalSlot(e_string_guard)
e_slot_boolean     = e_makeFinalSlot(e_boolean_guard)
e_safeEnvNames.push("List")
e_safeEnvNames.push("int")
e_safeEnvNames.push("float64")
e_safeEnvNames.push("String")
e_safeEnvNames.push("boolean")
e_maker_org_$cubik_$cle_$prim_$float64 = function () { return e_number_guard } // XXX wrong fqn
e_maker_org_$cubik_$cle_$prim_$int = function () { return e_int_guard } // XXX wrong fqn

/**
 * Are x and y not observably distinguishable? Copied 2008-12-31 from
 * http://code.google.com/p/google-caja/issues/detail?id=934
 */
function identical(x, y) {
  if (x === y) {
    // 0 === -0, but they are not identical
    return x !== 0 || 1/x === 1/y;
  } else {
    // NaN !== NaN, but they are identical
    return x !== x && y !== y;
  }
}
e_slot___equalizer = e_magicLazySlot(function () {
  return e_call(
    e_import("org.erights.e.elib.tables.makeEqualizer"),
    "run",
    [e_wrapJsFunction(identical)])
})
e_safeEnvNames.push("__equalizer")

function e_auditedBy(auditor, specimen) {
  return false // XXX stub
}
e_slot___auditedBy = e_makeFinalSlot({
  emsg_run_2: e_auditedBy,
})
e_safeEnvNames.push("__auditedBy")

// traceln is a stub ...
e_slot_traceln = e_makeFinalSlot({
  emsg_run_1: function () {},
})
// ...unless we can hook it up to something.
if (window["console"]) { // supplied by at least Firefox+Firebug and Safari, according to my research
  e_call(e_slot_traceln, "get", []).emsg_run_1 = function (s) {
    console.log(e_call(e_string_guard, "coerce", [s, e_throw]))
  },
}
e_safeEnvNames.push("traceln")

// XXX doesn't support bindings for GBA
function e_Env(table) {
  this.table = table
}
e_Env.prototype.emsg_getSlot_1 = function (noun) {
  if (noun in this.table) {
    return this.table[noun]
  } else {
    // XXX wording for updoc compatibility, probably not the best
    throw new Error("undefined E variable: " + noun)
  }
}
e_Env.prototype.emsg_withSlot_2 = function (insertNoun, slot) {
  var newTable = {}
  for (var n in this.table)
    newTable[n] = this.table[n]
  newTable[insertNoun] = slot
  return new e_Env(newTable)
}

function e_makeSafeEnv() {
  var table = {}
  for (var i = 0; i < e_safeEnvNames.length; i++) {
    table[e_safeEnvNames[i]] = window[e_slotVarName(e_safeEnvNames[i])]
  }
  return new e_Env(table)
}

// --- primitive imports --

// XXX stub, and bad fqn
var e_maker_org_$cubik_$cle_$prim_$Throwable = function () { return {
  toString: function () { return "Throwable" },
} }

function e_FlexList(array, guard) {
  this.array = array
  this.guard = guard
}
e_fqnTable[e_FlexList] = "org.erights.e.elib.tables.flexList"
e_FlexList.prototype.emsg___printOn_1 = function (out) {
  e_call(this, "printOn", ["[", ", ", "].diverge()", out])
}
e_FlexList.prototype.emsg_size_0 = function () { return this.array.length }
e_FlexList.prototype.emsg_get_1 = function (i) { return this.array.emsg_get_1(i) }
e_FlexList.prototype.emsg_snapshot_0 = function () {
  return e_cajita.freeze(this.array.slice()) }
e_FlexList.prototype.emsg_push_1 = function (v) { 
  this.array.push(e_call(this.guard, "coerce", [v, e_throw]))
}
e_FlexList.prototype.emsg = e_sugarHandler

var e_makeFlexList = {
  emsg_diverge_2: function (source, valueGuard) {
    var array = []
    e_call(source, "iterate", [{
      emsg_run_2: function (k, v) {
        array.push(e_call(valueGuard, "coerce", [v, e_throw]))
      },
    }])
    // .slice() to diverge from what can be altered by the iterate callback
    return new e_FlexList(array.slice(), valueGuard)
  },
  toString: function () { return "e_makeFlexList" },
}
var e_maker_org_$erights_$e_$elib_$tables_$makeFlexList = function () { return e_makeFlexList }

var e_makeSameGuard = {
  toString: function () { return "Same" },
}
var e_maker_org_$cubik_$cle_$prim_$Same = function () { return e_makeSameGuard } // XXX inappropriate fqn

var e_jsTools = {
  // convert an E function object into a JavaScript function
  emsg_asFunction_1: function (eFunc) {
    var f = function () {
      return e_call(eFunc, "run", Array.prototype.slice.call(arguments, 0))
    }
    return cajita ? ___.func(f) : f;
  }
}
var e_maker_org_$erights_$eojs_$jsTools = function () { return e_jsTools }

// --- privileged scope library -- XXX shouldn't be named by the global name convention?

var e_slot_alert = e_makeFinalSlot({emsg_run_1: function(v) {alert(v)}})

var e_slot_timer = e_makeFinalSlot({
  emsg_now_0: function () { return new Date().getTime() },
  emsg_whenPast_2: function (time, efunc) {
    time = e_number_guard.emsg_coerce_2(time, e_throw)
    // XXX return result as promise
    var offset = time - (new Date().getTime())
    //alert([time,(new Date().getTime()),offset])
    setTimeout(function () { e_call(efunc, 'run', []) },
               offset)
  },
  toString: function () { return "<timer>" },
})
