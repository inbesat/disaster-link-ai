package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.FamilyMemberEntity;

import java.util.List;

public class FamilyMemberRepository {
    private final SafeSphereDatabase db;

    public FamilyMemberRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<FamilyMemberEntity>> getFamilyMembersByUserId(String userId) {
        return db.familyMemberDao().getByUserId(userId);
    }

    public LiveData<FamilyMemberEntity> getFamilyMemberById(String id) {
        return db.familyMemberDao().getById(id);
    }

    public void insertFamilyMember(FamilyMemberEntity member) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.familyMemberDao().insert(member));
    }

    public void insertFamilyMembers(List<FamilyMemberEntity> members) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.familyMemberDao().insertAll(members));
    }

    public void updateFamilyMember(FamilyMemberEntity member) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.familyMemberDao().update(member));
    }

    public void deleteFamilyMembersByUserId(String userId) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.familyMemberDao().deleteByUserId(userId));
    }

    public void deleteAllFamilyMembers() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.familyMemberDao().deleteAll());
    }
}