package com.safesphere.nativeapp.ui.admin;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.Arrays;
import java.util.List;
import android.widget.TextView;
import androidx.fragment.app.Fragment;
import com.google.android.material.chip.Chip;
import android.widget.ImageView;

public class AdminDashboardFragment extends BaseFragment {

    private RecyclerView kpiRecyclerView, opsRecyclerView, actionsRecyclerView;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_admin_dashboard;
    }

    @Override
    protected void initViews(View view) {
        kpiRecyclerView = view.findViewById(R.id.adminKpiRecyclerView);
        opsRecyclerView = view.findViewById(R.id.adminOpsRecyclerView);
        actionsRecyclerView = view.findViewById(R.id.adminActionsRecyclerView);

        setupKPIs();
        setupOperations();
        setupActions();
    }

    private void setupKPIs() {
        kpiRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
        List<KPIItem> kpis = Arrays.asList(
                new KPIItem("Active Users", "42", "👥", R.color.colorInfo),
                new KPIItem("Live Operations", "7", "🚨", R.color.colorCritical),
                new KPIItem("Districts", "3", "🏙️", R.color.colorWarning),
                new KPIItem("ML Service", "Healthy", "🤖", R.color.colorSuccess)
        );
        kpiRecyclerView.setAdapter(new KPIAdapter(kpis));
    }

    private void setupOperations() {
        opsRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        List<OpItem> ops = Arrays.asList(
                new OpItem("evac-112", "Evacuate Riverline B Sector", "Patna", "critical", "LIVE", "14 units", "R. Verma", "2m ago"),
                new OpItem("deploy-88", "Deploy Boats to Kadamtala", "Patna", "high", "EXECUTING", "6 boats", "S. Nair", "9m ago"),
                new OpItem("medical-7", "Mobile Clinic – Kampur Staging", "Purba Champaran", "high", "EXECUTING", "3 clinics", "T. Das", "22m ago"),
                new OpItem("shelter-30", "Open Shelter 8 + Water Drop", "Ernakulam", "medium", "STAGED", "1 site", "M. Ali", "41m ago"),
                new OpItem("scan-55", "Fly Recon Grid 4N", "Purba Champaran", "low", "STAGED", "3 drones", "J. Kaur", "1h ago")
        );
        opsRecyclerView.setAdapter(new OpAdapter(ops));
    }

    private void setupActions() {
        actionsRecyclerView.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        List<ActionItem> actions = Arrays.asList(
                new ActionItem("User Management", R.drawable.ic_users, R.color.accentAdmin, v -> nav(R.id.userManagementFragment)),
                new ActionItem("Bulk Operations", R.drawable.ic_bulk, R.color.colorWarning, v -> nav(R.id.bulkOperationsFragment)),
                new ActionItem("Analytics", R.drawable.ic_analytics, R.color.colorInfo, v -> nav(R.id.analyticsFragment)),
                new ActionItem("Audit Logs", R.drawable.ic_audit, R.color.colorPrimary, v -> nav(R.id.auditLogsFragment)),
                new ActionItem("System Health", R.drawable.ic_health, R.color.colorSuccess, v -> nav(R.id.systemHealthFragment)),
                new ActionItem("District Config", R.drawable.ic_config, R.color.accentAdmin, v -> nav(R.id.districtConfigFragment)),
                new ActionItem("Report Triage", R.drawable.ic_health, R.color.colorCritical, v -> nav(R.id.triageDashboardFragment))
        );
        actionsRecyclerView.setAdapter(new ActionAdapter(actions));
    }

    private void nav(int dest) {
        requireActivity().getSupportFragmentManager().beginTransaction()
                .replace(R.id.nav_host_fragment, createFragment(dest))
                .addToBackStack(null)
                .commit();
    }

    private Fragment createFragment(int dest) {
        if (dest == R.id.userManagementFragment) return new UserManagementFragment();
        if (dest == R.id.bulkOperationsFragment) return new BulkOperationsFragment();
        if (dest == R.id.analyticsFragment) return new AnalyticsFragment();
        if (dest == R.id.auditLogsFragment) return new AuditLogsFragment();
        if (dest == R.id.systemHealthFragment) return new SystemHealthFragment();
        if (dest == R.id.districtConfigFragment) return new DistrictConfigFragment();
        return new AdminDashboardFragment();
    }

    // Data classes & Adapters
    static class KPIItem { String title, value, icon; int colorRes; KPIItem(String t, String v, String i, int c) { title=t; value=v; icon=i; colorRes=c; } }
    static class OpItem { String id, plan, district, priority, status, assets, owner, updated; OpItem(String i, String p, String d, String pr, String s, String a, String o, String u) { id=i; plan=p; district=d; priority=pr; status=s; assets=a; owner=o; updated=u; } }
    static class ActionItem { String title; int iconRes, colorRes; View.OnClickListener onClick; ActionItem(String t, int i, int c, View.OnClickListener cl) { title=t; iconRes=i; colorRes=c; onClick=cl; } }

    static class KPIAdapter extends RecyclerView.Adapter<KPIAdapter.VH> {
        List<KPIItem> items; KPIAdapter(List<KPIItem> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_kpi_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) { KPIItem item = items.get(pos); h.title.setText(item.title); h.value.setText(item.value); h.icon.setText(item.icon); h.card.setCardBackgroundColor(h.itemView.getContext().getColor(item.colorRes)); }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView title, value, icon; com.google.android.material.card.MaterialCardView card; VH(View v) { super(v); title = v.findViewById(R.id.kpiTitle); value = v.findViewById(R.id.kpiValue); icon = v.findViewById(R.id.kpiIcon); card = v.findViewById(R.id.kpiCard); } }
    }

    static class OpAdapter extends RecyclerView.Adapter<OpAdapter.VH> {
        List<OpItem> items; OpAdapter(List<OpItem> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_admin_op, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            OpItem o = items.get(pos);
            h.plan.setText(o.plan); h.district.setText(o.district); h.priority.setText(o.priority.toUpperCase());
            h.priority.setChipBackgroundColorResource(o.priority.equals("critical") ? R.color.colorCritical : o.priority.equals("high") ? R.color.colorWarning : o.priority.equals("medium") ? R.color.colorInfo : R.color.colorSuccess);
            h.status.setText(o.status); h.status.setChipBackgroundColorResource(o.status.equals("LIVE") ? R.color.colorCritical : o.status.equals("EXECUTING") ? R.color.colorWarning : R.color.colorInfo);
            h.assets.setText(o.assets); h.owner.setText(o.owner); h.updated.setText(o.updated);
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView plan, district, assets, owner, updated; com.google.android.material.chip.Chip priority, status; VH(View v) { super(v); plan = v.findViewById(R.id.opPlan); district = v.findViewById(R.id.opDistrict); priority = v.findViewById(R.id.opPriority); status = v.findViewById(R.id.opStatus); assets = v.findViewById(R.id.opAssets); owner = v.findViewById(R.id.opOwner); updated = v.findViewById(R.id.opUpdated); } }
    }

    static class ActionAdapter extends RecyclerView.Adapter<ActionAdapter.VH> {
        List<ActionItem> items; ActionAdapter(List<ActionItem> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_action_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) { ActionItem item = items.get(pos); h.title.setText(item.title); h.icon.setImageResource(item.iconRes); h.card.setCardBackgroundColor(h.itemView.getContext().getColor(R.color.bgSecondary)); h.card.setOnClickListener(item.onClick); }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView title; ImageView icon; com.google.android.material.card.MaterialCardView card; VH(View v) { super(v); title = v.findViewById(R.id.actionTitle); icon = v.findViewById(R.id.actionIcon); card = v.findViewById(R.id.actionCard); } }
    }
}