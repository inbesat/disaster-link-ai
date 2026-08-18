package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.textfield.TextInputEditText;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class AgentOrchestrationFragment extends BaseFragment {

    private TextInputEditText incidentInput;
    private Button simulateBtn, runBtn;
    private RecyclerView agentPipelineRecyclerView, decisionLogRecyclerView;
    private LinearLayout statusContainer;
    private TextView replayStep;
    private ImageButton replayPrev, replayNext;
    private int currentReplayStep = 3;
    private final String[] replaySteps = {
            "Step 1 of 5: Predictor - Risk assessment complete",
            "Step 2 of 5: Planner - 48h evacuation plan generated",
            "Step 3 of 5: Allocator - Resource allocation complete",
            "Step 4 of 5: Validator - Conflict check passed",
            "Step 5 of 5: Communicator - Alerts broadcast"
    };

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_agent_orchestration;
    }

    @Override
    protected void initViews(View view) {
        incidentInput = view.findViewById(R.id.incidentInput);
        simulateBtn = view.findViewById(R.id.simulateBtn);
        runBtn = view.findViewById(R.id.runBtn);
        agentPipelineRecyclerView = view.findViewById(R.id.agentPipelineRecyclerView);
        statusContainer = view.findViewById(R.id.statusContainer);
        decisionLogRecyclerView = view.findViewById(R.id.decisionLogRecyclerView);
        replayStep = view.findViewById(R.id.replayStep);
        replayPrev = view.findViewById(R.id.replayPrev);
        replayNext = view.findViewById(R.id.replayNext);

        setupAgentPipeline();
        setupButtons();
        setupDecisionLog();
        setupReplayControls();
    }

    private void setupAgentPipeline() {
        agentPipelineRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
        List<AgentItem> agents = Arrays.asList(
                new AgentItem("Predictor", "Risk Assessment", "idle"),
                new AgentItem("Planner", "48h Evacuation Plan", "idle"),
                new AgentItem("Allocator", "Resource Allocation", "idle"),
                new AgentItem("Validator", "Conflict & Capacity Check", "idle"),
                new AgentItem("Communicator", "SMS / Siren Fan-out", "idle")
        );
        agentPipelineRecyclerView.setAdapter(new AgentPipelineAdapter(agents));
    }

    private void setupButtons() {
        simulateBtn.setOnClickListener(v -> {
            incidentInput.setText("CATASTROPHIC flood event: Ganga river bank breach at KatQ ward, 12,000 residents at risk");
            runOrchestration();
        });

        runBtn.setOnClickListener(v -> runOrchestration());
    }

    private void runOrchestration() {
        String incident = incidentInput.getText() != null ? incidentInput.getText().toString().trim() : "";
        if (incident.isEmpty()) {
            com.google.android.material.snackbar.Snackbar.make(requireView(), "Describe the incident first", com.google.android.material.snackbar.Snackbar.LENGTH_SHORT).show();
            return;
        }

        // Simulate pipeline execution
        AgentPipelineAdapter adapter = (AgentPipelineAdapter) agentPipelineRecyclerView.getAdapter();
        if (adapter != null) {
            for (int i = 0; i < 5; i++) {
                final int step = i;
                new android.os.Handler().postDelayed(() -> {
                    adapter.updateAgentStatus(step, "active");
                    new android.os.Handler().postDelayed(() -> {
                        adapter.updateAgentStatus(step, "done");
                        if (step == 4) {
                            showStatusCards();
                            addDecisionLogEntries();
                        }
                    }, 800);
                }, i * 1500);
            }
        }
    }

    private void showStatusCards() {
        statusContainer.removeAllViews();
        String[] statuses = {
                "✓ Predictor: Risk level CRITICAL detected",
                "✓ Planner: 48h evacuation plan for Patna generated",
                "✓ Allocator: 120 boats, 500 med kits, 300 water pallets allocated",
                "✓ Validator: No conflicts detected",
                "⏳ Communicator: Awaiting human approval"
        };
        for (String s : statuses) {
            View card = LayoutInflater.from(requireContext()).inflate(R.layout.item_status_card, statusContainer, false);
            TextView text = card.findViewById(R.id.statusText);
            text.setText(s);
            statusContainer.addView(card);
        }
    }

    private void addDecisionLogEntries() {
        List<String> logs = Arrays.asList(
                "14:32:15 Predictor: Analyzed satellite flood data + weather forecast → CRITICAL risk",
                "14:32:18 Planner: Generated 48h phased evacuation for 12K residents across 3 districts",
                "14:32:22 Allocator: Optimized fleet - 7 buses, 3 boats assigned to Kankarbagh corridor",
                "14:32:25 Validator: Shelter capacity check passed - Central Hall 69% occupancy",
                "14:32:28 Pipeline: Waiting at approval checkpoint for human authorization"
        );
        decisionLogRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        decisionLogRecyclerView.setAdapter(new DecisionLogAdapter(logs));
    }

    private void setupDecisionLog() {
        decisionLogRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
    }

    private void setupReplayControls() {
        replayPrev.setOnClickListener(v -> {
            if (currentReplayStep > 0) {
                currentReplayStep--;
                replayStep.setText(replaySteps[currentReplayStep]);
            }
        });
        replayNext.setOnClickListener(v -> {
            if (currentReplayStep < replaySteps.length - 1) {
                currentReplayStep++;
                replayStep.setText(replaySteps[currentReplayStep]);
            }
        });
    }

    // Data classes & Adapters
    static class AgentItem { String name, role, status; AgentItem(String n, String r, String s) { name=n; role=r; status=s; } }

    static class AgentPipelineAdapter extends RecyclerView.Adapter<AgentPipelineAdapter.VH> {
        List<AgentItem> items;
        AgentPipelineAdapter(List<AgentItem> items) { this.items = items; }
        void updateAgentStatus(int pos, String status) { items.get(pos).status = status; notifyItemChanged(pos); }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_agent_node, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) { AgentItem a = items.get(pos); h.name.setText(a.name); h.role.setText(a.role); int colorRes = a.status.equals("active") ? R.color.colorWarning : a.status.equals("done") ? R.color.colorSuccess : R.color.textMuted; h.statusDot.setBackgroundColor(h.itemView.getContext().getColor(colorRes)); h.statusText.setText(a.status.toUpperCase()); h.statusText.setTextColor(h.itemView.getContext().getColor(colorRes)); }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView name, role, statusText; View statusDot; VH(View v) { super(v); name = v.findViewById(R.id.agentName); role = v.findViewById(R.id.agentRole); statusDot = v.findViewById(R.id.agentStatusDot); statusText = v.findViewById(R.id.agentStatusText); } }
    }

    static class DecisionLogAdapter extends RecyclerView.Adapter<DecisionLogAdapter.VH> {
        List<String> items; DecisionLogAdapter(List<String> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_decision_log, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) { h.text.setText(items.get(pos)); }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView text; VH(View v) { super(v); text = v.findViewById(R.id.logText); } }
    }
}