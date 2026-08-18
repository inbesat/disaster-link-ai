package com.safesphere.nativeapp.data.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.safesphere.nativeapp.data.entity.KnowledgeDocEntity;

import java.util.List;

@Dao
public interface KnowledgeDocDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<KnowledgeDocEntity> docs);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(KnowledgeDocEntity doc);

    @Update
    void update(KnowledgeDocEntity doc);

    @Query("SELECT * FROM knowledge_docs WHERE id = :id")
    LiveData<KnowledgeDocEntity> getById(String id);

    @Query("SELECT * FROM knowledge_docs WHERE district = :district")
    LiveData<List<KnowledgeDocEntity>> getByDistrict(String district);

    @Query("SELECT * FROM knowledge_docs WHERE documentType = :type")
    LiveData<List<KnowledgeDocEntity>> getByType(String type);

    @Query("SELECT * FROM knowledge_docs ORDER BY createdAt DESC")
    LiveData<List<KnowledgeDocEntity>> getAll();

    @Query("SELECT * FROM knowledge_docs WHERE embedding IS NULL LIMIT 50")
    LiveData<List<KnowledgeDocEntity>> getWithoutEmbeddings();

    @Query("DELETE FROM knowledge_docs")
    void deleteAll();
}