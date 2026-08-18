package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.EvacuationEntity;

import java.util.List;

public class EvacuationRepository {
    private final SafeSphereDatabase db;

    public EvacuationRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<EvacuationEntity>> getAllEvacuations() {
        return db.evacuationDao().getAll();
    }

    public LiveData<List<EvacuationEntity>> getEvacuationsByStatus(String status) {
        return db.evacuationDao().getByStatus(status);
    }

    public LiveData<EvacuationEntity> getEvacuationById(String id) {
        return db.evacuationDao().getById(id);
    }

    public void insertEvacuation(EvacuationEntity evacuation) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.evacuationDao().insert(evacuation));
    }

    public void insertEvacuations(List<EvacuationEntity> evacuations) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.evacuationDao().insertAll(evacuations));
    }

    public void updateEvacuation(EvacuationEntity evacuation) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.evacuationDao().update(evacuation));
    }

    public void deleteAllEvacuations() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.evacuationDao().deleteAll());
    }
}