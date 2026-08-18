package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.EvacuationEntity;

import java.util.List;

@Dao
public interface EvacuationDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<EvacuationEntity> evacuations);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(EvacuationEntity evacuation);

    @Update
    void update(EvacuationEntity evacuation);

    @Query("SELECT * FROM evacuations WHERE id = :id")
    LiveData<EvacuationEntity> getById(String id);

    @Query("SELECT * FROM evacuations WHERE status = :status")
    LiveData<List<EvacuationEntity>> getByStatus(String status);

    @Query("SELECT * FROM evacuations ORDER BY createdAt DESC")
    LiveData<List<EvacuationEntity>> getAll();

    @Query("DELETE FROM evacuations")
    void deleteAll();
}