package com.safesphere.nativeapp.ui.map;

import android.content.Context;
import android.util.Log;

import org.maplibre.android.offline.OfflineManager;
import org.maplibre.android.offline.OfflineRegion;
import org.maplibre.android.offline.OfflineRegionError;
import org.maplibre.android.offline.OfflineRegionStatus;
import org.maplibre.android.offline.OfflineTilePyramidRegionDefinition;

import java.io.File;
import java.io.IOException;

/**
 * Downloads and tracks the offline tile pack covering the demo operations
 * area (Patna). Supports pause/resume, progress in bytes, and auto-resume
 * when the app returns to foreground.
 */
public class OfflineMapManager {

    private static final String TAG = "OfflineMapManager";
    private static final String REGION_NAME = "patna_demo";
    private static final String STATE_FILE = "offline_pack_state";

    public interface Callbacks {
        void onProgress(int percent, long bytesDownloaded, long totalBytes);
        void onComplete(boolean success, String message);
        void onPaused();
    }

    private OfflineMapManager() {}

    private static volatile OfflineMapManager INSTANCE;
    public static synchronized OfflineMapManager getInstance() {
        if (INSTANCE == null) INSTANCE = new OfflineMapManager();
        return INSTANCE;
    }

    private OfflineRegion activeRegion;
    private Callbacks callbacks;
    private Context lastContext;
    private volatile boolean isPaused = false;
    private volatile boolean isDownloading = false;

    /** Checks for an existing pack, resumes or starts the download. */
    public synchronized void downloadRegion(Context context, Callbacks cb) {
        this.callbacks = cb;
        this.lastContext = context.getApplicationContext();
        isPaused = false;
        isDownloading = true;

        OfflineManager om = OfflineManager.getInstance(context);
        om.listOfflineRegions(new OfflineManager.ListOfflineRegionsCallback() {
            @Override
            public void onList(OfflineRegion[] regions) {
                for (OfflineRegion region : regions) {
                    String meta = new String(region.getMetadata());
                    if (meta.contains(REGION_NAME)) {
                        activeRegion = region;
                        resumeOrReport(region);
                        return;
                    }
                }
                createNewRegion(om);
            }

            @Override
            public void onError(String error) {
                Log.e(TAG, "listOfflineRegions failed: " + error);
                createNewRegion(om);
            }
        });
    }

    public synchronized void pauseDownload() {
        if (activeRegion != null && !isPaused) {
            activeRegion.setDownloadState(OfflineRegion.STATE_INACTIVE);
            isPaused = true;
            if (callbacks != null) callbacks.onPaused();
        }
    }

    public synchronized void resumeDownload(Context context) {
        if (activeRegion != null && isPaused) {
            isPaused = false;
            isDownloading = true;
            lastContext = context.getApplicationContext();
            activeRegion.setObserver(new OfflineRegion.OfflineRegionObserver() {
                @Override
                public void onStatusChanged(OfflineRegionStatus status) {
                    if (status.isRequiredResourceCountPrecise() && status.isComplete()) {
                        activeRegion.setDownloadState(OfflineRegion.STATE_INACTIVE);
                        notifyComplete(true, "Downloaded " + mb(status.getCompletedResourceSize()));
                    } else {
long required = Math.max(1, status.getRequiredResourceCount());
                    int percent = (int) ((status.getCompletedResourceCount() * 100) / required);
                    long bytes = status.getCompletedResourceSize();
                    long total = status.getRequiredResourceCount();
                        if (callbacks != null) callbacks.onProgress(Math.min(percent, 99), bytes, total);
                    }
                }
                @Override public void onError(OfflineRegionError error) {
                    Log.w(TAG, "Offline pack error: " + error.getMessage());
                }
                @Override public void mapboxTileCountLimitExceeded(long limit) {
                    Log.e(TAG, "Tile count limit exceeded: " + limit);
                    notifyComplete(false, "Region too large, tile limit reached");
                }
            });
            activeRegion.setDownloadState(OfflineRegion.STATE_ACTIVE);
        }
    }

