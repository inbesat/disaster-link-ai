package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class AiPlannerFragment extends BaseFragment {

    private RecyclerView chatRecyclerView, sourcesRecyclerView;
    private com.google.android.material.textfield.TextInputEditText chatInput;
    private ImageButton sendBtn, voiceBtn;
    private TextView tokenCounter;
    private ChipGroup promptChips;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_ai_planner;
    }

    @Override
    protected void initViews(View view) {
        chatRecyclerView = view.findViewById(R.id.chatRecyclerView);
        sourcesRecyclerView = view.findViewById(R.id.sourcesRecyclerView);
        chatInput = view.findViewById(R.id.chatInput);
        sendBtn = view.findViewById(R.id.sendBtn);
        voiceBtn = view.findViewById(R.id.voiceBtn);
        tokenCounter = view.findViewById(R.id.tokenCounter);
        promptChips = view.findViewById(R.id.promptChips);

        chatRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        sourcesRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));

        setupChat();
        setupPromptChips();
        setupSendButton();
    }

    private void setupChat() {
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage("assistant", "Ready for tactical planning. Ask me to draft a 48-hour evacuation plan for any district.", null));
        chatRecyclerView.setAdapter(new ChatAdapter(messages));
    }

    private void setupPromptChips() {
        String[] prompts = {"Draft 48h plan for Kankarbagh", "Shelter capacity report", "Resource allocation for Patna", "Flood risk assessment Ernakulam"};
        for (String p : prompts) {
            Chip chip = new Chip(requireContext());
            chip.setText(p);
            chip.setOnClickListener(v -> {
                chatInput.setText(p);
                sendMessage(p);
            });
            promptChips.addView(chip);
        }
    }

    private void setupSendButton() {
        sendBtn.setOnClickListener(v -> {
            String text = chatInput.getText() != null ? chatInput.getText().toString().trim() : "";
            if (!text.isEmpty()) {
                sendMessage(text);
                chatInput.setText("");
            }
        });
    }

    private void sendMessage(String text) {
        RecyclerView.Adapter adapter = chatRecyclerView.getAdapter();
        if (adapter instanceof ChatAdapter) {
            ((ChatAdapter) adapter).addUserMessage(text);
            // Simulate AI response
            new android.os.Handler().postDelayed(() -> {
                ((ChatAdapter) adapter).addAssistantMessage(generateResponse(text));
            }, 1500);
        }
    }

    private String generateResponse(String query) {
        if (query.toLowerCase().contains("kankarbagh")) {
            return "🏥 Querying Shelter Database [Patna] … → ✓\n🛰️ Accessing Satellite Flood Data [Patna] … → ✓\n\n**48-Hour Evacuation Plan: Kankarbagh**\n\n**Phase 1 (0-6h): ALERT**\n- Activate sirens & SMS blast to 12,000 residents\n- Deploy 4 NDRF boat teams to entry points\n- Open Central Community Hall (312/450)\n\n**Phase 2 (6-24h): EVACUATE**\n- Bus convoy: 7 buses × 50 capacity = 350\n- Boat extraction: 3 boats for waterlogged zones\n- Medical triage at Riverside High School\n\n**Phase 3 (24-48h): MONITOR**\n- Satellite flood tracking every 2h\n- Resource reallocation via optimizer\n- Family reunification at Civic Center";
        }
        return "I'll help you with that evacuation plan. Let me gather the latest data for your district.";
    }

    // Data classes & Adapters
    static class ChatMessage { String role, content; List<String> sources; ChatMessage(String r, String c, List<String> s) { role=r; content=c; sources=s; } }

    static class ChatAdapter extends RecyclerView.Adapter<ChatAdapter.VH> {
        List<ChatMessage> items = new ArrayList<>();
        ChatAdapter(List<ChatMessage> items) { this.items = items; }
        void addUserMessage(String text) { items.add(new ChatMessage("user", text, null)); notifyItemInserted(items.size()-1); }
        void addAssistantMessage(String text) { items.add(new ChatMessage("assistant", text, Arrays.asList("Shelter DB", "Satellite Data"))); notifyItemInserted(items.size()-1); }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_chat_message, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) { ChatMessage m = items.get(pos); h.role.setText(m.role.equals("user") ? "You" : "AI"); h.content.setText(m.content); h.itemView.setBackgroundColor(h.itemView.getContext().getColor(m.role.equals("user") ? R.color.bgSurface : R.color.bgSecondary)); }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView role, content; VH(View v) { super(v); role = v.findViewById(R.id.chatTime); content = v.findViewById(R.id.chatMessage); } }
    }

    static class SourceAdapter extends RecyclerView.Adapter<SourceAdapter.VH> {
        List<String> items = Arrays.asList("🏥 Shelter Database [Patna] — 450 capacity", "🛰️ Satellite Flood Data [Patna] — 0.8m rise");
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_source, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) { h.text.setText(items.get(pos)); }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView text; VH(View v) { super(v); text = v.findViewById(R.id.sourceText); } }
    }
}