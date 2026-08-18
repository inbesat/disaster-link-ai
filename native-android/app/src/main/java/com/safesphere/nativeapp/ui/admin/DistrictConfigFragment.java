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

import com.google.android.material.textfield.TextInputEditText;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.DistrictConfigEntity;
import com.safesphere.nativeapp.data.repository.DistrictConfigRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.List;

public class DistrictConfigFragment extends BaseFragment {

    private DistrictConfigRepository districtConfigRepository;
    private RecyclerView districtConfigRecyclerView;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_district_config;
    }

    @Override
    protected void initViews(View view) {
        districtConfigRepository = new DistrictConfigRepository(requireActivity());
        districtConfigRecyclerView = view.findViewById(R.id.districtConfigRecyclerView);
        districtConfigRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));

        districtConfigRepository.getAllDistrictConfigs().observe(getViewLifecycleOwner(), configs -> {
            if (configs != null) {
                districtConfigRecyclerView.setAdapter(new DistrictConfigAdapter(new ArrayList<>(configs)));
            }
        });
    }

    static class DistrictConfigAdapter extends RecyclerView.Adapter<DistrictConfigAdapter.VH> {
        List<DistrictConfigEntity> items = new ArrayList<>();
        DistrictConfigAdapter(List<DistrictConfigEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_district_config, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            DistrictConfigEntity d = items.get(pos);
            h.district.setText(d.district);
            h.floodThreshold.setText(String.valueOf(d.floodThreshold));
            h.warningThreshold.setText(String.valueOf(d.warningThreshold));
            h.criticalThreshold.setText(String.valueOf(d.criticalThreshold));
            h.saveBtn.setOnClickListener(v -> {
                d.floodThreshold = Double.parseDouble(h.floodThreshold.getText().toString());
                d.warningThreshold = Double.parseDouble(h.warningThreshold.getText().toString());
                d.criticalThreshold = Double.parseDouble(h.criticalThreshold.getText().toString());
                // TODO: Save to repository
                Toast.makeText(h.itemView.getContext(), d.district + " thresholds saved", Toast.LENGTH_SHORT).show();
            });
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView district; TextInputEditText floodThreshold, warningThreshold, criticalThreshold; Button saveBtn; VH(View v) { super(v); district = v.findViewById(R.id.dcDistrict); floodThreshold = v.findViewById(R.id.dcFloodThreshold); warningThreshold = v.findViewById(R.id.dcWarningThreshold); criticalThreshold = v.findViewById(R.id.dcCriticalThreshold); saveBtn = v.findViewById(R.id.dcSaveBtn); } }
    }
}