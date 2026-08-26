package com.safesphere.nativeapp.ui.gov;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.EvacuationEntity;
import com.safesphere.nativeapp.data.entity.ShelterEntity;
import com.safesphere.nativeapp.data.repository.EvacuationRepository;
import com.safesphere.nativeapp.data.repository.ShelterRepository;
import com.safesphere.nativeapp.ui.map.SafeSphereMapHelper;

import org.maplibre.android.maps.MapLibreMap;
import org.maplibre.android.maps.MapView;
import org.maplibre.android.maps.Style;

import java.util.List;

/** "Map" tab of Evacuations: villages, destination shelters and route lines. */
public class EvacMapTabFragment extends Fragment {

    private MapView mapView;

    private List<EvacuationEntity> latestEvacuations;
    private List<ShelterEntity> latestShelters;

    @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
        return inf.inflate(R.layout.fragment_evac_map, c, false);
    }

    @Override public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        mapView = view.findViewById(R.id.evacMapView);
        mapView.onCreate(savedInstanceState);

        EvacuationRepository evacRepo =
                new EvacuationRepository(requireActivity().getApplication());
        ShelterRepository shelterRepo =
                new ShelterRepository(requireActivity().getApplication());

        evacRepo.getAllEvacuations().observe(getViewLifecycleOwner(), items -> {
            latestEvacuations = items;
            renderIfReady();
        });
        shelterRepo.getAllShelters().observe(getViewLifecycleOwner(), items -> {
            latestShelters = items;
            renderIfReady();
        });

        mapView.getMapAsync(map -> {
            SafeSphereMapHelper.loadDarkStyle(map, style -> onStyleReady(map, style));
            map.addOnMapClickListener(point ->
                    SafeSphereMapHelper.handleClick(map, point, requireContext()));
        });
    }

    private void onStyleReady(MapLibreMap map, Style style) {
        styleRef = style;
        mapRef = map;
        SafeSphereMapHelper.setupBaseLayers(style);
        SafeSphereMapHelper.flyToDemoArea(map);
        renderIfReady();
    }

    private Style styleRef;
    private MapLibreMap mapRef;

    private void renderIfReady() {
        if (styleRef == null) return;
        if (latestShelters != null) {
            SafeSphereMapHelper.updateShelters(styleRef, latestShelters);
            SafeSphereMapHelper.updateEvacuations(styleRef, latestEvacuations, latestShelters);
        }
    }

    @Override public void onStart() { super.onStart(); if (mapView != null) mapView.onStart(); }
    @Override public void onResume() { super.onResume(); if (mapView != null) mapView.onResume(); }
    @Override public void onPause() { super.onPause(); if (mapView != null) mapView.onPause(); }
    @Override public void onStop() { super.onStop(); if (mapView != null) mapView.onStop(); }
    @Override public void onDestroyView() { super.onDestroyView(); if (mapView != null) { mapView.onDestroy(); mapView = null; } }
    @Override public void onLowMemory() { super.onLowMemory(); if (mapView != null) mapView.onLowMemory(); }
    @Override public void onSaveInstanceState(@NonNull Bundle outState) { super.onSaveInstanceState(outState); if (mapView != null) mapView.onSaveInstanceState(outState); }
}