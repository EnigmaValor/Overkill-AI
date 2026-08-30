package ai.overkill.privacyguard.llm

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SseEventParserTest {

    @Test
    fun `parses data line`() {
        val line = SseEventParser.parse("data: {\"ok\":true}")
        assertTrue(line is SseLine.Data)
        assertEquals("{\"ok\":true}", (line as SseLine.Data).json)
    }

    @Test
    fun `handles leading and trailing whitespace`() {
        val line = SseEventParser.parse("  data:  {\"x\":1}  ")
        assertTrue(line is SseLine.Data)
        assertEquals("{\"x\":1}", (line as SseLine.Data).json)
    }

    @Test
    fun `detects DONE sentinel`() {
        assertEquals(SseLine.Done, SseEventParser.parse("data: [DONE]"))
    }

    @Test
    fun `ignores comments blank and non-data lines`() {
        assertEquals(SseLine.Ignore, SseEventParser.parse(": keep-alive"))
        assertEquals(SseLine.Ignore, SseEventParser.parse(""))
        assertEquals(SseLine.Ignore, SseEventParser.parse("event: message"))
        assertEquals(SseLine.Ignore, SseEventParser.parse("data:"))
    }
}
