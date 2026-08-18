package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.AuditLogEntity;

import java.util.List;

@Dao
public interface AuditLogDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<AuditLogEntity> logs);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(AuditLogEntity log);

    @Query("SELECT * FROM audit_logs ORDER BY timestamp DESC")
    LiveData<List<AuditLogEntity>> getAll();

    @Query("SELECT * FROM audit_logs WHERE severity = :severity ORDER BY timestamp DESC")
    LiveData<List<AuditLogEntity>> getBySeverity(String severity);

    @Query("DELETE FROM audit_logs")
    void deleteAll();
}