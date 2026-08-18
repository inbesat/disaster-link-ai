package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.AuditLogEntity;

import java.util.List;

public class AuditLogRepository {
    private final SafeSphereDatabase db;

    public AuditLogRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<AuditLogEntity>> getAllAuditLogs() {
        return db.auditLogDao().getAll();
    }

    public LiveData<List<AuditLogEntity>> getAuditLogsBySeverity(String severity) {
        return db.auditLogDao().getBySeverity(severity);
    }

    public void insertAuditLog(AuditLogEntity log) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.auditLogDao().insert(log));
    }

    public void insertAuditLogs(List<AuditLogEntity> logs) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.auditLogDao().insertAll(logs));
    }

    public void deleteAllAuditLogs() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.auditLogDao().deleteAll());
    }
}