package com.safesphere.nativeapp.util;

import android.content.Context;
import android.util.Log;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.AlertEntity;
import com.safesphere.nativeapp.data.entity.DistrictConfigEntity;
import com.safesphere.nativeapp.data.entity.EvacuationEntity;
import com.safesphere.nativeapp.data.entity.FamilyMemberEntity;
import com.safesphere.nativeapp.data.entity.InventoryMovementEntity;
import com.safesphere.nativeapp.data.entity.KnowledgeDocEntity;
import com.safesphere.nativeapp.data.entity.ResourceEntity;
import com.safesphere.nativeapp.data.entity.RoadClosureEntity;
import com.safesphere.nativeapp.data.entity.ShelterEntity;
import com.safesphere.nativeapp.data.entity.SosEventEntity;
import com.safesphere.nativeapp.data.entity.UserEntity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class SeedDataLoader {
    private static final String TAG = "SeedDataLoader";
    private final Context context;
    private final SafeSphereDatabase db;

    public SeedDataLoader(Context context) {
        this.context = context;
        this.db = SafeSphereDatabase.getInstance(context);
    }

    public void loadAllSeedData() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> {
            try {
                loadUsers();
                loadShelters();
                loadResources();
                loadEvacuations();
                loadRoadClosures();
                loadDistrictConfigs();
                loadAlerts();
                loadAuditLogs();
                loadFamilyMembers();
                loadSosEvents();
                loadKnowledgeDocs();
                loadInventoryMovements();
                Log.d(TAG, "All seed data loaded successfully");
            } catch (Exception e) {
                Log.e(TAG, "Failed to load seed data", e);
            }
        });
    }

    private void loadUsers() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_users.json");
        JSONArray array = new JSONArray(json);
        List<UserEntity> users = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            users.add(parseUser(array.getJSONObject(i)));
        }
        db.userDao().insertAll(users);
    }

    private void loadShelters() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_shelters.json");
        JSONArray array = new JSONArray(json);
        List<ShelterEntity> shelters = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            shelters.add(parseShelter(array.getJSONObject(i)));
        }
        db.shelterDao().insertAll(shelters);
    }

    private void loadResources() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_resources.json");
        JSONArray array = new JSONArray(json);
        List<ResourceEntity> resources = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            resources.add(parseResource(array.getJSONObject(i)));
        }
        db.resourceDao().insertAll(resources);
    }

    private void loadEvacuations() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_evacuations.json");
        JSONArray array = new JSONArray(json);
        List<EvacuationEntity> evacuations = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            evacuations.add(parseEvacuation(array.getJSONObject(i)));
        }
        db.evacuationDao().insertAll(evacuations);
    }

    private void loadRoadClosures() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_road_closures.json");
        JSONArray array = new JSONArray(json);
        List<RoadClosureEntity> closures = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            closures.add(parseRoadClosure(array.getJSONObject(i)));
        }
        db.roadClosureDao().insertAll(closures);
    }

    private void loadDistrictConfigs() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_district_configs.json");
        JSONArray array = new JSONArray(json);
        List<DistrictConfigEntity> configs = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            configs.add(parseDistrictConfig(array.getJSONObject(i)));
        }
        db.districtConfigDao().insertAll(configs);
    }

    private void loadAlerts() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_alerts.json");
        JSONArray array = new JSONArray(json);
        List<AlertEntity> alerts = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            alerts.add(parseAlert(array.getJSONObject(i)));
        }
        db.alertDao().insertAll(alerts);
    }

    private void loadAuditLogs() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_audit_logs.json");
        JSONArray array = new JSONArray(json);
        List<AuditLogEntity> logs = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            logs.add(parseAuditLog(array.getJSONObject(i)));
        }
        db.auditLogDao().insertAll(logs);
    }

    private void loadFamilyMembers() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_family_members.json");
        JSONArray array = new JSONArray(json);
        List<FamilyMemberEntity> members = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            members.add(parseFamilyMember(array.getJSONObject(i)));
        }
        db.familyMemberDao().insertAll(members);
    }

    private void loadSosEvents() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_sos_events.json");
        JSONArray array = new JSONArray(json);
        List<SosEventEntity> events = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            events.add(parseSosEvent(array.getJSONObject(i)));
        }
        db.sosEventDao().insertAll(events);
    }

    private void loadKnowledgeDocs() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_knowledge_docs.json");
        JSONArray array = new JSONArray(json);
        List<KnowledgeDocEntity> docs = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            docs.add(parseKnowledgeDoc(array.getJSONObject(i)));
        }
        db.knowledgeDocDao().insertAll(docs);
    }

    private void loadInventoryMovements() throws IOException, JSONException {
        String json = loadJsonFromAssets("seed_inventory_movements.json");
        JSONArray array = new JSONArray(json);
        List<InventoryMovementEntity> movements = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            movements.add(parseInventoryMovement(array.getJSONObject(i)));
        }
        db.inventoryMovementDao().insertAll(movements);
    }

    private String loadJsonFromAssets(String filename) throws IOException {
        InputStream is = context.getAssets().open(filename);
        byte[] buffer = new byte[is.available()];
        is.read(buffer);
        is.close();
        return new String(buffer, StandardCharsets.UTF_8);
    }

    // Parsers
    private UserEntity parseUser(JSONObject o) throws JSONException {
        UserEntity u = new UserEntity();
        u.id = o.optString("id");
        u.email = o.optString("email");
        u.name = o.optString("name");
        u.phone = o.optString("phone");
        u.role = o.optString("role");
        u.organization = o.optString("organization");
        u.assignedDistrict = o.optString("assignedDistrict");
        u.status = o.optString("status");
        u.lastActive = o.optString("lastActive");
        u.avatarUrl = o.optString("avatarUrl");
        u.passwordHash = o.optString("passwordHash");
        u.createdAt = o.optString("createdAt");
        u.updatedAt = o.optString("updatedAt");
        u.guestMode = o.optBoolean("guestMode");
        u.pwdPriority = o.optBoolean("pwdPriority");
        u.pwdDetails = o.optString("pwdDetails");
        return u;
    }

    private ShelterEntity parseShelter(JSONObject o) throws JSONException {
        ShelterEntity s = new ShelterEntity();
        s.id = o.optString("id");
        s.name = o.optString("name");
        s.district = o.optString("district");
        s.lat = o.optDouble("lat");
        s.lng = o.optDouble("lng");
        s.capacity = o.optInt("capacity");
        s.currentOccupancy = o.optInt("currentOccupancy");
        s.water = o.optBoolean("water");
        s.food = o.optBoolean("food");
        s.medical = o.optBoolean("medical");
        s.electricity = o.optBoolean("electricity");
        s.status = o.optString("status");
        s.contactPerson = o.optString("contactPerson");
        s.phone = o.optString("phone");
        s.imageUrl = o.optString("imageUrl");
        s.createdAt = o.optString("createdAt");
        s.updatedAt = o.optString("updatedAt");
        return s;
    }

    private ResourceEntity parseResource(JSONObject o) throws JSONException {
        ResourceEntity r = new ResourceEntity();
        r.id = o.optString("id");
        r.name = o.optString("name");
        r.category = o.optString("category");
        r.quantity = o.optInt("quantity");
        r.unit = o.optString("unit");
        r.depotName = o.optString("depotName");
        r.lat = o.optDouble("lat");
        r.lng = o.optDouble("lng");
        r.status = o.optString("status");
        r.createdAt = o.optString("createdAt");
        r.updatedAt = o.optString("updatedAt");
        return r;
    }

    private EvacuationEntity parseEvacuation(JSONObject o) throws JSONException {
        EvacuationEntity e = new EvacuationEntity();
        e.id = o.optString("id");
        e.villageName = o.optString("villageName");
        e.shelterName = o.optString("shelterName");
        e.evacuees = o.optInt("evacuees");
        e.routeDurationSec = o.optInt("routeDurationSec");
        e.status = o.optString("status");
        e.busesNeeded = o.optInt("busesNeeded");
        e.boatsNeeded = o.optInt("boatsNeeded");
        e.createdAt = o.optString("createdAt");
        e.updatedAt = o.optString("updatedAt");
        return e;
    }

    private RoadClosureEntity parseRoadClosure(JSONObject o) throws JSONException {
        RoadClosureEntity r = new RoadClosureEntity();
        r.id = o.optString("id");
        r.lat = o.optDouble("lat");
        r.lng = o.optDouble("lng");
        r.roadName = o.optString("roadName");
        r.description = o.optString("description");
        r.active = o.optBoolean("active");
        r.createdAt = o.optString("createdAt");
        r.updatedAt = o.optString("updatedAt");
        return r;
    }

    private DistrictConfigEntity parseDistrictConfig(JSONObject o) throws JSONException {
        DistrictConfigEntity d = new DistrictConfigEntity();
        d.district = o.optString("district");
        d.floodThreshold = o.optDouble("floodThreshold");
        d.warningThreshold = o.optDouble("warningThreshold");
        d.criticalThreshold = o.optDouble("criticalThreshold");
        d.updatedAt = o.optString("updatedAt");
        return d;
    }

    private AlertEntity parseAlert(JSONObject o) throws JSONException {
        AlertEntity a = new AlertEntity();
        a.id = o.optString("id");
        a.district = o.optString("district");
        a.severity = o.optString("severity");
        a.message = o.optString("message");
        a.channel = o.optString("channel");
        a.status = o.optString("status");
        a.acknowledgedBy = o.optString("acknowledgedBy");
        a.acknowledgedAt = o.optString("acknowledgedAt");
        a.createdAt = o.optString("createdAt");
        a.expiresAt = o.optString("expiresAt");
        a.isDuplicate = o.optBoolean("isDuplicate");
        a.originalAlertId = o.optString("originalAlertId");
        a.language = o.optString("language");
        a.translatedMessage = o.optString("translatedMessage");
        a.unacknowledgedCount = o.optInt("unacknowledgedCount");
        return a;
    }

    private AuditLogEntity parseAuditLog(JSONObject o) throws JSONException {
        AuditLogEntity a = new AuditLogEntity();
        a.id = o.optString("id");
        a.action = o.optString("action");
        a.actor = o.optString("actor");
        a.resource = o.optString("resource");
        a.ip = o.optString("ip");
        a.severity = o.optString("severity");
        a.timestamp = o.optString("timestamp");
        return a;
    }

    private FamilyMemberEntity parseFamilyMember(JSONObject o) throws JSONException {
        FamilyMemberEntity f = new FamilyMemberEntity();
        f.id = o.optString("id");
        f.userId = o.optString("userId");
        f.name = o.optString("name");
        f.phone = o.optString("phone");
        f.relation = o.optString("relation");
        f.lat = o.optDouble("lat");
        f.lng = o.optDouble("lng");
        f.status = o.optString("status");
        f.lastSeen = o.optString("lastSeen");
        f.createdAt = o.optString("createdAt");
        return f;
    }

    private SosEventEntity parseSosEvent(JSONObject o) throws JSONException {
        SosEventEntity s = new SosEventEntity();
        s.id = o.optString("id");
        s.userId = o.optString("userId");
        s.type = o.optString("type");
        s.lat = o.optDouble("lat");
        s.lng = o.optDouble("lng");
        s.message = o.optString("message");
        s.status = o.optString("status");
        s.resolution = o.optString("resolution");
        s.createdAt = o.optString("createdAt");
        s.resolvedAt = o.optString("resolvedAt");
        return s;
    }

    private KnowledgeDocEntity parseKnowledgeDoc(JSONObject o) throws JSONException {
        KnowledgeDocEntity k = new KnowledgeDocEntity();
        k.id = o.optString("id");
        k.title = o.optString("title");
        k.district = o.optString("district");
        k.documentType = o.optString("documentType");
        k.content = o.optString("content");
        k.embedding = o.optString("embedding");
        k.createdAt = o.optString("createdAt");
        k.updatedAt = o.optString("updatedAt");
        return k;
    }

    private InventoryMovementEntity parseInventoryMovement(JSONObject o) throws JSONException {
        InventoryMovementEntity m = new InventoryMovementEntity();
        m.id = o.optString("id");
        m.resourceId = o.optString("resourceId");
        m.fromDepot = o.optString("fromDepot");
        m.toDepot = o.optString("toDepot");
        m.quantity = o.optInt("quantity");
        m.timestamp = o.optString("timestamp");
        m.status = o.optString("status");
        return m;
    }
}