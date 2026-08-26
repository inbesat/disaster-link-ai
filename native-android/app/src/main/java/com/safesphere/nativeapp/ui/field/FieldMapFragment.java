package com.safesphere.nativeapp.ui.field;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.repository.ResourceRepository;
import com.safesphere.nativeapp.data.repository.ShelterRepository;
import com.safesphere.nativeapp.ui.map.SafeSphereMapHelper;

import org.maplibre.android.maps.MapLibreMap;
import org.maplibre.android.maps.MapView;
import org.maplibre.android.maps.Style;

public class FieldMapFragment extends Fragment {

    private MapView mapView;

    @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
        return inf.inflate(R.layout.fragment_field_map, c, false);
    }

    @Override public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        mapView = view.findViewById(R.id.fieldMapView);
        mapView.onCreate(savedInstanceState);

        ShelterRepository shelterRepo = new ShelterRepository(requireActivity().getApplication());
        ResourceRepository resourceRepo = new ResourceRepository(requireActivity().getApplication());

        mapView.getMapAsync(map -> {
            SafeSphereMapHelper.loadDarkStyle(map, style ->
                    onStyleReady(map, style, shelterRepo, resourceRepo));
            map.addOnMapClickListener(point ->
                    SafeSphereMapHelper.handleClick(map, point, requireContext()));
        });
    }

    private void onStyleReady(MapLibreMap map, Style style,
                              ShelterRepository shelterRepo,
                              ResourceRepository resourceRepo) {
        SafeSphereMapHelper.setupBaseLayers(style);
        SafeSphereMapHelper.flyToDemoArea(map);

        shelterRepo.getAllShelters().observe(getViewLifecycleOwner(), shelters -> {
            if (shelters != null) SafeSphereMapHelper.updateShelters(style, shelters);
        });
        resourceRepo.getAllResources().observe(getViewLifecycleOwner(), resources -> {
            if (resources != null) SafeSphereMapHelper.updateResources(style, resources);
        });
    }

    @Override public void onStart() { super.onStart(); if (mapView != null) mapView.onStart(); }
    @Override public void onResume() { super.onResume(); if (mapView != null) mapView.onResume(); }
    @Override public void onPause() { super.onPause(); if (mapView != null) mapView.onPause(); }
    @Override public void onStop() { super.onStop(); if (mapView != null) mapView.onStop(); }
    @Override public void onDestroyView() { super.onDestroyView(); if (mapView != null) { mapView.onDestroy(); mapView = null; } }
    @Override public void onLowMemory() { super.onLowMemory(); if (mapView != null) mapView.onLowMemory(); }
    @Override public void onSaveInstanceState(@NonNull Bundle outState) { super.onSaveInstanceState(outState); if (mapView != null) mapView.onSaveInstanceState(outState); }
}