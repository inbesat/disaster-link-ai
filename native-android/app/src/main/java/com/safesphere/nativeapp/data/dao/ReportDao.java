package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.ReportEntity;

import java.util.List;

@Dao
public interface ReportDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<ReportEntity> reports);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(ReportEntity report);

    @Update
    void update(ReportEntity report);

    @Query("SELECT * FROM reports WHERE id = :id")
    LiveData<ReportEntity> getById(String id);

    @Query("SELECT * FROM reports WHERE verificationStatus = :status")
    LiveData<List<ReportEntity>> getByStatus(String status);

    @Query("SELECT * FROM reports ORDER BY createdAt DESC")
    LiveData<List<ReportEntity>> getAll();

    @Query("SELECT * FROM reports WHERE isPwd = 1")
    LiveData<List<ReportEntity>> getPwdPriority();

    @Query("DELETE FROM reports")
    void deleteAll();
}