    public boolean isDownloading() { return isDownloading; }
    public boolean isPaused() { return isPaused; }

    private void resumeOrReport(OfflineRegion region) {
        region.getStatus(new OfflineRegion.OfflineRegionStatusCallback() {
            @Override
            public void onStatus(OfflineRegionStatus status) {
                if (status.isComplete()) {
                    notifyComplete(true, "Offline pack already downloaded ("
                            + mb(status.getCompletedResourceSize()) + ")");
                } else {
                    attachObserver(region);
                    if (!isPaused) region.setDownloadState(OfflineRegion.STATE_ACTIVE);
                }
            }
            @Override public void onError(String error) {
                attachObserver(activeRegion);
                if (!isPaused) activeRegion.setDownloadState(OfflineRegion.STATE_ACTIVE);
            }
        });
    }

    private void createNewRegion(OfflineManager om) {
        OfflineTilePyramidRegionDefinition definition =
                new OfflineTilePyramidRegionDefinition(
                        SafeSphereMapHelper.STYLE_URL,
                        SafeSphereMapHelper.demoBounds(),
                        9.0, 14.0, 1.0f);
        byte[] metadata = ("{\"name\":\"" + REGION_NAME + "\"}").getBytes();

        om.createOfflineRegion(definition, metadata,
                new OfflineManager.CreateOfflineRegionCallback() {
                    @Override
                    public void onCreate(OfflineRegion region) {
                        activeRegion = region;
                        attachObserver(region);
                        region.setDownloadState(OfflineRegion.STATE_ACTIVE);
                    }
                    @Override public void onError(String error) {
                        Log.e(TAG, "createOfflineRegion failed: " + error);
                        notifyComplete(false, error);
                    }
                });
    }

    private void attachObserver(OfflineRegion region) {
        if (region == null) return;
        region.setObserver(new OfflineRegion.OfflineRegionObserver() {
            @Override
            public void onStatusChanged(OfflineRegionStatus status) {
                if (status.isRequiredResourceCountPrecise() && status.isComplete()) {
                    region.setDownloadState(OfflineRegion.STATE_INACTIVE);
                    isDownloading = false;
                    notifyComplete(true, "Downloaded " + mb(status.getCompletedResourceSize()));
                } else {
                    long required = Math.max(1, status.getRequiredResourceCount());
                    int percent = (int) ((status.getCompletedResourceCount() * 100) / required);
                    long bytes = status.getCompletedResourceSize();
                    long total = status.getRequiredResourceCount();
                    if (callbacks != null) callbacks.onProgress(Math.min(percent, 99), bytes, total);
                }
            }
            @Override public void onError(OfflineRegionError error) {
                Log.w(TAG, "Offline pack error: " + error.getMessage());
            }
            @Override public void mapboxTileCountLimitExceeded(long limit) {
                Log.e(TAG, "Tile count limit exceeded: " + limit);
                notifyComplete(false, "Region too large, tile limit reached");
            }
        });
    }

    public void onForeground(Context context) {
        if (isPaused && activeRegion != null) {
            Log.i(TAG, "App foregrounded — resuming paused download");
            resumeDownload(context.getApplicationContext());
        }
    }

    public void onBackground() {
        // keep downloading in background; no-op
    }

    public synchronized void cancelDownload() {
        if (activeRegion != null) {
            activeRegion.setDownloadState(OfflineRegion.STATE_INACTIVE);
            activeRegion = null;
        }
        isDownloading = false;
        isPaused = false;
    }

    private void notifyComplete(boolean success, String message) {
        isDownloading = false;
        isPaused = false;
        if (callbacks != null) {
            callbacks.onComplete(success, message);
            callbacks = null;
        }
    }

    private static String mb(long bytes) {
        return (bytes / (1024 * 1024)) + " MB";
    }
}