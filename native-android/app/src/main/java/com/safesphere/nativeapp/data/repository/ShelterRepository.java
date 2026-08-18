package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.ShelterEntity;

import java.util.List;

public class ShelterRepository {
    private final SafeSphereDatabase db;

    public ShelterRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<ShelterEntity>> getAllShelters() {
        return db.shelterDao().getAll();
    }

    public LiveData<List<ShelterEntity>> getSheltersByDistrict(String district) {
        return db.shelterDao().getByDistrict(district);
    }

    public LiveData<List<ShelterEntity>> getSheltersByStatus(String status) {
        return db.shelterDao().getByStatus(status);
    }

    public LiveData<ShelterEntity> getShelterById(String id) {
        return db.shelterDao().getById(id);
    }

    public LiveData<List<ShelterEntity>> getNearbyShelters(double minLat, double maxLat, double minLng, double maxLng) {
        return db.shelterDao().getNearby(minLat, maxLat, minLng, maxLng);
    }

    public void insertShelter(ShelterEntity shelter) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.shelterDao().insert(shelter));
    }

    public void insertShelters(List<ShelterEntity> shelters) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.shelterDao().insertAll(shelters));
    }

    public void updateShelter(ShelterEntity shelter) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.shelterDao().update(shelter));
    }

    public void deleteAllShelters() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.shelterDao().deleteAll());
    }
}