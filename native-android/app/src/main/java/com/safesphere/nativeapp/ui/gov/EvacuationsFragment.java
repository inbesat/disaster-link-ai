package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.lifecycle.Lifecycle;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.EvacuationEntity;
import com.safesphere.nativeapp.data.repository.EvacuationRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.List;
import com.google.android.material.chip.Chip;

public class EvacuationsFragment extends BaseFragment {

    private ViewPager2 viewPager;
    private TabLayout tabLayout;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_evacuations;
    }

    @Override
    protected void initViews(View view) {
        viewPager = view.findViewById(R.id.evacViewPager);
        tabLayout = view.findViewById(R.id.evacTabs);

        viewPager.setAdapter(new EvacPagerAdapter(requireActivity()));
        new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
            String[] titles = {"Pending", "In Transit", "Completed", "Map"};
            tab.setText(titles[position]);
        }).attach();
    }

    static class EvacPagerAdapter extends FragmentStateAdapter {
        EvacPagerAdapter(@NonNull FragmentActivity fa) { super(fa); }
        @NonNull @Override public Fragment createFragment(int position) {
            switch (position) {
                case 0: return new EvacKanbanFragment("pending");
                case 1: return new EvacKanbanFragment("in_transit");
                case 2: return new EvacKanbanFragment("completed");
                case 3: return new com.safesphere.nativeapp.ui.gov.EvacMapTabFragment();
                default: return new EvacKanbanFragment("pending");
            }
        }
        @Override public int getItemCount() { return 4; }
    }

    static class EvacKanbanFragment extends Fragment {
        private final String status;
        private EvacuationRepository evacRepository;
        private RecyclerView recyclerView;

        EvacKanbanFragment(String status) { this.status = status; }

        @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
            View view = inf.inflate(R.layout.fragment_evac_kanban, c, false);
            recyclerView = view.findViewById(R.id.evacKanbanRecyclerView);
            recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
            evacRepository = new EvacuationRepository(requireActivity().getApplication());
            evacRepository.getEvacuationsByStatus(status).observe(getViewLifecycleOwner(), items -> {
                if (items != null) {
                    recyclerView.setAdapter(new EvacAdapter(new ArrayList<>(items)));
                }
            });
            return view;
        }
    }

    static class EvacAdapter extends RecyclerView.Adapter<EvacAdapter.VH> {
        List<EvacuationEntity> items = new ArrayList<>();
        EvacAdapter(List<EvacuationEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_evac_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            EvacuationEntity e = items.get(pos);
            h.village.setText(e.villageName);
            h.shelter.setText("→ " + e.shelterName);
            h.evacuees.setText(e.evacuees + " people");
            h.duration.setText(formatDuration(e.routeDurationSec));
            h.buses.setText(e.busesNeeded + " buses");
            h.boats.setText(e.boatsNeeded + " boats");
            int colorRes = e.status.equals("in_transit") ? R.color.colorWarning : e.status.equals("completed") ? R.color.colorSuccess : R.color.colorInfo;
            h.statusChip.setText(e.status.replace("_", " ").toUpperCase());
            h.statusChip.setChipBackgroundColorResource(colorRes);
            h.itemView.setOnClickListener(v -> {
                // Show detail dialog
                new com.google.android.material.dialog.MaterialAlertDialogBuilder(v.getContext())
                        .setTitle(e.villageName)
                        .setMessage("Shelter: " + e.shelterName + "\nEvacuees: " + e.evacuees + "\nDuration: " + formatDuration(e.routeDurationSec) + "\nBuses: " + e.busesNeeded + "\nBoats: " + e.boatsNeeded + "\nStatus: " + e.status)
                        .setPositiveButton("OK", null)
                        .show();
            });
        }
        @Override public int getItemCount() { return items.size(); }
        private String formatDuration(int sec) {
            int h = sec / 3600; int m = (sec % 3600) / 60;
            return h + "h " + m + "m";
        }
        static class VH extends RecyclerView.ViewHolder { TextView village, shelter, evacuees, duration, buses, boats; com.google.android.material.chip.Chip statusChip; VH(View v) { super(v); village = v.findViewById(R.id.evacVillage); shelter = v.findViewById(R.id.evacShelter); evacuees = v.findViewById(R.id.evacEvacuees); duration = v.findViewById(R.id.evacDuration); buses = v.findViewById(R.id.evacBuses); boats = v.findViewById(R.id.evacBoats); statusChip = v.findViewById(R.id.evacStatusChip); } }
    }
}