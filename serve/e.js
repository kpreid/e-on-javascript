// Copyright 2008 Kevin Reid, under the terms of the MIT X license
// found at http://www.opensource.org/licenses/mit-license.html ...............
function e_js_write(text) {
  document.getElementById("output").appendChild(document.createTextNode(text))
}
function e_js_writebreak() {
  document.getElementById("output").appendChild(document.createElement('br'))
}

// --- core ---
function e_noSuchMethod(r, v, a) {
  var ty = typeof(r)
  if (ty === "object") {
    ty = r.constructor.toString().split("\n")[0]
  }
  throw("no such method error: " + ty + " " + r + "." + v + "(" + a + ")")
}

// called whenever an E-called object doesn't have an appropriately named JS method
function e_NoJsMethod(r, verb, args) {
  if (r.emsg !== undefined) { // will throw if r is undefined or null, this is fine as they are considered broken refs
    // If r has an emsg method, 
    return r.emsg(verb, args)
  } else {
    if (cajita === undefined) {
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

function e_NativeGuard(typeStr) {
  this.typeStr = typeStr
}
e_NativeGuard.prototype.emsg_coerce_2 = function (specimen, ejector) {
  if (typeof(specimen) === "object") {
    specimen = specimen.valueOf()
  }
  if (typeof(specimen) === this.typeStr) {
    return specimen
  } else { // XXX miranda coerce
    throw("E coercion error: " + specimen + " a " + specimen.constructor + " is not a " + this.typeStr)
  }
}

function e_ObjectGuard(constr) {
  this.constr = constr
}
e_ObjectGuard.prototype.emsg_coerce_2 = function (specimen, ejector) {
  if (specimen instanceof this.constr) {
    return specimen
  } else { // XXX miranda coerce
    throw("E coercion error: " + specimen + " a " + specimen.constructor + " is not a " + (this.constr.toString().split("\n")[0])) // kluge
  }
}

var e_boolean_guard = new e_NativeGuard("boolean")
var e_number_guard  = new e_NativeGuard("number")
var e_string_guard  = new e_NativeGuard("string")

function e_getObjectGuard(constr) {
  var guard = constr.e_guard
  if (guard === undefined) {
    guard = constr.e_guard = new e_ObjectGuard(constr)
  }
  return guard
}

// Note that JavaScript code can create 'subclasses' of existing constructors, and create instances from existing constructors with arbitrarily modified properties/methods. HOWEVER, Cajita code can do neither, so checking instanceofs is sufficient in a world of Cajita code and relied-upon JavaScript code.
var e_array_guard  = e_getObjectGuard(Array)

var e_fqnTable = {}
var e_sugarCache = {}
function e_sugarHandler(verb, args) {
  var c = this.constructor
  if (e_sugarCache[c] === undefined) {
    e_sugarCache[c] = e_slot_import__uriGetter.emsg_get_0().emsg_get_1(e_fqnTable[c] + "Sugar")
  }
  var sugarArgs = args.slice()
  sugarArgs.unshift(this) // XXX better technique?
  return e_call(e_sugarCache[c], "instance_" + verb, sugarArgs)
}

// --- library --- 

function e_wrapJsFunction(jsFunction) {
  if (cajita === undefined) {
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
  emsg_toString_1: function (what) { return "" + what }, // XXX hook into real printing
  toString: function () { return "<E>" },
}

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
  return [promise, resolver]
}

var e_throw = {
  toString: function () { return "<E throw>" },
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
  return {toString: function () { return "makeFlexList" }}
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
      pairs = e_array_guard.emsg_coerce_2(pairs, e_throw)
      var keys = []
      var values = []
      for (var i = 0; i < pairs.length; i++) {
        var pair = e_array_guard.emsg_coerce_2(pairs[i], e_throw)
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
      return new e_ConstMap(keys, values)
      
    },
    toString: function () { return "<E makeMap>" },
}

Array.prototype.emsg_diverge_0 = function () {
  makeFlexList()
}
Array.prototype.emsg_iterate_1 = function (assocFunc) {
  var l = this.length
  //alert("got to iterate" + l + " for " + this)
  for (var i = 0; i < l; i++) {
    e_call(assocFunc, "run", [i, this[i]])
  }
}

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
}

Boolean.prototype.emsg_not_0 = function () { return !this }

String.prototype.emsg_add_1 = function (other) {
  return this + e_string_guard.emsg_coerce_2(other, e_throw)
}

var e_slot_throw = e_makeFinalSlot(e_throw)
var e_slot_E = e_makeFinalSlot(e_e)
var e_slot_true = e_makeFinalSlot(true)
var e_slot_false = e_makeFinalSlot(false)
var e_slot_null = e_makeFinalSlot(e_null)
var e_slot___makeList = e_makeFinalSlot({
  emsg: function(verb,args) { if (verb === "run") {return args} else {e_noSuchMethod(this, verb, args)}}})
var e_slot___makeMap = e_makeFinalSlot(e_makeMap)
var e_slot___loop = e_makeFinalSlot({
    emsg_run_1: function (body) {
        // XXX should coerce to boolean
        while (e_call(body, "run", [])); }})
var e_slot___makeInt = e_makeFinalSlot({
    emsg_run_1: function (str) {
        return parseInt(e_string_guard.emsg_coerce_2(str, e_throw)); }})

var e_slot_import__uriGetter = e_makeFinalSlot({
  emsg_get_1: function (what) {
    // XXX inadequate escaping
    var compiledFn = window["e_maker_" + what.split("_").join("_u").split(".").join("_$")]
    if (compiledFn === undefined) {
      throw ("Import not found: " + what)
    } else {
      return compiledFn()
    }
  },
  toString: function () { return "<import:*>" },
})

e_slot_Ref = e_magicLazySlot(function () {
  return e_call(e_maker_org_$erights_$e_$elib_$ref_$RefAuthor(), "run",
           [e_wrapJsFunction(e_makePromise),
            e_wrapJsFunction(e_refShorten), 
            e_wrapJsFunction(e_refState), e_wrapJsFunction(e_refIsResolved),
            e_wrapJsFunction(e_makeUnconnectedRef),
            e_wrapJsFunction(e_refOptProblem),
            e_wrapJsFunction(e_refOptSealedDispatch),
            "BROKEN", "NEAR", "EVENTUAL", "Bogus DeepFrozenStamp"])
})

e_slot___bind     = e_magicLazySlot(function () { return e_maker_org_$erights_$e_$elang_$expand_$_u_ubind() })
e_slot___comparer = e_magicLazySlot(function () { return e_maker_org_$erights_$e_$elang_$expand_$comparer() })
e_slot_require    = e_magicLazySlot(function () { return e_maker_org_$erights_$e_$elang_$interp_$require () })

// --- primitive imports --

// XXX stub, and bad fqn
e_maker_org_$cubik_$cle_$prim_$Throwable = function () { return {
  toString: function () { return "Throwable" },
} }

// --- privileged scope library -- XXX shouldn't be visible to all code

var e_slot_alert = e_makeFinalSlot({emsg_run_1: function(v) {alert(v)}})
var e_slot_document = e_makeFinalSlot({emsg_write_1: function(v) {document.write(v)}})

e_document_writer = {
    emsg_print_1: function (object) {
        e_js_write(object.toString())
    },
    emsg_println_1: function (object) {
        e_js_write(object.toString())
        e_js_writebreak()
    },
    emsg_println_0: function () {
        e_js_writebreak()
    },
    emsg: function(verb,args) {
      if (verb === "print") {
        var i
        for (i = 0; i < args.length; i++) e_document_writer.emsg_print_1(args[i]);
      } else {
        e_noSuchMethod(this, verb, args)
      }
    },
    toString: function () { return "<stdout>" },
}
var e_slot_stdout = e_makeFinalSlot(e_document_writer)

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
