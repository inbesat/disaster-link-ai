package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.InventoryMovementEntity;

import java.util.List;

@Dao
public interface InventoryMovementDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<InventoryMovementEntity> movements);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(InventoryMovementEntity movement);

    @Update
    void update(InventoryMovementEntity movement);

    @Query("SELECT * FROM inventory_movements WHERE resourceId = :resourceId ORDER BY timestamp DESC")
    LiveData<List<InventoryMovementEntity>> getByResourceId(String resourceId);

    @Query("SELECT * FROM inventory_movements ORDER BY timestamp DESC")
    LiveData<List<InventoryMovementEntity>> getAll();

    @Query("DELETE FROM inventory_movements")
    void deleteAll();
}