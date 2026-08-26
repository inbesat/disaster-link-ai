package com.safesphere.nativeapp.push;

import android.content.Context;
import android.content.SharedPreferences;

import com.google.firebase.messaging.FirebaseMessaging;

/**
 * Manages FCM token registration and forwarding to backend.
 * Call TokenManager.registerToken(context) on app start / login.
 */
public final class TokenManager {

    private static final String PREFS = "fcm_tokens";
    private static final String KEY_TOKEN = "fcm_token";
    private static final String KEY_SENT = "token_sent_to_server";

    private TokenManager() {}

    /** Call on app start / after login to ensure token is registered and sent. */
    public static void registerToken(@androidx.annotation.NonNull Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String cached = prefs.getString(KEY_TOKEN, null);
        boolean sent = prefs.getBoolean(KEY_SENT, false);

        // Always fetch fresh token (handles rotation)
        com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
                .addOnSuccessListener(token -> {
                    saveToken(token, prefs);
                    if (!sent || !token.equals(cached)) {
                        sendTokenToServer(token);
                    }
                })
                .addOnFailureListener(e -> {
                    // Log failure, will retry next start
                });
    }

    private static void saveToken(String token, SharedPreferences prefs) {
        prefs.edit().putString(KEY_TOKEN, token).apply();
    }

    private static void sendTokenToServer(String token) {
        // TODO: POST to your backend /api/fcm/register with { token, user_id, role }
        // Example using Retrofit/OkHttp:
        // apiService.registerFcmToken(token, userId, role).enqueue(...);
    }
}