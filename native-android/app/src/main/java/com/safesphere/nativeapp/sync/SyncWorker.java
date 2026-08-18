package com.safesphere.nativeapp.sync;

import android.content.Context;

import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.safesphere.nativeapp.data.repository.AlertRepository;
import com.safesphere.nativeapp.data.repository.ResourceRepository;
import com.safesphere.nativeapp.data.repository.ShelterRepository;
import com.safesphere.nativeapp.data.repository.UserRepository;
import com.safesphere.nativeapp.util.ConnectivityMonitor;

import java.util.concurrent.TimeUnit;

public class SyncWorker extends Worker {

    public SyncWorker(Context context, WorkerParameters params) {
        super(context, params);
    }

    @Override
    public Result doWork() {
        if (!ConnectivityMonitor.getInstance(getApplicationContext()).isOnline()) {
            return Result.retry();
        }

        try {
            // Sync data from server when online
            // This is a placeholder - actual implementation would call API endpoints
            // and update local Room database
            
            // For demo, we just log that sync ran
            android.util.Log.d("SyncWorker", "Periodic sync executed");
            
            return Result.success();
        } catch (Exception e) {
            android.util.Log.e("SyncWorker", "Sync failed", e);
            return Result.retry();
        }
    }

    public static void schedulePeriodicSync(Context context) {
        PeriodicWorkRequest syncRequest = new PeriodicWorkRequest.Builder(SyncWorker.class, 15, TimeUnit.MINUTES)
                .setInitialDelay(1, TimeUnit.MINUTES)
                .build();
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "periodic_sync",
                androidx.work.ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
        );
    }

    public static void triggerImmediateSync(Context context) {
        WorkManager.getInstance(context).enqueueUniqueWork(
                "immediate_sync",
                androidx.work.ExistingWorkPolicy.REPLACE,
                new androidx.work.OneTimeWorkRequest.Builder(SyncWorker.class).build()
        );
    }
}