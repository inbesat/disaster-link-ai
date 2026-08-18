package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.FamilyMemberEntity;

import java.util.List;

@Dao
public interface FamilyMemberDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<FamilyMemberEntity> members);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(FamilyMemberEntity member);

    @Update
    void update(FamilyMemberEntity member);

    @Query("SELECT * FROM family_members WHERE userId = :userId")
    LiveData<List<FamilyMemberEntity>> getByUserId(String userId);

    @Query("SELECT * FROM family_members WHERE id = :id")
    LiveData<FamilyMemberEntity> getById(String id);

    @Query("DELETE FROM family_members WHERE userId = :userId")
    void deleteByUserId(String userId);

    @Query("DELETE FROM family_members")
    void deleteAll();
}