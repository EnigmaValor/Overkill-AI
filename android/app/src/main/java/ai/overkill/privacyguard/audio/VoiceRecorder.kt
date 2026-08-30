package ai.overkill.privacyguard.audio

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import java.io.File

/**
 * Records microphone audio to an AAC/M4A file in the app cache for Groq
 * transcription. Must be used after RECORD_AUDIO is granted (bridge
 * requestPermission). Recording is stopped automatically when the activity
 * pauses so the mic is never left open.
 */
class VoiceRecorder(private val context: Context) {
    private var recorder: MediaRecorder? = null
    private var currentFile: File? = null
    private var lastRecording: File? = null

    @Synchronized
    fun start(): File {
        require(recorder == null) { "recording already active" }
        val dir = File(context.cacheDir, "voice").apply { mkdirs() }
        val file = File(dir, "voice_${System.currentTimeMillis()}.m4a")
        val r = if (Build.VERSION.SDK_INT >= 31) MediaRecorder(context) else @Suppress("DEPRECATION") MediaRecorder()
        r.setAudioSource(MediaRecorder.AudioSource.MIC)
        r.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
        r.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
        r.setAudioSamplingRate(44100)
        r.setAudioEncodingBitRate(96000)
        r.setOutputFile(file.absolutePath)
        r.prepare()
        r.start()
        recorder = r
        currentFile = file
        return file
    }

    @Synchronized
    fun stop(): File? {
        val r = recorder ?: return null
        recorder = null
        val file = currentFile
        currentFile = null
        try {
            r.stop()
        } catch (_: Exception) {
            // Recording was too short to produce a valid file.
            r.release()
            file?.delete()
            return null
        } finally {
            runCatching { r.release() }
        }
        val result = file?.takeIf { it.length() > 0 }
        if (result != null) lastRecording = result
        return result
    }

    /** Most recently completed recording (for transcription). */
    @Synchronized
    fun lastRecording(): File? = lastRecording

    @Synchronized
    fun cancel() {
        val r = recorder
        recorder = null
        val file = currentFile
        currentFile = null
        runCatching { r?.stop() }
        runCatching { r?.release() }
        file?.delete()
    }

    @Synchronized
    fun isRecording(): Boolean = recorder != null
}
