package com.safesphere.nativeapp.util;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.util.Log;

public class ConnectivityMonitor {
    private static final String TAG = "ConnectivityMonitor";
    private static volatile ConnectivityMonitor instance;

    private final ConnectivityManager connectivityManager;
    private final ConnectivityManager.NetworkCallback networkCallback;
    private boolean isOnline = true;
    private OnConnectivityChangeListener listener;

    public interface OnConnectivityChangeListener {
        void onConnectivityChanged(boolean isOnline);
    }

    private ConnectivityMonitor(Context context) {
        connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                setOnline(true);
            }

            @Override
            public void onLost(Network network) {
                setOnline(false);
            }

            @Override
            public void onCapabilitiesChanged(Network network, NetworkCapabilities networkCapabilities) {
                boolean hasInternet = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
                setOnline(hasInternet);
            }
        };
    }

    public static ConnectivityMonitor getInstance(Context context) {
        if (instance == null) {
            synchronized (ConnectivityMonitor.class) {
                if (instance == null) {
                    instance = new ConnectivityMonitor(context.getApplicationContext());
                }
            }
        }
        return instance;
    }

    public void startMonitoring() {
        NetworkRequest request = new NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build();
        connectivityManager.registerNetworkCallback(request, networkCallback);
        checkConnectivity();
    }

    public void stopMonitoring() {
        try {
            connectivityManager.unregisterNetworkCallback(networkCallback);
        } catch (IllegalArgumentException e) {
            // Already unregistered
        }
    }

    public void checkConnectivity() {
        Network activeNetwork = connectivityManager.getActiveNetwork();
        if (activeNetwork == null) {
            setOnline(false);
            return;
        }
        NetworkCapabilities caps = connectivityManager.getNetworkCapabilities(activeNetwork);
        boolean hasInternet = caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        setOnline(hasInternet);
    }

    public boolean isOnline() {
        return isOnline;
    }

    public void setListener(OnConnectivityChangeListener listener) {
        this.listener = listener;
    }

    private void setOnline(boolean online) {
        if (isOnline != online) {
            isOnline = online;
            Log.d(TAG, "Connectivity changed: " + (online ? "ONLINE" : "OFFLINE"));
            if (listener != null) {
                listener.onConnectivityChanged(online);
            }
        }
    }
}