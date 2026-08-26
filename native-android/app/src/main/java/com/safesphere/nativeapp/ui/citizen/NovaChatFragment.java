package com.safesphere.nativeapp.ui.citizen;

import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ai.NovaRuleEngine;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class NovaChatFragment extends BaseFragment {

    private RecyclerView chatRecyclerView;
    private EditText chatInput;
    private ChipGroup promptChipGroup;

    private List<ChatMessage> messages = new ArrayList<>();
    private ChatAdapter adapter;

    @Override protected int getLayoutRes() { return R.layout.fragment_mitron_chat; }

    @Override protected void initViews(View view) {
        chatRecyclerView = view.findViewById(R.id.chatRecyclerView);
        chatInput = view.findViewById(R.id.chatInput);
        MaterialButton sendBtn = view.findViewById(R.id.sendBtn);
        MaterialToolbar toolbar = view.findViewById(R.id.mitron_toolbar);
        promptChipGroup = view.findViewById(R.id.promptChipGroup);

        chatRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());

        // Welcome message
        messages.add(new ChatMessage("Hello! I'm Nova — your AI Safety Assistant. I work offline with 61 emergency rules. Ask me about floods, cyclones, earthquakes, first aid, shelters, evacuation, or anything else. If you're in immediate danger, call 112.", true, formatTime(System.currentTimeMillis())));
        adapter = new ChatAdapter(messages);
        chatRecyclerView.setAdapter(adapter);

        // Suggested prompts (citizen-oriented)
        String[] prompts = {
                "flood safety",
                "nearest shelter",
                "emergency numbers",
                "go bag checklist",
                "earthquake what to do",
                "heat stroke first aid",
                "battery save tips",
                "i am safe"
        };
        for (String p : prompts) {
            Chip chip = new Chip(requireContext());
            chip.setText(p);
            chip.setCheckable(false);
            chip.setChipBackgroundColorResource(R.color.bgSurface);
            chip.setTextColor(requireContext().getColor(R.color.textPrimary));
            chip.setOnClickListener(v -> {
                String prompt = ((Chip) v).getText().toString();
                chatInput.setText(prompt);
                sendMessage(prompt);
            });
            promptChipGroup.addView(chip);
        }

        sendBtn.setOnClickListener(v -> {
            String text = chatInput.getText().toString().trim();
            if (!text.isEmpty()) {
                sendMessage(text);
                chatInput.setText("");
            }
        });
    }

    private void sendMessage(String text) {
        messages.add(new ChatMessage(text, false, formatTime(System.currentTimeMillis())));
        adapter.notifyItemInserted(messages.size() - 1);
        chatRecyclerView.scrollToPosition(messages.size() - 1);

        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            // Emergency intent pre-check
            if (NovaRuleEngine.isEmergencyIntent(text)) {
                String esc = NovaRuleEngine.emergencyEscalation(text);
                messages.add(new ChatMessage(esc, true, formatTime(System.currentTimeMillis()), "EMERGENCY"));
                adapter.notifyItemInserted(messages.size() - 1);
                chatRecyclerView.scrollToPosition(messages.size() - 1);
                return;
            }

            // Normal rule response
            NovaRuleEngine.Result result = NovaRuleEngine.generateResponse(text);
            String label = result.matched ? "RULE · 90%" : "FALLBACK";
            messages.add(new ChatMessage(result.text, true, formatTime(System.currentTimeMillis()), label));
            adapter.notifyItemInserted(messages.size() - 1);
            chatRecyclerView.scrollToPosition(messages.size() - 1);
        }, 800);
    }

    private String formatTime(long millis) {
        return new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date(millis));
    }

    static class ChatMessage {
        String text, time, source; boolean isBot;
        ChatMessage(String t, boolean b, String tm) { this(t, b, tm, null); }
        ChatMessage(String t, boolean b, String tm, String src) { text = t; isBot = b; time = tm; source = src; }
    }

    static class ChatAdapter extends RecyclerView.Adapter<ChatAdapter.VH> {
        List<ChatMessage> items;
        ChatAdapter(List<ChatMessage> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) {
            View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_chat_message, p, false);
            return new VH(view);
        }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            ChatMessage m = items.get(pos);
            h.message.setText(m.text);
            h.time.setText(m.time);
            if (m.source != null) {
                h.sourceChip.setVisibility(View.VISIBLE);
                h.sourceChip.setText(m.source);
            } else {
                h.sourceChip.setVisibility(View.GONE);
            }
            ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) h.itemView.getLayoutParams();
            if (m.isBot) {
                params.leftMargin = 0;
                params.rightMargin = (int) (16 * h.itemView.getResources().getDisplayMetrics().density);
                h.itemView.setBackgroundColor(h.itemView.getContext().getColor(R.color.bgSecondary));
            } else {
                params.leftMargin = (int) (48 * h.itemView.getResources().getDisplayMetrics().density);
                params.rightMargin = 0;
                h.itemView.setBackgroundColor(h.itemView.getContext().getColor(R.color.colorInfo));
            }
            h.message.setTextColor(m.isBot ? h.itemView.getContext().getColor(R.color.textPrimary) : Color.WHITE);
            h.time.setTextColor(m.isBot ? h.itemView.getContext().getColor(R.color.textMuted) : Color.parseColor("#B0E0FF"));
        }
        @Override public int getItemCount() { return items.size(); }
        @Override public int getItemViewType(int pos) { return items.get(pos).isBot ? 0 : 1; }
        static class VH extends RecyclerView.ViewHolder {
            TextView message, time; Chip sourceChip;
            VH(View v) { super(v); message = v.findViewById(R.id.chatMessage); time = v.findViewById(R.id.chatTime); sourceChip = v.findViewById(R.id.chatSourceChip); }
        }
    }
}