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

# silly test of some infrastructure -- throw this out once we can run updoc etc.
stdout.print("3 is a ")
stdout.print(if (Ref.isResolved(3)) { "resolved" } else { "unresolved" })
stdout.print(" ref.")