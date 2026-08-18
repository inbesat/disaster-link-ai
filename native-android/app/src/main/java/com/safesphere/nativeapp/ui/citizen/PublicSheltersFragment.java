package com.safesphere.nativeapp.ui.citizen;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.ShelterEntity;
import com.safesphere.nativeapp.data.repository.ShelterRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.List;

public class PublicSheltersFragment extends BaseFragment {

    private ShelterRepository shelterRepository;
    private RecyclerView sheltersRecyclerView;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_public_shelters;
    }

    @Override
    protected void initViews(View view) {
        shelterRepository = new ShelterRepository(requireActivity());
        sheltersRecyclerView = view.findViewById(R.id.sheltersRecyclerView);
        sheltersRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));

        shelterRepository.getAllShelters().observe(getViewLifecycleOwner(), shelters -> {
            if (shelters != null) {
                sheltersRecyclerView.setAdapter(new ShelterAdapter(new ArrayList<>(shelters)));
            }
        });
    }

    static class ShelterAdapter extends RecyclerView.Adapter<ShelterAdapter.VH> {
        List<ShelterEntity> items = new ArrayList<>();
        ShelterAdapter(List<ShelterEntity> items) { this.items = items; }

        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) {
            View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_shelter_card, p, false);
            return new VH(view);
        }

        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            ShelterEntity s = items.get(pos);
            h.name.setText(s.name);
            h.district.setText(s.district);
            h.capacity.setText(s.currentOccupancy + "/" + s.capacity);
            h.facilities.setText(buildFacilities(s));
            int pct = (int) ((s.currentOccupancy * 100f) / Math.max(1, s.capacity));
            h.progress.setProgress(pct);
            h.status.setText(s.status.toUpperCase());
            h.status.setTextColor(h.itemView.getContext().getColor(
                    s.status.equals("full") ? R.color.colorCritical :
                            s.status.equals("open") ? R.color.colorSuccess : R.color.textMuted
            ));
            h.navigate.setOnClickListener(v -> {
                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
                        android.net.Uri.parse("google.navigation:q=" + s.lat + "," + s.lng));
                intent.setPackage("com.google.android.apps.maps");
                v.getContext().startActivity(intent);
            });
        }

        @Override public int getItemCount() { return items.size(); }

        private String buildFacilities(ShelterEntity s) {
            List<String> f = new ArrayList<>();
            if (s.water) f.add("💧 Water");
            if (s.food) f.add("🍞 Food");
            if (s.medical) f.add("🏥 Medical");
            if (s.electricity) f.add("⚡ Power");
            return android.text.TextUtils.join("  •  ", f);
        }

        static class VH extends RecyclerView.ViewHolder {
            TextView name, district, capacity, facilities, status;
            androidx.appcompat.widget.AppCompatSeekBar progress;
            android.widget.Button navigate;
            VH(View v) {
                super(v);
                name = v.findViewById(R.id.shelterName);
                district = v.findViewById(R.id.shelterDistrict);
                capacity = v.findViewById(R.id.shelterCapacity);
                facilities = v.findViewById(R.id.shelterFacilities);
                progress = v.findViewById(R.id.shelterProgress);
                status = v.findViewById(R.id.shelterStatus);
                navigate = v.findViewById(R.id.shelterNavigate);
            }
        }
    }
}