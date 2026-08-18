package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.ResourceEntity;

import java.util.List;

@Dao
public interface ResourceDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<ResourceEntity> resources);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(ResourceEntity resource);

    @Update
    void update(ResourceEntity resource);

    @Query("SELECT * FROM resources WHERE id = :id")
    LiveData<ResourceEntity> getById(String id);

    @Query("SELECT * FROM resources WHERE category = :category")
    LiveData<List<ResourceEntity>> getByCategory(String category);

    @Query("SELECT * FROM resources WHERE status = :status")
    LiveData<List<ResourceEntity>> getByStatus(String status);

    @Query("SELECT * FROM resources ORDER BY name ASC")
    LiveData<List<ResourceEntity>> getAll();

    @Query("SELECT * FROM resources WHERE quantity < 10")
    LiveData<List<ResourceEntity>> getLowStock();

    @Query("DELETE FROM resources")
    void deleteAll();
}