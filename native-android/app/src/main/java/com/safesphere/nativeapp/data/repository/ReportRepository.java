package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.ReportEntity;

import java.util.List;

public class ReportRepository {
    private final SafeSphereDatabase db;

    public ReportRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<ReportEntity>> getAllReports() {
        return db.reportDao().getAll();
    }

    public LiveData<List<ReportEntity>> getReportsByStatus(String status) {
        return db.reportDao().getByStatus(status);
    }

    public LiveData<List<ReportEntity>> getPwdPriorityReports() {
        return db.reportDao().getPwdPriority();
    }

    public LiveData<ReportEntity> getReportById(String id) {
        return db.reportDao().getById(id);
    }

    public void insertReport(ReportEntity report) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.reportDao().insert(report));
    }

    public void insertReports(List<ReportEntity> reports) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.reportDao().insertAll(reports));
    }

    public void updateReport(ReportEntity report) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.reportDao().update(report));
    }

    public void deleteAllReports() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.reportDao().deleteAll());
    }
}