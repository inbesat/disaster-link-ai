package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.ResourceEntity;

import java.util.List;

public class ResourceRepository {
    private final SafeSphereDatabase db;

    public ResourceRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<ResourceEntity>> getAllResources() {
        return db.resourceDao().getAll();
    }

    public LiveData<List<ResourceEntity>> getResourcesByCategory(String category) {
        return db.resourceDao().getByCategory(category);
    }

    public LiveData<List<ResourceEntity>> getResourcesByStatus(String status) {
        return db.resourceDao().getByStatus(status);
    }

    public LiveData<ResourceEntity> getResourceById(String id) {
        return db.resourceDao().getById(id);
    }

    public LiveData<List<ResourceEntity>> getLowStockResources() {
        return db.resourceDao().getLowStock();
    }

    public void insertResource(ResourceEntity resource) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.resourceDao().insert(resource));
    }

    public void insertResources(List<ResourceEntity> resources) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.resourceDao().insertAll(resources));
    }

    public void updateResource(ResourceEntity resource) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.resourceDao().update(resource));
    }

    public void deleteAllResources() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.resourceDao().deleteAll());
    }
}