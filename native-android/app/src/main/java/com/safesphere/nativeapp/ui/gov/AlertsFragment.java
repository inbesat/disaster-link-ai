package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.SearchView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.AlertEntity;
import com.safesphere.nativeapp.data.repository.AlertRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.List;

public class AlertsFragment extends BaseFragment {

    private AlertRepository alertRepository;
    private RecyclerView alertsRecyclerView;
    private SearchView searchView;
    private Chip filterAll, filterCritical, filterWarning, filterInfo;
    private FloatingActionButton fabCompose;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_alerts;
    }

    @Override
    protected void initViews(View view) {
        alertRepository = new AlertRepository(requireActivity());
        alertsRecyclerView = view.findViewById(R.id.alertsRecyclerView);
        searchView = view.findViewById(R.id.alertSearchView);
        filterAll = view.findViewById(R.id.filterAll);
        filterCritical = view.findViewById(R.id.filterCritical);
        filterWarning = view.findViewById(R.id.filterWarning);
        filterInfo = view.findViewById(R.id.filterInfo);
        fabCompose = view.findViewById(R.id.fabComposeAlert);

        alertsRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        loadAlerts();

        setupFilters();
        setupSearch();
        setupFab();
    }

    private void loadAlerts() {
        alertRepository.getAllAlerts().observe(getViewLifecycleOwner(), alerts -> {
            if (alerts != null) {
                alertsRecyclerView.setAdapter(new AlertAdapter(new ArrayList<>(alerts)));
            }
        });
    }

    private void setupFilters() {
        Chip[] chips = {filterAll, filterCritical, filterWarning, filterInfo};
        for (Chip chip : chips) {
            chip.setOnCheckedChangeListener((buttonView, isChecked) -> {
                if (isChecked) {
                    for (Chip c : chips) {
                        if (c != buttonView) c.setChecked(false);
                    }
                    filterAlerts(buttonView.getText().toString());
                }
            });
        }
    }

    private void filterAlerts(String filter) {
        // TODO: Implement filtering
    }

    private void setupSearch() {
        searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override public boolean onQueryTextSubmit(String query) { return false; }
            @Override public boolean onQueryTextChange(String newText) {
                // TODO: Implement search
                return false;
            }
        });
    }

    private void setupFab() {
        fabCompose.setOnClickListener(v -> showComposeDialog());
    }

    private void showComposeDialog() {
        android.view.View dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_compose_alert, null);
        new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                .setTitle("Compose Alert")
                .setView(dialogView)
                .setPositiveButton("Send", (d, w) -> {
                    // TODO: Send alert
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    static class AlertAdapter extends RecyclerView.Adapter<AlertAdapter.VH> {
        List<AlertEntity> items = new ArrayList<>();
        AlertAdapter(List<AlertEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_alert_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) { AlertEntity a = items.get(pos); h.district.setText(a.district); h.message.setText(a.message); h.time.setText(formatTime(a.createdAt)); h.severity.setText(a.severity.toUpperCase()); h.severity.setChipBackgroundColorResource(a.severity.equals("critical") ? R.color.colorCritical : a.severity.equals("warning") ? R.color.colorWarning : R.color.colorInfo); }
        @Override public int getItemCount() { return items.size(); }
        private String formatTime(String iso) { try { java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.getDefault()); java.util.Date date = sdf.parse(iso); java.text.SimpleDateFormat out = new java.text.SimpleDateFormat("MMM dd, HH:mm", java.util.Locale.getDefault()); return out.format(date); } catch (Exception e) { return iso; } }
        static class VH extends RecyclerView.ViewHolder { TextView district, message, time; com.google.android.material.chip.Chip severity; VH(View v) { super(v); district = v.findViewById(R.id.alertDistrict); message = v.findViewById(R.id.alertMessage); time = v.findViewById(R.id.alertTime); severity = v.findViewById(R.id.alertSeverity); } }
    }
}