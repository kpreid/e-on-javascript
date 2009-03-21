// Copyright 2009 Kevin Reid, under the terms of the MIT X license
// found at http://www.opensource.org/licenses/mit-license.html ...............

function updoc_adjustFrames() {
  // XXX review this for portability among the relevant browsers
  var list = document.getElementsByClassName("updoc-pane");
  var i;
  for (i = 0; i < list.length; i++) {
    var element = list[i];
    //console.log(element)
    
    // XXX the 50 is a kludge, I bumped it up until no scroll bars showed
    element.style.height = "" + (element.contentDocument.getElementById("all-container-for-resize-kludge").scrollHeight + 50) + "px";
    
    // XXX this doesn't work because box widths are not shrink-to-fit and I don't want to mess with display:table at the moment
    //element.style.width = "" + (element.contentDocument.getElementById("all-container-for-resize-kludge").scrollWidth + 40) + "px";
  }
}

function updoc_startAdjustingFrames() {
  // XXX we should instead update only on window resize or when the updoc has done a step
  window.setInterval(updoc_adjustFrames, 1000);
}