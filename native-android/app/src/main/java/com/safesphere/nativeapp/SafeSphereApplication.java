package com.safesphere.nativeapp;

import android.app.Application;

import androidx.lifecycle.ProcessLifecycleOwner;

import com.safesphere.nativeapp.ai.TriageClassifier;
import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.push.TokenManager;
import com.safesphere.nativeapp.sync.SyncWorker;
import com.safesphere.nativeapp.util.ConnectivityMonitor;
import com.safesphere.nativeapp.util.SeedDataLoader;

import org.maplibre.android.MapLibre;

public class SafeSphereApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        // Initialize MapLibre
        MapLibre.getInstance(this);

        // Initialize Room database
        SafeSphereDatabase.getInstance(this);

        // Load TFLite triage model (loads from assets/triage.tflite if present)
        TriageClassifier.getInstance().load(this);

        // Seed demo data on first launch only
        android.content.SharedPreferences bootPrefs = getSharedPreferences("safesphere_boot", MODE_PRIVATE);
        if (!bootPrefs.getBoolean("seeded", false)) {
            new SeedDataLoader(this).loadAllSeedData();
            bootPrefs.edit().putBoolean("seeded", true).apply();
        }

        // Initialize connectivity monitor
        ConnectivityMonitor.getInstance(this).startMonitoring();

        // Register FCM token
        TokenManager.registerToken(this);

        // Schedule periodic sync
        SyncWorker.schedulePeriodicSync(this);

        // Lifecycle observer for app state
        ProcessLifecycleOwner.get().getLifecycle().addObserver(new androidx.lifecycle.DefaultLifecycleObserver() {
            @Override
            public void onStart(androidx.lifecycle.LifecycleOwner owner) {
                // App moved to foreground
                ConnectivityMonitor.getInstance(SafeSphereApplication.this).checkConnectivity();
            }

            @Override
            public void onStop(androidx.lifecycle.LifecycleOwner owner) {
                // App moved to background
            }
        });
    }
}