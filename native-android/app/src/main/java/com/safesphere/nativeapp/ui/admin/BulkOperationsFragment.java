package com.safesphere.nativeapp.ui.admin;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class BulkOperationsFragment extends BaseFragment {

    private RecyclerView bulkActionsRecyclerView;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_bulk_operations;
    }

    @Override
    protected void initViews(View view) {
        bulkActionsRecyclerView = view.findViewById(R.id.bulkActionsRecyclerView);
        bulkActionsRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));

        List<BulkActionItem> actions = Arrays.asList(
                new BulkActionItem("Mass SMS Blast", "Broadcast critical guidance to thousands of responders in one action.", R.drawable.ic_alerts, R.color.colorWarning, "sms"),
                new BulkActionItem("Bulk Shelter Status Update", "Flip shelter open/close status across a district in one shot.", R.drawable.ic_home, R.color.colorSuccess, "shelter"),
                new BulkActionItem("Fleet Reallocation", "Reassign boats and vehicles between depots and disaster sites.", R.drawable.ic_map, R.color.colorInfo, "fleet")
        );
        bulkActionsRecyclerView.setAdapter(new BulkActionAdapter(actions));
    }

    static class BulkActionItem { String title, description; int iconRes, colorRes, type; BulkActionItem(String t, String d, int i, int c, String ty) { title=t; description=d; iconRes=i; colorRes=c; type=ty; } }

    static class BulkActionAdapter extends RecyclerView.Adapter<BulkActionAdapter.VH> {
        List<BulkActionItem> items; BulkActionAdapter(List<BulkActionItem> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_bulk_action, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            BulkActionItem a = items.get(pos);
            h.title.setText(a.title); h.description.setText(a.description); h.icon.setImageResource(a.iconRes);
            h.card.setCardBackgroundColor(h.itemView.getContext().getColor(R.color.bgSecondary));
            h.card.setOnClickListener(v -> showConfigureDialog(a));
        }
        @Override public int getItemCount() { return items.size(); }
        private void showConfigureDialog(BulkActionItem action) {
            android.view.View dialogView = LayoutInflater.from(h.card.getContext()).inflate(R.layout.dialog_bulk_action, null);
            EditText messageInput = dialogView.findViewById(R.id.bulkMessageInput);
            new com.google.android.material.dialog.MaterialAlertDialogBuilder(h.card.getContext())
                    .setTitle("Configure " + action.title)
                    .setView(dialogView)
                    .setPositiveButton("EXECUTE", (d, w) -> {
                        Toast.makeText(h.card.getContext(), action.title + " executed", Toast.LENGTH_SHORT).show();
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        }
        static class VH extends RecyclerView.ViewHolder { TextView title, description; ImageView icon; com.google.android.material.card.MaterialCardView card; VH(View v) { super(v); title = v.findViewById(R.id.bulkTitle); description = v.findViewById(R.id.bulkDescription); icon = v.findViewById(R.id.bulkIcon); card = v.findViewById(R.id.bulkCard); } }
    }
}