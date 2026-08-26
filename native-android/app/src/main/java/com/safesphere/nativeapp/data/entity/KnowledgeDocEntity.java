package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.annotation.NonNull;
import androidx.room.PrimaryKey;

@Entity(tableName = "knowledge_docs")
public class KnowledgeDocEntity {
    @PrimaryKey
        @NonNull public String id;
    public String title;
    public String district;
    public String documentType; // Evacuation Protocol, DDMP, Medical Triaging, etc.
    public String content; // chunked text
    public String embedding; // base64 encoded vector or null
    public String createdAt;
    public String updatedAt;
}