package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.RoadClosureEntity;

import java.util.List;

public class RoadClosureRepository {
    private final SafeSphereDatabase db;

    public RoadClosureRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<RoadClosureEntity>> getAllRoadClosures() {
        return db.roadClosureDao().getAll();
    }

    public LiveData<List<RoadClosureEntity>> getActiveRoadClosures() {
        return db.roadClosureDao().getActive();
    }

    public LiveData<RoadClosureEntity> getRoadClosureById(String id) {
        return db.roadClosureDao().getById(id);
    }

    public void insertRoadClosure(RoadClosureEntity closure) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.roadClosureDao().insert(closure));
    }

    public void insertRoadClosures(List<RoadClosureEntity> closures) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.roadClosureDao().insertAll(closures));
    }

    public void updateRoadClosure(RoadClosureEntity closure) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.roadClosureDao().update(closure));
    }

    public void deleteAllRoadClosures() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.roadClosureDao().deleteAll());
    }
}