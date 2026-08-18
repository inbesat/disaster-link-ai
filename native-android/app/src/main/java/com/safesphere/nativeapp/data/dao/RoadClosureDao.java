package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.RoadClosureEntity;

import java.util.List;

@Dao
public interface RoadClosureDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<RoadClosureEntity> closures);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(RoadClosureEntity closure);

    @Update
    void update(RoadClosureEntity closure);

    @Query("SELECT * FROM road_closures WHERE id = :id")
    LiveData<RoadClosureEntity> getById(String id);

    @Query("SELECT * FROM road_closures WHERE active = 1")
    LiveData<List<RoadClosureEntity>> getActive();

    @Query("SELECT * FROM road_closures")
    LiveData<List<RoadClosureEntity>> getAll();

    @Query("DELETE FROM road_closures")
    void deleteAll();
}