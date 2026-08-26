package com.safesphere.nativeapp.ui.citizen;

import android.Manifest;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.textfield.TextInputEditText;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.FamilyMemberEntity;
import com.safesphere.nativeapp.data.repository.FamilyMemberRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;
import com.safesphere.nativeapp.util.LocationHelper;

import java.util.ArrayList;
import java.util.List;

public class FamilyCircleFragment extends BaseFragment {

    private FamilyMemberRepository familyRepository;
    private RecyclerView familyRecyclerView;
    private TextInputEditText nameInput, phoneInput, relationInput;
    private Button addBtn;

    private double myLat = Double.NaN;
    private double myLng = Double.NaN;
    private FamilyAdapter adapter;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_family_circle;
    }

    @Override
    protected void initViews(View view) {
        familyRepository = new FamilyMemberRepository(requireActivity().getApplication());
        familyRecyclerView = view.findViewById(R.id.familyRecyclerView);
        nameInput = view.findViewById(R.id.familyNameInput);
        phoneInput = view.findViewById(R.id.familyPhoneInput);
        relationInput = view.findViewById(R.id.familyRelationInput);
        addBtn = view.findViewById(R.id.addFamilyBtn);

        familyRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        String userId = roleManager.getUserId();
        if (userId != null) {
            familyRepository.getFamilyMembersByUserId(userId).observe(getViewLifecycleOwner(), this::updateFamily);
        }

        addBtn.setOnClickListener(v -> addFamilyMember());

        withPermission(Manifest.permission.ACCESS_FINE_LOCATION, this::acquireMyLocation);
    }

    private void acquireMyLocation() {
        LocationHelper.getCurrentLocation(this, new LocationHelper.Callback() {
            @Override
            public void onLocation(double lat, double lng, float accuracyMeters) {
                if (!isAdded()) return;
                myLat = lat;
                myLng = lng;
                refreshDistances();
            }

            @Override
            public void onUnavailable(@NonNull String reason) {
                // Distances simply stay "unknown" — no nagging.
            }
        });
    }

    private void refreshDistances() {
        if (adapter != null) {
            adapter.setMyLocation(myLat, myLng);
            adapter.notifyDataSetChanged();
        }
    }

    private void updateFamily(List<FamilyMemberEntity> members) {
        if (members == null) return;
        List<FamilyMemberEntity> copy = new ArrayList<>(members);
        if (adapter == null) {
            adapter = new FamilyAdapter(copy, myLat, myLng);
            familyRecyclerView.setAdapter(adapter);
        } else {
            adapter.items = copy;
            adapter.notifyDataSetChanged();
        }
    }

    private void addFamilyMember() {
        String name = nameInput.getText() != null ? nameInput.getText().toString().trim() : "";
        String phone = phoneInput.getText() != null ? phoneInput.getText().toString().trim() : "";
        String relation = relationInput.getText() != null ? relationInput.getText().toString().trim() : "";

        if (name.isEmpty() || phone.isEmpty()) {
            Toast.makeText(requireContext(), "Name and phone required", Toast.LENGTH_SHORT).show();
            return;
        }

        FamilyMemberEntity member = new FamilyMemberEntity();
        member.id = "fam-" + System.currentTimeMillis();
        member.userId = roleManager.getUserId() != null ? roleManager.getUserId() : "user-3";
        member.name = name;
        member.phone = phone;
        member.relation = relation.isEmpty() ? "Family" : relation;
        // Demo: place new members near the district center until real presence sync exists
        member.lat = 25.5941 + ((Math.abs(name.hashCode()) % 100) / 10000.0);
        member.lng = 85.1376 + ((Math.abs(phone.hashCode()) % 100) / 10000.0);
        member.status = "safe";
        member.lastSeen = utcNow();
        member.createdAt = member.lastSeen;

        familyRepository.insertFamilyMember(member);
        nameInput.setText("");
        phoneInput.setText("");
        relationInput.setText("");
        Toast.makeText(requireContext(), "Family member added", Toast.LENGTH_SHORT).show();
    }

    private static String utcNow() {
        return new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US)
                .format(new java.util.Date());
    }

    static class FamilyAdapter extends RecyclerView.Adapter<FamilyAdapter.VH> {
        List<FamilyMemberEntity> items = new ArrayList<>();
        double myLat = Double.NaN, myLng = Double.NaN;

        FamilyAdapter(List<FamilyMemberEntity> items) { this.items = items; }
        FamilyAdapter(List<FamilyMemberEntity> items, double myLat, double myLng) {
            this(items); this.myLat = myLat; this.myLng = myLng;
        }

        void setMyLocation(double lat, double lng) { this.myLat = lat; this.myLng = lng; }

        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) {
            View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_family_card, p, false);
            return new VH(view);
        }

        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            FamilyMemberEntity m = items.get(pos);
            h.name.setText(m.name);
            h.relation.setText(m.relation);
            h.phone.setText(m.phone);

            h.status.setText(safeStatus(m.status));
            h.status.setTextColor(h.itemView.getContext().getColor(
                    "safe".equals(m.status) ? R.color.colorSuccess :
                            "at_risk".equals(m.status) ? R.color.colorWarning : R.color.textMuted
            ));

            if (!Double.isNaN(myLat)) {
                double dist = LocationHelper.distanceMeters(myLat, myLng, m.lat, m.lng);
                h.distance.setText(LocationHelper.formatDistance(dist));
            } else {
                h.distance.setText("Distance unknown");
            }
        }

        private String safeStatus(String s) {
            if (s == null) return "UNKNOWN";
            return s.replace('_', ' ').toUpperCase(java.util.Locale.US);
        }

        @Override public int getItemCount() { return items.size(); }

        static class VH extends RecyclerView.ViewHolder {
            TextView name, relation, phone, status, distance;
            VH(View v) { super(v); name = v.findViewById(R.id.familyName); relation = v.findViewById(R.id.familyRelation); phone = v.findViewById(R.id.familyPhone); status = v.findViewById(R.id.familyStatus); distance = v.findViewById(R.id.familyDistance); }
        }
    }
}