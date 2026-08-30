package ai.overkill.privacyguard.bridge

import org.json.JSONObject

/** Host implemented by MainActivity: delivers bridge events to the WebView. */
interface BridgeHost {
    fun deliverToWeb(json: String)
    fun requestPermission(kind: String, requestId: String)
    fun exportFile(requestId: String, fileName: String, mime: String, contentB64: String)
}

/**
 * Event channel from Kotlin to JS. Events are JSON strings delivered to
 * window.__privacyBridgeEvent; ids match the JS request ids.
 */
class BridgeEventBus(private val host: BridgeHost) {

    fun result(id: String, value: JSONObject) {
        event(id, "result", JSONObject().put("value", value))
    }

    fun resultPlain(id: String, value: Any?) {
        event(id, "result", JSONObject().put("value", value ?: JSONObject.NULL))
    }

    fun resultError(id: String, kind: String, message: String) {
        event(id, "result", JSONObject().put("error", JSONObject().put("kind", kind).put("message", message)))
    }

    fun event(id: String, type: String, payload: JSONObject? = null) {
        val root = JSONObject()
        root.put("id", id)
        root.put("type", type)
        payload?.let { p ->
            for (key in p.keys()) {
                root.put(key, p.get(key))
            }
        }
        host.deliverToWeb(root.toString())
    }
}
