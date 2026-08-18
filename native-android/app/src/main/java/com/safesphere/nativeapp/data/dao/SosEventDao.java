package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.SosEventEntity;

import java.util.List;

@Dao
public interface SosEventDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<SosEventEntity> events);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(SosEventEntity event);

    @Update
    void update(SosEventEntity event);

    @Query("SELECT * FROM sos_events WHERE userId = :userId ORDER BY createdAt DESC")
    LiveData<List<SosEventEntity>> getByUserId(String userId);

    @Query("SELECT * FROM sos_events WHERE id = :id")
    LiveData<SosEventEntity> getById(String id);

    @Query("SELECT * FROM sos_events ORDER BY createdAt DESC")
    LiveData<List<SosEventEntity>> getAll();

    @Query("DELETE FROM sos_events")
    void deleteAll();
}