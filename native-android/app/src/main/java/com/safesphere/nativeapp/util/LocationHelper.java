package com.safesphere.nativeapp.util;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.SystemClock;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.CancellationTokenSource;

import java.util.Locale;

/**
 * Thin wrapper over FusedLocationProviderClient. Tries the cached last fix
 * first (fast + battery friendly), falls back to a fresh high-accuracy fix.
 * All results are delivered on the main thread via Google Play Services
 * task callbacks.
 */
public final class LocationHelper {

    private static final long MAX_LAST_FIX_AGE_MS = 60_000; // 1 minute

    public interface Callback {
        void onLocation(double lat, double lng, float accuracyMeters);

        void onUnavailable(@NonNull String reason);
    }

    private LocationHelper() {}

    public static boolean hasPermission(@NonNull Context context) {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
    }

    /** Fragment must have called withPermission() before invoking this. */
    public static void getCurrentLocation(@NonNull Fragment fragment, @NonNull Callback callback) {
        if (!hasPermission(requireContext(fragment))) {
            callback.onUnavailable("permission_denied");
            return;
        }
        try {
            FusedLocationProviderClient client = LocationServices
                    .getFusedLocationProviderClient(fragment.requireActivity());

            client.getLastLocation()
                    .addOnSuccessListener(fragment.requireActivity(), (Location loc) -> {
                        if (isFresh(loc)) {
                            deliver(callback, loc);
                        } else {
                            requestFreshFix(fragment, client, callback);
                        }
                    })
                    .addOnFailureListener(fragment.requireActivity(),
                            e -> requestFreshFix(fragment, client, callback));
        } catch (SecurityException se) {
            callback.onUnavailable("permission_denied");
        } catch (Exception e) {
            callback.onUnavailable(e.getMessage());
        }
    }

    private static void requestFreshFix(@NonNull Fragment fragment,
                                        @NonNull FusedLocationProviderClient client,
                                        @NonNull Callback callback) {
        try {
            client.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY,
                            new CancellationTokenSource().getToken())
                    .addOnSuccessListener(fragment.requireActivity(), (Location loc) -> {
                        if (loc != null) {
                            deliver(callback, loc);
                        } else {
                            callback.onUnavailable("no_gps_fix");
                        }
                    })
                    .addOnFailureListener(fragment.requireActivity(), e -> {
                        String reason = (e instanceof ApiException && e.getMessage() != null)
                                ? e.getMessage() : "gps_error";
                        callback.onUnavailable(reason);
                    });
        } catch (SecurityException se) {
            callback.onUnavailable("permission_denied");
        }
    }

    private static boolean isFresh(@Nullable Location loc) {
        return loc != null
                && (SystemClock.elapsedRealtimeNanos() - loc.getElapsedRealtimeNanos())
                <= MAX_LAST_FIX_AGE_MS * 1_000_000L;
    }

    private static void deliver(Callback callback, Location loc) {
        callback.onLocation(loc.getLatitude(), loc.getLongitude(), loc.getAccuracy());
    }

    private static Context requireContext(Fragment fragment) {
        return fragment.requireContext();
    }

    // ---------------------------------------------------------------- format

    @NonNull
    public static String formatCoord(double lat, double lng) {
        return String.format(Locale.US, "%.5f°, %.5f°", lat, lng);
    }

    /** Great-circle distance in meters (haversine). */
    public static double distanceMeters(double lat1, double lng1, double lat2, double lng2) {
        double r = 6_371_000; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    @NonNull
    public static String formatDistance(double meters) {
        if (meters < 1000) return String.format(Locale.US, "%.0f m away", meters);
        return String.format(Locale.US, "%.1f km away", meters / 1000);
    }
}