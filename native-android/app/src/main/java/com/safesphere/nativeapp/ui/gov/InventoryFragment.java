package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.SearchView;
import android.widget.Spinner;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.ResourceEntity;
import com.safesphere.nativeapp.data.repository.ResourceRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class InventoryFragment extends BaseFragment {

    private ResourceRepository resourceRepository;
    private RecyclerView inventoryRecyclerView;
    private SearchView searchView;
    private Spinner categorySpinner, statusSpinner;
    private FloatingActionButton fabAdd;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_inventory;
    }

    @Override
    protected void initViews(View view) {
        resourceRepository = new ResourceRepository(requireActivity());
        inventoryRecyclerView = view.findViewById(R.id.inventoryRecyclerView);
        searchView = view.findViewById(R.id.invSearchView);
        categorySpinner = view.findViewById(R.id.invCategorySpinner);
        statusSpinner = view.findViewById(R.id.invStatusSpinner);
        fabAdd = view.findViewById(R.id.fabAddResource);

        inventoryRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        loadResources();

        setupSpinners();
        setupSearch();
        setupFab();
    }

    private void loadResources() {
        resourceRepository.getAllResources().observe(getViewLifecycleOwner(), resources -> {
            if (resources != null) {
                inventoryRecyclerView.setAdapter(new ResourceAdapter(new ArrayList<>(resources)));
            }
        });
    }

    private void setupSpinners() {
        String[] categories = {"All", "boat", "food", "medical", "water", "personnel", "vehicle", "communication", "power", "other"};
        String[] statuses = {"All", "available", "deployed", "maintenance"};
        categorySpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, categories));
        statusSpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, statuses));
    }

    private void setupSearch() {
        searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override public boolean onQueryTextSubmit(String query) { return false; }
            @Override public boolean onQueryTextChange(String newText) { return false; }
        });
    }

    private void setupFab() {
        fabAdd.setOnClickListener(v -> showAddResourceDialog());
    }

    private void showAddResourceDialog() {
        View dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_add_resource, null);
        new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                .setTitle("Add Resource")
                .setView(dialogView)
                .setPositiveButton("Save", (d, w) -> {
                    // TODO: Save resource
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    static class ResourceAdapter extends RecyclerView.Adapter<ResourceAdapter.VH> {
        List<ResourceEntity> items = new ArrayList<>();
        ResourceAdapter(List<ResourceEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_resource_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            ResourceEntity r = items.get(pos);
            h.name.setText(r.name);
            h.category.setText(r.category.toUpperCase());
            h.quantity.setText(r.quantity + " " + (r.unit != null ? r.unit : ""));
            h.depot.setText(r.depotName != null ? r.depotName : "—");
            h.coords.setText(String.format("%.4f, %.4f", r.lat, r.lng));
            h.status.setText(r.status.toUpperCase());
            h.status.setChipBackgroundColorResource(
                    r.status.equals("available") ? R.color.colorSuccess :
                            r.status.equals("deployed") ? R.color.colorWarning : R.color.colorCritical
            );
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView name, category, quantity, depot, coords; com.google.android.material.chip.Chip status; VH(View v) { super(v); name = v.findViewById(R.id.resName); category = v.findViewById(R.id.resCategory); quantity = v.findViewById(R.id.resQuantity); depot = v.findViewById(R.id.resDepot); coords = v.findViewById(R.id.resCoords); status = v.findViewById(R.id.resStatus); } }
    }
}