# Copyright 2008-2009 Kevin Reid, under the terms of the MIT X license
# found at http://www.opensource.org/licenses/mit-license.html ................

def js := <import:org.erights.eojs.jsTools>

def simpleEHandler {
  to increment(value) {
    return E.toString(__makeInt(value) + 1)
  }
}

def domitaEHandler {
  to increment() {
    #alert("got domitaHandler, doc is " + E.toString(docita))
    def e := docita.getElementById("text")
    e["value"] := E.toString(__makeInt(e["value"]) + 1)
  }
  to schedule(t) {
    #var t := timer.now()
    #alert("scheduling after" + E.toString(t))
    timer.whenPast(t + 1000, fn {
      #alert("running")
      domitaEHandler.increment()
      domitaEHandler.schedule(t + 1000)
    })
    #alert("scheduled")
  }
}

def traceelem := docita.getElementById("debug")
def trce(s) { traceelem.appendChild(docita.createTextNode(s)) }

def dragField := docita.getElementById("dragfield")
def dragTargets := [
  docita.getElementById("rec"),
  docita.getElementById("arg0"),
]

def setDraggable(element) {
  var optTarget := null
  
  element["onmousedown"] := js.asFunction(def dragHandler(event) {
    #trce("Mouse down")
    def style := element["style"]  
    var mx := event["clientX"]
    var my := event["clientY"]
    var x := __makeInt(style["left"]) # XXX wrong, relying on buggy behavior of ignoring the 'px'
    var y := __makeInt(style["top"])
  
    dragField["onmousemove"] := js.asFunction(def moveHandler(event) {
      var nx := event["clientX"]
      var ny := event["clientY"]
      x += nx - mx; mx := nx
      y += ny - my; my := ny
      #trce(["drag[", nx - mx, ny - my, "]"])
      
      var snapX := x
      var snapY := y
      
      # kludge to get comparable units
      style["left"] := E.toString(snapX) + "px"
      style["top"]  := E.toString(snapY) + "px"
      def nsx := element.getOffsetLeft()
      def nsy := element.getOffsetTop() 
      
      for t in dragTargets {
        #trce(["Drag target is ", t])
        def tsx := t.getOffsetLeft()
        def tsy := t.getOffsetTop()
        if (((tsx  - nsx).abs() < 10) & ((tsy - nsy).abs() < 10)) {
          snapX := x - nsx + tsx
          snapY := y - nsy + tsy
          break
        }
      }
      
      style["left"] := E.toString(snapX) + "px"
      style["top"]  := E.toString(snapY) + "px"
      return false
    })
  
    dragField["onmouseup"] := js.asFunction(def mouseUpHandler(event) {
      dragField["onmousemove"] := ""
    })
  
    return false
  })
}

setDraggable(docita.getElementById("drag1"))
setDraggable(docita.getElementById("drag2"))

# --- Animation ---

def animElementStyle := docita.getElementById("ball")["style"]
def startAnimation() {
    def t := timer.now() + 50
    timer.whenPast(t, fn {
      animElementStyle["left"] := E.toString(30 * (t / 1000).sin() + 30) + "px"
      animElementStyle["top"] := E.toString(30 * (t / 1432).sin() + 30) + "px"
      startAnimation()
    })
}