package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "audit_logs")
public class AuditLogEntity {
    @PrimaryKey
    public String id;
    public String action;
    public String actor;
    public String resource;
    public String ip;
    public String severity; // info, warning, critical
    public String timestamp;
}