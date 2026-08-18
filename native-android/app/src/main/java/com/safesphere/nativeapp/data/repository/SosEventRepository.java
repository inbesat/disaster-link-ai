package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.SosEventEntity;

import java.util.List;

public class SosEventRepository {
    private final SafeSphereDatabase db;

    public SosEventRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<SosEventEntity>> getSosEventsByUserId(String userId) {
        return db.sosEventDao().getByUserId(userId);
    }

    public LiveData<List<SosEventEntity>> getAllSosEvents() {
        return db.sosEventDao().getAll();
    }

    public LiveData<SosEventEntity> getSosEventById(String id) {
        return db.sosEventDao().getById(id);
    }

    public void insertSosEvent(SosEventEntity event) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.sosEventDao().insert(event));
    }

    public void insertSosEvents(List<SosEventEntity> events) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.sosEventDao().insertAll(events));
    }

    public void updateSosEvent(SosEventEntity event) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.sosEventDao().update(event));
    }

    public void deleteAllSosEvents() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.sosEventDao().deleteAll());
    }
}