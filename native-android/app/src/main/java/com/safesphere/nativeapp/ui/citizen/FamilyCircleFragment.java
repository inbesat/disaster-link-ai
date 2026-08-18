package com.safesphere.nativeapp.ui.citizen;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.textfield.TextInputEditText;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.FamilyMemberEntity;
import com.safesphere.nativeapp.data.repository.FamilyMemberRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.List;

public class FamilyCircleFragment extends BaseFragment {

    private FamilyMemberRepository familyRepository;
    private RecyclerView familyRecyclerView;
    private TextInputEditText nameInput, phoneInput, relationInput;
    private Button addBtn;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_family_circle;
    }

    @Override
    protected void initViews(View view) {
        familyRepository = new FamilyMemberRepository(requireActivity());
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
    }

    private void updateFamily(List<FamilyMemberEntity> members) {
        if (members != null) {
            familyRecyclerView.setAdapter(new FamilyAdapter(new ArrayList<>(members)));
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
        member.lat = 25.5941;
        member.lng = 85.1376;
        member.status = "safe";
        member.lastSeen = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.getDefault()).format(new java.util.Date());
        member.createdAt = member.lastSeen;

        familyRepository.insertFamilyMember(member);
        nameInput.setText("");
        phoneInput.setText("");
        relationInput.setText("");
        Toast.makeText(requireContext(), "Family member added", Toast.LENGTH_SHORT).show();
    }

    static class FamilyAdapter extends RecyclerView.Adapter<FamilyAdapter.VH> {
        List<FamilyMemberEntity> items = new ArrayList<>();
        FamilyAdapter(List<FamilyMemberEntity> items) { this.items = items; }

        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) {
            View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_family_card, p, false);
            return new VH(view);
        }

        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            FamilyMemberEntity m = items.get(pos);
            h.name.setText(m.name);
            h.relation.setText(m.relation);
            h.phone.setText(m.phone);
            h.status.setText(m.status);
            h.status.setTextColor(h.itemView.getContext().getColor(
                    m.status.equals("safe") ? R.color.colorSuccess :
                            m.status.equals("at_risk") ? R.color.colorWarning : R.color.textMuted
            ));
        }

        @Override public int getItemCount() { return items.size(); }

        static class VH extends RecyclerView.ViewHolder {
            TextView name, relation, phone, status;
            VH(View v) { super(v); name = v.findViewById(R.id.familyName); relation = v.findViewById(R.id.familyRelation); phone = v.findViewById(R.id.familyPhone); status = v.findViewById(R.id.familyStatus); }
        }
    }
}