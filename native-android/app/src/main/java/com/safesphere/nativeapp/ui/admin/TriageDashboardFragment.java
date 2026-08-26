package com.safesphere.nativeapp.ui.admin;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.ReportEntity;
import com.safesphere.nativeapp.data.repository.ReportRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;
import com.safesphere.nativeapp.util.LocationHelper;

import java.util.ArrayList;
import java.util.List;

public class TriageDashboardFragment extends BaseFragment {

    private ReportRepository reportRepository;
    private RecyclerView triageRecyclerView;
    private Chip filterAll, filterCritical, filterHigh, filterMedium, filterLow;

    private TriageReportAdapter adapter;
    private List<ReportEntity> allReports = new ArrayList<>();
    private String currentFilter = "all";

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_triage_dashboard;
    }

    @Override
    protected void initViews(View view) {
        reportRepository = new ReportRepository(requireActivity().getApplication());
        triageRecyclerView = view.findViewById(R.id.triageRecyclerView);
        filterAll = view.findViewById(R.id.filterAll);
        filterCritical = view.findViewById(R.id.filterCritical);
        filterHigh = view.findViewById(R.id.filterHigh);
        filterMedium = view.findViewById(R.id.filterMedium);
        filterLow = view.findViewById(R.id.filterLow);

        triageRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new TriageReportAdapter(new ArrayList<>());
        triageRecyclerView.setAdapter(adapter);

        setupFilters();

        reportRepository.getAllReports().observe(getViewLifecycleOwner(), reports -> {
            if (reports != null) {
                allReports = new ArrayList<>(reports);
                applyFilter();
            }
        });
    }

    private void setupFilters() {
        Chip[] chips = {filterAll, filterCritical, filterHigh, filterMedium, filterLow};
        for (Chip chip : chips) {
            chip.setOnCheckedChangeListener((buttonView, isChecked) -> {
                if (isChecked) {
                    for (Chip c : chips) if (c != buttonView) c.setChecked(false);
                    currentFilter = chipIdToFilter(buttonView.getId());
                    applyFilter();
                }
            });
        }
    }

    private String chipIdToFilter(int id) {
        if (id == R.id.filterCritical) return "critical";
        if (id == R.id.filterHigh) return "high";
        if (id == R.id.filterMedium) return "medium";
        if (id == R.id.filterLow) return "low";
        return "all";
    }

    private void applyFilter() {
        List<ReportEntity> filtered = new ArrayList<>();
        for (ReportEntity r : allReports) {
            if ("all".equals(currentFilter)) {
                filtered.add(r);
            } else {
                String label = severityToLabel(r.severity);
                if (currentFilter.equals(label)) filtered.add(r);
            }
        }
        // Sort by severity descending
        filtered.sort((a, b) -> Integer.compare(b.severity, a.severity));
        adapter.updateItems(filtered);
    }

    private String severityToLabel(int severity) {
        if (severity >= 75) return "critical";
        if (severity >= 50) return "high";
        if (severity >= 30) return "medium";
        return "low";
    }

    static class TriageReportAdapter extends RecyclerView.Adapter<TriageReportAdapter.VH> {
        List<ReportEntity> items = new ArrayList<>();
        TriageReportAdapter(List<ReportEntity> items) { this.items = items; }
        void updateItems(List<ReportEntity> items) { this.items = items; notifyDataSetChanged(); }

        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) {
            View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_triage_report, p, false);
            return new VH(view);
        }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            ReportEntity r = items.get(pos);
            h.typeText.setText(prettify(r.reportType));
            h.textText.setText(r.rawText != null ? r.rawText : "");
            h.coordsText.setText(LocationHelper.formatCoord(r.lat, r.lng));
            h.timeText.setText(shortTime(r.createdAt));

            int sev = r.severity;
            h.severityChip.setText(severityLabel(sev));
            h.severityChip.setChipBackgroundColorResource(
                    sev >= 75 ? R.color.colorCritical :
                            sev >= 50 ? R.color.colorWarning :
                                    sev >= 30 ? R.color.colorInfo : R.color.colorSuccess);

            h.statusText.setText(r.verificationStatus != null ? r.verificationStatus : "unverified");

            h.verifyBtn.setOnClickListener(v -> {
                ReportRepository repo = new ReportRepository((android.app.Application) v.getContext().getApplicationContext());
                r.verificationStatus = "verified";
                repo.updateReport(r);
                h.statusText.setText("verified");
                Toast.makeText(v.getContext(), "Report verified", Toast.LENGTH_SHORT).show();
            });

            h.mapBtn.setOnClickListener(v -> {
                Toast.makeText(v.getContext(), "Opening map for report " + r.id, Toast.LENGTH_SHORT).show();
                // TODO: Navigate to map with this report's coordinates
            });
        }
        @Override public int getItemCount() { return items.size(); }

        private String prettify(String type) {
            if (type == null) return "REPORT";
            String[] parts = type.split("_");
            StringBuilder sb = new StringBuilder();
            for (String p : parts) sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1)).append(' ');
            return sb.toString().trim();
        }
        private String severityLabel(int sev) {
            if (sev >= 75) return "CRITICAL";
            if (sev >= 50) return "HIGH";
            if (sev >= 30) return "MEDIUM";
            return "LOW";
        }
        private String shortTime(String iso) {
            try {
                java.text.SimpleDateFormat in = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US);
                java.util.Date d = in.parse(iso);
                java.text.SimpleDateFormat out = new java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault());
                return d == null ? iso : out.format(d);
            } catch (Exception e) { return iso; }
        }

        static class VH extends RecyclerView.ViewHolder {
            TextView typeText, textText, coordsText, timeText, statusText;
            com.google.android.material.chip.Chip severityChip;
            com.google.android.material.button.MaterialButton verifyBtn, mapBtn;
            VH(View v) { super(v); typeText = v.findViewById(R.id.reportTypeText); textText = v.findViewById(R.id.reportText); coordsText = v.findViewById(R.id.reportCoords); timeText = v.findViewById(R.id.reportTime); severityChip = v.findViewById(R.id.severityChip); statusText = v.findViewById(R.id.statusText); verifyBtn = v.findViewById(R.id.verifyBtn); mapBtn = v.findViewById(R.id.mapBtn); }
        }
    }
}