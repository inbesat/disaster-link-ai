package com.safesphere.nativeapp.ui.settings;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.navigation.Navigation;

import com.google.android.material.switchmaterial.SwitchMaterial;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.base.BaseFragment;
import com.safesphere.nativeapp.ui.map.OfflineMapManager;
import com.safesphere.nativeapp.util.RoleManager;

public class SettingsFragment extends BaseFragment {

    @Override protected int getLayoutRes() { return R.layout.fragment_settings; }

    @Override protected void initViews(View view) {
        SharedPreferences prefs = requireContext().getSharedPreferences("safesphere_settings", Context.MODE_PRIVATE);

        SwitchMaterial darkMode = view.findViewById(R.id.darkModeSwitch);
        SwitchMaterial push = view.findViewById(R.id.pushSwitch);
        SwitchMaterial critical = view.findViewById(R.id.criticalSwitch);
        SwitchMaterial sms = view.findViewById(R.id.smsSwitch);
        SwitchMaterial offlineMaps = view.findViewById(R.id.offlineMapsSwitch);
        SwitchMaterial dataSaver = view.findViewById(R.id.dataSaverSwitch);

        darkMode.setChecked(prefs.getBoolean("dark_mode", false));
        push.setChecked(prefs.getBoolean("push_enabled", true));
        critical.setChecked(prefs.getBoolean("critical_alerts", true));
        sms.setChecked(prefs.getBoolean("sms_fallback", true));
        offlineMaps.setChecked(prefs.getBoolean("offline_maps", true));
        dataSaver.setChecked(prefs.getBoolean("data_saver", false));

        darkMode.setOnCheckedChangeListener((b, checked) -> prefs.edit().putBoolean("dark_mode", checked).apply());
        push.setOnCheckedChangeListener((b, checked) -> prefs.edit().putBoolean("push_enabled", checked).apply());
        critical.setOnCheckedChangeListener((b, checked) -> prefs.edit().putBoolean("critical_alerts", checked).apply());
        sms.setOnCheckedChangeListener((b, checked) -> prefs.edit().putBoolean("sms_fallback", checked).apply());
        offlineMaps.setOnCheckedChangeListener((b, checked) -> prefs.edit().putBoolean("offline_maps", checked).apply());
        dataSaver.setOnCheckedChangeListener((b, checked) -> prefs.edit().putBoolean("data_saver", checked).apply());

        setupOfflinePackDownload(view);

        Button logoutBtn = view.findViewById(R.id.logoutBtn);
        logoutBtn.setOnClickListener(v -> {
            prefs.edit().clear().apply();
            new RoleManager(requireContext()).clear();
            Toast.makeText(requireContext(), "Logged out", Toast.LENGTH_SHORT).show();
            Navigation.findNavController(view).navigate(R.id.loginFragment);
        });
    }

    private void setupOfflinePackDownload(View view) {
        Button downloadBtn = view.findViewById(R.id.downloadOfflineBtn);
        TextView statusText = view.findViewById(R.id.offlinePackStatus);
        androidx.appcompat.widget.LinearLayoutCompat progressContainer = view.findViewById(R.id.offlineProgressContainer);
        TextView progressText = view.findViewById(R.id.offlineProgressText);
        ProgressBar progressBar = view.findViewById(R.id.offlineProgressBar);
        TextView bytesText = view.findViewById(R.id.offlineBytesText);
        Button pauseBtn = view.findViewById(R.id.offlinePauseBtn);

        final OfflineMapManager mgr = OfflineMapManager.getInstance();

        downloadBtn.setOnClickListener(v -> {
            downloadBtn.setEnabled(false);
            progressContainer.setVisibility(View.VISIBLE);
            progressBar.setProgress(0);
            progressText.setText("Preparing… 0%");
            bytesText.setText("0 MB / 0 MB");
            OfflineMapManager.getInstance().downloadRegion(requireContext(),
                    new OfflineMapManager.Callbacks() {
                        @Override
                        public void onProgress(int percent, long bytesDownloaded, long totalBytes) {
                            if (!isAdded()) return;
                            requireActivity().runOnUiThread(() -> {
                                progressBar.setProgress(Math.min(percent, 100));
                                progressText.setText("Downloading… " + percent + "%");
                                bytesText.setText(mb(bytesDownloaded) + " / " + mb(totalBytes));
                            });
                        }

                        @Override
                        public void onComplete(boolean success, String message) {
                            if (!isAdded()) return;
                            requireActivity().runOnUiThread(() -> {
                                progressContainer.setVisibility(View.GONE);
                                downloadBtn.setEnabled(true);
                                downloadBtn.setText("Download");
                                requireView().findViewById(R.id.offlinePauseBtn).setVisibility(View.GONE);
                                statusText.setText(success
                                        ? "Offline pack ready — " + message
                                        : "Failed: " + message);
                            });
                        }

                        @Override
                        public void onPaused() {
                            if (!isAdded()) return;
                            requireActivity().runOnUiThread(() -> {
                                ((Button) requireView().findViewById(R.id.offlinePauseBtn)).setText("Resume");
                                requireView().findViewById(R.id.offlinePauseBtn).setVisibility(View.VISIBLE);
                            });
                        }
                    });
        });

        pauseBtn.setOnClickListener(v -> {
            if (mgr.isDownloading()) {
                mgr.pauseDownload();
            } else if (mgr.isPaused()) {
                mgr.resumeDownload(requireContext());
            }
        });
    }

    private static String mb(long bytes) {
        return (bytes / (1024 * 1024)) + " MB";
    }
}