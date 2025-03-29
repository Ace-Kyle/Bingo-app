package com.acekyle.bingo;

import android.content.Context;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import android.webkit.JavascriptInterface;

import java.util.Locale;

public class WebAppInterface {
    private static final String TAG = "WebAppInterface";

    private final Context context;
    private final FileHelper fileHelper;
    private TextToSpeech textToSpeech;
    private boolean ttsInitialized = false;

    public WebAppInterface(Context context) {
        this.context = context;
        this.fileHelper = new FileHelper(context);

        // Initialize Text-to-Speech
        textToSpeech = new TextToSpeech(context, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int result = textToSpeech.setLanguage(Locale.ITALIAN);
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.e(TAG, "Italian language not supported, using default");
                    textToSpeech.setLanguage(Locale.getDefault());
                }
                ttsInitialized = true;
            } else {
                Log.e(TAG, "Failed to initialize TextToSpeech");
            }
        });
    }

    @JavascriptInterface
    public String getNumberData() {
        return fileHelper.getNumberData();
    }

    @JavascriptInterface
    public void ConvertTextToSpeech(String text) {
        if (ttsInitialized) {
            textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "bingo_tts_id");
        } else {
            Log.e(TAG, "TextToSpeech not initialized");
        }
    }

    public void cleanup() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
    }
}