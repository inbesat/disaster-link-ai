package com.safesphere.nativeapp.ui.map;

import android.content.Context;
import android.graphics.Color;
import android.graphics.PointF;

import androidx.annotation.NonNull;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.safesphere.nativeapp.data.entity.EvacuationEntity;
import com.safesphere.nativeapp.data.entity.ResourceEntity;
import com.safesphere.nativeapp.data.entity.RoadClosureEntity;
import com.safesphere.nativeapp.data.entity.ShelterEntity;

import org.maplibre.android.camera.CameraUpdateFactory;
import org.maplibre.android.geometry.LatLng;
import org.maplibre.android.geometry.LatLngBounds;
import org.maplibre.android.maps.MapLibreMap;
import org.maplibre.android.maps.Style;
import org.maplibre.android.style.layers.CircleLayer;
import org.maplibre.android.style.layers.LineLayer;
import org.maplibre.android.style.layers.PropertyFactory;
import org.maplibre.android.style.sources.GeoJsonSource;
import org.maplibre.geojson.Feature;
import org.maplibre.geojson.FeatureCollection;
import org.maplibre.geojson.LineString;
import org.maplibre.geojson.Point;

import java.util.ArrayList;
import java.util.List;

/**
 * Shared MapLibre styling + data layers. All layers are backed by local
 * GeoJSON sources so they render fully offline once tiles are cached.
 */
public final class SafeSphereMapHelper {

    public static final String STYLE_URL =
            "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

    /** Demo operations area: Patna, Bihar and surroundings. */
    public static final double DEMO_LAT = 25.5941;
    public static final double DEMO_LNG = 85.1376;
    public static final LatLng DEMO_CENTER = new LatLng(DEMO_LAT, DEMO_LNG);

    // Source ids
    public static final String SRC_SHELTER_OPEN = "ss-shelters-open";
    public static final String SRC_SHELTER_FULL = "ss-shelters-full";
    public static final String SRC_SHELTER_CLOSED = "ss-shelters-closed";
    public static final String SRC_RESOURCES = "ss-resources";
    public static final String SRC_CLOSURES = "ss-closures";
    public static final String SRC_SOS = "ss-sos";
    public static final String SRC_EVAC_LINES = "ss-evac-lines";
    public static final String SRC_VILLAGES = "ss-villages";

    // Layer ids
    public static final String LYR_SHELTER_OPEN = "lyr-shelters-open";
    public static final String LYR_SHELTER_FULL = "lyr-shelters-full";
    public static final String LYR_SHELTER_CLOSED = "lyr-shelters-closed";
    public static final String LYR_RESOURCES = "lyr-resources";
    public static final String LYR_CLOSURES = "lyr-closures";
    public static final String LYR_SOS = "lyr-sos";
    public static final String LYR_EVAC_LINES = "lyr-evac-lines";
    public static final String LYR_VILLAGES = "lyr-villages";

    private static final String[] SHELTER_LAYERS = {
            LYR_SHELTER_OPEN, LYR_SHELTER_FULL, LYR_SHELTER_CLOSED };

    private SafeSphereMapHelper() {}

    public static void loadDarkStyle(@NonNull MapLibreMap map, @NonNull Style.OnStyleLoaded onLoaded) {
        map.setStyle(new Style.Builder().fromUri(STYLE_URL), onLoaded);
    }

    /** Creates empty GeoJSON sources + styled layers. Idempotent per Style instance. */
    public static void setupBaseLayers(@NonNull Style style) {
        addCircleLayer(style, SRC_SHELTER_OPEN, LYR_SHELTER_OPEN, "#22C55E", 8f);
        addCircleLayer(style, SRC_SHELTER_FULL, LYR_SHELTER_FULL, "#EF4444", 8f);
        addCircleLayer(style, SRC_SHELTER_CLOSED, LYR_SHELTER_CLOSED, "#64748B", 6f);
        addCircleLayer(style, SRC_RESOURCES, LYR_RESOURCES, "#3B82F6", 7f);
        addCircleLayer(style, SRC_CLOSURES, LYR_CLOSURES, "#F59E0B", 7f);
        addCircleLayer(style, SRC_SOS, LYR_SOS, "#F87171", 10f);
        addCircleLayer(style, SRC_VILLAGES, LYR_VILLAGES, "#A78BFA", 9f);

        style.addSource(new GeoJsonSource(SRC_EVAC_LINES));
        style.addLayer(new LineLayer(LYR_EVAC_LINES, SRC_EVAC_LINES)
                .withProperties(
                        PropertyFactory.lineColor("#F59E0B"),
                        PropertyFactory.lineWidth(3f),
                        PropertyFactory.lineOpacity(0.85f)));
    }

