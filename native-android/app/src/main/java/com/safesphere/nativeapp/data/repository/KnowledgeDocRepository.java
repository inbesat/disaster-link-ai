package com.safesphere.nativeapp.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.safesphere.nativeapp.data.db.SafeSphereDatabase;
import com.safesphere.nativeapp.data.entity.KnowledgeDocEntity;

import java.util.List;

public class KnowledgeDocRepository {
    private final SafeSphereDatabase db;

    public KnowledgeDocRepository(Application application) {
        db = SafeSphereDatabase.getInstance(application);
    }

    public LiveData<List<KnowledgeDocEntity>> getAllKnowledgeDocs() {
        return db.knowledgeDocDao().getAll();
    }

    public LiveData<List<KnowledgeDocEntity>> getKnowledgeDocsByDistrict(String district) {
        return db.knowledgeDocDao().getByDistrict(district);
    }

    public LiveData<List<KnowledgeDocEntity>> getKnowledgeDocsByType(String type) {
        return db.knowledgeDocDao().getByType(type);
    }

    public LiveData<List<KnowledgeDocEntity>> getKnowledgeDocsWithoutEmbeddings() {
        return db.knowledgeDocDao().getWithoutEmbeddings();
    }

    public LiveData<KnowledgeDocEntity> getKnowledgeDocById(String id) {
        return db.knowledgeDocDao().getById(id);
    }

    public void insertKnowledgeDoc(KnowledgeDocEntity doc) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.knowledgeDocDao().insert(doc));
    }

    public void insertKnowledgeDocs(List<KnowledgeDocEntity> docs) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.knowledgeDocDao().insertAll(docs));
    }

    public void updateKnowledgeDoc(KnowledgeDocEntity doc) {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.knowledgeDocDao().update(doc));
    }

    public void deleteAllKnowledgeDocs() {
        SafeSphereDatabase.databaseWriteExecutor.execute(() -> db.knowledgeDocDao().deleteAll());
    }
}