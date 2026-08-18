package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.SearchView;

import androidx.annotation.NonNull
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.ShelterEntity;
import com.safesphere.nativeapp.data.repository.ShelterRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.List;

public class SheltersMgmtFragment extends BaseFragment {

    private ShelterRepository shelterRepository;
    private RecyclerView sheltersRecyclerView;
    private SearchView searchView;
    private FloatingActionButton fabAdd;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_shelters_mgmt;
    }

    @Override
    protected void initViews(View view) {
        shelterRepository = new ShelterRepository(requireActivity());
        sheltersRecyclerView = view.findViewById(R.id.sheltersMgmtRecyclerView);
        searchView = view.findViewById(R.id.shelterSearchView);
        fabAdd = view.findViewById(R.id.fabAddShelter);

        sheltersRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        loadShelters();

        setupSearch();
        setupFab();
    }

    private void loadShelters() {
        shelterRepository.getAllShelters().observe(getViewLifecycleOwner(), shelters -> {
            if (shelters != null) {
                sheltersRecyclerView.setAdapter(new ShelterAdapter(new ArrayList<>(shelters)));
            }
        });
    }

    private void setupSearch() {
        searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override public boolean onQueryTextSubmit(String query) { return false; }
            @Override public boolean onQueryTextChange(String newText) { return false; }
        });
    }

    private void setupFab() {
        fabAdd.setOnClickListener(v -> showAddShelterDialog());
    }

    private void showAddShelterDialog() {
        View dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_add_shelter, null);
        new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                .setTitle("Add Shelter")
                .setView(dialogView)
                .setPositiveButton("Save", (d, w) -> {})
                .setNegativeButton("Cancel", null)
                .show();
    }

    static class ShelterAdapter extends RecyclerView.Adapter<ShelterAdapter.VH> {
        List<ShelterEntity> items = new ArrayList<>();
        ShelterAdapter(List<ShelterEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_shelter_mgmt_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            ShelterEntity s = items.get(pos);
            h.name.setText(s.name);
            h.district.setText(s.district);
            h.capacity.setText(s.currentOccupancy + "/" + s.capacity);
            h.facilities.setText(buildFacilities(s));
            int pct = (int) ((s.currentOccupancy * 100f) / Math.max(1, s.capacity));
            h.progress.setProgress(pct);
            h.status.setText(s.status.toUpperCase());
            h.status.setChipBackgroundColorResource(
                    s.status.equals("full") ? R.color.colorCritical :
                            s.status.equals("open") ? R.color.colorSuccess : R.color.textMuted
            );
            h.edit.setOnClickListener(v -> {});
            h.delete.setOnClickListener(v -> {});
        }
        @Override public int getItemCount() { return items.size(); }
        private String buildFacilities(ShelterEntity s) {
            List<String> f = new ArrayList<>(); if (s.water) f.add("💧"); if (s.food) f.add("🍞"); if (s.medical) f.add("🏥"); if (s.electricity) f.add("⚡");
            return android.text.TextUtils.join("  ", f);
        }
        static class VH extends RecyclerView.ViewHolder { TextView name, district, capacity, facilities; androidx.appcompat.widget.AppCompatSeekBar progress; com.google.android.material.chip.Chip status; ImageView edit, delete; VH(View v) { super(v); name = v.findViewById(R.id.shelterName); district = v.findViewById(R.id.shelterDistrict); capacity = v.findViewById(R.id.shelterCapacity); facilities = v.findViewById(R.id.shelterFacilities); progress = v.findViewById(R.id.shelterProgress); status = v.findViewById(R.id.shelterStatus); edit = v.findViewById(R.id.shelterEdit); delete = v.findViewById(R.id.shelterDelete); } }
    }
}