package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.AlertEntity;

import java.util.List;

@Dao
public interface AlertDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<AlertEntity> alerts);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(AlertEntity alert);

    @Update
    void update(AlertEntity alert);

    @Query("SELECT * FROM alerts WHERE id = :id")
    LiveData<AlertEntity> getById(String id);

    @Query("SELECT * FROM alerts WHERE district = :district ORDER BY createdAt DESC")
    LiveData<List<AlertEntity>> getByDistrict(String district);

    @Query("SELECT * FROM alerts WHERE severity = :severity ORDER BY createdAt DESC")
    LiveData<List<AlertEntity>> getBySeverity(String severity);

    @Query("SELECT * FROM alerts WHERE acknowledgedBy IS NULL ORDER BY createdAt DESC")
    LiveData<List<AlertEntity>> getUnacknowledged();

    @Query("SELECT * FROM alerts ORDER BY createdAt DESC")
    LiveData<List<AlertEntity>> getAll();

    @Query("SELECT COUNT(*) FROM alerts WHERE acknowledgedBy IS NULL")
    LiveData<Integer> getUnacknowledgedCount();

    @Query("DELETE FROM alerts")
    void deleteAll();
}