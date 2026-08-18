package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.UserEntity;

import java.util.List;

public class UserRepository {
    private final SafeSphereDatabase db;

    public UserRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<UserEntity>> getAllUsers() {
        return db.userDao().getAll();
    }

    public LiveData<UserEntity> getUserById(String id) {
        return db.userDao().getById(id);
    }

    public LiveData<UserEntity> getUserByEmail(String email) {
        return db.userDao().getByEmail(email);
    }

    public LiveData<List<UserEntity>> getUsersByRole(String role) {
        return db.userDao().getByRole(role);
    }

    public void insertUser(UserEntity user) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.userDao().insert(user));
    }

    public void insertUsers(List<UserEntity> users) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.userDao().insertAll(users));
    }

    public void updateUser(UserEntity user) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.userDao().update(user));
    }

    public void deleteAllUsers() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.userDao().deleteAll());
    }
}