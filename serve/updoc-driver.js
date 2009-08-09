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

function updoc_Driver(prefix, runInitFunc) {
  var waitHook;
  var printFunc;
  
  var interp = e_cajita.freeze({
    emsg_waitAtTop_1: function (ref) { 
      var oldWait = waitHook;
      waitHook = e_slot_Ref.emsg_get_0().emsg_whenResolved_2(ref, e_wrapJsFunction(function () {
        return oldWait;
      }));
      return e_null;
    },
    emsg_getPrintFunc_0: function () { return printFunc; },
    emsg_setPrintFunc_1: function (f) { printFunc = f; return e_null; }
  });
  
  var stdoutWB = e_call(e_import("org.erights.e.elib.oldeio.makeTextWriter"), "makeBufferingPair", []);
  var stderrWB = e_call(e_import("org.erights.e.elib.oldeio.makeTextWriter"), "makeBufferingPair", []);
  
  function makePrintOrPrintln(writer, ln) {
    var printfunc = e_cajita.freeze({
      emsg___printOn_1: function (out) {
        e_call(out, "write", ["<print" + (ln ? "ln" : "") + ">"]);
      },
      emsg: function (verb, args) { 
        if (verb === "run") {
          e_call(writer, "printAll", [args]);
          if (ln) e_call(writer, "println", []);
          return e_null;
        } else {
          e_doMiranda(printfunc, verb, args, e_noSuchMethod);
        }
      },
    });
    return printfunc;
  }

  function captureOutput(answers, name, buffer) {
    var text = e_call(buffer, "snapshot", []);
    if (text !== "") {
      answers.push([name, text]);
    }
    e_call(buffer, "_clear", []); // XXX ad hoc invented on the spot
  }
  
  function getRunFuncForStep(index) {
    return window[prefix + "_runOuter_" + index];
  }
  
  function doNotifyStatus() {
    for (var i = 0; i < updoc_notifyStatus.length; i++) {
      e_call(e_e, "send", [updoc_notifyStatus[i], "run", [prefix]])
    }
  }
  
  function finishStep(index, answers, expectedAnswers) {
    if (window["console"]) console.log(prefix + ": updoc step " + index + " \\ finished");
    var stepOutput = document.getElementById(prefix + "-output-" + index);

    var match = expectedAnswers.length == answers.length;
    for (var j = 0; j < answers.length; j++) {
      var a = answers[j];
      var exp = expectedAnswers[j];
      stepOutput.appendChild(document.createTextNode('# ' + a[0] + ': ' + a[1] + '\n\n'));
      if (a[2] !== undefined) {
        stepOutput.appendChild(document.createTextNode(a[2] + '\n\n'));
      }

      if (match && (   a[0] != exp[0]
                    || a[1] != exp[1])) {
        stepOutput.appendChild(document.createTextNode("fail at " + j + "-" + (a[0] != exp[0]) + "-" + (a[1] != exp[1]) + " lenGot=" + a[1].length + "=<<" + a[1] + ">> lenExp=" + exp[1].length + "=<<" + exp[1] + ">>"));
        match = false;
      }
    }

    setStepStatus(index, match ? "updoc-matched" : "updoc-mismatch");

    var statusRecord = updoc_status[prefix];

    statusRecord[match ? "success" : "failure"]++;
    doNotifyStatus();
  }

  // XXX this does *not* include updating the interframe-communication status record
  function setStepStatus(index, statusClass) {
    var stepFrame = document.getElementById(prefix + "-step-" + index);
    var stepProgress = document.getElementById(prefix + "-progress-" + index);

    stepFrame.className = "updoc-step " + statusClass;
    stepProgress.className = "updoc-progress " + statusClass;
  }
  
  var driver = {
    "augmentEnv": function (env) {
      var makeVerbFacet = env.emsg_get_1("__makeVerbFacet");
      env = e_call(env, "with", ["interp", interp]);
      env = e_call(env, "with", ["stdout", stdoutWB[0]]);
      env = e_call(env, "with", ["stderr", stderrWB[0]]);
      env = e_call(env, "with", ["print", makePrintOrPrintln(stdoutWB[0], false)]);
      env = e_call(env, "with", ["println", makePrintOrPrintln(stdoutWB[0], true)]);
      return env;
    },
    "run": function () {
      // reset internal and external updoc state
      runInitFunc();
      waitHook = "arbitrary resolved value";
      printFunc = makePrintFunc(new e_ConstMap([], [])); // XXX const map should be a CycleBreaker instead
      
      // initialize and reset step record
      updoc_status[prefix] = {done: false, success: 0, failure: 0};
      doNotifyStatus();
      
      // start updoc
      setTimeout(function () { driver.chainStep(0) }, 1);
      
      // Reset appearance of all steps
      for (var index = 0; getRunFuncForStep(index) !== undefined; index++) {
        setStepStatus(index, "updoc-pending");

        var stepOutput = document.getElementById(prefix + "-output-" + index);
        var c;
        while (c = stepOutput.firstChild) stepOutput.removeChild(c);
      }
      
    },
    "chainStep": function (stepIndex) {
      var runFunc = getRunFuncForStep(stepIndex);
      if (runFunc !== undefined) {
        var callback = runFunc(driver);
        e_slot_Ref.emsg_get_0().emsg_whenResolved_2(waitHook, e_wrapJsFunction(function () {
          callback();
          driver.chainStep(stepIndex + 1);
        }));
      } else {
        updoc_status[prefix].done = true;
        doNotifyStatus();
      }
    },
    "runSyntaxError": function (prefix, errorString, index, expectedAnswers) {
      finishStep(index, [["syntax error", errorString]], expectedAnswers);
      return function () {};
    },

    "runStep": function (prefix, func, index, expectedAnswers) {
      if (window["console"]) console.log(prefix + ": updoc step " + index + " / started");
      setStepStatus(index, "updoc-running");

      // 3rd element is not compared but is printed, if defined
      var answers = [];
      try {
        var result = func()
        captureOutput(answers, "stdout", stdoutWB[1]);
        captureOutput(answers, "stderr", stderrWB[1]);
        if (result !== e_null) {
          answers.push(["value", e_call(printFunc, "run", [result])]);
        }
      } catch (exception) {
        captureOutput(answers, "stdout", stdoutWB[1]);
        captureOutput(answers, "stderr", stderrWB[1]);
        // .stack is defined in Firefox
        answers.push(["problem", e_call(e_e, "toQuote", [exception]), exception.stack]);
      }
      
      return function () {
        captureOutput(answers, "stdout", stdoutWB[1]);
        captureOutput(answers, "stderr", stderrWB[1]);

        finishStep(index, answers, expectedAnswers);
      };
    }
  };
  return driver;
}

