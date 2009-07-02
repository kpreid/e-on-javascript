// Copyright 2008-2009 Kevin Reid, under the terms of the MIT X license
// found at http://www.opensource.org/licenses/mit-license.html ...............

// Mapping from prefix to {success: n, failure: n, done: boolean}
var updoc_status = {}

// List of E-functions (taking prefix as arg) to call with notification of changes of status
var updoc_notifyStatus = []

function makePrintFunc(unenv) {
  var printEFunc = {
    emsg_run_1: function (object) {
      var writerAndBuffer = e_call(e_import("org.erights.e.elib.oldeio.makeTextWriter"), "makeBufferingPair", []);
      e_call(e_call(writerAndBuffer[0], "withExits", [unenv]), "quote", [object]);
      return e_call(writerAndBuffer[1], "snapshot", []);
    },
    emsg_withExit_2: function (object, name) {
      return makePrintFunc(e_call(unenv, "with", [object, name]));
    },
  };
  return printEFunc;
}

function updoc_Driver(prefix) {
  var waitHook = "arbitrary resolved value";
  
  // XXX const map should be a CycleBreaker instead
  var printFunc = makePrintFunc(new e_ConstMap([], []));
  
  var interp = {
    emsg_waitAtTop_1: function (ref) { 
      var oldWait = waitHook;
      waitHook = e_slot_Ref.emsg_get_0().emsg_whenResolved_2(ref, e_wrapJsFunction(function () {
        return oldWait;
      }));
      return e_null;
    },
    emsg_getPrintFunc_0: function () { return printFunc; },
    emsg_setPrintFunc_1: function (f) { printFunc = f; return e_null; }
  };
  
  var driver = {
    "augmentEnv": function (env) {
      return e_call(env, "with", ["interp", interp]);
    },
    "run": function () {
      updoc_status[prefix] = {done: false, success: 0, failure: 0};
      setTimeout(function () { driver.chainStep(0) }, 1);
    },
    "chainStep": function (stepIndex) {
      //alert("wait hook is " + waitHook)
      var runFunc = window[prefix + "_runOuter_" + stepIndex];
      if (runFunc !== undefined) {
        runFunc(driver);
        e_slot_Ref.emsg_get_0().emsg_whenResolved_2(waitHook, e_wrapJsFunction(function () {
          driver.chainStep(stepIndex + 1);
        }));
      } else {
        updoc_status[prefix].done = true;
        updoc_doNotifyStatus(prefix);
      }
    },
    "runSyntaxError": function (prefix, errorString, index, expectedAnswers) {
      updoc_finishStep(prefix, index, [["syntax error", errorString]], expectedAnswers)
    },

    "runStep": function (prefix, func, index, expectedAnswers) {
      var stepFrame = document.getElementById(prefix + "-step-" + index)
      stepFrame.className = "updoc-step updoc-running"

      // 3rd element is not compared but is printed, if defined
      var answers = []
      try {
        var result = func()
        if (result !== e_null) {
          answers.push(["value", e_call(printFunc, "run", [result]) + "\n"]);
        }
      } catch (exception) {
        // .stack is defined in Firefox
        answers.push(["problem", e_call(e_e, "toQuote", [exception]), exception.stack]);
      }

      updoc_finishStep(prefix, index, answers, expectedAnswers);
    }
  };
  return driver;
}

function updoc_finishStep(prefix, index, answers, expectedAnswers) {
  var stepFrame = document.getElementById(prefix + "-step-" + index)
  var stepOutput = document.getElementById(prefix + "-output-" + index)
  
  var match = expectedAnswers.length == answers.length
  for (var j = 0; j < answers.length; j++) {
    var a = answers[j]
    stepOutput.appendChild(document.createTextNode('# ' + a[0] + ': ' + a[1]))
    if (a[2] !== undefined) {
      stepOutput.appendChild(document.createTextNode('\n\n' + a[2]))
    }
    
    if (match && (   a[0] != expectedAnswers[j][0]
                  || a[1] != expectedAnswers[j][1])) {
      //document.getElementById("output-" + index).appendChild(document.createTextNode("fail at " + j + "-" + (answers[j][0] != expectedAnswers[j][0]) + "-" + (answers[j][1] != expectedAnswers[j][1])))
      match = false
    }
  }

  stepFrame.className = match ? "updoc-step updoc-matched" : "updoc-step updoc-mismatch"
  
  var statusRecord = updoc_status[prefix];
  
  statusRecord[match ? "success" : "failure"]++;
  updoc_doNotifyStatus(prefix)
}

function updoc_doNotifyStatus(prefix) {
  for (var i = 0; i < updoc_notifyStatus.length; i++) {
    e_call(e_e, "send", [updoc_notifyStatus[i], "run", [prefix]])
  }
}
