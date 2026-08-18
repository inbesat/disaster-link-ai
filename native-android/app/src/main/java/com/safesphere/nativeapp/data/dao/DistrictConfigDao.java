package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.DistrictConfigEntity;

import java.util.List;

@Dao
public interface DistrictConfigDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<DistrictConfigEntity> configs);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(DistrictConfigEntity config);

    @Update
    void update(DistrictConfigEntity config);

    @Query("SELECT * FROM district_configs WHERE district = :district")
    LiveData<DistrictConfigEntity> getByDistrict(String district);

    @Query("SELECT * FROM district_configs")
    LiveData<List<DistrictConfigEntity>> getAll();

    @Query("DELETE FROM district_configs")
    void deleteAll();
}