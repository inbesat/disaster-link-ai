package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

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

import java.util.ArrayList;
import java.util.List;
import android.widget.Button;
import android.widget.TextView;

public class TriageFragment extends BaseFragment {

    private ReportRepository reportRepository;
    private RecyclerView triageRecyclerView;
    private Chip filterAll, filterCritical, filterFlooding, filterRoadBlocked, filterShelterNeeded, filterRescue;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_triage;
    }

    @Override
    protected void initViews(View view) {
        reportRepository = new ReportRepository(requireActivity().getApplication());
        triageRecyclerView = view.findViewById(R.id.triageRecyclerView);
        filterAll = view.findViewById(R.id.filterAll);
        filterCritical = view.findViewById(R.id.filterCritical);
        filterFlooding = view.findViewById(R.id.filterFlooding);
        filterRoadBlocked = view.findViewById(R.id.filterRoadBlocked);
        filterShelterNeeded = view.findViewById(R.id.filterShelterNeeded);
        filterRescue = view.findViewById(R.id.filterRescue);

        triageRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        loadReports();

        setupFilters();
    }

    private void loadReports() {
        reportRepository.getAllReports().observe(getViewLifecycleOwner(), reports -> {
            if (reports != null) {
                triageRecyclerView.setAdapter(new ReportAdapter(new ArrayList<>(reports)));
            }
        });
    }

    private void setupFilters() {
        Chip[] chips = {filterAll, filterCritical, filterFlooding, filterRoadBlocked, filterShelterNeeded, filterRescue};
        for (Chip chip : chips) {
            chip.setOnCheckedChangeListener((buttonView, isChecked) -> {
                if (isChecked) {
                    for (Chip c : chips) {
                        if (c != buttonView) c.setChecked(false);
                    }
                    // TODO: Filter reports
                }
            });
        }
    }

    static class ReportAdapter extends RecyclerView.Adapter<ReportAdapter.VH> {
        List<ReportEntity> items = new ArrayList<>();
        ReportAdapter(List<ReportEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_report_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            ReportEntity r = items.get(pos);
            h.type.setText(r.reportType.replace("_", " ").toUpperCase());
            h.severity.setText("Severity " + r.severity);
            h.severity.setChipBackgroundColorResource(
                    r.severity >= 85 ? R.color.colorCritical :
                            r.severity >= 65 ? R.color.colorWarning :
                                    r.severity >= 40 ? R.color.colorInfo : R.color.colorSuccess
            );
            h.location.setText(r.locations != null ? r.locations : "Unknown");
            h.text.setText(r.rawText != null ? r.rawText : "");
            h.source.setText(r.source);
            if (r.isPwd) {
                h.pwdBadge.setVisibility(View.VISIBLE);
                h.pwdDetails.setText(r.pwdDetails);
                h.pwdDetails.setVisibility(View.VISIBLE);
            } else {
                h.pwdBadge.setVisibility(View.GONE);
                h.pwdDetails.setVisibility(View.GONE);
            }
            h.verify.setOnClickListener(v -> {
                r.verificationStatus = "verified";
                notifyItemChanged(pos);
            });
            h.reject.setOnClickListener(v -> {
                r.verificationStatus = "rejected";
                notifyItemChanged(pos);
            });
            h.drone.setOnClickListener(v -> {
                // TODO: Dispatch drone
            });
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { com.google.android.material.chip.Chip type, severity; TextView location, text, source; View pwdBadge; TextView pwdDetails; Button verify, reject, drone; VH(View v) { super(v); type = v.findViewById(R.id.reportType); severity = v.findViewById(R.id.reportSeverity); location = v.findViewById(R.id.reportLocation); text = v.findViewById(R.id.reportText); source = v.findViewById(R.id.reportSource); pwdBadge = v.findViewById(R.id.reportPwdBadge); pwdDetails = v.findViewById(R.id.reportPwdDetails); verify = v.findViewById(R.id.reportVerify); reject = v.findViewById(R.id.reportReject); drone = v.findViewById(R.id.reportDrone); } }
    }
}