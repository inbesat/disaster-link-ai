package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.AlertEntity;

import java.util.List;

public class AlertRepository {
    private final SafeSphereDatabase db;

    public AlertRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<AlertEntity>> getAllAlerts() {
        return db.alertDao().getAll();
    }

    public LiveData<List<AlertEntity>> getAlertsByDistrict(String district) {
        return db.alertDao().getByDistrict(district);
    }

    public LiveData<List<AlertEntity>> getAlertsBySeverity(String severity) {
        return db.alertDao().getBySeverity(severity);
    }

    public LiveData<List<AlertEntity>> getUnacknowledgedAlerts() {
        return db.alertDao().getUnacknowledged();
    }

    public LiveData<Integer> getUnacknowledgedCount() {
        return db.alertDao().getUnacknowledgedCount();
    }

    public LiveData<AlertEntity> getAlertById(String id) {
        return db.alertDao().getById(id);
    }

    public void insertAlert(AlertEntity alert) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.alertDao().insert(alert));
    }

    public void insertAlerts(List<AlertEntity> alerts) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.alertDao().insertAll(alerts));
    }

    public void updateAlert(AlertEntity alert) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.alertDao().update(alert));
    }

    public void deleteAllAlerts() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.alertDao().deleteAll());
    }
}