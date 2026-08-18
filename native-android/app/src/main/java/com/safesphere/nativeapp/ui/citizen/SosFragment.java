package com.safesphere.nativeapp.ui.citizen;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.GridLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LifecycleOwner;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.repository.SosEventRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

public class SosFragment extends BaseFragment {

    private SosEventRepository sosRepository;
    private GridLayout sosGrid, helplineGrid;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_sos;
    }

    @Override
    protected void initViews(View view) {
        sosRepository = new SosEventRepository(requireActivity());
        sosGrid = view.findViewById(R.id.sosGrid);
        helplineGrid = view.findViewById(R.id.helplineGrid);

        setupSosButtons();
        setupHelplines();
        loadSosHistory();
    }

    private void setupSosButtons() {
        String[][] sosActions = {
                {"I Need Rescue", "🚤", "#EF4444"},
                {"Medical Emergency", "🚑", "#EF4444"},
                {"Share Location", "📍", "#F59E0B"},
                {"Call Helpline", "☎️", "#3B82F6"},
                {"I Am Safe", "✅", "#22C55E"},
                {"Report Hazard", "⚠️", "#F59E0B"}
        };

        for (int i = 0; i < sosActions.length; i++) {
            String[] action = sosActions[i];
            View card = LayoutInflater.from(requireContext()).inflate(R.layout.item_sos_action, sosGrid, false);
            TextView title = card.findViewById(R.id.sosActionTitle);
            TextView icon = card.findViewById(R.id.sosActionIcon);
            title.setText(action[0]);
            icon.setText(action[1]);
            card.setBackgroundColor(android.graphics.Color.parseColor(action[2]));

            int finalI = i;
            card.setOnClickListener(v -> onSosAction(action[0]));

            GridLayout.LayoutParams params = new GridLayout.LayoutParams();
            params.width = 0;
            params.columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f);
            params.rowSpec = GridLayout.spec(i / 2);
            params.setMargins(8, 8, 8, 8);
            card.setLayoutParams(params);
            sosGrid.addView(card);
        }
    }

    private void onSosAction(String action) {
        // Show countdown confirmation
        com.google.android.material.dialog.MaterialAlertDialogBuilder builder = new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext());
        builder.setTitle("Confirm " + action);
        builder.setMessage("Hold to confirm. This will send your GPS location to emergency responders.");
        builder.setPositiveButton("Send Now", (dialog, which) -> {
            sendSos(action);
        });
        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    private void sendSos(String type) {
        // Create SOS event
        com.safesphere.nativeapp.data.entity.SosEventEntity event = new com.safesphere.nativeapp.data.entity.SosEventEntity();
        event.id = "sos-" + System.currentTimeMillis();
        event.userId = "user-3"; // Current user
        event.type = type.toLowerCase().replace(" ", "_");
        event.lat = 25.5941;
        event.lng = 85.1376;
        event.message = "SOS: " + type;
        event.status = "sent";
        event.createdAt = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.getDefault()).format(new java.util.Date());

        sosRepository.insertSosEvent(event);

        com.google.android.material.snackbar.Snackbar.make(requireView(), "SOS sent: " + type, com.google.android.material.snackbar.Snackbar.LENGTH_LONG)
                .setBackgroundTint(getColor(R.color.colorSuccess))
                .show();
    }

    private void setupHelplines() {
        String[][] helplines = {
                {"Control Room", "1070", "☎️"},
                {"Police", "100", "👮"},
                {"Ambulance", "108", "🚑"},
                {"Fire", "101", "🚒"}
        };

        for (int i = 0; i < helplines.length; i++) {
            String[] h = helplines[i];
            View card = LayoutInflater.from(requireContext()).inflate(R.layout.item_emergency_contact, helplineGrid, false);
            TextView name = card.findViewById(R.id.contactName);
            TextView number = card.findViewById(R.id.contactNumber);
            TextView icon = card.findViewById(R.id.contactIcon);
            name.setText(h[0]);
            number.setText(h[1]);
            icon.setText(h[2]);

            int finalI = i;
            card.setOnClickListener(v -> {
                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_DIAL);
                intent.setData(android.net.Uri.parse("tel:" + helplines[finalI][1]));
                startActivity(intent);
            });

            GridLayout.LayoutParams params = new GridLayout.LayoutParams();
            params.width = 0;
            params.columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f);
            params.rowSpec = GridLayout.spec(i / 2);
            card.setLayoutParams(params);
            helplineGrid.addView(card);
        }
    }

    private void loadSosHistory() {
        sosRepository.getSosEventsByUserId("user-3").observe((LifecycleOwner) this, events -> {
            // TODO: Show history in a separate section
        });
    }
}