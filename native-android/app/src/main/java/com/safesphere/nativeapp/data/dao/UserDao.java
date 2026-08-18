package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.UserEntity;

import java.util.List;

@Dao
public interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<UserEntity> users);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(UserEntity user);

    @Update
    void update(UserEntity user);

    @Query("SELECT * FROM users WHERE id = :id")
    LiveData<UserEntity> getById(String id);

    @Query("SELECT * FROM users WHERE email = :email")
    LiveData<UserEntity> getByEmail(String email);

    @Query("SELECT * FROM users WHERE role = :role")
    LiveData<List<UserEntity>> getByRole(String role);

    @Query("SELECT * FROM users")
    LiveData<List<UserEntity>> getAll();

    @Query("SELECT * FROM users WHERE guestMode = 1")
    LiveData<List<UserEntity>> getGuests();

    @Query("DELETE FROM users")
    void deleteAll();
}