package com.safesphere.nativeapp.ui.admin;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.AuditLogEntity;
import com.safesphere.nativeapp.data.repository.AuditLogRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.List;

public class AuditLogsFragment extends BaseFragment {

    private AuditLogRepository auditRepository;
    private RecyclerView auditRecyclerView;
    private Chip filterAll, filterInfo, filterWarning, filterCritical;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_audit_logs;
    }

    @Override
    protected void initViews(View view) {
        auditRepository = new AuditLogRepository(requireActivity());
        auditRecyclerView = view.findViewById(R.id.auditRecyclerView);
        filterAll = view.findViewById(R.id.filterAll);
        filterInfo = view.findViewById(R.id.filterInfo);
        filterWarning = view.findViewById(R.id.filterWarning);
        filterCritical = view.findViewById(R.id.filterCritical);

        auditRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        loadAuditLogs();

        setupFilters();
    }

    private void loadAuditLogs() {
        auditRepository.getAllAuditLogs().observe(getViewLifecycleOwner(), logs -> {
            if (logs != null) {
                auditRecyclerView.setAdapter(new AuditAdapter(new ArrayList<>(logs)));
            }
        });
    }

    private void setupFilters() {
        Chip[] chips = {filterAll, filterInfo, filterWarning, filterCritical};
        for (Chip chip : chips) {
            chip.setOnCheckedChangeListener((buttonView, isChecked) -> {
                if (isChecked) {
                    for (Chip c : chips) {
                        if (c != buttonView) c.setChecked(false);
                    }
                }
            });
        }
    }

    static class AuditAdapter extends RecyclerView.Adapter<AuditAdapter.VH> {
        List<AuditLogEntity> items = new ArrayList<>();
        AuditAdapter(List<AuditLogEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_audit_log, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            AuditLogEntity a = items.get(pos);
            h.action.setText(a.action);
            h.actor.setText(a.actor);
            h.resource.setText(a.resource);
            h.ip.setText(a.ip);
            h.time.setText(formatTime(a.timestamp));
            h.severity.setText(a.severity.toUpperCase());
            h.severity.setChipBackgroundColorResource(
                    a.severity.equals("critical") ? R.color.colorCritical :
                            a.severity.equals("warning") ? R.color.colorWarning : R.color.colorInfo
            );
        }
        @Override public int getItemCount() { return items.size(); }
        private String formatTime(String iso) { try { java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.getDefault()); java.util.Date date = sdf.parse(iso); java.text.SimpleDateFormat out = new java.text.SimpleDateFormat("MMM dd, HH:mm", java.util.Locale.getDefault()); return out.format(date); } catch (Exception e) { return iso; } }
        static class VH extends RecyclerView.ViewHolder { TextView action, actor, resource, ip, time; com.google.android.material.chip.Chip severity; VH(View v) { super(v); action = v.findViewById(R.id.auditAction); actor = v.findViewById(R.id.auditActor); resource = v.findViewById(R.id.auditResource); ip = v.findViewById(R.id.auditIp); time = v.findViewById(R.id.auditTime); severity = v.findViewById(R.id.auditSeverity); } }
    }
}