    private static void addCircleLayer(Style style, String sourceId, String layerId,
                                       String colorHex, float radius) {
        style.addSource(new GeoJsonSource(sourceId, FeatureCollection.fromFeatures(new ArrayList<>())));
        style.addLayer(new CircleLayer(layerId, sourceId)
                .withProperties(
                        PropertyFactory.circleColor(Color.parseColor(colorHex)),
                        PropertyFactory.circleRadius(radius),
                        PropertyFactory.circleStrokeColor(Color.WHITE),
                        PropertyFactory.circleStrokeWidth(1.5f),
                        PropertyFactory.circleOpacity(0.92f)));
    }

    // ------------------------------------------------------------------ data

    public static void updateShelters(@NonNull Style style, List<ShelterEntity> shelters) {
        List<Feature> open = new ArrayList<>();
        List<Feature> full = new ArrayList<>();
        List<Feature> closed = new ArrayList<>();
        if (shelters != null) {
            for (ShelterEntity s : shelters) {
                Feature f = pointFeature(s.lat, s.lng);
                f.addStringProperty("id", safe(s.id));
                f.addStringProperty("name", safe(s.name));
                f.addStringProperty("district", safe(s.district));
                f.addStringProperty("status", safe(s.status));
                f.addStringProperty("capacity",
                        safe(s.currentOccupancy) + "/" + safe(s.capacity));
                if ("open".equalsIgnoreCase(s.status)) open.add(f);
                else if ("full".equalsIgnoreCase(s.status)) full.add(f);
                else closed.add(f);
            }
        }
        setSource(style, SRC_SHELTER_OPEN, open);
        setSource(style, SRC_SHELTER_FULL, full);
        setSource(style, SRC_SHELTER_CLOSED, closed);
    }

    public static void updateResources(@NonNull Style style, List<ResourceEntity> resources) {
        List<Feature> features = new ArrayList<>();
        if (resources != null) {
            for (ResourceEntity r : resources) {
                Feature f = pointFeature(r.lat, r.lng);
                f.addStringProperty("name", safe(r.depotName));
                f.addStringProperty("category", safe(r.category));
                f.addStringProperty("quantity", safe(r.quantity) + " " + safe(r.unit));
                features.add(f);
            }
        }
        setSource(style, SRC_RESOURCES, features);
    }

    public static void updateClosures(@NonNull Style style, List<RoadClosureEntity> closures) {
        List<Feature> features = new ArrayList<>();
        if (closures != null) {
            for (RoadClosureEntity c : closures) {
                Feature f = pointFeature(c.lat, c.lng);
                f.addStringProperty("roadName", safe(c.roadName));
                f.addStringProperty("description", safe(c.description));
                features.add(f);
            }
        }
        setSource(style, SRC_CLOSURES, features);
    }

