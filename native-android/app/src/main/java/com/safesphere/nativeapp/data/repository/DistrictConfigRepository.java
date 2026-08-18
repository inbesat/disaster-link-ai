package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.DistrictConfigEntity;

import java.util.List;

public class DistrictConfigRepository {
    private final SafeSphereDatabase db;

    public DistrictConfigRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<DistrictConfigEntity>> getAllDistrictConfigs() {
        return db.districtConfigDao().getAll();
    }

    public LiveData<DistrictConfigEntity> getDistrictConfig(String district) {
        return db.districtConfigDao().getByDistrict(district);
    }

    public void insertDistrictConfig(DistrictConfigEntity config) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.districtConfigDao().insert(config));
    }

    public void insertDistrictConfigs(List<DistrictConfigEntity> configs) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.districtConfigDao().insertAll(configs));
    }

    public void updateDistrictConfig(DistrictConfigEntity config) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.districtConfigDao().update(config));
    }

    public void deleteAllDistrictConfigs() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.districtConfigDao().deleteAll());
    }
}