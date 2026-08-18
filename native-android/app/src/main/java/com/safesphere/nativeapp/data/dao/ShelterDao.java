package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.ShelterEntity;

import java.util.List;

@Dao
public interface ShelterDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<ShelterEntity> shelters);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(ShelterEntity shelter);

    @Update
    void update(ShelterEntity shelter);

    @Query("SELECT * FROM shelters WHERE id = :id")
    LiveData<ShelterEntity> getById(String id);

    @Query("SELECT * FROM shelters WHERE district = :district")
    LiveData<List<ShelterEntity>> getByDistrict(String district);

    @Query("SELECT * FROM shelters WHERE status = :status")
    LiveData<List<ShelterEntity>> getByStatus(String status);

    @Query("SELECT * FROM shelters ORDER BY name ASC")
    LiveData<List<ShelterEntity>> getAll();

    @Query("SELECT * FROM shelters WHERE lat BETWEEN :minLat AND :maxLat AND lng BETWEEN :minLng AND :maxLng")
    LiveData<List<ShelterEntity>> getNearby(double minLat, double maxLat, double minLng, double maxLng);

    @Query("DELETE FROM shelters")
    void deleteAll();
}