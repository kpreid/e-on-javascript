// Copyright 2009 Kevin Reid, under the terms of the MIT X license
// found at http://www.opensource.org/licenses/mit-license.html ...............

function updoc_adjustFrames() {
  // XXX review this for portability among the relevant browsers
  var list = document.getElementsByClassName("updoc-pane");
  var i;
  for (i = 0; i < list.length; i++) {
    //updoc_adjustFrame(list[i]);
  }
}

function updoc_adjustFrame(element) {
  // XXX review this for portability among the relevant browsers

  // XXX the 50 is a kludge, I bumped it up until no scroll bars showed in FF and Safari
  element.style.height = "" + (element.contentDocument.getElementById("updoc-content-container-for-resize-kludge").scrollHeight + 50) + "px";
  
  // XXX this doesn't work because box widths are not shrink-to-fit and I don't want to mess with display:table at the moment
  //element.style.width = "" + (element.contentDocument.getElementById("updoc-content-container-for-resize-kludge").scrollWidth + 40) + "px";
}

function updoc_attachNotification(i, frameElement) {
  var notifyList = frameElement.contentWindow.updoc_notifyStatus;
  if (notifyList === undefined) {
    window.setTimeout(function () { updoc_attachNotification(i, frameElement) }, 1000); // XXX use onload instead of polling (but check for race conditions)
  } else {
    notifyList.push({emsg_run_1: function (prefix) {
      var status = frameElement.contentWindow.updoc_status[prefix]; // XXX does not do the right thing if there is more than one prefix
      var statusField = document.getElementById("updoc-index-status-" + i);
      while (statusField.childNodes.length) {
        statusField.removeChild(statusField.firstChild);
      }
      var report;
      if (status.done && status.failure === 0) {
        report = "done";
      } else {
        report = (status.done ? "" : "running; ") + status.success + " succeeded, " + status.failure + " failed";
      }
      statusField.appendChild(document.createTextNode(report));
    
      updoc_adjustFrame(frameElement);
    }})
  }
}

function updoc_setupIndexPage() {
  window.onresize = updoc_adjustFrames

  // XXX review this for portability among the relevant browsers
  var list = document.getElementsByClassName("updoc-pane");
  var i;
  for (i = 0; i < list.length; i++) {
    var element = list[i];
    // XXX don't assume the node-list index is the same as the updoc pane id
    updoc_attachNotification(i, element);
  }
}

