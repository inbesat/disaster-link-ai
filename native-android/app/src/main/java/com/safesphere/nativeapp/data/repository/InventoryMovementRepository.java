package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.InventoryMovementEntity;

import java.util.List;

public class InventoryMovementRepository {
    private final SafeSphereDatabase db;

    public InventoryMovementRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<InventoryMovementEntity>> getMovementsByResourceId(String resourceId) {
        return db.inventoryMovementDao().getByResourceId(resourceId);
    }

    public LiveData<List<InventoryMovementEntity>> getAllMovements() {
        return db.inventoryMovementDao().getAll();
    }

    public void insertMovement(InventoryMovementEntity movement) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.inventoryMovementDao().insert(movement));
    }

    public void insertMovements(List<InventoryMovementEntity> movements) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.inventoryMovementDao().insertAll(movements));
    }

    public void updateMovement(InventoryMovementEntity movement) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.inventoryMovementDao().update(movement));
    }

    public void deleteAllMovements() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.inventoryMovementDao().deleteAll());
    }
}