    /**
     * Evacuation routes rendered as straight lines from village to destination
     * shelter. Villages have no stored coordinates in demo data, so a stable
     * pseudo-geocode (hash-derived offset around the district center) keeps
     * pins consistent between launches without needing network geocoding.
     */
    public static void updateEvacuations(@NonNull Style style,
                                         List<EvacuationEntity> evacuations,
                                         List<ShelterEntity> shelters) {
        List<Feature> lines = new ArrayList<>();
        List<Feature> villages = new ArrayList<>();
        if (evacuations != null) {
            for (EvacuationEntity e : evacuations) {
                LatLng village = pseudoGeocode(e.villageName);
                LatLng shelter = findShelter(shelters, e.shelterName);
                if (shelter == null) shelter = pseudoGeocode("shelter:" + e.shelterName);

                List<Point> pts = new ArrayList<>();
                pts.add(Point.fromLngLat(village.getLongitude(), village.getLatitude()));
                pts.add(Point.fromLngLat(shelter.getLongitude(), shelter.getLatitude()));
                Feature line = Feature.fromGeometry(LineString.fromLngLats(pts));
                line.addStringProperty("village", safe(e.villageName));
                line.addStringProperty("status", safe(e.status));
                lines.add(line);

                Feature v = pointFeature(village.getLatitude(), village.getLongitude());
                v.addStringProperty("name", safe(e.villageName));
                v.addStringProperty("evacuees", safe(e.evacuees));
                villages.add(v);
            }
        }
        setSource(style, SRC_EVAC_LINES, lines);
        setSource(style, SRC_VILLAGES, villages);
    }

    private static LatLng findShelter(List<ShelterEntity> shelters, String name) {
        if (shelters == null || name == null) return null;
        for (ShelterEntity s : shelters) {
            if (name.equalsIgnoreCase(s.name)) return new LatLng(s.lat, s.lng);
        }
        return null;
    }

    private static LatLng pseudoGeocode(String seed) {
        int h = Math.abs((seed == null ? "x" : seed).hashCode());
        double latOffset = ((h % 1000) / 10000.0) - 0.05;
        double lngOffset = (((h / 1000) % 1000) / 10000.0) - 0.05;
        return new LatLng(DEMO_LAT + latOffset, DEMO_LNG + lngOffset);
    }

    private static Feature pointFeature(double lat, double lng) {
        return Feature.fromGeometry(Point.fromLngLat(lng, lat));
    }

    private static void setSource(Style style, String sourceId, List<Feature> features) {
        GeoJsonSource src = style.getSourceAs(sourceId);
        if (src != null) src.setGeoJson(FeatureCollection.fromFeatures(features));
    }

    private static String safe(Object o) { return o == null ? "" : String.valueOf(o); }

    // ---------------------------------------------------------------- clicks

    /** Returns true if a known layer was hit (dialog shown). */
    public static boolean handleClick(@NonNull MapLibreMap map, @NonNull LatLng point,
                                      @NonNull Context context) {
        PointF screen = map.getProjection().toScreenLocation(point);
        List<Feature> hits = map.queryRenderedFeatures(screen,
                LYR_SHELTER_OPEN, LYR_SHELTER_FULL, LYR_SHELTER_CLOSED,
                LYR_RESOURCES, LYR_CLOSURES, LYR_VILLAGES);
        if (hits.isEmpty()) return false;
        Feature hit = hits.get(0);
        StringBuilder sb = new StringBuilder();
        String title = "Location";
        if (hit.hasProperty("name")) title = hit.getStringProperty("name");
        for (String key : new String[]{"district", "status", "capacity",
                "category", "quantity", "roadName", "description", "evacuees"}) {
            if (hit.hasProperty(key)) {
                String val = hit.getStringProperty(key);
                if (val != null && !val.isEmpty()) {
                    if (sb.length() > 0) sb.append("\n");
                    sb.append(prettyKey(key)).append(": ").append(val);
                }
            }
        }
        new MaterialAlertDialogBuilder(context)
                .setTitle(title)
                .setMessage(sb.length() > 0 ? sb.toString() : "No details available")
                .setPositiveButton("Close", null)
                .show();
        return true;
    }

    private static String prettyKey(String key) {
        switch (key) {
            case "roadName": return "Road";
            default: return Character.toUpperCase(key.charAt(0)) + key.substring(1);
        }
    }

    // ---------------------------------------------------------------- camera

    public static void flyToDemoArea(@NonNull MapLibreMap map) {
        map.moveCamera(CameraUpdateFactory.newLatLngZoom(DEMO_CENTER, 12));
    }

    public static LatLngBounds demoBounds() {
        return LatLngBounds.from(DEMO_LAT + 0.35, DEMO_LNG + 0.45,
                DEMO_LAT - 0.35, DEMO_LNG - 0.45);
    }
}