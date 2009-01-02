// Copyright 2008-2009 Kevin Reid, under the terms of the MIT X license
// found at http://www.opensource.org/licenses/mit-license.html ...............

function updoc_runSyntaxError(prefix, errorString, index, expectedAnswers) {
  updoc_finishStep(prefix, index, [["syntax error", errorString]], expectedAnswers)
}

function updoc_runStep(prefix, func, index, expectedAnswers) {
  var stepFrame = document.getElementById(prefix + "-step-" + index)
  stepFrame.className = "updoc-step updoc-running"
  
  // 3rd element is not compared but is printed, if defined
  var answers = []
  try {
    var result = func()
    if (result !== e_null) {
      answers.push(["value", e_call(e_e, "toQuote", [result]) + "\n"])
    }
  } catch (exception) {
    // .stack is defined in Firefox
    answers.push(["problem", "" + exception, exception.stack])
  }
  
  updoc_finishStep(prefix, index, answers, expectedAnswers)
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
  
}