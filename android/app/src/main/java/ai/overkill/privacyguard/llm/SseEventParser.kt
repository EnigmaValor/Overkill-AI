package ai.overkill.privacyguard.llm

/** Server-sent-event line parser (pure, unit-testable). */
sealed class SseLine {
    object Ignore : SseLine()
    object Done : SseLine()
    data class Data(val json: String) : SseLine()
}

object SseEventParser {
    fun parse(line: String): SseLine {
        val t = line.trim()
        if (t.isEmpty() || t.startsWith(":")) return SseLine.Ignore
        if (!t.startsWith("data:")) return SseLine.Ignore
        val payload = t.removePrefix("data:").trim()
        if (payload.isEmpty()) return SseLine.Ignore
        if (payload == "[DONE]") return SseLine.Done
        return SseLine.Data(payload)
    }
}
