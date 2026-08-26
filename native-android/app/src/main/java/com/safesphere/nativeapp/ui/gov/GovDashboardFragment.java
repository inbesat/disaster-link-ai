package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.AlertEntity;
import com.safesphere.nativeapp.data.entity.ResourceEntity;
import com.safesphere.nativeapp.data.entity.ShelterEntity;
import com.safesphere.nativeapp.data.repository.AlertRepository;
import com.safesphere.nativeapp.data.repository.ResourceRepository;
import com.safesphere.nativeapp.data.repository.ShelterRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import androidx.fragment.app.Fragment;
import com.google.android.material.chip.Chip;
import android.widget.ImageView;

public class GovDashboardFragment extends BaseFragment {

    private AlertRepository alertRepository;
    private ShelterRepository shelterRepository;
    private ResourceRepository resourceRepository;
    private RecyclerView kpiRecyclerView, quickActionsRecyclerView, recentAlertsRecyclerView;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_gov_dashboard;
    }

    @Override
    protected void initViews(View view) {
        alertRepository = new AlertRepository(requireActivity().getApplication());
        shelterRepository = new ShelterRepository(requireActivity().getApplication());
        resourceRepository = new ResourceRepository(requireActivity().getApplication());
        kpiRecyclerView = view.findViewById(R.id.kpiRecyclerView);
        quickActionsRecyclerView = view.findViewById(R.id.quickActionsRecyclerView);
        recentAlertsRecyclerView = view.findViewById(R.id.recentAlertsRecyclerView);

        setupKPIs();
        setupQuickActions();
        setupRecentAlerts();
    }

    private void setupKPIs() {
        kpiRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
        List<KPIItem> kpis = Arrays.asList(
                new KPIItem("Active Alerts", "3", "🚨", R.color.colorCritical),
                new KPIItem("Shelters Open", "12/15", "🏠", R.color.colorSuccess),
                new KPIItem("Resources", "1,247", "📦", R.color.colorInfo),
                new KPIItem("Evacuees", "2,340", "🚌", R.color.colorWarning),
                new KPIItem("Field Teams", "8", "👥", R.color.colorPrimary)
        );
        kpiRecyclerView.setAdapter(new KPIAdapter(kpis));
    }

    private void setupQuickActions() {
        quickActionsRecyclerView.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        List<ActionItem> actions = Arrays.asList(
                new ActionItem("Send Alert", R.drawable.ic_alerts, R.color.colorCritical, v -> navigateToAlerts()),
                new ActionItem("Agent Squad", R.drawable.ic_bot, R.color.colorPrimary, v -> navigateToAgentSquad()),
                new ActionItem("AI Planner", R.drawable.ic_brain, R.color.accentAdmin, v -> navigateToAIPlanner()),
                new ActionItem("Evacuations", R.drawable.ic_map, R.color.colorInfo, v -> navigateToEvacuations()),
                new ActionItem("Inventory", R.drawable.ic_package, R.color.colorWarning, v -> navigateToInventory()),
                new ActionItem("Shelters", R.drawable.ic_home, R.color.colorSuccess, v -> navigateToSheltersMgmt()),
                new ActionItem("Triage", R.drawable.ic_medical, R.color.colorCritical, v -> navigateToTriage()),
                new ActionItem("Command Center", R.drawable.ic_dashboard, R.color.colorPrimary, v -> navigateToCommandCenter())
        );
        quickActionsRecyclerView.setAdapter(new ActionAdapter(actions));
    }

    private void setupRecentAlerts() {
        recentAlertsRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        alertRepository.getAllAlerts().observe(getViewLifecycleOwner(), alerts -> {
            if (alerts != null) {
                // Show only first 5
                List<AlertEntity> recent = new ArrayList<>(alerts.subList(0, Math.min(5, alerts.size())));
                recentAlertsRecyclerView.setAdapter(new RecentAlertAdapter(recent));
            }
        });
    }

    // Navigation methods
    private void navigateToAlerts() { nav(R.id.alertsFragment); }
    private void navigateToAgentSquad() { nav(R.id.agentOrchestrationFragment); }
    private void navigateToAIPlanner() { nav(R.id.aiPlannerFragment); }
    private void navigateToEvacuations() { nav(R.id.evacuationsFragment); }
    private void navigateToInventory() { nav(R.id.inventoryFragment); }
    private void navigateToSheltersMgmt() { nav(R.id.sheltersMgmtFragment); }
    private void navigateToTriage() { nav(R.id.triageFragment); }
    private void navigateToCommandCenter() { nav(R.id.commandCenterFragment); }
    private void nav(int dest) {
        requireActivity().getSupportFragmentManager().beginTransaction()
                .replace(R.id.nav_host_fragment, createFragment(dest))
                .addToBackStack(null)
                .commit();
    }

    private Fragment createFragment(int dest) {
        if (dest == R.id.alertsFragment) return new AlertsFragment();
        if (dest == R.id.agentOrchestrationFragment) return new AgentOrchestrationFragment();
        if (dest == R.id.aiPlannerFragment) return new AiPlannerFragment();
        if (dest == R.id.evacuationsFragment) return new EvacuationsFragment();
        if (dest == R.id.inventoryFragment) return new InventoryFragment();
        if (dest == R.id.sheltersMgmtFragment) return new SheltersMgmtFragment();
        if (dest == R.id.triageFragment) return new TriageFragment();
        if (dest == R.id.commandCenterFragment) return new CommandCenterFragment();
        return new GovDashboardFragment();
    }

    // Data classes
    static class KPIItem { String title, value, icon; int colorRes; KPIItem(String t, String v, String i, int c) { title=t; value=v; icon=i; colorRes=c; } }
    static class ActionItem { String title; int iconRes, colorRes; View.OnClickListener onClick; ActionItem(String t, int i, int c, View.OnClickListener cl) { title=t; iconRes=i; colorRes=c; onClick=cl; } }

    // Adapters
    static class KPIAdapter extends RecyclerView.Adapter<KPIAdapter.VH> {
        List<KPIItem> items; KPIAdapter(List<KPIItem> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_kpi_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) { KPIItem item = items.get(pos); h.title.setText(item.title); h.value.setText(item.value); h.icon.setText(item.icon); h.card.setCardBackgroundColor(h.itemView.getContext().getColor(item.colorRes)); }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView title, value, icon; com.google.android.material.card.MaterialCardView card; VH(View v) { super(v); title = v.findViewById(R.id.kpiTitle); value = v.findViewById(R.id.kpiValue); icon = v.findViewById(R.id.kpiIcon); card = v.findViewById(R.id.kpiCard); } }
    }

    static class ActionAdapter extends RecyclerView.Adapter<ActionAdapter.VH> {
        List<ActionItem> items; ActionAdapter(List<ActionItem> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_action_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) { ActionItem item = items.get(pos); h.title.setText(item.title); h.icon.setImageResource(item.iconRes); h.card.setCardBackgroundColor(h.itemView.getContext().getColor(R.color.bgSecondary)); h.card.setOnClickListener(item.onClick); }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView title; ImageView icon; com.google.android.material.card.MaterialCardView card; VH(View v) { super(v); title = v.findViewById(R.id.actionTitle); icon = v.findViewById(R.id.actionIcon); card = v.findViewById(R.id.actionCard); } }
    }

    static class RecentAlertAdapter extends RecyclerView.Adapter<RecentAlertAdapter.VH> {
        List<AlertEntity> items = new ArrayList<>(); RecentAlertAdapter(List<AlertEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_alert_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) { AlertEntity a = items.get(pos); h.district.setText(a.district); h.message.setText(a.message); h.time.setText(formatTime(a.createdAt)); h.severity.setText(a.severity.toUpperCase()); h.severity.setChipBackgroundColorResource(a.severity.equals("critical") ? R.color.colorCritical : a.severity.equals("warning") ? R.color.colorWarning : R.color.colorInfo); }
        @Override public int getItemCount() { return items.size(); }
        private String formatTime(String iso) { try { java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.getDefault()); java.util.Date date = sdf.parse(iso); java.text.SimpleDateFormat out = new java.text.SimpleDateFormat("MMM dd, HH:mm", java.util.Locale.getDefault()); return out.format(date); } catch (Exception e) { return iso; } }
        static class VH extends RecyclerView.ViewHolder { TextView district, message, time; com.google.android.material.chip.Chip severity; VH(View v) { super(v); district = v.findViewById(R.id.alertDistrict); message = v.findViewById(R.id.alertMessage); time = v.findViewById(R.id.alertTime); severity = v.findViewById(R.id.alertSeverity); } }
    }
}