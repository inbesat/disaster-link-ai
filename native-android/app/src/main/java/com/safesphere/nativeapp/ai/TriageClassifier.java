package com.safesphere.nativeapp.ai;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.util.HashMap;
import java.util.Map;

/**
 * On-device TFLite triage classifier for incident reports.
 *
 * Model contract (placeholder — replace with real model):
 *   Input:  float[1, MAX_SEQ]  (token IDs, padded)
 *   Output: float[1, 4]        (logits for: low, medium, high, critical)
 *
 * This wrapper handles model loading, tokenization (simple vocab hash),
 * and inference. Drop a real `triage.tflite` into assets/ to enable.
 */
public final class TriageClassifier {

    private static final int MAX_SEQ = 64;
    private static final int VOCAB_SIZE = 10000;
    private static final String MODEL_NAME = "triage.tflite";

    private static final String[] LABELS = {"low", "medium", "high", "critical"};

    private Interpreter interpreter;
    private final Map<String, Integer> vocab = new HashMap<>();

    private TriageClassifier() {}

    private static volatile TriageClassifier INSTANCE;
    public static synchronized TriageClassifier getInstance() {
        if (INSTANCE == null) INSTANCE = new TriageClassifier();
        return INSTANCE;
    }

    /** Loads the model from assets. Returns true if successful. */
    public boolean load(@NonNull Context context) {
        if (interpreter != null) return true;
        try (FileInputStream fis = (FileInputStream) context.getAssets().open(MODEL_NAME);
             FileChannel fc = fis.getChannel()) {
            ByteBuffer bb = fc.map(FileChannel.MapMode.READ_ONLY, 0, fc.size());
            interpreter = new Interpreter(bb);
            // Warm-up with dummy input
            float[][] dummy = new float[1][MAX_SEQ];
            float[][] out = new float[1][LABELS.length];
            interpreter.run(dummy, out);
            return true;
        } catch (IOException | IllegalArgumentException e) {
            interpreter = null;
            return false;
        }
    }

    /** True if a model is loaded and ready. */
    public boolean isReady() { return interpreter != null; }

    /**
     * Scores a report. If model not loaded, returns heuristic score.
     * @param text  raw report text
     * @param type  report type (flood, fire, medical, etc.)
     * @return Result with severity label, score 0-100, and confidence
     */
    @NonNull
    public Result score(@Nullable String text, @Nullable String type) {
        String combined = (type == null ? "" : type + " ") + (text == null ? "" : text);
        int heuristic = heuristicSeverity(combined);

        if (interpreter == null) {
            return new Result(
                    LABELS[heuristicToLabel(heuristic)],
                    heuristic,
                    0.6f,
                    false
            );
        }

        // Prepare input: simple hash-based tokenization
        float[][] input = new float[1][MAX_SEQ];
        String[] tokens = combined.toLowerCase(java.util.Locale.US).split("\\W+");
        for (int i = 0; i < Math.min(tokens.length, MAX_SEQ); i++) {
            input[0][i] = vocabHash(tokens[i]);
        }

        float[][] output = new float[1][LABELS.length];
        interpreter.run(input, output);

        int idx = argmax(output[0]);
        float confidence = softmax(output[0])[idx];
        int severity = Math.round((idx / 3.0f) * 100f);

        return new Result(LABELS[idx], severity, confidence, true);
    }

    private int argmax(float[] arr) {
        int best = 0;
        for (int i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
        return best;
    }

    private float[] softmax(float[] logits) {
        float max = logits[0];
        for (float v : logits) if (v > max) max = v;
        float sum = 0;
        float[] out = new float[logits.length];
        for (int i = 0; i < logits.length; i++) {
            out[i] = (float) Math.exp(logits[i] - max);
            sum += out[i];
        }
        for (int i = 0; i < out.length; i++) out[i] /= sum;
        return out;
    }

    private float vocabHash(String token) {
        return vocab.computeIfAbsent(token, k -> Math.abs(k.hashCode()) % VOCAB_SIZE) / (float) VOCAB_SIZE;
    }

    private int heuristicSeverity(String text) {
        String t = text.toLowerCase(java.util.Locale.US);
        if (t.contains("trapped") || t.contains("dying") || t.contains("collapsing") ||
                t.contains("unconscious") || t.contains("on fire") || t.contains("explosion"))
            return 100;
        if (t.contains("flood") && (t.contains("rising") || t.contains("flash")))
            return 85;
        if (t.contains("landslide") || t.contains("landslide"))
            return 80;
        if (t.contains("fire") || t.contains("smoke") || t.contains("gas leak"))
            return 75;
        if (t.contains("medical") || t.contains("injured") || t.contains("wounded") ||
                t.contains("bleeding") || t.contains("chest pain"))
            return 70;
        if (t.contains("flood") || t.contains("cyclone") || t.contains("storm"))
            return 60;
        if (t.contains("earthquake") || t.contains("landslide") || t.contains("building"))
            return 55;
        if (t.contains("road") && (t.contains("blocked") || t.contains("closed")))
            return 40;
        if (t.contains("power") || t.contains("water supply"))
            return 30;
        return 20;
    }

    private int heuristicToLabel(int score) {
        if (score >= 75) return 3;
        if (score >= 50) return 2;
        if (score >= 30) return 1;
        return 0;
    }

    public static class Result {
        public final String label;
        public final int severity;        // 0-100
        public final float confidence;    // 0-1
        public final boolean modelUsed;
        Result(String l, int s, float c, boolean m) { label = l; severity = s; confidence = c; modelUsed = m; }
    }
}